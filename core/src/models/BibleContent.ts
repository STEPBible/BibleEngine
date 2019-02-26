import { IBibleSectionBase } from './BibleSection';
import { IBiblePhraseWithNumbers } from './BiblePhrase';
import { IContentGroup, ContentGroupType } from './ContentGroup';

export type IBibleContent =
    | IBibleContentSection
    | IBibleContentGroup<ContentGroupType>
    | IBibleContentPhrase;

export interface IBibleNumbering {
    /**
     * this property has NO effect when importing bible data, its a helper in output data
     */
    numbering?: {
        normalizedChapterIsStarting?: number;
        normalizedChapterIsStartingInRange?: number;
        normalizedVerseIsStarting?: number;
        normalizedSubverseIsStarting?: number;
        versionChapterIsStarting?: number;
        versionChapterIsStartingInRange?: number;
        versionVerseIsStarting?: number;
        versionSubverseIsStarting?: number;
    };
}
export interface IBibleContentSection extends IBibleSectionBase, IBibleNumbering {
    readonly type: 'section';
    contents: IBibleContent[];
}

export interface IBibleContentGroup<T extends ContentGroupType>
    extends IContentGroup<T>,
        IBibleNumbering {
    readonly type: 'group';
    readonly groupType: T;

    contents: (IBibleContentGroup<ContentGroupType> | IBibleContentPhrase)[];
}

export interface IBibleContentPhrase extends IBiblePhraseWithNumbers, IBibleNumbering {
    readonly type: 'phrase';
}
