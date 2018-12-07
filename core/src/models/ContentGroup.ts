export interface IContentGroup {
    readonly groupType:
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
        | 'translationChange';

    /**
     * 'quote' | 'person' => who?
     * 'translationChange' => what?
     *
     * - the requirement 'jesus words in red' can be achieved via quote='jesus'
     * - we have a seperate modifer for 'divineName' (in addition to 'person'), since person='god'
     *   would also match instances where divineName wouldn't
     */
    modifier?: string;
}
