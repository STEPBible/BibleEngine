export interface OsisXmlNode {
    attributes: {
        annotateRef?: string;
        canonical?: 'true';
        eID?: string;
        lemma?: string;
        level?: string;
        marker?: string;
        n?: string;
        osisID?: string;
        osisIDWork?: string;
        osisRef?: string;
        sID?: string;
        subType?: OsisXmlNodeSubType;
        type?: OsisXmlNodeType;
        verseNum?: string;
        who?: string;
        'xml:lang'?: string;
    };
    isSelfClosing: boolean;
    name: OsisXmlNodeName;
}

export enum OsisXmlNodeType {
    BOLD = 'bold',
    BOOK = 'book',
    BOOK_INTRODUCTION = 'introduction',
    CROSS_REFERENCE = 'crossReference',
    ITALIC = 'italic',
    MILESTONE = 'x-milestone',
    NEWLINE = 'x-newLine',
    NEWLINE_POETRY = 'x-newPoetryLine',
    PARAGRAPH = 'paragraph',
    PSALM = 'psalm',
    SECTION = 'section',
    SECTION_MAJOR = 'majorSection',
    SECTION_SUB = 'subSection',
    SELAH = 'x-selah',
    TEXTUAL_NOTE = 'x-textual-note',
    UNDERLINE = 'underline'
}

export enum OsisXmlNodeSubType {
    PRE_VERSE = 'x-preverse'
}

export enum Indentation {
    SMALL = '1',
    LARGE = '2'
}

export enum OsisXmlNodeName {
    CATCH_WORD = 'catchWord',
    CHAPTER = 'chapter',
    DIVINE_NAME = 'divineName',
    DIVISION = 'div',
    FOREIGN_WORD = 'foreign',
    HIGHLIGHT = 'hi',
    IDENTIFIER = 'identifier',
    LINEBREAK = 'lb',
    LINE = 'l',
    LINE_GROUP = 'lg',
    MILESTONE = 'milestone',
    NOTE = 'note',
    OSIS_HEADER = 'header',
    OSIS_ROOT = 'osisText',
    PARAGRAPH = 'p',
    QUOTE = 'q',
    REF_SYSTEM = 'refSystem',
    REFERENCE = 'reference',
    VERSION_SCOPE = 'scope',
    TITLE = 'title',
    VERSE = 'verse',
    WORD = 'w',
    WORD_SEGMENT = 'seg',
    WORK = 'work',
    XML = 'xml',
    XML_ROOT = 'osis'
}
