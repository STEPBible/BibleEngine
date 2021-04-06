import { startNewSection } from './functions/sections.functions';
import path from 'path';
import { readFileSync, createReadStream } from 'fs';
import { decodeStream, encodeStream } from 'iconv-lite';
import { parser } from 'sax';

import {
    IBibleContentGroup,
    IBibleContentPhrase,
    IBibleCrossReference,
    IBibleNote,
    DocumentRoot,
    DocumentPhrase,
    DocumentGroup,
    generateVersionReferenceId,
} from '@bible-engine/core';

import { BibleEngineImporter, IImporterOptions } from '../../shared/Importer.interface';
import { startsWithPunctuationChar, streamToString } from '../../shared/helpers.functions';
import { OsisXmlNode, OsisXmlNodeType, OsisXmlNodeName } from '../../shared/osisTypes';
import { ITagWithType, TagType } from './types';
import Logger from '../../shared/Logger';
import { ParserContext } from './entities/ParserContext';
import {
    getParsedBookChapterVerseRef,
    getCurrentContainer,
    isBeginningOfSection,
    isInsideDocumentHeader,
    isInsideIgnoredContent,
} from './functions/helpers.functions';
import {
    isBeginningOfParagraph,
    createParagraph,
    startNewParagraph,
    sourceTextHasParagraphs,
    closeCurrentParagraph,
} from './functions/paragraphs.functions';
import { parseStrongsNums } from './functions/strongs.functions';
import { stackHasParagraph, validateGroup } from './functions/validators.functions';
import { updateContextWithTitleText } from './functions/titles.functions';
import {
    getErrorMessageWithContextStackTrace,
    getCurrentVerse,
} from './functions/logging.functions';

const STRICT_MODE_ENABLED = true;

export class OsisImporter extends BibleEngineImporter {
    context = new ParserContext();

    async import() {
        const xml = await this.getXmlFromOptions(this.options);
        const context = await this.getContextFromXml(xml);
        return this.saveContextToDatabase(context);
    }

    async getXmlFromOptions(options: IImporterOptions) {
        let xml;
        if (options.sourceData) xml = options.sourceData;
        else {
            const sourcePath = options.sourcePath || path.resolve(__dirname) + '/data/osis.xml';
            xml = options.sourceEncoding
                ? await streamToString(
                      createReadStream(sourcePath)
                          .pipe(decodeStream(options.sourceEncoding))
                          .pipe(encodeStream('utf8'))
                  )
                : readFileSync(sourcePath, 'utf8');
        }
        return xml;
    }

    async getContextFromXml(xml: string): Promise<ParserContext> {
        // Since the stream can't be canceled, we need to wrap events in a guard
        let encounteredError = false;
        const pParsing = new Promise<ParserContext>((resolve, reject) => {
            this.context = new ParserContext();
            this.context.hasSectionsInSourceText = xml.includes(`type="section"`);
            this.context.hasParagraphsInSourceText = sourceTextHasParagraphs(xml);
            const xmlStream = parser(STRICT_MODE_ENABLED);
            xmlStream.ontext = (text: string) => {
                if (encounteredError) {
                    return;
                }
                this.parseTextNode(text, this.context);
            };
            xmlStream.onopentag = (tag: any) => {
                if (encounteredError) {
                    return;
                }
                this.parseOpeningTag(tag, this.context);
            };
            xmlStream.onclosetag = (tagName: OsisXmlNodeName) => {
                if (encounteredError) {
                    return;
                }
                this.parseClosingTag(tagName, this.context);
            };
            xmlStream.onerror = (error) => {
                encounteredError = true;
                reject(error);
            };
            xmlStream.onend = () => {
                if (encounteredError) {
                    return;
                }
                resolve(this.context);
            };
            xmlStream.write(xml);
            xmlStream.close();
        });

        let context;
        try {
            context = await pParsing;
            return context;
        } catch (error) {
            encounteredError = true;
            throw error;
        }
    }

    async saveContextToDatabase(context: ParserContext) {
        if (!context.version) throw new Error(`can't find version id`);

        Logger.info(`importing version ${context.version.uid}`);
        const version = await this.bibleEngine.addVersion(context.version);
        for (const book of context.books) {
            Logger.verbose(`importing book ${book.book.title}`);
            await this.bibleEngine.addBookWithContent(version, book);
        }

        return this.bibleEngine.finalizeVersion(version.id);
    }

    toString() {
        return 'OSIS';
    }

