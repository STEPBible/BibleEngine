import { readFileSync } from 'fs';
import { parser } from 'sax';
import * as winston from 'winston';

import {
    BibleEngine,
    BibleReferenceParser,
    DocumentElement,
    DocumentPhrase,
    generateVersionReferenceId,
    getOsisIdFromParatextId,
    IBibleBook,
    IBibleContentPhrase,
    IBibleCrossReference,
    IBibleNote,
    IBibleVersion,
} from '@bible-engine/core';

import {
    BibleEngineImporter,
    IImporterOptions,
    ImporterBookMetadataBook,
    LogLevel,
} from '../../shared/Importer.interface';

import {
    endsWithNoSpaceAfterChar,
    getPhrasesFromParsedReferences,
    getReferencesFromText,
    startsWithNoSpaceBeforeChar,
} from '../../shared/helpers.functions';
import {
    closeAllGroups,
    closeDocument,
    closeGroupContainer,
    getContextCurrentLocation,
    getCurrentBiblePhrase,
    getCurrentContainer,
    getCurrentSection,
    getCurrentTag,
    isInNoteContainerTag,
    isInSectionTag,
    isInsideDocument,
    isInsideGroup,
    isInsideIgnoredContent,
    isInTag,
    isTagIgnored,
    startDocument,
    startGroupContainer,
    startLine,
    startNewParagraph,
    startSection,
    UsxParseError,
} from './helpers';
import { IParserContext, UsxXmlNode, UsxXmlNodeName, UsxXmlNodeStyle } from './types';

export class UsxImporter extends BibleEngineImporter {
    private logger: winston.Logger;

