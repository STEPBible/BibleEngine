import * as path from 'path';
import { readFileSync, createReadStream, writeFileSync } from 'fs';
import { decodeStream, encodeStream } from 'iconv-lite';
import { parser } from 'sax';

import {
    IBibleContentSection,
    IBibleContentGroup,
    IBibleContentPhrase,
    IBibleCrossReference,
    IBibleNote,
    DocumentRoot,
    DocumentPhrase,
    DocumentGroup,
    generateVersionReferenceId,
} from '@bible-engine/core';

import { BibleEngineImporter } from '../../shared/Importer.interface';
import { startsWithPunctuationChar, streamToString } from '../../shared/helpers.functions';
import { OsisXmlNode, OsisXmlNodeType, OsisXmlNodeName } from '../../shared/osisTypes';
import { ParserContext, ITagWithType, TagType } from './types';
import Logger from '../../shared/Logger'
import { getOsisReferenceEntities } from './functions/helpers.functions'

const DEBUG_OUTPUT_JSON_FILE: string | false = false;
const STRICT_MODE_ENABLED = true;

export class OsisImporter extends BibleEngineImporter {
    context: ParserContext = {
        hierarchicalTagStack: [],
        books: [],
        contentContainerStack: [],
        skipClosingTags: [],
        sectionStack: [],
    }

    async import() {
        let xml: string;
        if (this.options.sourceData) xml = this.options.sourceData;
        else {
            const sourcePath = this.options.sourcePath ||
                path.resolve(__dirname) + '/data/osis.xml';
            xml = this.options.sourceEncoding
                ? await streamToString(
                    createReadStream(sourcePath)
                        .pipe(decodeStream(this.options.sourceEncoding))
                        .pipe(encodeStream('utf8'))
                )
                : readFileSync(sourcePath, 'utf8');
        }

        const pParsing = new Promise<ParserContext>((resolve, reject) => {
            const xmlStream = parser(STRICT_MODE_ENABLED);

            this.context = {
                hierarchicalTagStack: [],
                books: [],
                contentContainerStack: [],
                skipClosingTags: [],
                sectionStack: [],
            };
            xmlStream.ontext = (text: string) => this.parseTextNode(text, this.context);
            xmlStream.onopentag = (tag: any) => this.parseOpeningTag(tag, this.context);
            xmlStream.onclosetag = (tagName: OsisXmlNodeName) =>
                this.parseClosingTag(tagName, this.context);
            xmlStream.onerror = (error) => {
                xmlStream.close()
                reject(error);
            }
            xmlStream.onend = () => {
                resolve(this.context);
            };
            xmlStream.write(xml);
            xmlStream.close();
        });

        let context;
        try {
            context = await pParsing;
        } catch (error) {
            console.error(error)
            console.error('Current verse: ', this.getCurrentVerse(this.context))
            process.exit(1)
        }

        if (!context.version) throw this.getError(`can't find version id`);

        if (DEBUG_OUTPUT_JSON_FILE) {
            writeFileSync(DEBUG_OUTPUT_JSON_FILE, JSON.stringify(context.books.slice(18, 19)));
        }

        Logger.info(`importing version ${context.version.uid}`);
        const version = await this.bibleEngine.addVersion(context.version);
        for (const book of context.books) {
            Logger.verbose(`importing book ${book.book.title}`)
            await this.bibleEngine.addBookWithContent(version, book);
        }

        return this.bibleEngine.finalizeVersion(version.id);
    }

    toString() {
        return 'OSIS';
    }

