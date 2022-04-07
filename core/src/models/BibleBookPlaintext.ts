// we need `undefined` here since subverse zero is a special case that does not exist most of the time
export type BibleChapterPlaintext = Map<number, (string | undefined)[]>;
export type BibleBookPlaintext = Map<number, BibleChapterPlaintext>;

export type BiblePlaintext = Map<string, BibleBookPlaintext>;
