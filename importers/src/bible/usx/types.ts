import {
    BibleReferenceParser,
    ContentGroupType,
    DocumentRoot,
    IBibleBook,
    IBibleContent,
    IBibleContentGroup,
    IBibleContentSection,
    IBibleNote,
    IBibleReference,
    IBibleReferenceRange,
    IBibleVersion,
} from '@bible-engine/core';

export interface IParserContext {
    version: IBibleVersion;
    book: IBibleBook;
    currentChapter?: number;
    currentVerse?: number;
    currentVerseJoinToVersionRef?: IBibleReference;
    currentVerseJoinToVersionRefContainer?: ParserStackItem;
    currentSubverse?: number;
    /** current text for error reporting purposes */
    currentText?: string;
    contentContainerStack: ParserStackItem[];
    hierarchicalTagStack: UsxXmlNode[];
    openedSelfClosingTag?: UsxXmlNode;
    skipClosingTags: TagType[];
    sectionStack: any[];
    isCurrentVerseImplicit: boolean;
    noteBuffer?: IBibleNote;
    referenceBuffer?: IBibleReferenceRange;
    bcv?: BibleReferenceParser;
}

export type UsxXmlNodeName =
    | 'usx'
    | 'book'
    | 'chapter'
    | 'verse'
    | 'para'
    | 'note'
    | 'char'
    | 'table'
    | 'ref'
    | 'optbreak';