    parseOpeningTag(tag: OsisXmlNode, context: ParserContext) {
        let elementType: TagType = tag.name;
        // the following also means that only `div` tags without a type will
        // have the `DIVISION` type
        if (elementType === 'div' && tag.attributes.type) elementType = tag.attributes.type;
        if (elementType === 'note' && tag.attributes.type === OsisXmlNodeType.CROSS_REFERENCE)
            elementType = OsisXmlNodeType.CROSS_REFERENCE;
        const stackTag: ITagWithType = { ...tag, type: elementType };

        if (tag.isSelfClosing) {
            context.openedSelfClosingTag = stackTag;
            // stop if this is actually a closing tag
            if (tag.attributes.eID) return;
        } else {
            context.hierarchicalTagStack.push(stackTag);
        }

        if (isInsideIgnoredContent(context)) {
            return;
        }

        switch (elementType) {
            case OsisXmlNodeName.CATCH_WORD:
            case OsisXmlNodeName.WORK: {
                // is handled in parseTextNode
                break;
            }
            case OsisXmlNodeName.REFERENCE: {
                if (!tag.attributes.osisRef) {
                    return this.logError('Invalid cross reference verse found');
                }
                if (tag.attributes.osisRef === this.getCurrentOsisVerse()) {
                    this.logVerbose('Ignoring self-referencing cross reference');
                    return;
                }
                if (!context.crossRefBuffer) {
                    return this.logError('Reference found outside cross ref block');
                }
                if (!context.crossRefBuffer.refs) {
                    return this.logError(
                        `Corrupted cross ref buffer found: ${JSON.stringify(
                            context.crossRefBuffer
                        )}`
                    );
                }
                const osisRef = getParsedBookChapterVerseRef(tag.attributes.osisRef);
                const crossRef: IBibleCrossReference = {
                    key: context.crossRefBuffer?.key,
                    range: osisRef,
                };
                context.crossRefBuffer.refs.push(crossRef);
                break;
            }
            case OsisXmlNodeName.OSIS_ROOT: {
                if (!tag.attributes.osisIDWork || !tag.attributes['xml:lang'])
                    throw this.getError(`missing osisIDWork or xml:lang attribute`);
                context.version = {
                    uid: tag.attributes.osisIDWork,
                    language: tag.attributes['xml:lang'],
                    title: tag.attributes.osisIDWork,
                    chapterVerseSeparator: ':',
                    ...this.options.versionMeta,
                };
                break;
            }
            case OsisXmlNodeType.BOOK: {
                const bookMeta =
                    this.options.bookMeta &&
                    tag.attributes.osisID &&
                    this.options.bookMeta.get(tag.attributes.osisID);
                // currently we force bookMeta to be provided by the user (since the osis
                // file we are currently working on doesn't have the data in the file)
                if (!bookMeta) {
                    throw this.getError(`book metadata missing for ${tag.attributes.osisID}`);
                }

                if (
                    context.books.find((book) => book.book.abbreviation === tag.attributes.osisID)
                ) {
                    throw this.getError(
                        `Duplicate book: book already exists in stack: ${tag.attributes.osisID}`
                    );
                }

                if (tag.isSelfClosing) {
                    // SWORD modules have self-closing book marker tags
                    return;
                }

                if (context.currentBook) {
                    Logger.verbose(`Manually closing book: ${context.currentBook.abbreviation}`);
                    this.closeCurrentBook(context, tag);
                }

                const bookNr = context.books.length + 1;

                context.currentBook = {
                    osisId: tag.attributes.osisID!,
                    type: bookNr < 40 ? 'ot' : 'nt',
                    ...bookMeta,
                };

                context.contentContainerStack = [{ type: 'root', contents: [] }];
                context.sectionStack = [];
                context.currentChapter = 0;
                context.currentVerse = 0;
                break;
            }
            case OsisXmlNodeName.CHAPTER: {
                if (typeof context.currentChapter !== 'number')
                    throw this.getError(`chapter outside a book`);
                if (!tag.attributes.osisID) throw this.getError('chapter tag without osisID');
                const numbers = tag.attributes.osisID.split('.');
                context.currentChapter++;
                if (+numbers[1] !== context.currentChapter)
                    throw this.getError(`chapter number mismatch ${tag.attributes.osisID}`);
                // sometimes there is a verse 1 tag, sometimes not
                context.currentVerse = 1;
                break;
            }
            case OsisXmlNodeName.VERSE: {
                if (typeof context.currentVerse !== 'number') {
                    throw this.getError(`verse outside a chapter`);
                }
                if (!tag.attributes.osisID) throw this.getError('verse tag without osisID');

                const refs = tag.attributes.osisID.split(' ');
                const numbers = refs[0].split('.');

                // sometimes there is a verse 1 tag, sometimes not. sometimes the same verse number
                // has two verse tags when a section splits a verse
                if (+numbers[2] !== 1 && +numbers[2] !== context.currentVerse)
                    context.currentVerse++;
                // sometimes there are skipped verses in versions
                // TODO: does this cause issues when requesting a verse?
                if (context.currentVerse + 1 === +numbers[2]) context.currentVerse++;

                if (+numbers[1] !== context.currentChapter || +numbers[2] !== context.currentVerse)
                    throw this.getError(`numbering mismatch: ${tag.attributes.osisID}`);

                if (refs.length > 1) {
                    const numbersEnd = refs[refs.length - 1].split('.');
                    if (+numbersEnd[1] !== context.currentChapter)
                        throw this.getError(
                            `verse spans across chapters is currently not supported: ${tag.attributes.osisID}`
                        );

                    // next verses are merged to this one => save information
                    // about this in context and create empty verse before next
                    // verse tag starts
                    context.currentVerseJoinToVersionRef = {
                        bookOsisId: context.currentBook!.osisId,
                        versionChapterNum: +numbersEnd[1],
                        versionVerseNum: +numbersEnd[2],
                    };
                }

                break;
            }
            case OsisXmlNodeType.SECTION_MAJOR:
            case OsisXmlNodeType.SECTION:
            case OsisXmlNodeType.SECTION_SUB: {
                startNewSection(context, elementType);
                break;
            }
            case OsisXmlNodeName.SWORD_PILCROW: {
                if (tag.isSelfClosing && tag.attributes.sID) {
                    startNewParagraph(context);
                }
                break;
            }
            case OsisXmlNodeName.PARAGRAPH:
            case OsisXmlNodeType.PARAGRAPH: {
                startNewParagraph(context);
                break;
            }
            case OsisXmlNodeName.LINE_GROUP: {
                if (tag.isSelfClosing && tag.attributes.sID) {
                    this.startNewLineGroup();
                    break;
                }
                if (tag.isSelfClosing && tag.attributes.eID) {
                    this.closeCurrentLineGroup();
                    break;
                }
                this.startNewLineGroup();
                break;
            }
            case OsisXmlNodeName.LINE: {
                let currentContainer = getCurrentContainer(context);
                let lineNr =
                    currentContainer.type === 'group' && currentContainer.groupType === 'lineGroup'
                        ? currentContainer.contents.length + 1
                        : 1;
                const lineGroup: IBibleContentGroup<'line'> = {
                    type: 'group',
                    groupType: 'line',
                    modifier: lineNr,
                    contents: [],
                };
                // RADAR: currently only taking into account a second level of indentation here
                //        (the first level is already taken care of by the linegroup)
                if (tag.attributes.level && +tag.attributes.level > 1) {
                    const indentGroup: IBibleContentGroup<'indent'> = {
                        type: 'group',
                        groupType: 'indent',
                        contents: [lineGroup],
                    };

                    currentContainer.contents.push(indentGroup);
                } else currentContainer.contents.push(lineGroup);
                context.contentContainerStack.push(lineGroup);
                break;
            }
            case OsisXmlNodeName.LINEBREAK: {
                if (isBeginningOfSection(context) || isBeginningOfParagraph(context)) {
                    // Ignore unnecessary line breaks at beginning of section,
                    // that occur immediately after a title
                    return;
                }
                switch (tag.attributes.type) {
                    case undefined:
                    case OsisXmlNodeType.NEWLINE:
                    case OsisXmlNodeType.NEWLINE_POETRY: {
                        const phrase = this.getCurrentPhrase(context);
                        if (!phrase) throw this.getError(`linebreak failed: can't find phrase`);
                        phrase.linebreak = true;
                        break;
                    }
                    default:
                        throw this.getError(`unknown lb-tag type: ${tag.attributes.type}`);
                }
                break;
            }
            case OsisXmlNodeType.BOOK_INTRODUCTION: {
                if (!context.currentBook || context.currentBook.introduction)
                    throw this.getError(
                        `can't add book introduction: no book or duplicate introduction`
                    );
                const content: DocumentRoot = { type: 'root', contents: [] };
                context.currentBook.introduction = content;
                context.contentContainerStack.push(content);
                break;
            }
            case OsisXmlNodeName.NOTE: {
                const content: DocumentRoot = { type: 'root', contents: [] };
                const currentContainer = getCurrentContainer(context);
                if (
                    currentContainer.type === OsisXmlNodeType.SECTION &&
                    tag.attributes.type !== OsisXmlNodeType.EXPLANATION &&
                    currentContainer.contents.length === 0
                ) {
                    this.logInfo('saving note as section description');
                    currentContainer.description = content;
                } else {
                    const currentPhrase = this.getCurrentPhrase(context, true);
                    if (!currentPhrase) {
                        throw this.getError('note without a phrase');
                    }
                    const note: IBibleNote = {
                        key: tag.attributes.n,
                        content,
                    };
                    currentPhrase.notes = [note];
                }
                context.contentContainerStack.push(content);
                break;
            }
            case OsisXmlNodeType.CROSS_REFERENCE: {
                if (context.crossRefBuffer) {
                    this.logVerbose(
                        `
                        cross reference buffer not cleared, combining with next ref
                        existing refs: ${JSON.stringify(context.crossRefBuffer.refs)}
                        new refs found: ${JSON.stringify(tag.attributes)}
                        `
                    );
                    break;
                }
                context.crossRefBuffer = {
                    key: tag.attributes.n,
                    refs: [],
                };
                break;
            }
            case OsisXmlNodeName.WORD: {
                if (tag.isSelfClosing) {
                    // Strongs tags with no inner content are ignored
                    // For example: <w lemma="strong:H3588"/>
                    return;
                }
                if (context.strongsBuffer) {
                    throw this.getError(
                        `
                        Strongs reference buffer was not cleared.
                        existing contents: ${JSON.stringify(context.strongsBuffer)}
                        new strongs tag: ${JSON.stringify(tag.attributes)}
                        `
                    );
                }
                if (!tag.attributes.lemma) {
                    // There are some cases where an original language word,
                    // does not have corresponding strongs tags
                    return;
                }
                context.strongsBuffer = parseStrongsNums(tag.attributes.lemma);
                break;
            }
            case OsisXmlNodeName.TITLE: {
                if (isInsideDocumentHeader(context)) {
                    break;
                }
                if (tag.attributes.canonical === 'true') {
                    const titleGroup: IBibleContentGroup<'title'> = {
                        type: 'group',
                        groupType: 'title',
                        contents: [],
                    };
                    const currentContainer = getCurrentContainer(context);
                    if (
                        currentContainer.type !== 'group' ||
                        currentContainer.groupType !== 'paragraph'
                    ) {
                        const paragraph = createParagraph();

                        currentContainer.contents.push(paragraph);
                    } else currentContainer.contents.push(titleGroup);
                    context.contentContainerStack.push(titleGroup);
                } else if (!context.hasSectionsInSourceText) {
                    // Since titles should always be attached to a section,
                    // versions with titles but not sections need artifical sections
                    startNewSection(context, OsisXmlNodeType.SECTION);
                }
                // section title is handled in parseTextNode
                break;
            }
            // RADAR: currently only styling selah (type "x-selah") in italic
            case OsisXmlNodeName.FOREIGN_WORD: {
                const currentContainer = getCurrentContainer(context);

                const groupItalic: IBibleContentGroup<'italic'> = {
                    type: 'group',
                    groupType: 'italic',
                    contents: [],
                };

                currentContainer.contents.push(groupItalic);
                context.contentContainerStack.push(groupItalic);
                break;
            }
            case OsisXmlNodeName.TRANS_CHANGE: {
                const currentContainer = getCurrentContainer(context);
                const groupTransChange: IBibleContentGroup<'translationChange'> = {
                    type: 'group',
                    groupType: 'translationChange',
                    contents: [],
                };
                currentContainer.contents.push(groupTransChange);
                context.contentContainerStack.push(groupTransChange);
                break;
            }
            case OsisXmlNodeName.QUOTE: {
                if (tag.attributes.marker) {
                    const currentContainer = getCurrentContainer(context);
                    const markerPhrase: IBibleContentPhrase = {
                        type: 'phrase',
                        content: tag.attributes.marker,
                        skipSpace: 'after',
                        versionChapterNum: context.currentChapter,
                        versionVerseNum: context.currentVerse,
                    };
                    currentContainer.contents.push(markerPhrase);
                }

                // since some quote span over multiple chapters, opening a quote group leads to a
                // corrupted document structure in a lot of cases. Because of that we currently only
                // create phrases for the quote markers.
                // RADAR: Since having proper quote groups would be preferred to retain the
                // semantic information in BibleEngine we leave the code for creating a group here
                // in case this can be implemented properly at a later stage
                //
                // const quoteGroup: IBibleContentGroup<'quote'> = {
                //     type: 'group',
                //     groupType: 'quote',
                //     // use quoteMarker text as a phrase
                //     contents: [markerPhrase]
                // };
                // currentContainer.contents.push(quoteGroup);
                // context.contentContainerStack.push(quoteGroup);

                break;
            }
            case OsisXmlNodeName.HIGHLIGHT: {
                const currentContainer = getCurrentContainer(context);

                const groupEmphasis: IBibleContentGroup<'emphasis'> = {
                    type: 'group',
                    groupType: 'emphasis',
                    contents: [],
                };

                currentContainer.contents.push(groupEmphasis);
                context.contentContainerStack.push(groupEmphasis);
                break;
            }
            case OsisXmlNodeName.DIVINE_NAME: {
                const currentContainer = getCurrentContainer(context);
                if (!this.isInsideNonCanonicalTitle()) {
                    const groupDivineName: IBibleContentGroup<'divineName'> = {
                        type: 'group',
                        groupType: 'divineName',
                        contents: [],
                    };
                    currentContainer.contents.push(groupDivineName);
                    context.contentContainerStack.push(groupDivineName);
                }
                break;
            }
            case OsisXmlNodeType.BOOK_GROUP:
            case OsisXmlNodeName.DATE:
            case OsisXmlNodeName.DESCRIPTION:
            case OsisXmlNodeName.DIVISION:
            case OsisXmlNodeName.IDENTIFIER:
            case OsisXmlNodeName.INSCRIPTION:
            case OsisXmlNodeName.LANGUAGE:
            case OsisXmlNodeName.MILESTONE:
            case OsisXmlNodeName.NAME:
            case OsisXmlNodeName.OSIS_HEADER:
            case OsisXmlNodeName.PUBLISHER:
            case OsisXmlNodeName.REF_SYSTEM:
            case OsisXmlNodeName.RIGHTS:
            case OsisXmlNodeName.SWORD_MILESTONE:
            case OsisXmlNodeName.TEXTUAL_VARIATION:
            case OsisXmlNodeName.TYPE:
            case OsisXmlNodeName.REVISION_DESC:
            case OsisXmlNodeName.VERSION_SCOPE:
            case OsisXmlNodeName.WORD_SEGMENT:
            case OsisXmlNodeName.XML_ROOT: {
                // ignore (until needed)
                break;
            }
            default: {
                if (!elementType) {
                    this.logWarning(`unrecognized osis xml tag: ${elementType}`);
                }
            }
        }
    }

