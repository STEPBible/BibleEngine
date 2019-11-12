export type ContentGroupType =
    | 'bold'
    | 'divineName'
    | 'emphasis'
    | 'indent'
    | 'italic'
    | 'line'
    | 'linegroup'
    | 'link'
    | 'orderedListItem'
    | 'paragraph'
    | 'person'
    | 'quote'
    | 'sela'
    | 'title'
    | 'translationChange'
    | 'unorderedListItem';

export interface IContentGroup<T extends ContentGroupType> {
    readonly groupType: T;

    /**
     * - 'quote' | 'person' => who?
     * - 'translationChange' => what?
     * - 'title' => 'inline' | 'pullout'
     * - 'orderedListItem' | 'unorderedListItem' => seperate index for each item (also for
     *      unordered items, otherwise items can't be distinguished)
     * - 'line' => line nr (needed to distinguish lines)
     *
     * - the requirement 'jesus words in red' can be achieved via quote='jesus'
     * - we have a seperate modifer for 'divineName' (in addition to 'person'), since person='god'
     *   would also match instances where divineName wouldn't
     */
    modifier?: T extends 'title' ? 'inline' | 'pullout' : T extends 'line' ? number : string;
}
