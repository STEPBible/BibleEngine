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

export type BibleOutput =
    | IBibleOutputSection
    | IBibleOutputGroup<IContentGroup['groupType']>
    | IBibleOutputPhrases;

export interface IBibleOutputRoot {
    readonly type: 'root';
    parent: undefined;
    numbering?: IBibleOutputNumbering;
    contents: BibleOutput[];
}

export interface IBibleOutputSection extends IBibleSection {
    readonly type: 'section';
    parent: BibleOutput | IBibleOutputRoot;
    meta: { sectionId: number; level: number };
    numbering?: IBibleOutputNumbering;
    contents: BibleOutput[]; // a section can contain everything
}

export interface IBibleOutputGroup<T extends IContentGroup['groupType']> extends IContentGroup {
    readonly type: 'group';
    readonly groupType: T;
    parent: BibleOutput | IBibleOutputRoot;
    numbering?: IBibleOutputNumbering;
    meta: T extends 'paragraph'
        ? { paragraphId: number; phraseStartId: number; phraseEndId: number }
        : T extends 'quote'
        ? { level: number }
        : T extends 'indent'
        ? { level: number }
        : undefined;
    contents: (IBibleOutputGroup<T> | IBibleOutputPhrases)[];
}

export interface IBibleOutputPhrases {
    readonly type: 'phrases';
    parent: BibleOutput | IBibleOutputRoot;
    numbering?: IBibleOutputNumbering;
    contents: IBiblePhrase[];
}
