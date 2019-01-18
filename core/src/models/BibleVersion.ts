import { DocumentRoot } from './Document';

export interface IBibleVersion {
    version: string;
    title: string;
    description?: DocumentRoot;
    language: string;
    copyrightShort?: string;
    copyrightLong?: DocumentRoot;
    chapterVerseSeparator: string;
    hasStrongs?: boolean;
}