    parseClosingTag(tagName: OsisXmlNodeName, context: ParserContext) {
        if (context.skipClosingTags.length && context.skipClosingTags[0] === tagName) {
            context.skipClosingTags.shift();
            if (context.openedSelfClosingTag) delete context.openedSelfClosingTag;
            return;
        }

        let currentTag: ITagWithType | undefined;
        if (context.openedSelfClosingTag) {
            if (context.openedSelfClosingTag.name !== tagName) {
                throw this.getError(`invalid self closing end tag`);
            }
            currentTag = context.openedSelfClosingTag;
            delete context.openedSelfClosingTag;
            // stop if this is actually a starting tag
            if (currentTag.attributes.sID) return;
        } else {
            currentTag = context.hierarchicalTagStack.pop();
        }

        if (!currentTag) throw this.getError(`can't find matching tag for closing tag ${tagName}`);

        if (isInsideIgnoredContent(context)) {
            return;
        }

        let closeTagsAtEnd: OsisXmlNodeName[] = [];
        let startTagsAtEnd: OsisXmlNode[] = [];

        if (currentTag.name !== tagName) {
            // an unclosed quote group?
            // RADAR: since some quote span over multiple chapters, opening a quote group leads to a
            //     corrupted document structure in a lot of cases. The following code blocks try to
            //     fix this automatically. However since this doesn't work reliably, we currently
            //     only create phrases for the quote markers, not groups.
            //     Since having proper quote groups would be preferred (to retain the
            //     semantic information in BibleEngine) we leave this code here
            //     in case this can be implemented properly at a later stage
            if (currentTag.name === OsisXmlNodeName.QUOTE) {
                const quoteContainer = getCurrentContainer(context);
                if (
                    !quoteContainer ||
                    quoteContainer.type !== 'group' ||
                    quoteContainer.groupType !== 'quote'
                )
                    throw this.getError(`expected quote group on top of stack`);

                const outerTag = context.hierarchicalTagStack.pop();
                if (!outerTag || outerTag.name !== tagName)
                    throw this.getError(`invalid closing tag: ${tagName} (after second level)`);

                const outerContainer =
                    context.contentContainerStack[context.contentContainerStack.length - 2];
                if (
                    !outerContainer ||
                    outerContainer.contents.length !== 1 ||
                    outerContainer.type !== 'group' ||
                    outerContainer.contents[0] !== quoteContainer
                ) {
                    this.logVerbose('closing and reopening quote group');
                    // close and restart quote group
                    currentTag = {
                        name: OsisXmlNodeName.QUOTE,
                        type: OsisXmlNodeName.QUOTE,
                        isSelfClosing: false,
                        attributes: {},
                    };
                    context.hierarchicalTagStack.push({
                        name: tagName,
                        type: tagName,
                        isSelfClosing: false,
                        attributes: {},
                    });
                    closeTagsAtEnd.push(tagName);
                    startTagsAtEnd.push({
                        name: OsisXmlNodeName.QUOTE,
                        isSelfClosing: false,
                        attributes: {},
                    });
                } else {
                    this.logVerbose('switching up quote group');
                    context.contentContainerStack.pop();
                    context.contentContainerStack.pop();

                    // switch tags in tagStack
                    context.hierarchicalTagStack.push(currentTag);
                    currentTag = outerTag;

                    // switch containers
                    outerContainer.contents = quoteContainer.contents;
                    quoteContainer.contents = [outerContainer];
                    context.contentContainerStack.push(quoteContainer);
                    context.contentContainerStack.push(outerContainer);
                }
            } else if (tagName === OsisXmlNodeName.QUOTE) {
                // closing a quote group with another group still open?
                this.logVerbose('manually closing quote group');
                closeTagsAtEnd.push(OsisXmlNodeName.QUOTE);

                context.skipClosingTags.push(currentTag.name);
            } else {
                throw this.getError(`invalid closing tag: ${tagName}`);
            }
        }

        switch (currentTag.type) {
            case OsisXmlNodeType.BOOK: {
                if (currentTag.isSelfClosing) {
                    // SWORD modules have self-closing book marker tags
                    return;
                }
                this.closeCurrentBook(context, currentTag);
                break;
            }
            case OsisXmlNodeName.VERSE: {
                if (context.currentVerseJoinToVersionRef) {
                    if (
                        !context.currentVerseJoinToVersionRef.versionVerseNum ||
                        !context.currentVerse
                    )
                        throw this.getError(`can't create verse span, verse number missing`);

                    const currentContainer = getCurrentContainer(context);
                    for (
                        let emptyVerse = context.currentVerse + 1;
                        emptyVerse <= context.currentVerseJoinToVersionRef.versionVerseNum;
                        emptyVerse++
                    ) {
                        const emptyPhrase: IBibleContentPhrase = {
                            type: 'phrase',
                            content: '',
                            versionChapterNum:
                                context.currentVerseJoinToVersionRef.versionChapterNum,
                            versionVerseNum: emptyVerse,
                            joinToVersionRefId: generateVersionReferenceId({
                                bookOsisId: context.currentBook!.osisId,
                                versionChapterNum: context.currentChapter,
                                versionVerseNum: context.currentVerse,
                            }),
                        };
                        currentContainer.contents.push(emptyPhrase);
                    }
                    context.currentVerse = context.currentVerseJoinToVersionRef.versionVerseNum;
                    context.currentVerseJoinToVersionRef = undefined;
                }
                break;
            }
            case OsisXmlNodeName.OSIS_ROOT:
            case OsisXmlNodeName.CHAPTER:
            case OsisXmlNodeName.LINEBREAK: {
                // nothing to do
                break;
            }
            case OsisXmlNodeType.SECTION:
            case OsisXmlNodeType.SECTION_MAJOR:
            case OsisXmlNodeType.SECTION_SUB: {
                // we don't end sections from here since there is a bug in one of our
                // files where subSections are ended too early - we now close sections
                // when the next one is started
                break;
            }
            case OsisXmlNodeName.PARAGRAPH:
            case OsisXmlNodeType.PARAGRAPH: {
                closeCurrentParagraph(context);
                break;
            }
            case OsisXmlNodeName.LINE: {
                const lineGroup = context.contentContainerStack.pop();
                if (!lineGroup || lineGroup.type !== 'group' || lineGroup.groupType !== 'line') {
                    throw this.getError(`unclean container stack while closing line`);
                }
                break;
            }
            case OsisXmlNodeName.LINE_GROUP: {
                if (currentTag.isSelfClosing) {
                    // Some SWORD modules have self-closing line groups
                    break;
                }
                this.closeCurrentLineGroup();
                break;
            }
            case OsisXmlNodeType.BOOK_INTRODUCTION:
            case OsisXmlNodeName.NOTE: {
                const note = context.contentContainerStack.pop();
                if (!note || note.type !== 'root') {
                    throw this.getError(
                        `
                        unclean container stack while closing note or introduction.
                        Found this node type on top of stack: ${JSON.stringify(note)}
                        Tag name to close: ${currentTag.name}
                        Tag attributes: ${JSON.stringify(currentTag.attributes)}
                        Current book introduction: ${JSON.stringify(
                            context.currentBook?.introduction
                        )}
                        `
                    );
                }
                break;
            }
            case OsisXmlNodeType.CROSS_REFERENCE: {
                // we handle the cross ref in parseTextNode
                if (context.crossRefBuffer?.refs?.length === 0) {
                    this.logVerbose('Ignoring cross reference block with no actual references');
                    delete context.crossRefBuffer;
                }
                break;
            }
            case OsisXmlNodeName.TITLE: {
                if (isInsideDocumentHeader(context)) {
                    return;
                }
                if (currentTag.attributes.canonical === 'true') {
                    const title = context.contentContainerStack.pop();
                    if (!title || title.type !== 'group' || title.groupType !== 'title') {
                        throw this.getError(`unclean container stack while closing title`);
                    }
                }
                break;
            }
            case OsisXmlNodeName.QUOTE: {
                // since some quote span over multiple chapters, opening a quote group leads to a
                // corrupted document structure in a lot of cases. Because of that we currently only
                // create phrases for the quote markers.
                // RADAR: Since having proper quote groups would be preferred to retain the
                // semantic information in BibleEngine we leave the code for creating a group here
                // in case this can be implemented properly at a later stage

                // const quoteGroup = context.contentContainerStack.pop();
                // if (
                //     !quoteGroup ||
                //     quoteGroup.type !== 'group' ||
                //     quoteGroup.groupType !== 'quote'
                // ) {
                //     if (DEBUG_OUTPUT_ENABLED) console.log(context, quoteGroup);
                //     throw this.getError(`unclean container stack while closing quote`);
                // }

                const currentContainer = getCurrentContainer(context);
                if (currentTag.attributes.marker)
                    currentContainer.contents.push({
                        type: 'phrase',
                        content: currentTag.attributes.marker,
                        versionChapterNum: context.currentChapter,
                        versionVerseNum: context.currentVerse,
                        skipSpace: 'before',
                    });
                break;
            }
            case OsisXmlNodeName.FOREIGN_WORD: {
                const italicGroup = context.contentContainerStack.pop();
                validateGroup(italicGroup, 'italic', context);
                break;
            }
            case OsisXmlNodeName.TRANS_CHANGE: {
                const groupTransChange = context.contentContainerStack.pop();
                validateGroup(groupTransChange, 'translationChange', context);
                break;
            }
            case OsisXmlNodeName.HIGHLIGHT: {
                const emphasisGroup = context.contentContainerStack.pop();
                validateGroup(emphasisGroup, 'emphasis', context);
                break;
            }
            case OsisXmlNodeName.DIVINE_NAME: {
                if (!this.isInsideNonCanonicalTitle()) {
                    const divineNameGroup = context.contentContainerStack.pop();
                    validateGroup(divineNameGroup, 'divineName', context);
                }
                break;
            }
            case OsisXmlNodeName.SWORD_PILCROW: {
                const isEndingParagraphMarker =
                    currentTag.isSelfClosing && currentTag.attributes.eID;
                if (isEndingParagraphMarker) {
                    closeCurrentParagraph(context);
                    break;
                }
                break;
            }
            case OsisXmlNodeType.BOOK_GROUP:
            case OsisXmlNodeName.CATCH_WORD:
            case OsisXmlNodeName.COLOPHON:
            case OsisXmlNodeName.REFERENCE:
            case OsisXmlNodeName.WORK: {
                // is handled in parseTextNode
                break;
            }
            case OsisXmlNodeName.DATE:
            case OsisXmlNodeName.DESCRIPTION:
            case OsisXmlNodeName.DIVISION:
            case OsisXmlNodeName.IDENTIFIER:
            case OsisXmlNodeName.INSCRIPTION:
            case OsisXmlNodeName.LANGUAGE:
            case OsisXmlNodeName.MILESTONE:
            case OsisXmlNodeName.NAME:
            case OsisXmlNodeName.OSIS_HEADER:
            case OsisXmlNodeName.PUBLISHER:
            case OsisXmlNodeName.REF_SYSTEM:
            case OsisXmlNodeName.RIGHTS:
            case OsisXmlNodeName.SWORD_MILESTONE:
            case OsisXmlNodeName.TEXTUAL_VARIATION:
            case OsisXmlNodeName.TYPE:
            case OsisXmlNodeName.REVISION_DESC:
            case OsisXmlNodeName.VERSION_SCOPE:
            case OsisXmlNodeName.WORD:
            case OsisXmlNodeName.WORD_SEGMENT:
            case OsisXmlNodeName.XML_ROOT: {
                // currently ignored
                break;
            }
            default: {
                this.logWarning(`unrecognized closing osis xml tag: ${currentTag.type}`);
            }
        }

        for (const closeTag of closeTagsAtEnd) {
            this.logVerbose(`manually closing ${closeTag}`);
            this.parseClosingTag(closeTag, context);
        }
        for (const startTag of startTagsAtEnd) {
            this.logVerbose(`manually starting ${startTag.name}`);
            this.parseOpeningTag(startTag, context);
        }
    }

