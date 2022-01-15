import { DocumentRoot } from './Document';

export interface IDictionaryEntry {
    strong: string;
    dictionary: string;
    lemma?: string;
    transliteration?: string;
    pronunciation?: string;
    gloss: string;
    content?: string;
}