    constructor(
        protected bibleEngine: BibleEngine,
        public options: IImporterOptions & {
            versionMeta: IBibleVersion;
            bookMeta: Map<string, ImporterBookMetadataBook & { sourcePath: string }>;
        }
    ) {
        super(bibleEngine, options);
        const level: LogLevel = options.logLevel || 'warn';
        this.logger = winston.createLogger({
            level,
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf((info) => info.message)
            ),
            transports: new winston.transports.Console(),
        });
    }

    async getContextFromXml(book: IBibleBook, xml: string): Promise<IParserContext> {
        // Since the stream can't be canceled, we need to wrap events in a guard
        let encounteredError = false;
        return new Promise<IParserContext>((resolve, reject) => {
            const context: IParserContext = {
                version: this.options.versionMeta,
                book,
                contentContainerStack: [{ type: 'book', contents: [] }],
                hierarchicalTagStack: [],
                skipClosingTags: [],
                sectionStack: [],
                isCurrentVerseImplicit: false,
            };
            try {
                const bcv_parser = require(`bible-passage-reference-parser/js/${context.version.language
                    .substring(0, 2)
                    .toLowerCase()}_bcv_parser`).bcv_parser;
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
                this.log('warn', 'missing language file for bible-reference-parser', context);
            }
            const xmlStream = parser(true);
            xmlStream.ontext = (text: string) => {
                if (encounteredError) {
                    return;
                }
                this.parseTextNode(text, context);
            };
            xmlStream.onopentag = (tag: any) => {
                if (encounteredError) {
                    return;
                }
                this.parseOpeningTag(tag, context);
            };
            xmlStream.onclosetag = (tagName: UsxXmlNodeName) => {
                if (encounteredError) {
                    return;
                }
                this.parseClosingTag(tagName, context);
            };
            xmlStream.onerror = (error) => {
                encounteredError = true;
                reject(error);
            };
            xmlStream.onend = () => {
                if (encounteredError) {
                    return;
                }
                resolve(context);
            };
            xmlStream.write(xml);
            xmlStream.close();
        });
    }

    async import() {
        this.log('info', `importing version ${this.options.versionMeta.uid}`);
        const version = await this.bibleEngine.addVersion(this.options.versionMeta);

        for (const [osisId, book] of this.options.bookMeta.entries()) {
            this.log('info', `[${this.options.versionMeta.uid}] importing book ${book.title}`);

            // typescript somehow is not catching that we enforced the `sourcePath` attribute
            // (it correctly throws an error when not setting it)
            const xml = readFileSync(book.sourcePath!, 'utf8');
            const context = await this.getContextFromXml(
                {
                    ...book,
                    osisId,
                    type: book.number < 40 ? 'ot' : book.number <= 66 ? 'nt' : 'ap',
                },
                xml
            );

            if (!context.contentContainerStack[0])
                throw new UsxParseError(`missing book content for ${book.title}`, context);

            await this.bibleEngine.addBookWithContent(
                version,
                {
                    book: context.book,
                    contents: context.contentContainerStack[0].contents,
                    contentHasNormalizedNumbers: false,
                },
                {
                    skipCrossRefs: this.options.skip?.crossRefs,
                    skipNotes: this.options.skip?.notes,
                    skipStrongs: this.options.skip?.strongs,
                }
            );
        }

        return this.bibleEngine.finalizeVersion(version.id);
    }

    log(level: LogLevel, msg: string, context?: IParserContext) {
        this.logger.log(level, `${context ? getContextCurrentLocation(context) + ' ' : ''}${msg}`);
    }

    parseOpeningTag(tag: UsxXmlNode, context: IParserContext) {
        tag.type = tag.attributes.style ? tag.attributes.style : tag.name;

        if (tag.isSelfClosing) {
            context.openedSelfClosingTag = tag;
            // stop if this is actually a closing tag or an ignored tag
            if (tag.attributes.eid || isTagIgnored(tag.type)) return;
        } else {
            context.hierarchicalTagStack.push(tag);
        }

        if (isInsideIgnoredContent(context)) return;

        // we have to handle verse joining when a new verse is started since there are no
        // closing verse tags in USX 2.6
        if (
            (tag.type === UsxXmlNodeStyle.CHAPTER || tag.type === UsxXmlNodeStyle.VERSE) &&
            context.currentVerseJoinToVersionRef
        ) {
            if (
                !context.currentVerseJoinToVersionRef.versionVerseNum ||
                !context.currentVerse ||
                !context.currentVerseJoinToVersionRefContainer
            )
                throw new UsxParseError(
                    `can't create verse span, missing verse number(${context.currentVerseJoinToVersionRef.versionVerseNum}) or container (${context.currentVerseJoinToVersionRefContainer})`,
                    context,
                    true
                );

            const refContainer = context.currentVerseJoinToVersionRefContainer;
            for (
                let emptyVerse = context.currentVerse + 1;
                emptyVerse <= context.currentVerseJoinToVersionRef.versionVerseNum;
                emptyVerse++
            ) {
                const emptyPhrase: IBibleContentPhrase = {
                    type: 'phrase',
                    content: '',
                    versionChapterNum: context.currentVerseJoinToVersionRef.versionChapterNum,
                    versionVerseNum: emptyVerse,
                    versionSubverseNum: 1,
                    joinToVersionRefId: generateVersionReferenceId({
                        bookOsisId: context.book.osisId,
                        versionChapterNum: context.currentChapter,
                        versionVerseNum: context.currentVerse,
                    }),
                };
                refContainer.contents.push(emptyPhrase);
            }
            context.currentVerseJoinToVersionRef = undefined;
            context.currentVerseJoinToVersionRefContainer = undefined;
        }

        switch (tag.type) {
            case 'chapter':
            case UsxXmlNodeStyle.CHAPTER:
                context.currentChapter = +tag.attributes.number!;
                // we have instances where the introduction-end tag is missing
                if (context.currentChapter === 1 && isInsideDocument(context))
                    context.book.introduction = closeDocument(context);
                context.currentVerse = 1;
                context.currentSubverse = 1;
                context.isCurrentVerseImplicit = true;
                break;
            case 'verse':
            case UsxXmlNodeStyle.VERSE:
                context.isCurrentVerseImplicit = false;
                const refs = tag.attributes.number!.split('-');
                const subverses = ['a', 'b', 'c', 'd', 'e', 'f'];
                context.currentVerse = parseInt(refs[0]!);
                const subverseIndex = subverses.indexOf(refs[0]!.slice(-1));
                context.currentSubverse = subverseIndex !== -1 ? subverseIndex + 1 : 1;
                if (refs[1]) {
                    // next verses are merged to this one => save information
                    // about this in context and create empty verse before next
                    // verse tag starts
                    context.currentVerseJoinToVersionRef = {
                        bookOsisId: context.book.osisId,
                        versionChapterNum: context.currentChapter,
                        versionVerseNum: parseInt(refs[1]),
                    };
                }
                break;
            case UsxXmlNodeStyle.NOTE_ENDNOTE:
            case UsxXmlNodeStyle.NOTE_EXTENDED:
            case UsxXmlNodeStyle.NOTE_FOOTNOTE:
            case UsxXmlNodeStyle.NOTE_INTRODUCTORY:
            case UsxXmlNodeStyle.SECTION_PARALLEL_REFERENCES:
            case UsxXmlNodeStyle.SECTION_DIVISION_REFERENCES:
                if (tag.type === UsxXmlNodeStyle.NOTE_INTRODUCTORY && tag.isSelfClosing) break;
                startDocument(context);
                break;
            case UsxXmlNodeStyle.INTRODUCTION_TITLE_LEVEL1:
            case UsxXmlNodeStyle.INTRODUCTION_TITLE:
                // we have an instance of a source file with duplicate book introductions.
                // workaround: if we encounter a major introduction title level 1 while inside a
                // document, we throw away the current document and restart
                if (isInsideDocument(context)) closeDocument(context);
                startDocument(context);
                break;
            // this is a self-closing tag without a related end-tag. we handle it here in
            // `parseOpeningTag` since we only handle self-closing tags in `parseClosingTag` that
            // have a dedicated `eid` attribute (that is also a necessary restriction since
            // USX <= 2.6 does not use `sid` / `eid` attributes at all
            case UsxXmlNodeStyle.INTRODUCTION_END:
                // we have instances where there is an `INTRODUCTION_END` without any introduction
                // content before it
                if (isInsideDocument(context)) context.book.introduction = closeDocument(context);
                break;
            case UsxXmlNodeStyle.INTRODUCTION_PARAGRAPH:
            case UsxXmlNodeStyle.INTRODUCTION_PARAGRAPH_INDENTED:
            case UsxXmlNodeStyle.INTRODUCTION_PARAGRAPH_MARGIN:
            case UsxXmlNodeStyle.INTRODUCTION_PARAGRAPH_MARGIN_INDENTED:
            case UsxXmlNodeStyle.INTRODUCTION_PARAGRAPH_NOFIRSTLINEINDENT: {
                // there are files that don't have the `BOOK_INTRODUCTION_START` tag
                if (!isInsideDocument(context)) {
                    startDocument(context);
                }
                closeAllGroups(context);
                startGroupContainer('paragraph', context);
                break;
            }
            case UsxXmlNodeStyle.PARAGRAPH:
            case UsxXmlNodeStyle.PARAGRAPH_NOFIRSTLINEINDENT: {
                closeAllGroups(context);
                startGroupContainer('paragraph', context);
                break;
            }
            case UsxXmlNodeStyle.PARAGRAPH_EMBEDDED:
            case UsxXmlNodeStyle.PARAGRAPH_INDENTED:
            case UsxXmlNodeStyle.PARAGRAPH_INDENTED_LEVEL1:
            case UsxXmlNodeStyle.PARAGRAPH_INDENTED_LEVEL2:
            case UsxXmlNodeStyle.PARAGRAPH_INDENTED_LEVEL3:
            case UsxXmlNodeStyle.PARAGRAPH_INDENTED_NOFIRSTLINEINDENT:
            case UsxXmlNodeStyle.PARAGRAPH_EMBEDDED_OPENING:
            case UsxXmlNodeStyle.PARAGRAPH_EMBEDDED_CLOSING: {
                closeAllGroups(context);
                startGroupContainer('paragraph', context);
                startGroupContainer('indent', context);
                if (
                    tag.type === UsxXmlNodeStyle.PARAGRAPH_INDENTED_LEVEL2 ||
                    tag.type === UsxXmlNodeStyle.PARAGRAPH_INDENTED_LEVEL3
                )
                    startGroupContainer('indent', context);
                if (tag.type === UsxXmlNodeStyle.PARAGRAPH_INDENTED_LEVEL3)
                    startGroupContainer('indent', context);
                break;
            }
            case UsxXmlNodeStyle.PARAGRAPH_NOBREAK: {
                const currentContainer = getCurrentContainer(context);
                const lastParagraph =
                    currentContainer.contents[currentContainer.contents.length - 1];
                if (
                    !lastParagraph ||
                    lastParagraph.type !== 'group' ||
                    (lastParagraph.groupType !== 'paragraph' && lastParagraph.groupType !== 'line')
                )
                    throw new UsxParseError(
                        `tried to continue paragraph but found ${
                            (lastParagraph as any)?.groupType
                        }`,
                        context
                    );
                context.contentContainerStack.push(lastParagraph);
                break;
            }
            case UsxXmlNodeStyle.PARAGRAPH_BREAK: {
                // we interpret paragraph-break tags as effectively re-starting a paragraph.
                // if there is no paragraph open currently open currently we ignore this tag.
                if (isInsideGroup('paragraph', context)) {
                    startNewParagraph(context);
                }
                break;
            }
            case UsxXmlNodeStyle.SECTION_MAJOR_LEVEL1:
            case UsxXmlNodeStyle.SECTION_MAJOR_LEVEL2:
            case UsxXmlNodeStyle.SECTION_LEVEL1:
            case UsxXmlNodeStyle.SECTION_LEVEL2:
            case UsxXmlNodeStyle.SECTION_LEVEL3:
            case UsxXmlNodeStyle.SECTION_LEVEL4:
                startSection(context, tag.type);
                break;
            case UsxXmlNodeStyle.SECTION_MAJOR:
                startSection(context, UsxXmlNodeStyle.SECTION_MAJOR_LEVEL1);
                break;
            case UsxXmlNodeStyle.INTRODUCTION_SECTION_HEADING_LEVEL1:
            case UsxXmlNodeStyle.INTRODUCTION_OUTLINE_TITLE:
                // there are files that don't have the `BOOK_INTRODUCTION_START` tag
                if (!isInsideDocument(context)) {
                    startDocument(context);
                }
                startSection(context, UsxXmlNodeStyle.SECTION_LEVEL1);
                break;
            case UsxXmlNodeStyle.CHAPTER_LABEL:
                startSection(context, UsxXmlNodeStyle.SECTION_LEVEL3);
                const chapterSection = getCurrentSection(context);
                chapterSection!.isChapterLabel = true;
                break;
            case UsxXmlNodeStyle.POETRY_ACROSTIC_HEADING:
            case UsxXmlNodeStyle.SECTION_SPEAKER:
                // we treat acrostic or speaker headings as the lowest level sections to make those headings work
                startSection(context, UsxXmlNodeStyle.SECTION_LEVEL4);
                break;
            case UsxXmlNodeStyle.TITLE_CANONICAL: {
                closeAllGroups(context);
                // if the canonical title is outside of verse 1 (i.e. we set the verse number implicitly on chapter start), we number it as `1.0`
                if (context.isCurrentVerseImplicit) context.currentSubverse = 0;
                startNewParagraph(context);
                startGroupContainer('title', context);
                break;
            }
            case UsxXmlNodeStyle.POETRY:
            case UsxXmlNodeStyle.POETRY_LEVEL1:
            case UsxXmlNodeStyle.POETRY_LEVEL2:
            case UsxXmlNodeStyle.POETRY_LEVEL3:
            case UsxXmlNodeStyle.POETRY_LEVEL4:
            case UsxXmlNodeStyle.LIST_ITEM:
            case UsxXmlNodeStyle.LIST_ITEM_LEVEL1:
            case UsxXmlNodeStyle.LIST_ITEM_LEVEL2:
            case UsxXmlNodeStyle.LIST_ITEM_LEVEL3:
            case UsxXmlNodeStyle.LIST_ITEM_LEVEL4:
                startLine(context, tag.type);
                break;
            case UsxXmlNodeStyle.POETRY_CENTERED:
            case UsxXmlNodeStyle.POETRY_RIGHT:
            case UsxXmlNodeStyle.POETRY_EMBEDDED:
            case UsxXmlNodeStyle.POETRY_EMBEDDED_LEVEL1:
            case UsxXmlNodeStyle.PARAGRAPH_EMBEDDED_REFRAIN:
            case UsxXmlNodeStyle.INTRODUCTION_POETRY:
            case UsxXmlNodeStyle.INTRODUCTION_POETRY_LEVEL1:
                startLine(context, UsxXmlNodeStyle.POETRY_LEVEL1);
                break;
            case UsxXmlNodeStyle.POETRY_EMBEDDED_LEVEL2:
            case UsxXmlNodeStyle.INTRODUCTION_POETRY_LEVEL12:
                startLine(context, UsxXmlNodeStyle.POETRY_LEVEL2);
                break;
            case UsxXmlNodeStyle.INSCRIPTION:
                // we treat inscription paragraphs as a single indented poetry line
                startLine(context, UsxXmlNodeStyle.POETRY_LEVEL2);
                break;
            case UsxXmlNodeStyle.TABLE_ROW:
                startLine(context, UsxXmlNodeStyle.LIST_ITEM_LEVEL1);
                break;
            case UsxXmlNodeStyle.INTRODUCTION_LIST_ITEM:
            case UsxXmlNodeStyle.INTRODUCTION_LIST_ITEM_LEVEL1:
            case UsxXmlNodeStyle.INTRODUCTION_OUTLINE_LEVEL1:
                // there are files that don't have the `BOOK_INTRODUCTION_START` tag
                if (!isInsideDocument(context)) {
                    startDocument(context);
                }
                startLine(context, UsxXmlNodeStyle.LIST_ITEM_LEVEL1);
                break;
            case UsxXmlNodeStyle.INTRODUCTION_LIST_ITEM_LEVEL2:
            case UsxXmlNodeStyle.INTRODUCTION_OUTLINE_LEVEL2:
                startLine(context, UsxXmlNodeStyle.LIST_ITEM_LEVEL2);
                break;
            case UsxXmlNodeStyle.INTRODUCTION_OUTLINE_LEVEL3:
                startLine(context, UsxXmlNodeStyle.LIST_ITEM_LEVEL3);
                break;
            case UsxXmlNodeStyle.DIVINE_NAME:
                startGroupContainer('divineName', context);
                break;
            case UsxXmlNodeStyle.SELAH:
                startGroupContainer('sela', context);
                break;
            case UsxXmlNodeStyle.QUOTE:
            case UsxXmlNodeStyle.NOTE_CHAR_QUOTE:
                startGroupContainer('quote', context);
                break;
            case UsxXmlNodeStyle.BOLD:
                startGroupContainer('bold', context);
                break;
            case UsxXmlNodeStyle.EMPHASIS:
            case UsxXmlNodeStyle.NOTE_CHAR_KEYWORD:
            case UsxXmlNodeStyle.KEYWORD:
                startGroupContainer('emphasis', context);
                break;
            case UsxXmlNodeStyle.ITALIC:
                startGroupContainer('italic', context);
                break;
            case UsxXmlNodeStyle.WORDS_OF_JESUS:
                startGroupContainer('quote', context, 'jesus');
                break;
            case UsxXmlNodeStyle.NOTE_CHAR_ALTTRANSLATION:
                startGroupContainer('translationChange', context);
                break;
            case UsxXmlNodeStyle.TRANSLATION_CHANGE_ADDITION:
                startGroupContainer('translationChange', context, 'addition');
                break;
            case UsxXmlNodeStyle.CROSS_REFERENCE:
                // we have instances of a char-crossref tag inside the bible text
                if (!isInsideDocument(context)) startDocument(context);
                break;
            case UsxXmlNodeStyle.CROSS_REFERENCE_QUOTE:
            case UsxXmlNodeStyle.INTRODUCTION_OUTLINE_REFERENCES:
                // is handled in the `ref` tag
                break;
            case 'ref':
                const paratextLoc = tag.attributes.loc;
                if (
                    paratextLoc &&
                    !isInTag(UsxXmlNodeStyle.SECTION_MAJOR, context) &&
                    !isInTag(UsxXmlNodeStyle.SECTION_MAJOR_REFERENCES, context) &&
                    !(
                        isInTag(UsxXmlNodeStyle.SECTION_DIVISION_REFERENCES, context) &&
                        !isInTag(UsxXmlNodeStyle.CROSS_REFERENCE, context)
                    )
                ) {
                    const bookAndRef = paratextLoc.split(' ');
                    const osisId = getOsisIdFromParatextId(bookAndRef[0]!);
                    // there might be references to book ids that we can't link to, such as XXA
                    // ("extra material"). if we can't find the osisId, we just ignore the link
                    if (osisId && bookAndRef[1]) {
                        const refStartEnd = bookAndRef[1].split('-');
                        const startChapterVerse = refStartEnd[0]!.split(':');
                        let endChapter: number | undefined;
                        let endVerse: number | undefined;
                        if (refStartEnd[1]) {
                            const endChapterVerse = refStartEnd[1].split(':');
                            if (endChapterVerse[1]) {
                                if (!startChapterVerse[1])
                                    throw new UsxParseError(
                                        `Missing starting verse in reference: ${paratextLoc}`,
                                        context
                                    );
                                endChapter = parseInt(endChapterVerse[0]!);
                                endVerse = parseInt(endChapterVerse[1]);
                            } else if (!startChapterVerse[1]) {
                                endChapter = parseInt(endChapterVerse[0]!);
                            } else {
                                endVerse = parseInt(endChapterVerse[0]!);
                            }
                        }
                        context.referenceBuffer = {
                            bookOsisId: osisId,
                            versionChapterNum: parseInt(startChapterVerse[0]!),
                            versionVerseNum: startChapterVerse[1]
                                ? parseInt(startChapterVerse[1])
                                : undefined,
                            versionChapterEndNum: endChapter,
                            versionVerseEndNum: endVerse,
                        };
                    }
                }
                break;
            case 'optbreak': {
                // we currently only see this in the context of a table-cell. since we currently
                // don't support tables (and render each row as a line), a linebreak within a cell
                // does not produce a desired outcome, so we ignore `optbreak` for now

                // const phrase = getCurrentBiblePhrase(context);
                // if (!phrase)
                //     throw new UsxParseError(`linebreak failed: can't find phrase`, context);
                // phrase.linebreak = true;
                break;
            }
            // tags that don't need any action:
            case 'usx':
            case 'table':
            case UsxXmlNodeStyle.NOTE_CHAR_TEXT:
            // tags that are handled in `parseTextNode`:
            case UsxXmlNodeStyle.NOTE_CHAR_VERSENUMBER:
            case UsxXmlNodeStyle.SECTION_MAJOR_REFERENCES:
            // tags that we chose to ignore (for now):
            case UsxXmlNodeStyle.TRANSLITERATED:
            case UsxXmlNodeStyle.ORDINAL_NUMBER_TEXT:
            case UsxXmlNodeStyle.SMALL_CAPITALIZATION:
            case UsxXmlNodeStyle.BOOK_NAME:
            case UsxXmlNodeStyle.TABLE_CELL1:
            case UsxXmlNodeStyle.TABLE_CELL2:
            case UsxXmlNodeStyle.TABLE_CELL2_RIGHT:
            case UsxXmlNodeStyle.TABLE_CELL3:
            case UsxXmlNodeStyle.NOTE_ADDITIONAL_PARAGRAPH:
            case UsxXmlNodeStyle.PROPER_NAME:
            case UsxXmlNodeStyle.WORDLIST_ITEM:
                break;
            default:
                this.log('warn', `unhandled tag ${tag.type}`);
                break;
        }
    }

    parseTextNode(text: string, context: IParserContext) {
        const trimmedText = text.trim();
        if (!trimmedText) {
            return;
        }
        // set `trimmedText` to context for error reporting
        context.currentText = trimmedText;
        const currentTag = getCurrentTag(context);
        if (
            isInsideIgnoredContent(context) ||
            // we ignore introduction major title, however we still need it to start the document
            currentTag.type === UsxXmlNodeStyle.INTRODUCTION_TITLE ||
            currentTag.type === UsxXmlNodeStyle.INTRODUCTION_TITLE_LEVEL1 ||
            // we ignore the self reference within `SECTION_DIVISION_REFERENCES` (so that the
            // division references are properly detected as section cross references)
            (isInTag(UsxXmlNodeStyle.SECTION_DIVISION_REFERENCES, context) &&
                !isInTag(UsxXmlNodeStyle.CROSS_REFERENCE, context))
            // ||
            // // we ignore chapter label texts, however we still want notes inside of it
            // currentTag.type === UsxXmlNodeStyle.CHAPTER_LABEL
        )
            return;

        const currentContainer = getCurrentContainer(context);

        if (isInsideDocument(context)) {
            if (
                isInTag(UsxXmlNodeStyle.CROSS_REFERENCE, context) &&
                (!isInTag('ref', context) || !context.referenceBuffer) &&
                context.bcv
            ) {
                const refs = getReferencesFromText(context.bcv, trimmedText, {
                    bookOsisId: context.book.osisId,
                    chapterNum: context.currentChapter,
                    language: context.version.language,
                });
                if (refs.length) {
                    currentContainer.contents.push(
                        ...getPhrasesFromParsedReferences(trimmedText, refs, context.version.uid)
                    );
                    return;
                }
            } else {
                const phrase: DocumentPhrase = { type: 'phrase', content: trimmedText };
                if (startsWithNoSpaceBeforeChar(trimmedText)) phrase.skipSpace = 'before';
                if (endsWithNoSpaceAfterChar(trimmedText))
                    phrase.skipSpace = phrase.skipSpace === 'before' ? 'both' : 'after';
                if (context.referenceBuffer) {
                    phrase.bibleReference = {
                        ...context.referenceBuffer,
                        versionId: undefined,
                        versionUid: this.options.versionMeta.uid,
                    };
                    delete context.referenceBuffer;
                }
                const phraseContainer: DocumentElement =
                    currentTag.type === UsxXmlNodeStyle.NOTE_CHAR_VERSENUMBER
                        ? { type: 'group', groupType: 'italic', contents: [phrase] }
                        : phrase;
                currentContainer.contents.push(phraseContainer);
            }
        } else {
            if (context.referenceBuffer)
                throw new UsxParseError(`reference outside of document`, context);

            if (isInSectionTag(context)) {
                const currentSection = getCurrentSection(context);
                if (!currentSection) throw new UsxParseError(`missing section container`, context);
                const titleText =
                    currentTag.type === UsxXmlNodeStyle.DIVINE_NAME
                        ? trimmedText.toUpperCase()
                        : trimmedText;
                if (currentSection.title) currentSection.title += ' ' + titleText;
                else currentSection.title = titleText;
            } else if (isInTag(UsxXmlNodeStyle.SECTION_MAJOR_REFERENCES, context)) {
                const currentSection = getCurrentSection(context);
                if (!currentSection)
                    throw new UsxParseError(
                        `missing section container (parsing major references)`,
                        context
                    );
                // we don't use `trimmedText` here since we want to use the text as it is in the source file
                if (currentSection.subTitle) currentSection.subTitle += text;
                else currentSection.subTitle = text;
            } else {
                if (!context.currentChapter || !context.currentVerse)
                    throw new UsxParseError(`saving phrase without numbering ${text}`, context);

                const phraseTemplate: Partial<IBibleContentPhrase> = {
                    type: 'phrase',
                    versionChapterNum: context.currentChapter,
                    versionVerseNum: context.currentVerse,
                    versionSubverseNum: context.currentSubverse,
                };

                if (context.currentVerseJoinToVersionRef) {
                    phraseTemplate.joinToVersionRefId = generateVersionReferenceId(
                        context.currentVerseJoinToVersionRef
                    );
                    context.currentVerseJoinToVersionRefContainer = currentContainer;
                }

                if (context.noteBuffer) {
                    currentContainer.contents.push({
                        ...phraseTemplate,
                        content: '',
                        notes: [context.noteBuffer],
                    });
                    delete context.noteBuffer;
                }

                const phrase: IBibleContentPhrase = {
                    ...phraseTemplate,
                    content: trimmedText,
                };

                if (startsWithNoSpaceBeforeChar(trimmedText)) phrase.skipSpace = 'before';
                if (endsWithNoSpaceAfterChar(trimmedText))
                    phrase.skipSpace = phrase.skipSpace === 'before' ? 'both' : 'after';

                currentContainer.contents.push(phrase);
            }
        }
    }

    parseClosingTag(tagName: UsxXmlNodeName, context: IParserContext) {
        if (context.skipClosingTags.length && context.skipClosingTags[0] === tagName) {
            context.skipClosingTags.shift();
            if (context.openedSelfClosingTag) delete context.openedSelfClosingTag;
            return;
        }

        let currentTag: UsxXmlNode | undefined;
        if (context.openedSelfClosingTag) {
            if (context.openedSelfClosingTag.name !== tagName) {
                throw new UsxParseError(`invalid self closing end tag`, context);
            }
            currentTag = context.openedSelfClosingTag;
            delete context.openedSelfClosingTag;
            // stop if this is actually a starting tag
            if (currentTag.attributes.sid) return;
            // stop if this document uses self closing tags without `sid`/`eid` attributes.
            // this is the case for USX <= 2.6 where there are the starting tags for chapter/verse
            if (!currentTag.attributes.eid) return;
        } else {
            currentTag = context.hierarchicalTagStack.pop();
        }

        if (!currentTag)
            throw new UsxParseError(`can't find matching tag for closing tag ${tagName}`, context);

        if (isInsideIgnoredContent(context)) return;

        switch (currentTag.type) {
            case UsxXmlNodeStyle.NOTE_ENDNOTE:
            case UsxXmlNodeStyle.NOTE_EXTENDED:
            case UsxXmlNodeStyle.NOTE_FOOTNOTE:
            case UsxXmlNodeStyle.NOTE_INTRODUCTORY:
            case UsxXmlNodeStyle.SECTION_PARALLEL_REFERENCES:
            case UsxXmlNodeStyle.SECTION_DIVISION_REFERENCES:
            case UsxXmlNodeStyle.CROSS_REFERENCE: {
                // if we encounter a cross reference tag outside book introduction or note
                // container, we close the current document. this is because there are sometimes
                // standalone char-crossref-tags in bible texts. However we don't want to close the
                // document from a crossref-tag if its inside a note container tag or book intro
                // (which is the default - this is just a workaround for faulty source files)
                if (
                    UsxXmlNodeStyle.CROSS_REFERENCE &&
                    (isInNoteContainerTag(context) ||
                        // check if we are inside book introduction
                        !context.currentChapter)
                )
                    break;

                const content = closeDocument(context);
                let crossRefs: IBibleCrossReference[] | undefined;
                // check if document only consist of references and convert to cross reference
                if (
                    content.contents.length &&
                    content.contents.findIndex(
                        (_content) =>
                            !(
                                (_content.type === 'phrase' || !_content.type) &&
                                (_content.bibleReference ||
                                    [
                                        ';',
                                        ',',
                                        '.',
                                        '(',
                                        ')',
                                        '–',
                                        '-',
                                        'و',
                                        '；',
                                        '，',
                                        '。',
                                    ].indexOf(_content.content) !== -1)
                            )
                    ) === -1
                ) {
                    crossRefs = content.contents
                        .filter((_content) => !!(_content as DocumentPhrase).bibleReference)
                        .map((_content) => ({
                            label: (_content as DocumentPhrase).content,
                            range: (_content as DocumentPhrase).bibleReference!,
                        }));
                }

                if (
                    isInSectionTag(context) ||
                    currentTag.type === UsxXmlNodeStyle.SECTION_PARALLEL_REFERENCES ||
                    currentTag.type === UsxXmlNodeStyle.SECTION_DIVISION_REFERENCES
                ) {
                    const currentSection = getCurrentSection(context);
                    if (!currentSection)
                        throw new UsxParseError(`missing section for note`, context);
                    if (crossRefs) {
                        if (currentSection.crossReferences)
                            currentSection.crossReferences.push(...crossRefs);
                        else currentSection.crossReferences = crossRefs;
                    } else currentSection.description = content;
                } else {
                    const type = currentTag.type;
                    // const type = isInTag(UsxXmlNodeStyle.CHAPTER_LABEL, context)
                    //     ? 'cl'
                    //     : currentTag.type;
                    const note: IBibleNote = {
                        type,
                        key: currentTag.attributes.caller,
                        content,
                    };

                    if (
                        currentTag.type === UsxXmlNodeStyle.NOTE_INTRODUCTORY
                        // ||
                        // isInTag(UsxXmlNodeStyle.CHAPTER_LABEL, context)
                    ) {
                        // those notes need to be attached to the following content
                        context.noteBuffer = note;
                    } else {
                        const lastPhrase = getCurrentBiblePhrase(context, true);
                        if (!lastPhrase)
                            throw new UsxParseError(`can't find phrase for note`, context);
                        if (crossRefs) lastPhrase.crossReferences = crossRefs;
                        else {
                            if (lastPhrase.notes) lastPhrase.notes.push(note);
                            else lastPhrase.notes = [note];
                        }
                    }
                }
                break;
            }
            case UsxXmlNodeStyle.PARAGRAPH:
            case UsxXmlNodeStyle.PARAGRAPH_NOBREAK:
            case UsxXmlNodeStyle.PARAGRAPH_NOFIRSTLINEINDENT:
            case UsxXmlNodeStyle.PARAGRAPH_EMBEDDED:
            case UsxXmlNodeStyle.PARAGRAPH_EMBEDDED_OPENING:
            case UsxXmlNodeStyle.PARAGRAPH_EMBEDDED_CLOSING:
            case UsxXmlNodeStyle.PARAGRAPH_INDENTED:
            case UsxXmlNodeStyle.PARAGRAPH_INDENTED_LEVEL1:
            case UsxXmlNodeStyle.PARAGRAPH_INDENTED_LEVEL2:
            case UsxXmlNodeStyle.PARAGRAPH_INDENTED_LEVEL3:
            case UsxXmlNodeStyle.PARAGRAPH_INDENTED_NOFIRSTLINEINDENT:
            case UsxXmlNodeStyle.INTRODUCTION_PARAGRAPH:
            case UsxXmlNodeStyle.INTRODUCTION_PARAGRAPH_INDENTED:
            case UsxXmlNodeStyle.INTRODUCTION_PARAGRAPH_MARGIN:
            case UsxXmlNodeStyle.INTRODUCTION_PARAGRAPH_MARGIN_INDENTED:
            case UsxXmlNodeStyle.INTRODUCTION_PARAGRAPH_NOFIRSTLINEINDENT:
            // the following types open multiple groups and we need to close them down to the paragraph level
            case UsxXmlNodeStyle.INSCRIPTION:
                closeGroupContainer('paragraph', context);
                break;
            case UsxXmlNodeStyle.TITLE_CANONICAL:
                closeGroupContainer('paragraph', context);
                if (context.isCurrentVerseImplicit) context.currentSubverse = 1;
                break;
            case UsxXmlNodeStyle.POETRY:
            case UsxXmlNodeStyle.POETRY_LEVEL1:
            case UsxXmlNodeStyle.POETRY_LEVEL2:
            case UsxXmlNodeStyle.POETRY_LEVEL3:
            case UsxXmlNodeStyle.POETRY_LEVEL4:
            case UsxXmlNodeStyle.POETRY_CENTERED:
            case UsxXmlNodeStyle.POETRY_RIGHT:
            case UsxXmlNodeStyle.POETRY_EMBEDDED:
            case UsxXmlNodeStyle.POETRY_EMBEDDED_LEVEL1:
            case UsxXmlNodeStyle.POETRY_EMBEDDED_LEVEL2:
            case UsxXmlNodeStyle.PARAGRAPH_EMBEDDED_REFRAIN:
            case UsxXmlNodeStyle.LIST_ITEM:
            case UsxXmlNodeStyle.LIST_ITEM_LEVEL1:
            case UsxXmlNodeStyle.LIST_ITEM_LEVEL2:
            case UsxXmlNodeStyle.LIST_ITEM_LEVEL3:
            case UsxXmlNodeStyle.LIST_ITEM_LEVEL4:
            case UsxXmlNodeStyle.INTRODUCTION_POETRY:
            case UsxXmlNodeStyle.INTRODUCTION_POETRY_LEVEL1:
            case UsxXmlNodeStyle.INTRODUCTION_POETRY_LEVEL12:
            case UsxXmlNodeStyle.INTRODUCTION_LIST_ITEM:
            case UsxXmlNodeStyle.INTRODUCTION_LIST_ITEM_LEVEL1:
            case UsxXmlNodeStyle.INTRODUCTION_LIST_ITEM_LEVEL2:
            case UsxXmlNodeStyle.INTRODUCTION_OUTLINE_LEVEL1:
            case UsxXmlNodeStyle.INTRODUCTION_OUTLINE_LEVEL2:
            case UsxXmlNodeStyle.INTRODUCTION_OUTLINE_LEVEL3:
            case UsxXmlNodeStyle.TABLE_ROW:
            case UsxXmlNodeStyle.DIVINE_NAME:
            case UsxXmlNodeStyle.SELAH:
            case UsxXmlNodeStyle.QUOTE:
            case UsxXmlNodeStyle.BOLD:
            case UsxXmlNodeStyle.EMPHASIS:
            case UsxXmlNodeStyle.ITALIC:
            case UsxXmlNodeStyle.WORDS_OF_JESUS:
            case UsxXmlNodeStyle.KEYWORD:
            case UsxXmlNodeStyle.NOTE_CHAR_KEYWORD:
            case UsxXmlNodeStyle.NOTE_CHAR_QUOTE:
            case UsxXmlNodeStyle.NOTE_CHAR_ALTTRANSLATION:
            case UsxXmlNodeStyle.TRANSLATION_CHANGE_ADDITION:
                // TODO: do error checks
                const closedContainer = context.contentContainerStack.pop();
                if (closedContainer?.type === 'book')
                    throw new UsxParseError(`closing book root container`, context);
                break;
        }
    }

    toString() {
        return 'USX';
    }
}