    parseTextNode(text: string, context: ParserContext) {
        if (isInsideIgnoredContent(context)) {
            return;
        }
        const trimmedText = text.trim();
        if (!trimmedText) {
            // Some strongs tags have empty content, since they represent
            // original-language words not present in the translation
            delete context.strongsBuffer;
            return;
        }
        const currentTag = this.getCurrentTag(context);

        if (
            context.hierarchicalTagStack.find((tag) => tag.name === OsisXmlNodeName.REVISION_DESC)
        ) {
            return;
        }
        if (context.hierarchicalTagStack.find((tag) => tag.name === OsisXmlNodeName.WORK)) {
            if (currentTag.name === OsisXmlNodeName.TITLE) {
                if (!context.version)
                    throw this.getError(`can't add version title: version meta missing`);
                context.version.title = text;
            }
            return;
        }
        if (
            currentTag.type === OsisXmlNodeType.CROSS_REFERENCE ||
            currentTag.name === OsisXmlNodeName.REFERENCE
        ) {
            // Can ignore text inside. only need xml attributes
            return;
        }
        if (currentTag.attributes.type === OsisXmlNodeType.PSALM_BOOK_TITLE) {
            // ignore psalm book titles for now, e.g., 'Book One'
            return;
        }

        let currentContainer = getCurrentContainer(context);

        if (this.isInsideNoteOrIntroduction()) {
            const phrase: DocumentPhrase = {
                type: 'phrase',
                content: trimmedText,
            };
            // Strongs numbers inside notes are not supported
            delete context.strongsBuffer;
            if (currentTag && currentTag.name === OsisXmlNodeName.CATCH_WORD) {
                const group: DocumentGroup<'bold'> = {
                    type: 'group',
                    groupType: 'bold',
                    contents: [phrase],
                };
                currentContainer.contents.push(group);
            } else currentContainer.contents.push(phrase);
            return;
        }

        if (this.isInsideNonCanonicalTitle()) {
            updateContextWithTitleText(context, currentTag.type, trimmedText);
            return;
        }

        if (!stackHasParagraph(context, currentContainer)) {
            if (this.context.hasParagraphsInSourceText) {
                throw this.getError(`text outside of paragraph: "${text}"`);
            }
            const hasNoStructureMarkup =
                !this.context.hasParagraphsInSourceText &&
                !this.context.hasParagraphsInSourceText;
            if (hasNoStructureMarkup) {
                currentContainer = startNewParagraph(context);
            }
        }

        if (!context.currentChapter || !context.currentVerse) {
            throw this.getError(`phrase without chapter or verse: ${text}`);
        }

        const phrase: IBibleContentPhrase = {
            type: 'phrase',
            content: trimmedText,
            versionChapterNum: context.currentChapter,
            versionVerseNum: context.currentVerse,
        };
        if (startsWithPunctuationChar(trimmedText)) phrase.skipSpace = 'before';
        if (context.crossRefBuffer) {
            phrase.crossReferences = context.crossRefBuffer.refs;
            delete context.crossRefBuffer;
        }
        if (context.strongsBuffer) {
            phrase.strongs = context.strongsBuffer;
            delete context.strongsBuffer;
        }
        if (context.currentVerseJoinToVersionRef) {
            phrase.joinToVersionRefId = generateVersionReferenceId(
                context.currentVerseJoinToVersionRef
            );
        }
        currentContainer.contents.push(phrase);
    }

