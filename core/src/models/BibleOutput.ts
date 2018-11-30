import { BiblePhrase, BibleSection, BibleBook, BibleVersion } from '../entities';
import {
    IBibleReferenceRange,
    IBibleReference,
    IBibleSection,
    IBiblePhrase,
    IContentGroup
} from '../models';

export interface IBibleOutputBase {
    version: BibleVersion;
    versionBook: BibleBook;
    range: IBibleReferenceRange;
}

export interface IBibleOutputPlaintext extends IBibleOutputBase {
    verses: IBibleVerse[];
}

export interface IBibleOutputRich extends IBibleOutputBase {
    content: IBibleOutputRoot;

    /**
     * the sections that are in and around the current range, indexed by their level (1,2,3,..)
     */
    context: {
        [index: number]: {
            /**
             * the sections that start or end within the current range
             */
            includedSections: BibleSection[];
            /**
             * the section that wraps the current range (without being contained in it)
             */
            wrappingSection?: BibleSection;
            /**
             * the sections of this level before the current range that have no intersection
             * with the current range
             */
            previousSections: BibleSection[];
            /**
             * this sections of this level after the current range that have no intersection
             * with the current range
             */
            nextSections: BibleSection[];
        };
    };

    /**
     * pre-generated ranges to use in context queries for paragraph, section (level 1) and chapter
     */
    contextRanges: {
        [key in 'paragraph' | 'section' | 'chapter']: {
            // RADAR: we might enable this again
            // completeStartingRange?: IBibleReferenceRange;
            completeRange?: IBibleReferenceRange;
            // RADAR: we might enable this again
            // completeEndingRange?: IBibleReferenceRange;
            previousRange?: IBibleReferenceRange;
            nextRange?: IBibleReferenceRange;
        }
    };
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

export type BibleOutput = IBibleOutputSection | IBibleOutputGroup | IBibleOutputPhrase;

export interface IBibleOutputRoot {
    readonly type: 'root';
    parent: undefined;
    numbering?: IBibleOutputNumbering;
    contents: BibleOutput[];
}

export interface IBibleOutputSection extends IBibleSection {
    readonly type: 'section';
    parent: BibleOutput;
    numbering?: IBibleOutputNumbering;
    contents: BibleOutput[]; // a section can contain everything
}

export interface IBibleOutputGroup extends IContentGroup {
    readonly type: 'group';
    parent: BibleOutput;
    numbering?: IBibleOutputNumbering;
    contents: (IBibleOutputGroup | IBibleOutputPhrase)[];
}

export interface IBibleOutputPhrase extends IBiblePhrase {
    readonly type: 'phrase';
    parent: BibleOutput;
    numbering?: IBibleOutputNumbering;
}
