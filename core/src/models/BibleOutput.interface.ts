import {
    BiblePhrase,
    BibleSection,
    IBibleReferenceRange,
    BibleBook,
    BibleVersion,
    IBibleReference
} from '.';

export interface IBibleOutputBase {
    version: BibleVersion;
    versionBook: BibleBook;
    range: IBibleReferenceRange;
    sectionLevel1?: BibleSection;
    sectionLevel2Up?: BibleSection[];
}

export interface IBibleOutputPlaintext extends IBibleOutputBase {
    verses: IBibleVerse[];
}

export interface IBibleOutputFormatted extends IBibleOutputBase {
    paragraphs: IBibleFormattingGroup[];
}

export interface IBibleVerse {
    reference: Required<IBibleReference>;
    phrases: BiblePhrase[];
}

export interface IBibleFormattingGroup {
    type:
        | 'none'
        | 'paragraph'
        | 'indent'
        | 'quote'
        | 'bold'
        | 'italic'
        | 'divineName'
        | 'jesusWords';
    content: IBibleFormattingGroup[] | BiblePhrase[];
}
