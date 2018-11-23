export type BibleVersePlaintext = string;
export type BibleChapterPlaintext = Map<number, BibleVersePlaintext>;
export type BibleBookPlaintext = Map<number, BibleChapterPlaintext>;