    startNewLineGroup() {
        let currentContainer = getCurrentContainer(this.context);

        const lineGroupGroup: IBibleContentGroup<'lineGroup'> = {
            type: 'group',
            groupType: 'lineGroup',
            contents: [],
        };

        if (currentContainer.type !== 'group' || currentContainer.groupType !== 'paragraph') {
            const paragraph = createParagraph();
            currentContainer.contents.push(paragraph);
        } else currentContainer.contents.push(lineGroupGroup);
        this.context.contentContainerStack.push(lineGroupGroup);
    }

    closeCurrentLineGroup() {
        const lineGroup = this.context.contentContainerStack.pop();
        if (!lineGroup || lineGroup.type !== 'group' || lineGroup.groupType !== 'lineGroup')
            throw this.getError(`unclean container stack while closing lineGroup`);
    }

    closeCurrentBook(context: ParserContext, bookTag: OsisXmlNode) {
        if (!context.currentBook) {
            this.logError(
                `can't close book: no content. Triggered by tag: ${JSON.stringify(
                    bookTag?.attributes
                )}`
            );
            return;
        }
        const rootContainer = context.contentContainerStack[0];
        if (rootContainer.type !== 'root') throw this.getError(`book content has no root`);
        context.books.push({
            book: context.currentBook,
            contents: rootContainer.contents,
        });
        delete context.currentBook;
    }

