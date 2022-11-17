import { IBiblePhraseWithNumbers } from './BiblePhrase';
import { IBibleSectionBase } from './BibleSection';
import { ContentGroupType, IContentGroup } from './ContentGroup';

export type IBibleContent =
    | IBibleContentSection
    | IBibleContentGroup<ContentGroupType>
    | IBibleContentPhrase;

export interface IBibleNumbering {
    /**
     * this property was originally only a helper in output data. however since its much more space
     * efficient than adding the numbering to every phrase in input, this is now also supported for
     * input data (thus enabling more space efficent bible downloads)
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
        joinToRefId?: number;
        joinToVersionRefId?: number;
    };
}
export interface IBibleContentSection extends IBibleSectionBase {
    readonly type: 'section';
    contents: IBibleContent[];
    /**
     * In the UI we show chapter numbers after the section heading, which is
     * determined by the `numbering` attribute. `numberingInteral` indicates the
     * "real" start of a chapter/verse
     */
    numberingInternal?: IBibleNumbering['numbering'];
}

export interface IBibleContentGroup<T extends ContentGroupType>
    extends IContentGroup<T>,
        IBibleNumbering {
    readonly type: 'group';
    readonly groupType: T;

    contents: (IBibleContentGroup<ContentGroupType> | IBibleContentPhrase)[];
}

export interface IBibleContentPhrase extends IBiblePhraseWithNumbers, IBibleNumbering {
    readonly type?: 'phrase';
}
