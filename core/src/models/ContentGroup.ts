export type ContentGroupType =
    | 'paragraph'
    | 'person'
    | 'quote'
    | 'orderedListItem'
    | 'unorderedListItem'
    | 'indent'
    | 'bold'
    | 'italic'
    | 'emphasis'
    | 'divineName'
    | 'translationChange'
    | 'title'
    | 'poetry';

export interface IContentGroup<T extends ContentGroupType> {
    readonly groupType: T;

    /**
     * - 'quote' | 'person' => who?
     * - 'translationChange' => what?
     * - 'title' => 'inline' | 'pullout'
     * - 'orderedListItem' | 'unorderedListItem' => seperate index for each item (also for
     *      unordered items, otherwise items can't be distinguished)
     *
     * - the requirement 'jesus words in red' can be achieved via quote='jesus'
     * - we have a seperate modifer for 'divineName' (in addition to 'person'), since person='god'
     *   would also match instances where divineName wouldn't
     */
    modifier?: T extends 'title' ? 'inline' | 'pullout' : string;
}
