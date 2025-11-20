import {
    IBibleBook,
    IBibleContent,
    IBibleContentGroup,
    IBibleContentPhrase,
    IBibleContentSection,
    IBibleReference,
    IBibleReferenceRange,
    IBibleVersion,
} from '../models/index.js';
import { IBibleNumbering } from './BibleContent.js';
import { IBiblePhraseEntity } from './BiblePhrase.js';
import { IBibleSectionReduced } from './BibleSection.js';
import { ContentGroupType } from './ContentGroup.js';

// export interface IBibleEngineOutput {
//     source?: 'local' | 'remote';
// }

export interface IBibleOutputBase {
    //} extends IBibleEngineOutput {
    version: IBibleVersion;
    versionBook: IBibleBook;
    range: IBibleReferenceRange;
}

export interface IBibleOutputPlaintext extends IBibleOutputBase {
    verses: IBibleVerse[];
}

export interface IBibleContextRangeBase {
    completeRange?: IBibleReferenceRange;
    completeStartingRange?: IBibleReferenceRange;
    completeEndingRange?: IBibleReferenceRange;
    previousRange?: IBibleReferenceRange;
    nextRange?: IBibleReferenceRange;
}

export interface IBibleOutputRich extends IBibleOutputBase {
    content: IBibleOutputRoot;

    /**
     * the sections that are in and around the current range, indexed by their level (1,2,3,..)
     */
    context: {
        [index: number]: {
            /**
             * the sections that start within the current range
             */
            startingSections: IBibleSectionReduced[];
            /**
             * the section that ends within the current range (but not starts within)
             */
            endingPartialSection?: IBibleSectionReduced;
            /**
             * the section that wraps the current range (without being contained in it)
             */
            wrappingSection?: IBibleSectionReduced;
            /**
             * the sections of this level before the current range that have no intersection
             * with the current range
             */
            previousSections: IBibleSectionReduced[];
            /**
             * this sections of this level after the current range that have no intersection
             * with the current range
             */
            nextSections: IBibleSectionReduced[];
        };
    };

    /**
     * pre-generated ranges to use in context queries for paragraph, sections (per level) and
     * chapter
     */
    contextRanges: {
        paragraph: IBibleContextRangeBase;
        versionChapter: IBibleContextRangeBase;
        normalizedChapter: IBibleContextRangeBase;
        sections: { [index: number]: IBibleContextRangeBase };
    };
}

export interface IBibleVerse {
    reference: Required<IBibleReference>;
    phrases: IBiblePhraseEntity[];
}

export interface IBibleOutputRoot extends IBibleNumbering {
    readonly type: 'root';
    contents: IBibleContent[];
}

export type BibleContentGenerator =
    | IBibleContentGeneratorSection
    | IBibleContentGeneratorGroup<ContentGroupType>
    | IBibleContentGeneratorPhrase;

export type BibleContentGeneratorContainer =
    | IBibleContentGeneratorRoot
    | IBibleContentGeneratorSection
    | IBibleContentGeneratorGroup<ContentGroupType>;

export interface IBibleContentGeneratorRoot extends IBibleOutputRoot {
    parent: undefined;
    contents: BibleContentGenerator[];
}

export interface IBibleContentGeneratorSection extends IBibleContentSection {
    parent: BibleContentGeneratorContainer;
    meta: { level: number; phraseStartId: number; phraseEndId: number };
    contents: BibleContentGenerator[]; // a section can contain everything
}

export interface IBibleContentGeneratorGroup<T extends ContentGroupType>
    extends IBibleContentGroup<T> {
    parent: BibleContentGeneratorContainer;
    meta: T extends 'paragraph'
        ? { paragraphId: number; phraseStartId: number; phraseEndId: number }
        : T extends 'quote'
        ? { level: number }
        : T extends 'indent'
        ? { level: number }
        : undefined;
    contents: (IBibleContentGeneratorGroup<ContentGroupType> | IBibleContentGeneratorPhrase)[];
}

export interface IBibleContentGeneratorPhrase extends IBibleContentPhrase {
    parent: BibleContentGeneratorContainer;
}
