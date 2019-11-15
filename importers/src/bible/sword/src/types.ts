import {
    IBibleCrossReference,
    IBibleNote,
    IBibleContentPhrase,
    IBibleContentGroup,
    IBibleContentSection
} from '@bible-engine/core';
import { OsisXmlNode } from '../../../shared/osisTypes';

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

export type ParserContext = {
    chapterNum: number;
    currentNode?: OsisXmlNode;
    currentNoteNode?: OsisXmlNode;
    currentNoteNum: number;
    currentCrossRefNode?: OsisXmlNode;
    crossRefs: IBibleCrossReference[];
    divineNameNode?: OsisXmlNode;
    quoteNode?: OsisXmlNode;
    verseNum: number;
    notes: IBibleNote[];
    noteText: string;
    osisRef: string;
    psalmTitle?: OsisXmlNode;
    psalmTitleContents: IBibleContentPhrase[];
    phrases: any;
    paragraph?: IBibleContentGroup<'paragraph'>;
    noteCount: number;
    title?: OsisXmlNode;
    titleSection: IBibleContentSection;
    titleSections: IBibleContentSection[];
    titleText: string;
};
