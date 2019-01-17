import { DocumentDefault } from './Document';

export interface IDictionaryEntry {
    strong: string;
    dictionary: string;
    lemma?: string;
    transliteration?: string;
    gloss: string;
    content?: DocumentDefault;
}
