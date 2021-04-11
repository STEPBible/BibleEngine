export interface VerseMetadata {
    book: string;
    bookNum: number;
    chapter: number;
    osis: string;
    verse: number;
}

export interface VersePosition {
    length: number;
    startPos: number;
}

export interface VerseMetadata {
    book: string;
    bookNum: number;
    chapter: number;
    osis: string;
    verse: number;
}

export interface ChapterPosition {
    bookStartPos: number;
    booknum: number;
    length: number;
    startPos: number;
    verses: VersePosition[];
}

export interface JsonFilterOptions {
    headings: true;
    footnotes: true;
    crossReferences: false;
    strongsNumbers: true;
    indentation: true;
    wordsOfChristInRed: false;
    oneVersePerLine: false;
    array: false;
}

export interface VerseXML {
    text: string;
    verse: number;
}

export interface ChapterXML {
    intro: string;
    verses: VerseXML[];
}

export interface BookXML {
    osisId: string;
    fullName: string;
    bookNum: number;
    chapters: ChapterXML[];
}

export enum SwordMetadataKey {
    DESCRIPTION = 'Description',
    ENCODING = 'Encoding',
    IN_DEPTH_DESCRIPTION = 'About',
    LANGUAGE = 'Lang',
    OPTION_FILTER = 'GlobalOptionFilter',
    SHORT_COPYRIGHT = 'ShortCopyright',
    SOURCE_TYPE = 'SourceType',
    VERSIFICATION = 'Versification',
}

export enum SwordFilterOptions {
    OSIS_STRONGS = 'OSISStrongs',
}