    async parseOpeningTag(tag: OsisXmlNode, context: ParserContext) {
        try {
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

            switch (elementType) {
                case OsisXmlNodeName.CATCH_WORD:
                case OsisXmlNodeName.WORK: {
                    // is handled in parseTextNode
                    break;
                }
                case OsisXmlNodeName.REFERENCE: {
                    if (!tag.attributes.osisRef) {
                        return this.logError('Invalid cross reference verse found')
                    }
                    if (!context.crossRefBuffer) {
                        return this.logError('Reference found outside cross ref block')
                    }
                    if (!context.crossRefBuffer.key || !context.crossRefBuffer.refs) {
                        return this.logError(`Corrupted cross ref buffer found: ${JSON.stringify(context.crossRefBuffer)}`)
                    }
                    const osisRef = getOsisReferenceEntities(
                        tag.attributes.osisRef
                    );
                    const crossRef: IBibleCrossReference = {
                        key: context.crossRefBuffer?.key,
                        range: {
                            bookOsisId: osisRef.bookOsisId,
                            versionChapterNum: osisRef.versionChapterNum,
                            versionVerseNum: osisRef.versionVerseNum,
                        }
                    };
                    context.crossRefBuffer.refs.push(crossRef)
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

                    if (context.books.find(book => book.book.abbreviation === tag.attributes.osisID)) {
                        throw this.getError(`Duplicate book: book already exists in stack: ${tag.attributes.osisID}`)
                    }

                    if (context.currentBook) {
                        Logger.verbose(`Manually closing book: ${context.currentBook.abbreviation}`)
                        this.closeCurrentBook(context, tag)
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
                    if (!tag.attributes.osisID)
                        throw this.getError('chapter tag without osisID')
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
                    if (!tag.attributes.osisID)
                        throw this.getError('verse tag without osisID');

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
                    // since we have some osis files where subSections are ended too early, we only
                    // close sections when the next one is started - this leads to this rather
                    // complicated code where we look which kind of section is currently open in order
                    // to determine if we close the section(s)

                    let currentContainer = this.getCurrentContainer(context);

                    // if a section starts, we close all still open groups (even if the file
                    // isn't buggy, this can happen, since we sometimes auto open certain
                    // groups)
                    while (currentContainer.type !== 'section' && currentContainer.type !== 'root') {
                        context.contentContainerStack.pop();
                        currentContainer = this.getCurrentContainer(context);
                    }
                    // => currentContainer is now either a section or the root node

                    if (context.sectionStack.length) {
                        const sectionOrder = [
                            OsisXmlNodeType.SECTION_MAJOR,
                            OsisXmlNodeType.SECTION,
                            OsisXmlNodeType.SECTION_SUB,
                        ];
                        const elementSectionOsisLevel = sectionOrder.indexOf(elementType);
                        let currentSectionOsisLevel = sectionOrder.indexOf(
                            context.sectionStack[context.sectionStack.length - 1]
                        );

                        while (elementSectionOsisLevel <= currentSectionOsisLevel) {
                            context.sectionStack.pop();
                            // also works when sectionStack is empty
                            currentSectionOsisLevel = sectionOrder.indexOf(
                                context.sectionStack[context.sectionStack.length - 1]
                            );

                            context.contentContainerStack.pop();
                            currentContainer = this.getCurrentContainer(context);
                        }
                    }

                    if (currentContainer.type !== 'root' && currentContainer.type !== 'section')
                        throw this.getError(`sections can only start within sections or at root`);

                    const section: IBibleContentSection = {
                        type: 'section',
                        level: context.sectionStack.length,
                        contents: [],
                    };

                    context.sectionStack.push(elementType);
                    currentContainer.contents.push(section);
                    context.contentContainerStack.push(section);

                    break;
                }
                case OsisXmlNodeName.PARAGRAPH:
                case OsisXmlNodeType.PARAGRAPH: {
                    this.startNewParagraph(context)
                    break;
                }
                case OsisXmlNodeName.LINE_GROUP: {
                    let currentContainer = this.getCurrentContainer(context);

                    const lineGroupGroup: IBibleContentGroup<'lineGroup'> = {
                        type: 'group',
                        groupType: 'lineGroup',
                        contents: [],
                    };

                    if (
                        currentContainer.type !== 'group' ||
                        currentContainer.groupType !== 'paragraph'
                    ) {
                        const paragraph: IBibleContentGroup<'paragraph'> = {
                            type: 'group',
                            groupType: 'paragraph',
                            contents: [lineGroupGroup],
                        };

                        currentContainer.contents.push(paragraph);
                    } else currentContainer.contents.push(lineGroupGroup);
                    context.contentContainerStack.push(lineGroupGroup);
                    break;
                }
                case OsisXmlNodeName.LINE: {
                    let currentContainer = this.getCurrentContainer(context);
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
                    switch (tag.attributes.type) {
                        case undefined:
                        case OsisXmlNodeType.NEWLINE:
                        case OsisXmlNodeType.NEWLINE_POETRY:
                            const phrase = this.getCurrentPhrase(context);
                            if (!phrase)
                                throw this.getError(
                                    `linebreak failed: can't find phrase`,
                                );
                            phrase.linebreak = true;
                            break;
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
                    const currentContainer = this.getCurrentContainer(context);
                    if (currentContainer.type === 'section') {
                        Logger.info(
                            this.getErrorMessageWithContext(
                                'saving note as section description',
                                context
                            )
                        );
                        currentContainer.description = content;
                    } else {
                        const currentPhrase = this.getCurrentPhrase(context, true);
                        if (!currentPhrase) {
                            throw this.logError(
                                'note without a phrase',
                            )
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
                        throw this.getError(
                            `
                        cross reference buffer was not cleared.
                        existing refs: ${JSON.stringify(context.crossRefBuffer.refs)}
                        ---
                        attributes of new cross ref tag: ${JSON.stringify(tag.attributes)}
                        `,
                        );
                    }
                    if (!tag.attributes.n)
                        throw this.logError('crossRef without index key')

                    context.crossRefBuffer = {
                        key: tag.attributes.n,
                        refs: [],
                    };
                    break;
                }
                case OsisXmlNodeName.WORD: {
                    if (context.strongsBuffer) {
                        throw this.getError(
                            `
                        Strongs reference buffer was not cleared.
                        existing contents: ${JSON.stringify(context.strongsBuffer)}
                        new strongs tag: ${JSON.stringify(tag.attributes)}
                        `,
                        )
                    }
                    if (!tag.attributes.lemma) {
                        throw this.getError('No strongs numbers found on tag')
                    }
                    if (!tag)
                        context.strongsBuffer = this.parseStrongsNums(tag)
                    break;
                }
                case OsisXmlNodeName.TITLE: {
                    if (tag.attributes.canonical === 'true') {
                        const titleGroup: IBibleContentGroup<'title'> = {
                            type: 'group',
                            groupType: 'title',
                            contents: [],
                        };
                        const currentContainer = this.getCurrentContainer(context);
                        if (
                            currentContainer.type !== 'group' ||
                            currentContainer.groupType !== 'paragraph'
                        ) {
                            const paragraph: IBibleContentGroup<'paragraph'> = {
                                type: 'group',
                                groupType: 'paragraph',
                                contents: [titleGroup],
                            };

                            currentContainer.contents.push(paragraph);
                        } else currentContainer.contents.push(titleGroup);
                        context.contentContainerStack.push(titleGroup);
                    }
                    // section title is handled in parseTextNode
                    break;
                }
                case OsisXmlNodeName.WORD: {
                    // TODO: implement strongs
                    break;
                }
                // RADAR: currently only styling selah (type "x-selah") in italic
                case OsisXmlNodeName.FOREIGN_WORD: {
                    const currentContainer = this.getCurrentContainer(context);

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
                    const currentContainer = this.getCurrentContainer(context);
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
                        const currentContainer = this.getCurrentContainer(context);
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
                    const currentContainer = this.getCurrentContainer(context);

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
                    const currentContainer = this.getCurrentContainer(context);
                    if (
                        !context.hierarchicalTagStack.find(
                            (tag) => tag.name === OsisXmlNodeName.TITLE && !tag.attributes.canonical
                        )
                    ) {
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
                case OsisXmlNodeName.DATE:
                case OsisXmlNodeName.DESCRIPTION:
                case OsisXmlNodeName.DIVISION:
                case OsisXmlNodeName.IDENTIFIER:
                case OsisXmlNodeName.LANGUAGE:
                case OsisXmlNodeName.MILESTONE:
                case OsisXmlNodeName.NAME:
                case OsisXmlNodeName.OSIS_HEADER:
                case OsisXmlNodeName.PUBLISHER:
                case OsisXmlNodeName.REF_SYSTEM:
                case OsisXmlNodeName.RIGHTS:
                case OsisXmlNodeName.TYPE:
                case OsisXmlNodeName.REVISION_DESC:
                case OsisXmlNodeName.VERSION_SCOPE:
                case OsisXmlNodeName.WORD_SEGMENT:
                case OsisXmlNodeName.XML_ROOT: {
                    // ignore (until needed)
                    break;
                }
                default: {
                    if (!elementType)
                        this.logError(`unrecognized osis xml tag: ${elementType}`);
                }
            }
        }
        catch (error) {
            console.error(error)
            process.exit(1)
        }
    }

    parseClosingTag(tagName: OsisXmlNodeName, context: ParserContext) {
        try {
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
                    const quoteContainer = this.getCurrentContainer(context);
                    if (
                        !quoteContainer ||
                        quoteContainer.type !== 'group' ||
                        quoteContainer.groupType !== 'quote'
                    )
                        throw this.getError(
                            `expected quote group on top of stack`,
                        );

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
                        Logger.verbose(
                            this.getErrorMessageWithContext(
                                'closing and reopening quote group',
                                context
                            )
                        );
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
                        Logger.verbose(
                            this.getErrorMessageWithContext('switching up quote group', context)
                        );
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
                    Logger.verbose(
                        this.getErrorMessageWithContext('manually closing quote group', context)
                    );
                    closeTagsAtEnd.push(OsisXmlNodeName.QUOTE);

                    context.skipClosingTags.push(currentTag.name);
                } else {
                    throw this.getError(`invalid closing tag: ${tagName}`);
                }
            }

            switch (currentTag.type) {
                case OsisXmlNodeType.BOOK: {
                    this.closeCurrentBook(context, currentTag)
                    break;
                }
                case OsisXmlNodeName.VERSE: {
                    if (context.currentVerseJoinToVersionRef) {
                        if (
                            !context.currentVerseJoinToVersionRef.versionVerseNum ||
                            !context.currentVerse
                        )
                            throw this.getError(`can't create verse span, verse number missing`)

                        const currentContainer = this.getCurrentContainer(context);
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
                    this.closeCurrentParagraph(context);
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
                    const lineGroup = context.contentContainerStack.pop();
                    if (!lineGroup || lineGroup.type !== 'group' || lineGroup.groupType !== 'lineGroup')
                        throw this.getError(`unclean container stack while closing lineGroup`);
                    break;
                }
                case OsisXmlNodeType.BOOK_INTRODUCTION:
                case OsisXmlNodeName.NOTE: {
                    const note = context.contentContainerStack.pop();
                    if (!note || note.type !== 'root') {
                        this.logError(
                            `
                        unclean container stack while closing note or introduction.
                        Found this node type on top of stack: ${JSON.stringify(note)}
                        Tag name to close: ${currentTag.name}
                        Tag attributes: ${JSON.stringify(currentTag.attributes)}
                        Current book introduction: ${JSON.stringify(context.currentBook?.introduction)}
                        `,
                        );
                    }
                    break;
                }
                case OsisXmlNodeType.CROSS_REFERENCE: {
                    // we handle the cross ref in parseTextNode
                    if (context.crossRefBuffer?.refs?.length === 0) {
                        // this.logError('Cross reference block found with no actual references')
                    }
                    break;
                }
                case OsisXmlNodeName.TITLE: {
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

                    const currentContainer = this.getCurrentContainer(context);
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
                    if (
                        !italicGroup ||
                        italicGroup.type !== 'group' ||
                        italicGroup.groupType !== 'italic'
                    )
                        throw this.getError(
                            `unclean container stack while closing "foreign" group`,
                        );
                    break;
                }
                case OsisXmlNodeName.TRANS_CHANGE: {
                    const groupTransChange = context.contentContainerStack.pop();
                    if (
                        !groupTransChange ||
                        groupTransChange.type !== 'group' ||
                        groupTransChange.groupType !== 'translationChange'
                    )
                        throw this.getError(
                            `unclean container stack while closing "transChange" group`,
                        );
                    break;
                }
                case OsisXmlNodeName.HIGHLIGHT: {
                    const emphasisGroup = context.contentContainerStack.pop();
                    if (
                        !emphasisGroup ||
                        emphasisGroup.type !== 'group' ||
                        emphasisGroup.groupType !== 'emphasis'
                    )
                        throw this.getError(`unclean container stack while closing emphasis group`);
                    break;
                }
                case OsisXmlNodeName.DIVINE_NAME: {
                    if (
                        !context.hierarchicalTagStack.find(
                            (tag) => tag.name === 'title' && !tag.attributes.canonical
                        )
                    ) {
                        const divineNameGroup = context.contentContainerStack.pop();
                        if (
                            !divineNameGroup ||
                            divineNameGroup.type !== 'group' ||
                            divineNameGroup.groupType !== 'divineName'
                        )
                            throw this.getError(
                                `unclean container stack while closing divineName group`
                            );
                    }
                    break;
                }
                case OsisXmlNodeName.WORD: {
                    // currently not implemented
                    break;
                }
                case OsisXmlNodeName.CATCH_WORD:
                case OsisXmlNodeName.REFERENCE:
                case OsisXmlNodeName.WORK: {
                    // is handled in parseTextNode
                    break;
                }
                case OsisXmlNodeName.DATE:
                case OsisXmlNodeName.DESCRIPTION:
                case OsisXmlNodeName.DIVISION:
                case OsisXmlNodeName.IDENTIFIER:
                case OsisXmlNodeName.LANGUAGE:
                case OsisXmlNodeName.MILESTONE:
                case OsisXmlNodeName.NAME:
                case OsisXmlNodeName.OSIS_HEADER:
                case OsisXmlNodeName.PUBLISHER:
                case OsisXmlNodeName.REF_SYSTEM:
                case OsisXmlNodeName.RIGHTS:
                case OsisXmlNodeName.SWORD_MILESTONE:
                case OsisXmlNodeName.TYPE:
                case OsisXmlNodeName.REVISION_DESC:
                case OsisXmlNodeName.VERSION_SCOPE:
                case OsisXmlNodeName.WORD_SEGMENT:
                case OsisXmlNodeName.XML_ROOT: {
                    // currently ignored
                    break;
                }
                default: {
                    this.logError(`unrecognized closing osis xml tag: ${currentTag.type}`);
                }
            }

            for (const closeTag of closeTagsAtEnd) {
                Logger.verbose(`manually closing ${closeTag}`);
                this.parseClosingTag(closeTag, context);
            }
            for (const startTag of startTagsAtEnd) {
                Logger.verbose(`manually starting ${startTag.name}`);
                this.parseOpeningTag(startTag, context);
            }
        }
        catch (error) {
            console.error(error)
            process.exit(1)
        }
    }

    parseTextNode(text: string, context: ParserContext) {
        try {
            const trimmedText = text.trim();
            if (!trimmedText) {
                // Some strongs tags have empty content, since they represent
                // original-language words not present in the translation
                delete context.strongsBuffer
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
                // ignore psalm book titles for now
                return;
            }

            let currentContainer = this.getCurrentContainer(context);

            if (
                context.hierarchicalTagStack.find(
                    (tag) =>
                        tag.name === OsisXmlNodeName.NOTE ||
                        tag.type === OsisXmlNodeType.BOOK_INTRODUCTION
                )
            ) {
                const phrase: DocumentPhrase = {
                    type: 'phrase',
                    content: trimmedText,
                };
                if (currentTag && currentTag.name === OsisXmlNodeName.CATCH_WORD) {
                    const group: DocumentGroup<'bold'> = {
                        type: 'group',
                        groupType: 'bold',
                        contents: [phrase],
                    };
                    currentContainer.contents.push(group);
                } else currentContainer.contents.push(phrase);
                return;
            } else if (
                context.hierarchicalTagStack.find(
                    (tag) =>
                        tag.name === OsisXmlNodeName.TITLE &&
                        (!tag.attributes.canonical || tag.attributes.canonical === 'false')
                )
            ) {
                if (currentContainer.type !== 'section') {
                    throw this.logError(
                        `can't set title to section: no section`,
                    );
                }
                if (currentTag.attributes.type === OsisXmlNodeType.TEXTUAL_NOTE) {
                    currentContainer.subTitle = trimmedText;
                } else {
                    const styledText =
                        currentTag.type === OsisXmlNodeName.DIVINE_NAME
                            ? trimmedText.toUpperCase()
                            : trimmedText;
                    if (currentContainer.title) currentContainer.title += ' ' + styledText;
                    else currentContainer.title = styledText;
                }
                return;
            }

            if (
                context.contentContainerStack.findIndex((container) => {
                    if (container.type === 'group' && container.groupType === 'paragraph') return true;

                    if (container !== currentContainer) {
                        const lastContent = container.contents[container.contents.length - 1];
                        if (lastContent.type === 'group' && lastContent.groupType === 'paragraph')
                            return true;
                    }

                    return false;
                }) === -1
            ) {
                this.logError(`text outside of paragraph: "${text}"`)
                this.startNewParagraph(context)
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
                phrase.strongs = context.strongsBuffer
                delete context.strongsBuffer
            }
            if (context.currentVerseJoinToVersionRef) {
                phrase.joinToVersionRefId = generateVersionReferenceId(
                    context.currentVerseJoinToVersionRef
                );
            }

            currentContainer.contents.push(phrase);
        }
        catch (error) {
            console.error(error)
            process.exit(1)
        }
    }

    startNewParagraph(context: ParserContext) {
        let currentContainer = this.getCurrentContainer(context);
        const paragraph: IBibleContentGroup<'paragraph'> = {
            type: 'group',
            groupType: 'paragraph',
            contents: [],
        };
        currentContainer.contents.push(paragraph);
        context.contentContainerStack.push(paragraph);
    }

    closeCurrentParagraph(context: ParserContext) {
        const paragraph = this.getCurrentContainer(context);
        if (!paragraph || paragraph.type !== 'group' || paragraph.groupType !== 'paragraph') {
            const errorMsg = `can't close paragraph: no paragraph on end of stack`;
            this.logError(errorMsg);
        } else {
            context.contentContainerStack.pop();
        }
    }

    closeCurrentBook(context: ParserContext, bookTag: OsisXmlNode) {
        if (!context.currentBook) {
            this.logError(`can't close book: no content. Triggered by tag: ${JSON.stringify(bookTag?.attributes)}`);
            return
        }
        const rootContainer = context.contentContainerStack[0];
        if (rootContainer.type !== 'root') throw this.getError(`book content has no root`);
        context.books.push({
            book: context.currentBook,
            contents: rootContainer.contents,
        });
        delete context.currentBook
    }

    parseStrongsNums(tag: OsisXmlNode) {
        const lemma = tag.attributes!.lemma!.replace(/\!/g, '')
        const strongsNumbersString = lemma.split('strong:').join('')
        const strongsNumbers = strongsNumbersString
            .split(' ')
            .filter(element => element)
            .map(strongsNum => this.normalizeStrongsNum(strongsNum));
        return strongsNumbers
    }

    normalizeStrongsNum(strongsNum: string): string {
        const lastCharacter = strongsNum[strongsNum.length - 1];
        const startingletter = strongsNum[0].toUpperCase();
        const numberPortion = this.isNumeric(lastCharacter)
            ? strongsNum.substring(1)
            : strongsNum.substring(1, strongsNum.length - 1);
        const endingLetter = this.isNumeric(lastCharacter) ? '' : lastCharacter.toLowerCase();
        const paddedNumber = String('0000' + numberPortion).slice(-4);
        return startingletter + paddedNumber + endingLetter;
    }

    isNumeric(num: any): num is number {
        return !isNaN(num);
    }

    getCurrentTag(context: ParserContext) {
        return context.hierarchicalTagStack[context.hierarchicalTagStack.length - 1];
    }

    getCurrentContainer(context: ParserContext) {
        if (!context.contentContainerStack.length) {
            throw this.getError(`missing root container`);
        }
        return context.contentContainerStack[context.contentContainerStack.length - 1];
    }

    getCurrentPhrase(context: ParserContext, createIfMissing = false) {
        const currentContainer = this.getCurrentContainer(context);
        if (
            currentContainer.type === 'section' ||
            currentContainer.type === 'group' ||
            currentContainer.type === 'root'
        ) {
            let lastContent = currentContainer.contents[currentContainer.contents.length - 1];
            if (!lastContent) {
                if (createIfMissing) {
                    Logger.verbose(
                        this.getErrorMessageWithContext('creating empty phrase', context)
                    );
                    const emptyPhrase: IBibleContentPhrase = {
                        type: 'phrase',
                        content: '',
                        versionChapterNum: context.currentChapter,
                        versionVerseNum: context.currentVerse,
                    };
                    currentContainer.contents.push(emptyPhrase);
                    return emptyPhrase;
                } else {
                    throw this.getError(`looking for phrase in an empty container`);
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

    getError(msg: string) {
        throw new Error(this.getErrorMessageWithContext(msg, this.context))
    }

    logError(msg: string) {
        Logger.error(this.getErrorMessageWithContext(msg, this.context))
    }

    getCurrentVerse(context: ParserContext) {
        return `${context.currentBook && context.currentBook.osisId} ${context.currentChapter
            }:${context.currentVerse}`
    }

    getErrorMessageWithContext(msg: string, context: ParserContext) {
        return `${msg} in ${this.getCurrentVerse(context)}`;
    }
}
