import { BiblePhrase, BibleSection, BibleBook, BibleVersion } from '../entities';
import {
    IBibleReferenceRange,
    IBibleReference,
    IContentGroup,
    IBibleContentSection,
    IBibleContent,
    IBibleContentGroup,
    IBibleContentPhrase
} from '../models';
import { IBibleNumbering } from './BibleContent';

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

export interface IBibleOutputRoot extends IBibleNumbering {
    readonly type: 'root';
    contents: IBibleContent[];
}

export type BibleContentGenerator =
    | IBibleContentGeneratorSection
    | IBibleContentGeneratorGroup<IContentGroup['groupType']>
    | IBibleContentGeneratorPhrase;

export type BibleContentGeneratorContainer =
    | IBibleContentGeneratorRoot
    | IBibleContentGeneratorSection
    | IBibleContentGeneratorGroup<IContentGroup['groupType']>;

export interface IBibleContentGeneratorRoot extends IBibleOutputRoot {
    parent: undefined;
    contents: BibleContentGenerator[];
}

export interface IBibleContentGeneratorSection extends IBibleContentSection {
    parent: BibleContentGeneratorContainer;
    meta: { sectionId: number; level: number; phraseStartId: number; phraseEndId: number };
    contents: BibleContentGenerator[]; // a section can contain everything
}

export interface IBibleContentGeneratorGroup<T extends IContentGroup['groupType']>
    extends IBibleContentGroup<T> {
    parent: BibleContentGeneratorContainer;
    meta: T extends 'paragraph'
        ? { paragraphId: number; phraseStartId: number; phraseEndId: number }
        : T extends 'quote'
        ? { level: number }
        : T extends 'indent'
        ? { level: number }
        : undefined;
    contents: (IBibleContentGeneratorGroup<T> | IBibleContentGeneratorPhrase)[];
}

export interface IBibleContentGeneratorPhrase extends IBibleContentPhrase {
    parent: BibleContentGeneratorContainer;
}
