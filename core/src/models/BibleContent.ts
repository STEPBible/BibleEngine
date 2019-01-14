import { IBibleSectionBase } from './BibleSection';
import { IBiblePhraseWithNumbers } from './BiblePhrase';
import { IContentGroup } from './ContentGroup';

export type IBibleContent =
    | IBibleContentSection
    | IBibleContentGroup<IContentGroup['groupType']>
    | IBibleContentPhrase;

export interface IBibleNumbering {
    /**
     * this property has NO effect when importing bible data, its a helper in output data
     */
    numbering?: {
        normalizedChapterIsStarting?: number;
        normalizedChapterIsStartingInRange?: number;
        normalizedVerseIsStarting?: number;
        versionChapterIsStarting?: number;
        versionChapterIsStartingInRange?: number;
        versionVerseIsStarting?: number;
    };
}
export interface IBibleContentSection extends IBibleSectionBase, IBibleNumbering {
    readonly type: 'section';
    contents: IBibleContent[];
}

export interface IBibleContentGroup<T extends IContentGroup['groupType']>
    extends IContentGroup,
        IBibleNumbering {
    readonly type: 'group';
    readonly groupType: T;

    contents: (IBibleContentGroup<IContentGroup['groupType']> | IBibleContentPhrase)[];
}

export interface IBibleContentPhrase extends IBiblePhraseWithNumbers, IBibleNumbering {
    readonly type: 'phrase';
}
