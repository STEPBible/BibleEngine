import { IBibleNote } from './BibleNote';
import { IBibleCrossReference } from './BibleCrossReference';
import { IContentPhrase } from './ContentPhrase';
import { IBibleReferenceNormalizedNumbers } from './BibleReference';

export interface IBiblePhrase extends IContentPhrase {
    versionChapterNum: number;
    versionVerseNum: number;
    // in case normalized number come pre-calculated (e.g. when downloading a version)
    normalizedReference?: IBibleReferenceNormalizedNumbers;
    quoteWho?: string;
    person?: string;
    strongs?: string[];
    notes?: IBibleNote[];
    crossReferences?: IBibleCrossReference[];
}

export type PhraseModifiers = {
    indentLevel: number;
    quoteLevel: number;
    // we have a mix of semantic and style modifiers here - we provide both to be compatible with
    // every bible version while keeping the flexibility for those that use semantic modifiers:
    bold?: boolean;
    italic?: boolean;
    emphasis?: boolean;
    divineName?: boolean;
    listItem?: string;
    translationChange?: string;
    person?: string;
    quoteWho?: string;
};
