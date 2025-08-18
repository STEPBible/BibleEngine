export interface IDictionaryEntry {
    strong: string;
    dictionary: string;
    lemma?: string | null;
    transliteration?: string | null;
    pronunciation?: string | null;
    gloss: string;
    content?: string | null;
}
