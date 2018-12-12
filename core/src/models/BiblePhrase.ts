import { IBibleNote } from './BibleNote';
import { IBibleCrossReference } from './BibleCrossReference';
import { IContentPhrase } from './ContentPhrase';
import { IBibleReferenceNormalizedNumbers } from './BibleReference';

export interface IBiblePhrase extends IContentPhrase {
    quoteWho?: string;
    person?: string;
    strongs?: string[];
    notes?: IBibleNote[];
    crossReferences?: IBibleCrossReference[];
}

export interface IBiblePhraseWithNumbers extends IBiblePhrase {
    versionChapterNum: number;
    versionVerseNum: number;
    // in case normalized number come pre-calculated (e.g. when downloading a version)
    normalizedReference?: IBibleReferenceNormalizedNumbers;
}

export type PhraseModifiers = {
    indentLevel?: number;
    quoteLevel?: number;
    // we have a mix of semantic and style modifiers here - we provide both to be compatible with
    // every bible version while keeping the flexibility for those that use semantic modifiers:
    orderedListItem?: string;
    unorderedListItem?: string;
    translationChange?: string;
    bold?: boolean;
    italic?: boolean;
    emphasis?: boolean;
    divineName?: boolean;
};

export type ValueModifiers = 'translationChange' | 'orderedListItem' | 'unorderedListItem';

export type BooleanModifiers = 'bold' | 'italic' | 'divineName' | 'emphasis';