export enum UsxXmlNodeStyle {
    BOOK = 'id',
    BOOK_HEADING = 'h',
    BOOK_TITLE = 'mt1',
    BOOK_TITLE_LEVEL2 = 'mt2',
    BOOK_TITLE_LEVEL3 = 'mt3',
    CHAPTER = 'c',
    CHAPTER_LABEL = 'cl',
    DIVINE_NAME = 'nd',
    REM = 'rem',
    TOC1 = 'toc1',
    TOC2 = 'toc2',
    TOC3 = 'toc3',
    VERSE = 'v',
    INSCRIPTION = 'pc',
    INTRODUCTION_TITLE = 'imt',
    INTRODUCTION_TITLE_LEVEL1 = 'imt1',
    INTRODUCTION_TITLE_LEVEL2 = 'imt2',
    INTRODUCTION_TITLE_AT_END = 'imte1',
    INTRODUCTION_END = 'ie',
    INTRODUCTION_PARAGRAPH = 'ip',
    INTRODUCTION_PARAGRAPH_INDENTED = 'ipi',
    INTRODUCTION_PARAGRAPH_MARGIN = 'im',
    INTRODUCTION_PARAGRAPH_MARGIN_INDENTED = 'imi',
    INTRODUCTION_PARAGRAPH_NOFIRSTLINEINDENT = 'imq',
    INTRODUCTION_POETRY = 'iq',
    INTRODUCTION_POETRY_LEVEL1 = 'iq1',
    INTRODUCTION_POETRY_LEVEL12 = 'iq2',
    INTRODUCTION_LIST_ITEM = 'ili',
    INTRODUCTION_LIST_ITEM_LEVEL1 = 'ili1',
    INTRODUCTION_LIST_ITEM_LEVEL2 = 'ili2',
    INTRODUCTION_SECTION_HEADING_LEVEL1 = 'is1',
    INTRODUCTION_OUTLINE_TITLE = 'iot',
    INTRODUCTION_OUTLINE_REFERENCES = 'ior',
    INTRODUCTION_OUTLINE_LEVEL1 = 'io1',
    INTRODUCTION_OUTLINE_LEVEL2 = 'io2',
    INTRODUCTION_OUTLINE_LEVEL3 = 'io3',
    INTRODUCTION_BLANK_LINE = 'ib',
    LIST_ITEM = 'li',
    LIST_ITEM_LEVEL1 = 'li1',
    LIST_ITEM_LEVEL2 = 'li2',
    LIST_ITEM_LEVEL3 = 'li3',
    LIST_ITEM_LEVEL4 = 'li4',
    NOTE_FOOTNOTE = 'f',
    NOTE_ENDNOTE = 'fe',
    NOTE_EXTENDED = 'ef',
    NOTE_INTRODUCTORY = 'iex',
    NOTE_CHAR_TEXT = 'ft',
    NOTE_CHAR_ORIGIN = 'fr',
    NOTE_CHAR_KEYWORD = 'fk',
    NOTE_CHAR_QUOTE = 'fq',
    NOTE_CHAR_ALTTRANSLATION = 'fqa',
    NOTE_CHAR_VERSENUMBER = 'fv',
    NOTE_CHAR_PREVIOUS_REFERENCE = 'fm',
    NOTE_ADDITIONAL_PARAGRAPH = 'fp',
    NOTE_CHAR_LABEL = 'fl',
    PARAGRAPH = 'p',
    PARAGRAPH_BREAK = 'b',
    PARAGRAPH_EMBEDDED = 'pm',
    PARAGRAPH_EMBEDDED_OPENING = 'pmo',
    PARAGRAPH_EMBEDDED_CLOSING = 'pmc',
    PARAGRAPH_EMBEDDED_REFRAIN = 'pmr',
    PARAGRAPH_INDENTED = 'pi',
    PARAGRAPH_INDENTED_LEVEL1 = 'pi1',
    PARAGRAPH_INDENTED_LEVEL2 = 'pi2',
    PARAGRAPH_INDENTED_LEVEL3 = 'pi3',
    PARAGRAPH_INDENTED_NOFIRSTLINEINDENT = 'mi',
    PARAGRAPH_NOBREAK = 'nb',
    PARAGRAPH_NOFIRSTLINEINDENT = 'm',
    POETRY = 'q',
    POETRY_LEVEL1 = 'q1',
    POETRY_LEVEL2 = 'q2',
    POETRY_LEVEL3 = 'q3',
    POETRY_LEVEL4 = 'q4',
    POETRY_EMBEDDED = 'qm',
    POETRY_EMBEDDED_LEVEL1 = 'qm1',
    POETRY_EMBEDDED_LEVEL2 = 'qm2',
    POETRY_CENTERED = 'qc',
    POETRY_RIGHT = 'qr',
    POETRY_ACROSTIC_HEADING = 'qa',
    SECTION_LEVEL1 = 's1',
    SECTION_LEVEL2 = 's2',
    SECTION_LEVEL3 = 's3',
    SECTION_LEVEL4 = 's4',
    SECTION_MAJOR = 'ms',
    SECTION_MAJOR_LEVEL1 = 'ms1',
    SECTION_MAJOR_LEVEL2 = 'ms2',
    SECTION_MAJOR_REFERENCES = 'mr',
    SECTION_PARALLEL_REFERENCES = 'r',
    SECTION_SPEAKER = 'sp',
    SECTION_DIVISION_REFERENCES = 'sr',
    SELAH = 'qs',
    TABLE_ROW = 'tr',
    TABLE_HEADING1 = 'th1',
    TABLE_HEADING2 = 'th2',
    TABLE_HEADING3 = 'th3',
    TABLE_CELL1 = 'tc1',
    TABLE_CELL2 = 'tc2',
    TABLE_CELL3 = 'tc3',
    TABLE_CELL2_RIGHT = 'tcr2',
    TITLE_CANONICAL = 'd',
    TRANSLATION_CHANGE_ADDITION = 'add',
    QUOTE = 'qt',
    WORDS_OF_JESUS = 'wj',
    BOLD = 'bd',
    EMPHASIS = 'em',
    ITALIC = 'it',
    TRANSLITERATED = 'tl',
    ORDINAL_NUMBER_TEXT = 'ord',
    SMALL_CAPITALIZATION = 'sc',
    CROSS_REFERENCE = 'xt',
    CROSS_REFERENCE_QUOTE = 'rq',
    BOOK_NAME = 'bk',
    PROPER_NAME = 'pn',
    WORDLIST_ITEM = 'w',
    KEYWORD = 'k',
}

export type TagType = UsxXmlNodeName | UsxXmlNodeStyle;

export const SECTION_TAGS = [
    UsxXmlNodeStyle.SECTION_MAJOR,
    UsxXmlNodeStyle.SECTION_MAJOR_LEVEL1,
    UsxXmlNodeStyle.SECTION_MAJOR_LEVEL2,
    UsxXmlNodeStyle.SECTION_LEVEL1,
    UsxXmlNodeStyle.SECTION_LEVEL2,
    UsxXmlNodeStyle.SECTION_LEVEL3,
    UsxXmlNodeStyle.SECTION_LEVEL4,
    UsxXmlNodeStyle.SECTION_SPEAKER,
    UsxXmlNodeStyle.POETRY_ACROSTIC_HEADING,
    UsxXmlNodeStyle.CHAPTER_LABEL,
    UsxXmlNodeStyle.INTRODUCTION_SECTION_HEADING_LEVEL1,
    UsxXmlNodeStyle.INTRODUCTION_OUTLINE_TITLE,
] as const;

