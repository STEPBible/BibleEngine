import { DocumentRoot } from './Document';

export interface IBibleVersion {
    uid: string;
    abbreviation?: string;
    title: string;
    description?: DocumentRoot;
    language: string;
    copyrightShort?: string;
    copyrightLong?: DocumentRoot;
    chapterVerseSeparator: string;
    hasStrongs?: boolean;
    isPlaintext?: boolean;
    lastUpdate?: Date;
    dataLocation?: 'db' | 'file' | 'remote';
    type?: 'orig' | 'formal' | 'dynamic' | 'free';
    crossRefBeforePhrase?: boolean;
}
