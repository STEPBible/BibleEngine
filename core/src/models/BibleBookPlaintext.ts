export type BibleChapterPlaintext = Map<number, string[]>;
export type BibleBookPlaintext = Map<number, BibleChapterPlaintext>;

export type BiblePlaintext = Map<string, BibleBookPlaintext>;
