export interface OsisXmlNode {
    attributes: {
        annotateRef?: string;
        canonical?: 'true' | 'false';
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
    PARALLEL = 'parallel',
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
    DATE = 'date',
    DESCRIPTION = 'description',
    DIVINE_NAME = 'divineName',
    DIVISION = 'div',
    FOREIGN_WORD = 'foreign',
    HIGHLIGHT = 'hi',
    IDENTIFIER = 'identifier',
    LANGUAGE = 'language',
    LEMMA = 'lemma',
    LINEBREAK = 'lb',
    LINE = 'l',
    LINE_GROUP = 'lg',
    MILESTONE = 'milestone',
    NAME = 'name',
    NOTE = 'note',
    OSIS_HEADER = 'header',
    OSIS_ROOT = 'osisText',
    PARAGRAPH = 'p',
    PUBLISHER = 'publisher',
    QUOTE = 'q',
    REF_SYSTEM = 'refSystem',
    REFERENCE = 'reference',
    REVISION_DESC = 'revisionDesc',
    RIGHTS = 'rights',
    SWORD_MILESTONE = 'x-milestone',
    TITLE = 'title',
    TRANS_CHANGE = 'transChange',
    TYPE = 'type',
    VERSE = 'verse',
    WORD = 'w',
    WORD_SEGMENT = 'seg',
    WORK = 'work',
    VERSION_SCOPE = 'scope',
    XML = 'xml',
    XML_ROOT = 'osis'
}
