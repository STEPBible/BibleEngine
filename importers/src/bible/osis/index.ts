import { createReadStream, readFileSync } from 'fs';
import { decodeStream, encodeStream } from 'iconv-lite';
import path from 'path';
import { parser } from 'sax';
import { getCurrentSection, startNewSection } from './functions/sections.functions';

import {
    BibleReferenceParser,
    DocumentGroup,
    DocumentPhrase,
    DocumentRoot,
    generateVersionReferenceId,
    IBibleContentGroup,
    IBibleContentPhrase,
    IBibleCrossReference,
    IBibleNote,
} from '@bible-engine/core';

import {
    endsWithNoSpaceAfterChar,
    getBibleReferenceFromParsedReference,
    getPhrasesFromParsedReferences,
    getReferencesFromText,
    startsWithNoSpaceBeforeChar,
    streamToString,
} from '../../shared/helpers.functions';
import { BibleEngineImporter, IImporterOptions } from '../../shared/Importer.interface';
import Logger from '../../shared/Logger';
import { OsisXmlNode, OsisXmlNodeName, OsisXmlNodeType } from '../../shared/osisTypes';
import { ParserContext } from './entities/ParserContext';
import { OsisParseError } from './errors/OsisParseError';
import {
    getCurrentContainer,
    getParsedBookChapterVerseRef,
    isBeginningOfSection,
    isInsideDocumentHeader,
    isInsideIgnoredContent,
} from './functions/helpers.functions';
import {
    closeCurrentParagraph,
    createParagraph,
    isBeginningOfParagraph,
    sourceTextHasParagraphs,
    startNewParagraph,
} from './functions/paragraphs.functions';
import { parseStrongsNums } from './functions/strongs.functions';
import { updateContextWithTitleText } from './functions/titles.functions';
import { stackHasParagraph, validateGroup } from './functions/validators.functions';
import { ITagWithType, TagType } from './types';

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
            this.context.autoGenMissingParagraphs = this.options.autoGenMissingParagraphs;
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

        Logger.info(`importing version ${context.version.uid}`, context);
        const version = await this.bibleEngine.addVersion(context.version);
        for (const book of context.books) {
            Logger.verbose(`importing book ${book.book.title}`, context);
            await this.bibleEngine.addBookWithContent(version, book, {
                skipCrossRefs: this.options.skip?.crossRefs,
                skipNotes: this.options.skip?.notes,
                skipStrongs: this.options.skip?.strongs,
            });
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
        if (
            (elementType === 'note' && tag.attributes.type === OsisXmlNodeType.CROSS_REFERENCE) ||
            (elementType === 'title' && tag.attributes.type === OsisXmlNodeType.PARALLEL)
        )
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
                // references in document-nodes are handled in `parseTextNode`
                if (this.isInsideNoteOrIntroduction()) return;

                if (tag.attributes.osisRef === this.getCurrentOsisVerse()) {
                    Logger.verbose('Ignoring self-referencing cross reference', context);
                    return;
                }
                if (!context.crossRefBuffer) {
                    Logger.verbose('Reference found outside cross ref block', context);
                    return;
                }

                const crossRef: IBibleCrossReference = {
                    key: context.crossRefBuffer?.key,
                    range: tag.attributes.osisRef
                        ? getParsedBookChapterVerseRef(tag.attributes.osisRef)
                        : { bookOsisId: '' },
                };

                if (this.isInsideSectionCrossRefs()) {
                    const currentSection = getCurrentSection(context);
                    if (!currentSection || !currentSection.crossReferences) {
                        return Logger.error('section cross reference without section', context);
                    }
                    currentSection.crossReferences.push(crossRef);
                } else if (this.options.crossRefConnectToPhrase === 'before') {
                    const currentPhrase = this.getCurrentPhrase(context, true);
                    if (!currentPhrase || !currentPhrase.crossReferences)
                        return Logger.error('cross reference without phrase', context);
                    currentPhrase.crossReferences?.push(crossRef);
                } else {
                    if (!context.crossRefBuffer.refs) {
                        return Logger.error(
                            `Corrupted cross ref buffer found: ${JSON.stringify(
                                context.crossRefBuffer
                            )}`,
                            context
                        );
                    }
                    context.crossRefBuffer.refs.push(crossRef);
                }
                break;
            }
            case OsisXmlNodeName.OSIS_ROOT: {
                if (!tag.attributes.osisIDWork || !tag.attributes['xml:lang'])
                    throw new OsisParseError(`missing osisIDWork or xml:lang attribute`, context);

                context.version = {
                    uid: tag.attributes.osisIDWork,
                    language: tag.attributes['xml:lang'],
                    title: tag.attributes.osisIDWork,
                    chapterVerseSeparator: ':',
                    ...this.options.versionMeta,
                };

                try {
                    const bcv_parser = require(`bible-passage-reference-parser/js/${context.version.language}_bcv_parser`)
                        .bcv_parser;
                    const bcv: BibleReferenceParser = new bcv_parser({});
                    bcv.set_options({
                        punctuation_strategy:
                            this.options.versionMeta?.chapterVerseSeparator === ',' ? 'eu' : 'us',
                        invalid_passage_strategy: 'include',
                        invalid_sequence_strategy: 'include',
                        passage_existence_strategy: 'bc',
                        consecutive_combination_strategy: 'separate',
                    });
                    context.bcv = bcv;
                } catch (e) {
                    Logger.warning('missing language file for bible-reference-parser', context);
                }

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
                    throw new OsisParseError(
                        `book metadata missing for ${tag.attributes.osisID}`,
                        context
                    );
                }

                if (
                    context.books.find((book) => book.book.abbreviation === tag.attributes.osisID)
                ) {
                    throw new OsisParseError(
                        `Duplicate book: book already exists in stack: ${tag.attributes.osisID}`,
                        context
                    );
                }

                if (context.currentBook) {
                    Logger.verbose(
                        `Manually closing book: ${context.currentBook.abbreviation}`,
                        context
                    );
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
                    throw new OsisParseError(`chapter outside a book`, context);
                if (!tag.attributes.osisID)
                    throw new OsisParseError('chapter tag without osisID', context);
                const numbers = tag.attributes.osisID.split('.');
                if (!numbers[1])
                    throw new OsisParseError(
                        `missing chapter in osisId ${tag.attributes.osisID}`,
                        context
                    );
                context.currentChapter++;
                if (+numbers[1] !== context.currentChapter)
                    throw new OsisParseError(
                        `chapter number mismatch ${tag.attributes.osisID}`,
                        context
                    );
                // sometimes there is a verse 1 tag, sometimes not
                context.currentVerse = 1;
                context.currentSubverse = 1;
                context.isCurrentVerseImplicit = true;
                // create paragraph for each chapter for sources without paragraphs and sections
                if (
                    !this.context.hasParagraphsInSourceText &&
                    !this.context.hasSectionsInSourceText &&
                    this.options.autoGenChapterParagraphs
                )
                    startNewParagraph(context);
                break;
            }
            case OsisXmlNodeName.VERSE: {
                context.isCurrentVerseImplicit = false;
                if (typeof context.currentVerse !== 'number') {
                    throw new OsisParseError(`verse outside a chapter`, context);
                }
                if (!tag.attributes.osisID)
                    throw new OsisParseError('verse tag without osisID', context);

                const refs = tag.attributes.osisID.split(' ');
                const numbers = refs[0]!.split('.');
                if (!numbers[1] || !numbers[2])
                    throw new OsisParseError(
                        `missing chapter or verse in osisId ${refs[0]}`,
                        context
                    );

                // sometimes there is a verse 1 tag, sometimes not. sometimes the same verse number
                // has two verse tags when a section splits a verse
                if (+numbers[2] !== 1 && +numbers[2] !== context.currentVerse)
                    context.currentVerse++;
                // sometimes there are skipped verses in versions
                // TODO: does this cause issues when requesting a verse?
                if (context.currentVerse + 1 === +numbers[2]) context.currentVerse++;

                if (+numbers[1] !== context.currentChapter || +numbers[2] !== context.currentVerse)
                    throw new OsisParseError(
                        `numbering mismatch: ${tag.attributes.osisID}`,
                        context
                    );

                if (refs.length > 1) {
                    const numbersEnd = refs[refs.length - 1]!.split('.');
                    if (!numbersEnd[1] || !numbersEnd[2])
                        throw new OsisParseError(
                            `missing chapter in osisId ${refs[refs.length - 1]}`,
                            context
                        );
                    if (+numbersEnd[1] !== context.currentChapter)
                        throw new OsisParseError(
                            `verse spans across chapters is currently not supported: ${tag.attributes.osisID}`,
                            context
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

                context.currentSubverse = 1;
                break;
            }
            case OsisXmlNodeType.SECTION_MAJOR:
            case OsisXmlNodeType.SECTION:
            case OsisXmlNodeType.SECTION_SUB: {
                startNewSection(context, elementType);
                break;
            }
            case OsisXmlNodeName.PARAGRAPH:
            case OsisXmlNodeType.PARAGRAPH:
            case OsisXmlNodeType.SWORD_PILCROW: {
                startNewParagraph(context);
                break;
            }
            case OsisXmlNodeName.LINE_GROUP:
            case OsisXmlNodeName.LIST:
            case OsisXmlNodeName.TABLE: {
                this.startNewLineGroup();
                break;
            }
            case OsisXmlNodeName.ITEM:
            case OsisXmlNodeName.LINE:
            case OsisXmlNodeName.ROW: {
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
                        if (!phrase)
                            throw new OsisParseError(
                                `linebreak failed: can't find phrase`,
                                context
                            );
                        phrase.linebreak = true;
                        break;
                    }
                    case OsisXmlNodeType.OPTIONAL: {
                        // ignore
                        break;
                    }
                    default:
                        throw new OsisParseError(
                            `unknown lb-tag type: ${tag.attributes.type}`,
                            context
                        );
                }
                break;
            }
            case OsisXmlNodeType.BOOK_INTRODUCTION: {
                if (!context.currentBook || context.currentBook.introduction)
                    throw new OsisParseError(
                        `can't add book introduction: no book or duplicate introduction`,
                        context
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
                    Logger.info('saving note as section description', context);
                    currentContainer.description = content;
                } else {
                    const currentPhrase = this.getCurrentPhrase(context, true);
                    if (!currentPhrase) {
                        throw new OsisParseError('note without a phrase', context);
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
                    Logger.verbose(
                        `
                            cross reference buffer not cleared, combining with next ref
                            existing refs: ${JSON.stringify(context.crossRefBuffer.refs)}
                            new refs found: ${JSON.stringify(tag.attributes)}
                            `,
                        context
                    );
                    break;
                }
                // we use `crossRefBuffer` for all cases, since we need to access the `key` later
                context.crossRefBuffer = {
                    key: tag.attributes.n,
                };

                if (this.isInsideSectionCrossRefs()) {
                    const currentSection = getCurrentSection(context);
                    if (!currentSection)
                        throw new OsisParseError('cross reference without section', context);
                    Logger.info('saving cross refs for section', context);
                    currentSection.crossReferences = [];
                } else if (this.options.crossRefConnectToPhrase === 'before') {
                    const currentPhrase = this.getCurrentPhrase(context, true);
                    if (!currentPhrase) {
                        throw new OsisParseError('cross reference without phrase', context);
                    }
                    currentPhrase.crossReferences = [];
                } else {
                    context.crossRefBuffer.refs = [];
                }
                break;
            }
            case OsisXmlNodeName.WORD: {
                if (tag.isSelfClosing) {
                    // Strongs tags with no inner content are ignored
                    // For example: <w lemma="strong:H3588"/>
                    return;
                }
                if (context.strongsBuffer) {
                    throw new OsisParseError(
                        `
                        Strongs reference buffer was not cleared.
                        existing contents: ${JSON.stringify(context.strongsBuffer)}
                        new strongs tag: ${JSON.stringify(tag.attributes)}
                        `,
                        context
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
                    // if the canonical title is outside of verse 1 (i.e. we set the verse number implicitly on chapter start), we number it as `1.0`
                    if (context.isCurrentVerseImplicit) context.currentSubverse = 0;
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
                        const paragraph = createParagraph([titleGroup]);
                        currentContainer.contents.push(paragraph);
                    } else currentContainer.contents.push(titleGroup);
                    context.contentContainerStack.push(titleGroup);
                } else if (
                    !context.hasSectionsInSourceText &&
                    tag.attributes.type !== OsisXmlNodeType.SCOPE
                ) {
                    // Since titles should always be attached to a section,
                    // versions with titles but not sections need artifical sections
                    const sectionType =
                        tag.attributes.level === 'sub'
                            ? OsisXmlNodeType.SECTION_SUB
                            : OsisXmlNodeType.SECTION;

                    // DISABLED: subsequent titles will now just replace the preivous title. the
                    //           concatenated titles looked weird, especially when passages are
                    //           viewed in isolation (if we don't create a new section, a
                    //           subsequent title tag will just be added to the exising title of
                    //           the current section). if we always create a new section on title,
                    //           the higher level sections in the source will be ignored since they
                    //           don't have content. we leave the code here, in case the previous
                    //           behavior is needed in the future.
                    //
                    // const currentSection = getCurrentSection(context);
                    // // we only create a new section if there is no current section or the current one already has content
                    // // (this way subsequent title tags will be concatenated instead of closing and reopening sections)
                    // if (!currentSection || currentSection.contents.length) {
                    startNewSection(context, sectionType);
                    // }
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
                        versionSubverseNum: context.currentSubverse,
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
            case OsisXmlNodeName.CELL:
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
            case OsisXmlNodeName.SALUTE:
            case OsisXmlNodeName.SPEAKER:
            case OsisXmlNodeType.SWORD_MILESTONE:
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
                if (!elementType || elementType.indexOf('disabled') === -1) {
                    Logger.warning(`unrecognized opening osis xml tag: ${elementType}`, context);
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
                throw new OsisParseError(`invalid self closing end tag`, context);
            }
            currentTag = context.openedSelfClosingTag;
            delete context.openedSelfClosingTag;
            // stop if this is actually a starting tag
            if (currentTag.attributes.sID) return;
        } else {
            currentTag = context.hierarchicalTagStack.pop();
        }

        if (!currentTag)
            throw new OsisParseError(`can't find matching tag for closing tag ${tagName}`, context);

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
                    throw new OsisParseError(`expected quote group on top of stack`, context);

                const outerTag = context.hierarchicalTagStack.pop();
                if (!outerTag || outerTag.name !== tagName)
                    throw new OsisParseError(
                        `invalid closing tag: ${tagName} (after second level)`,
                        context
                    );

                const outerContainer =
                    context.contentContainerStack[context.contentContainerStack.length - 2];
                if (
                    !outerContainer ||
                    outerContainer.contents.length !== 1 ||
                    outerContainer.type !== 'group' ||
                    outerContainer.contents[0] !== quoteContainer
                ) {
                    Logger.verbose('closing and reopening quote group', context);
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
                    Logger.verbose('switching up quote group', context);
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
                Logger.verbose('manually closing quote group', context);
                closeTagsAtEnd.push(OsisXmlNodeName.QUOTE);

                context.skipClosingTags.push(currentTag.name);
            } else {
                throw new OsisParseError(`invalid closing tag: ${tagName}`, context);
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
                        throw new OsisParseError(
                            `can't create verse span, verse number missing`,
                            context
                        );

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
                            versionSubverseNum: 1,
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
            case OsisXmlNodeName.CHAPTER: {
                if (!this.context.hasParagraphsInSourceText) {
                    const paragraph = getCurrentContainer(context);
                    if (
                        paragraph &&
                        paragraph.type === 'group' &&
                        paragraph.groupType === 'paragraph'
                    )
                        closeCurrentParagraph(context);
                }
                break;
            }
            case OsisXmlNodeName.OSIS_ROOT:
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
            case OsisXmlNodeType.PARAGRAPH:
            case OsisXmlNodeType.SWORD_PILCROW: {
                closeCurrentParagraph(context);
                break;
            }
            case OsisXmlNodeName.ITEM:
            case OsisXmlNodeName.LINE:
            case OsisXmlNodeName.ROW: {
                const lineGroup = context.contentContainerStack.pop();
                if (!lineGroup || lineGroup.type !== 'group' || lineGroup.groupType !== 'line') {
                    throw new OsisParseError(`unclean container stack while closing line`, context);
                }
                break;
            }
            case OsisXmlNodeName.LINE_GROUP:
            case OsisXmlNodeName.LIST:
            case OsisXmlNodeName.TABLE: {
                this.closeCurrentLineGroup(context);
                break;
            }
            case OsisXmlNodeType.BOOK_INTRODUCTION:
            case OsisXmlNodeName.NOTE: {
                const note = context.contentContainerStack.pop();
                if (!note || note.type !== 'root') {
                    throw new OsisParseError(
                        `
                        unclean container stack while closing note or introduction.
                        Found this node type on top of stack: ${JSON.stringify(note)}
                        Tag name to close: ${currentTag.name}
                        Tag attributes: ${JSON.stringify(currentTag.attributes)}
                        Current book introduction: ${JSON.stringify(
                            context.currentBook?.introduction
                        )}
                        `,
                        context
                    );
                }
                break;
            }
            case OsisXmlNodeType.CROSS_REFERENCE: {
                // we handle the cross ref in parseTextNode
                if (
                    this.options.crossRefConnectToPhrase === 'before' ||
                    this.isInsideSectionCrossRefs()
                ) {
                    delete context.crossRefBuffer;
                } else if (context.crossRefBuffer?.refs?.length === 0) {
                    Logger.verbose(
                        'Ignoring cross reference block with no actual references',
                        context
                    );
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
                        throw new OsisParseError(
                            `unclean container stack while closing title`,
                            context
                        );
                    }
                    if (context.isCurrentVerseImplicit) context.currentSubverse = 1;
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
                //     throw new OsisParseError(`unclean container stack while closing quote`);
                // }

                const currentContainer = getCurrentContainer(context);
                if (currentTag.attributes.marker)
                    currentContainer.contents.push({
                        type: 'phrase',
                        content: currentTag.attributes.marker,
                        versionChapterNum: context.currentChapter,
                        versionVerseNum: context.currentVerse,
                        versionSubverseNum: context.currentSubverse,
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
            case OsisXmlNodeType.BOOK_GROUP:
            case OsisXmlNodeName.CATCH_WORD:
            case OsisXmlNodeName.COLOPHON:
            case OsisXmlNodeName.REFERENCE:
            case OsisXmlNodeName.WORK: {
                // is handled in parseTextNode
                break;
            }
            case OsisXmlNodeName.CELL:
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
            case OsisXmlNodeName.SALUTE:
            case OsisXmlNodeName.SPEAKER:
            case OsisXmlNodeType.SWORD_MILESTONE:
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
                if (!currentTag.type || currentTag.type.indexOf('disabled') === -1) {
                    Logger.warning(
                        `unrecognized closing osis xml tag: ${currentTag.type}`,
                        context
                    );
                }
            }
        }

        for (const closeTag of closeTagsAtEnd) {
            Logger.verbose(`manually closing ${closeTag}`, context);
            this.parseClosingTag(closeTag, context);
        }
        for (const startTag of startTagsAtEnd) {
            Logger.verbose(`manually starting ${startTag.name}`, context);
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
        const versionUid = this.options.versionMeta?.uid || context.version?.uid;

        if (
            context.hierarchicalTagStack.find((tag) => tag.name === OsisXmlNodeName.REVISION_DESC)
        ) {
            return;
        }
        if (context.hierarchicalTagStack.find((tag) => tag.name === OsisXmlNodeName.WORK)) {
            if (currentTag.name === OsisXmlNodeName.TITLE) {
                if (!context.version)
                    throw new OsisParseError(
                        `can't add version title: version meta missing`,
                        context
                    );
                context.version.title = text;
            }
            return;
        }
        const isInDocumentNode = this.isInsideNoteOrIntroduction();
        if (
            currentTag.type === OsisXmlNodeType.CROSS_REFERENCE ||
            (!isInDocumentNode &&
                context.crossRefBuffer &&
                currentTag.name === OsisXmlNodeName.REFERENCE)
        ) {
            // Fix missing osisRefs of the last added reference
            if (currentTag.name === OsisXmlNodeName.REFERENCE) {
                let currentCrossRefContainer: IBibleCrossReference[] | undefined;
                if (this.isInsideSectionCrossRefs()) {
                    const currentSection = getCurrentSection(context);
                    if (currentSection?.crossReferences?.length)
                        currentCrossRefContainer = currentSection.crossReferences;
                } else if (this.options.crossRefConnectToPhrase === 'before') {
                    const currentPhrase = this.getCurrentPhrase(context);
                    if (currentPhrase && currentPhrase.crossReferences?.length)
                        currentCrossRefContainer = currentPhrase.crossReferences;
                } else {
                    if (context.crossRefBuffer?.refs?.length)
                        currentCrossRefContainer = context.crossRefBuffer.refs;
                }
                if (currentCrossRefContainer?.length) {
                    const currentCrossRef = currentCrossRefContainer[
                        currentCrossRefContainer.length - 1
                    ]!;
                    // we check if the label was already set. this can happen if we ignored a reference tag earlier
                    // however the parser will still come to this text node which would
                    // overwrite the label of the previous reference in this cross ref group
                    if (!currentCrossRef.label) {
                        currentCrossRef.label = trimmedText;
                        if (!currentCrossRef.range.bookOsisId) {
                            // we remove the ref with the missing range and create new ones (since there can be multiple)
                            currentCrossRefContainer.pop();
                            if (context.bcv && versionUid && context.currentBook?.osisId) {
                                const crossRefs = getReferencesFromText(context.bcv, trimmedText, {
                                    bookOsisId: context.currentBook.osisId,
                                    chapterNum: context.currentChapter,
                                });
                                for (const crossRef of crossRefs) {
                                    currentCrossRefContainer.push({
                                        label: trimmedText.slice(
                                            crossRef.indices[0],
                                            crossRef.indices[1]
                                        ),
                                        range: getBibleReferenceFromParsedReference(
                                            crossRef,
                                            versionUid
                                        ),
                                    });
                                }
                                if (!crossRefs.length) {
                                    throw new OsisParseError(
                                        `can't parse references in "${trimmedText}"`,
                                        context
                                    );
                                }
                            }
                        }
                    }
                }
            }
            // else: we ignore content in cross-reference blocks that are not a reference
            return;
        }
        if (currentTag.attributes.type === OsisXmlNodeType.PSALM_BOOK_TITLE) {
            // ignore psalm book titles for now, e.g., 'Book One'
            return;
        }

        let currentContainer = getCurrentContainer(context);

        if (isInDocumentNode) {
            const phrase: DocumentPhrase = {
                type: 'phrase',
                content: trimmedText,
            };
            if (startsWithNoSpaceBeforeChar(trimmedText)) phrase.skipSpace = 'before';
            if (endsWithNoSpaceAfterChar(trimmedText))
                phrase.skipSpace = phrase.skipSpace === 'before' ? 'both' : 'after';

            // Strongs numbers inside notes are not supported
            delete context.strongsBuffer;

            if (currentTag && currentTag.name === OsisXmlNodeName.CATCH_WORD) {
                const group: DocumentGroup<'bold'> = {
                    type: 'group',
                    groupType: 'bold',
                    contents: [phrase],
                };
                currentContainer.contents.push(group);
                return;
            }

            if (
                currentTag &&
                currentTag.name === OsisXmlNodeName.REFERENCE &&
                currentTag.attributes.osisRef
            ) {
                // at this point the UID should be known, either by `versionMeta` or by parsing the xml header
                if (!versionUid) throw new OsisParseError("can't determin version uid", context);
                phrase.bibleReference = {
                    ...getParsedBookChapterVerseRef(currentTag.attributes.osisRef),
                    versionId: undefined,
                    versionUid,
                };
            } else {
                if (context.bcv && context.currentBook) {
                    // at this point the UID should be known, either by `versionMeta` or by parsing the xml header
                    if (!versionUid)
                        throw new OsisParseError("can't determin version uid", context);

                    const localRefMatcher =
                        context.version?.language === 'en'
                            ? /(^| )(chapter|ch\.|v\.|verse|verses) ([0-9,:\-–; ]|(and|to|chapter|ch\.|v\.|verse|verses))+/gi
                            : context.version?.language === 'de'
                            ? /(Kapitel|V\.|Vers) ([0-9,\.\-–; ]|(und|bis|Kapitel|V\.|Vers))+/g
                            : undefined;
                    const refs = getReferencesFromText(context.bcv, trimmedText, {
                        bookOsisId: context.currentBook.osisId,
                        chapterNum: context.currentChapter,
                        localRefMatcher,
                    });
                    if (refs.length) {
                        currentContainer.contents.push(
                            ...getPhrasesFromParsedReferences(trimmedText, refs, versionUid)
                        );
                        return;
                    }
                }
            }

            currentContainer.contents.push(phrase);

            return;
        }

        if (this.isInsideNonCanonicalTitle()) {
            updateContextWithTitleText(context, currentTag.type, trimmedText);
            return;
        }

        if (!stackHasParagraph(context, currentContainer)) {
            if (this.context.hasParagraphsInSourceText && !context.autoGenMissingParagraphs) {
                throw new OsisParseError(`text outside of paragraph: "${text}"`, context);
            }
            if (!this.context.hasParagraphsInSourceText || context.autoGenMissingParagraphs) {
                currentContainer = startNewParagraph(context);
            }
        }

        if (!context.currentChapter || !context.currentVerse) {
            throw new OsisParseError(`phrase without chapter or verse: ${text}`, context);
        }

        const phrase: IBibleContentPhrase = {
            type: 'phrase',
            content: trimmedText,
            versionChapterNum: context.currentChapter,
            versionVerseNum: context.currentVerse,
            versionSubverseNum: context.currentSubverse,
        };
        if (startsWithNoSpaceBeforeChar(trimmedText)) phrase.skipSpace = 'before';
        if (endsWithNoSpaceAfterChar(trimmedText))
            phrase.skipSpace = phrase.skipSpace === 'before' ? 'both' : 'after';
        if (context.crossRefBuffer) {
            if (
                this.options.crossRefConnectToPhrase === 'after' &&
                context.crossRefBuffer.refs?.length
            )
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
            const paragraph = createParagraph([lineGroupGroup]);
            currentContainer.contents.push(paragraph);
        } else currentContainer.contents.push(lineGroupGroup);
        this.context.contentContainerStack.push(lineGroupGroup);
    }

    closeCurrentLineGroup(context: ParserContext) {
        const lineGroup = this.context.contentContainerStack.pop();
        if (!lineGroup || lineGroup.type !== 'group' || lineGroup.groupType !== 'lineGroup')
            throw new OsisParseError(`unclean container stack while closing lineGroup`, context);
    }

    closeCurrentBook(context: ParserContext, bookTag: OsisXmlNode) {
        if (!context.currentBook) {
            Logger.error(
                `can't close book: no content. Triggered by tag: ${JSON.stringify(
                    bookTag?.attributes
                )}`,
                context
            );
            return;
        }
        const rootContainer = context.contentContainerStack[0];
        if (rootContainer?.type !== 'root')
            throw new OsisParseError(`book content has no root`, context);
        context.books.push({
            book: context.currentBook,
            contents: rootContainer.contents,
        });
        delete context.currentBook;
    }

    getCurrentTag(context: ParserContext) {
        if (!context.hierarchicalTagStack.length) {
            throw new OsisParseError(`unexpected empty tag stack`, context);
        }
        return context.hierarchicalTagStack[context.hierarchicalTagStack.length - 1]!;
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
                    Logger.verbose(`creating empty phrase inside ${containerType}`, context);
                    const emptyPhrase: IBibleContentPhrase = {
                        type: 'phrase',
                        content: '',
                        versionChapterNum: context.currentChapter,
                        versionVerseNum: context.currentVerse,
                        versionSubverseNum: context.currentSubverse,
                    };
                    currentContainer.contents.push(emptyPhrase);
                    return emptyPhrase;
                } else {
                    throw new OsisParseError(
                        `looking for phrase in an empty ${containerType}`,
                        context
                    );
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
                (tag.name === OsisXmlNodeName.NOTE &&
                    tag.attributes.type !== OsisXmlNodeType.CROSS_REFERENCE) ||
                tag.type === OsisXmlNodeType.BOOK_INTRODUCTION
        );
    }

    isInsideNonCanonicalTitle() {
        return this.context.hierarchicalTagStack.find(
            (tag) =>
                tag.name === OsisXmlNodeName.TITLE &&
                (!tag.attributes.canonical || tag.attributes.canonical === 'false')
        );
    }

    isInsideSectionCrossRefs() {
        return this.context.hierarchicalTagStack.find(
            (tag) =>
                tag.name === OsisXmlNodeName.TITLE &&
                tag.attributes.type === OsisXmlNodeType.PARALLEL
        );
    }

    getCurrentOsisVerse() {
        return `${this.context.currentBook?.osisId}.${this.context.currentChapter}.${this.context.currentVerse}`;
    }
}
