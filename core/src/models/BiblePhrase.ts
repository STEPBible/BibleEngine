import { IBibleNote } from './BibleNote';
import { IBibleCrossReference } from './BibleCrossReference';
import { IContentPhrase } from './ContentPhrase';
import { IBibleReferenceNormalizedNumbers, IBibleReferenceVersionNumbers } from './BibleReference';

export interface IBiblePhrase extends IContentPhrase {
    quoteWho?: string;
    person?: string;
    strongs?: string[];
    notes?: IBibleNote[];
    crossReferences?: IBibleCrossReference[];
}

export interface IBiblePhraseWithNumbers extends IBiblePhrase, IBibleReferenceVersionNumbers {
    /**
     * TODO: implement
     * in some cases after normalization we can't be exactly sure where the verse boundaries are
     * within a group of verses. In this case we put all the text in the first verse and add an
     * empty phrase for each of the other verses. The first verse sets 'joinToRefId' to the last
     * verse of the group, all the others set it to the first verse, that contains the content.
     * If a phrase is encountered that has 'joinToRefId' set to a verse before, this has to be
     * fetched instead and the verse indicator needs to show a verse-span instead of a single number
     */
    joinToRefId?: number;
    joinToVersionRefId?: number;

    versionChapterNum?: number; // has to be set
    versionVerseNum?: number; // has to be set

    /** in case normalized numbers come pre-calculated (e.g. when downloading a version) */
    normalizedReference?: IBibleReferenceNormalizedNumbers;

    sourceTypeId?: number;
}

export type PhraseModifiers = {
    indentLevel?: number;
    quoteLevel?: number;
    line?: number;
    // we have a mix of semantic and style modifiers here - we provide both to be compatible with
    // every bible version while keeping the flexibility for those that use semantic modifiers:
    orderedListItem?: string;
    unorderedListItem?: string;
    translationChange?: string;
    link?: string;
    title?: 'pullout' | 'inline';
    bold?: boolean;
    italic?: boolean;
    divineName?: boolean;
    emphasis?: boolean;
    lineGroup?: boolean;
    sela?: boolean;
};

export type StringModifiers =
    | 'translationChange'
    | 'orderedListItem'
    | 'unorderedListItem'
    | 'link';
export type NumberModifiers = 'line';
export type ValueModifiers = StringModifiers | NumberModifiers | 'title';
export type BooleanModifiers = 'bold' | 'italic' | 'divineName' | 'emphasis' | 'lineGroup' | 'sela';