export const SECTION_TAGS_NORMALIZED = [
    UsxXmlNodeStyle.SECTION_MAJOR_LEVEL1,
    UsxXmlNodeStyle.SECTION_MAJOR_LEVEL2,
    UsxXmlNodeStyle.SECTION_LEVEL1,
    UsxXmlNodeStyle.SECTION_LEVEL2,
    UsxXmlNodeStyle.SECTION_LEVEL3,
    UsxXmlNodeStyle.SECTION_LEVEL4,
] as const;

export const NOTE_CONTAINER_TAGS = [
    UsxXmlNodeStyle.NOTE_ENDNOTE,
    UsxXmlNodeStyle.NOTE_EXTENDED,
    UsxXmlNodeStyle.NOTE_FOOTNOTE,
    UsxXmlNodeStyle.NOTE_INTRODUCTORY,
    UsxXmlNodeStyle.SECTION_MAJOR_REFERENCES,
    UsxXmlNodeStyle.SECTION_PARALLEL_REFERENCES,
    UsxXmlNodeStyle.SECTION_DIVISION_REFERENCES,
] as const;

// CURRENTLY NOT NEEDED
// export const LINE_TAGS: TagType[] = [
//     UsxXmlNodeStyle.INTRODUCTION_LIST_ITEM,
//     UsxXmlNodeStyle.INTRODUCTION_LIST_ITEM_LEVEL1,
//     UsxXmlNodeStyle.INTRODUCTION_LIST_ITEM_LEVEL2,
//     UsxXmlNodeStyle.LIST_ITEM,
//     UsxXmlNodeStyle.LIST_ITEM_LEVEL1,
//     UsxXmlNodeStyle.LIST_ITEM_LEVEL2,
//     UsxXmlNodeStyle.LIST_ITEM_LEVEL3,
//     UsxXmlNodeStyle.LIST_ITEM_LEVEL4,
//     UsxXmlNodeStyle.POETRY,
//     UsxXmlNodeStyle.POETRY_LEVEL1,
//     UsxXmlNodeStyle.POETRY_LEVEL2,
//     UsxXmlNodeStyle.POETRY_LEVEL3,
//     UsxXmlNodeStyle.POETRY_EMBEDDED,
//     UsxXmlNodeStyle.POETRY_EMBEDDED_LEVEL1,
//     UsxXmlNodeStyle.POETRY_EMBEDDED_LEVEL2,
//     UsxXmlNodeStyle.POETRY_CENTERED,
//     UsxXmlNodeStyle.POETRY_RIGHT,
//     UsxXmlNodeStyle.POETRY_ACROSTIC_HEADING,
//     UsxXmlNodeStyle.TABLE_ROW,
// ]

export const IGNORED_TAGS: TagType[] = [
    'book',
    UsxXmlNodeStyle.BOOK,
    UsxXmlNodeStyle.BOOK_HEADING,
    // // RADAR: this sometimes has notes attached
    // UsxXmlNodeStyle.CHAPTER_LABEL,
    UsxXmlNodeStyle.BOOK_TITLE,
    UsxXmlNodeStyle.BOOK_TITLE_LEVEL2,
    UsxXmlNodeStyle.BOOK_TITLE_LEVEL3,
    UsxXmlNodeStyle.REM,
    UsxXmlNodeStyle.TOC1,
    UsxXmlNodeStyle.TOC2,
    UsxXmlNodeStyle.TOC3,
    UsxXmlNodeStyle.NOTE_CHAR_ORIGIN,
    UsxXmlNodeStyle.NOTE_CHAR_LABEL,
    // UsxXmlNodeStyle.SECTION_MAJOR,
    // UsxXmlNodeStyle.SECTION_MAJOR_REFERENCES,
    UsxXmlNodeStyle.NOTE_CHAR_PREVIOUS_REFERENCE,
    UsxXmlNodeStyle.INTRODUCTION_TITLE_LEVEL2,
    UsxXmlNodeStyle.INTRODUCTION_TITLE_AT_END,
    UsxXmlNodeStyle.INTRODUCTION_BLANK_LINE,
    UsxXmlNodeStyle.TABLE_HEADING1,
    UsxXmlNodeStyle.TABLE_HEADING2,
    UsxXmlNodeStyle.TABLE_HEADING3,
];

export interface UsxXmlNode {
    readonly name: UsxXmlNodeName;
    readonly attributes: {
        eid?: string;
        number?: string;
        sid?: string;
        style?: UsxXmlNodeStyle;
        caller?: string;
        loc?: string;
    };
    isSelfClosing: boolean;
    type: TagType;
}

export type ParserStackItem =
    | { type: 'book'; contents: IBibleContent[] }
    | DocumentRoot
    | IBibleContentSection
    | IBibleContentGroup<ContentGroupType>;