    getCurrentTag(context: ParserContext) {
        return context.hierarchicalTagStack[context.hierarchicalTagStack.length - 1];
    }

    getCurrentPhrase(context: ParserContext, createIfMissing = false) {
        const currentContainer = getCurrentContainer(context);
        if (
            currentContainer.type === 'section' ||
            currentContainer.type === 'group' ||
            currentContainer.type === 'root'
        ) {
            let lastContent = currentContainer.contents[currentContainer.contents.length - 1];
            if (!lastContent) {
                const containerType = (currentContainer as any).groupType || currentContainer.type;
                if (createIfMissing) {
                    this.logVerbose(`creating empty phrase inside ${containerType}`);
                    const emptyPhrase: IBibleContentPhrase = {
                        type: 'phrase',
                        content: '',
                        versionChapterNum: context.currentChapter,
                        versionVerseNum: context.currentVerse,
                    };
                    currentContainer.contents.push(emptyPhrase);
                    return emptyPhrase;
                } else {
                    throw this.getError(`
                        looking for phrase in an empty ${containerType}
                        current tag: ${JSON.stringify(this.getCurrentTag(context))}
                        current container: ${JSON.stringify(getCurrentContainer(context).type)}
                    `);
                }
            }
            while (
                lastContent &&
                (lastContent.type === 'section' || lastContent.type === 'group')
            ) {
                lastContent = lastContent.contents[lastContent.contents.length - 1];
            }
            if (lastContent && (!lastContent.type || lastContent.type === 'phrase'))
                return lastContent;
        }

        return false;
    }

