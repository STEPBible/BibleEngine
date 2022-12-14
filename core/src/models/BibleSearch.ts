export type SearchQueryMode = 'exact' | 'fuzzy';
export type SearchSortMode = 'relevance' | 'reference';

export interface IBibleSearchOptions {
    versionUid: string;
    alternativeVersionUids?: string[];
    query: string;
    bookRange?: { start: number; end?: number };
    queryMode?: SearchQueryMode;
    sortMode?: SearchSortMode;
    pagination?: { page: number; count?: number };
}

export interface IBibleSearchResult {
    content: string;
    versionBook: number;
    versionChapter: number;
    versionVerse: number;
    versionUid: string;
}
