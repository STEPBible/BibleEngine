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
    /**
     * the section(s) that wrap the current range (without being contained in it),
     * indexed by their level (1,2,3,..)
     * @type {{ [index: number]: BibleSection[] }}
     * @memberof IBibleOutputBase
     */
    wrappingSections?: { [index: number]: BibleSection };
    previousSection?: BibleSection;
    nextSection?: BibleSection;
    completeStartingParagraphRange?: IBibleReferenceRange;
    completeEndingParagraphRange?: IBibleReferenceRange;
    previousParagraphRange?: IBibleReferenceRange;
    nextParagraphRange?: IBibleReferenceRange;
    completeStartingSectionRange?: IBibleReferenceRange;
    completeEndingSectionRange?: IBibleReferenceRange;
    previousSectionRange?: IBibleReferenceRange;
    nextSectionRange?: IBibleReferenceRange;
    completeChapterRange?: IBibleReferenceRange;
    previousChapterRange?: IBibleReferenceRange;
    nextChapterRange?: IBibleReferenceRange;
}

export interface IBibleOutputPlaintext extends IBibleOutputBase {
    verses: IBibleVerse[];
}

export interface IBibleOutputFormatted extends IBibleOutputBase {
    content: IBibleOutputGroupRoot;
}

export interface IBibleVerse {
    reference: Required<IBibleReference>;
    phrases: BiblePhrase[];
}

export interface IBibleOutputNumbering {
    normalizedChapterIsStarting?: number;
    normalizedChapterIsStartingInRange?: number;
    normalizedVerseIsStarting?: number;
    versionChapterIsStarting?: number;
    versionChapterIsStartingInRange?: number;
    versionVerseIsStarting?: number;
}

export type BibleOutputGroup =
    | IBibleOutputGroupRoot
    | IBibleOutputGroupSection
    | IBibleOutputGroupParagraph
    | IBibleOutputGroupLevelFormatting
    | IBibleOutputGroupBooleanFormatting
    | IBibleOutputGroupPhrases;

export interface IBibleOutputGroupRoot {
    readonly type: 'root';
    parent: undefined;
    numbering: IBibleOutputNumbering;
    contents: BibleOutputGroup[];
}

export interface IBibleOutputGroupSection extends BibleSection {
    readonly type: 'section';
    parent: BibleOutputGroup;
    numbering: IBibleOutputNumbering;
    contents: BibleOutputGroup[]; // a section can contain everything
}

// we have a seperate type for paragraphs (and not within the formatting groups or section groups)
// to make explicit that a paragraph can't contain another section, nor can a formatting group
// contain a paragraph
export interface IBibleOutputGroupParagraph extends BibleSection {
    readonly type: 'paragraph';
    parent: BibleOutputGroup;
    numbering: IBibleOutputNumbering;
    contents: (
        | IBibleOutputGroupLevelFormatting
        | IBibleOutputGroupBooleanFormatting
        | IBibleOutputGroupPhrases)[];
}

export interface IBibleOutputGroupBooleanFormatting {
    readonly type: 'bold' | 'italic' | 'divineName' | 'jesusWords';
    parent: BibleOutputGroup; // pointer back to it's parent, needed for generating the groups
    numbering: IBibleOutputNumbering;
    contents: (
        | IBibleOutputGroupLevelFormatting
        | IBibleOutputGroupBooleanFormatting
        | IBibleOutputGroupPhrases)[];
}

export interface IBibleOutputGroupLevelFormatting {
    readonly type: 'indentLevel' | 'quoteLevel';
    parent: BibleOutputGroup; // pointer back to it's parent, needed for generating the groups
    numbering: IBibleOutputNumbering;
    level: number;
    contents: (
        | IBibleOutputGroupLevelFormatting
        | IBibleOutputGroupBooleanFormatting
        | IBibleOutputGroupPhrases)[];
}

export interface IBibleOutputGroupPhrases {
    readonly type: 'phrases';
    parent: BibleOutputGroup;
    numbering: IBibleOutputNumbering;
    contents: BiblePhrase[];
}