    isInsideNoteOrIntroduction() {
        return this.context.hierarchicalTagStack.find(
            (tag) =>
                tag.name === OsisXmlNodeName.NOTE || tag.type === OsisXmlNodeType.BOOK_INTRODUCTION
        );
    }

    isInsideNonCanonicalTitle() {
        return this.context.hierarchicalTagStack.find(
            (tag) =>
                tag.name === OsisXmlNodeName.TITLE &&
                (!tag.attributes.canonical || tag.attributes.canonical === 'false')
        );
    }

    getError(msg: string) {
        return new Error(getErrorMessageWithContextStackTrace(msg, this.context));
    }

    logError(msg: string) {
        Logger.error(this.getErrorMessageWithContext(msg, this.context));
    }

    logWarning(msg: string) {
        Logger.warning(this.getErrorMessageWithContext(msg, this.context));
    }

    logInfo(msg: string) {
        Logger.info(this.getErrorMessageWithContext(msg, this.context));
    }

    logVerbose(msg: string) {
        Logger.verbose(this.getErrorMessageWithContext(msg, this.context));
    }

    getCurrentOsisVerse() {
        return `${this.context.currentBook?.osisId}.${this.context.currentChapter}.${this.context.currentVerse}`;
    }

    getErrorMessageWithContext(msg: string, context: ParserContext) {
        return `${msg} in ${getCurrentVerse(context)}`;
    }
}
