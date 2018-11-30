import { IBibleNote } from './BibleNote';
import { IBibleCrossReference } from './BibleCrossReference';
import { IContentPhrase } from './ContentPhrase';

export interface IBiblePhrase extends IContentPhrase {
    versionChapterNum: number;
    versionVerseNum: number;
    quoteWho?: string;
    person?: string;
    strongs?: string[];
    notes?: IBibleNote[];
    crossReferences?: IBibleCrossReference[];
}

export type PhraseModifiers = {
    indentLevel?: number;
    quoteLevel?: number;
    orderedListItem?: number;
    unorderedListItem?: number;
    // we have a mix of semantic and style modifiers here - we provide both to be compatible with
    // every bible version while keeping the flexibility for those that use semantic modifiers:
    bold?: boolean;
    italic?: boolean;
    emphasis?: boolean;
    divineName?: boolean;
    translationChange?: string;
};
