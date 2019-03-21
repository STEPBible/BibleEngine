import { DocumentRoot } from './Document';

export interface IBibleVersion {
    uid: string;
    title: string;
    description?: DocumentRoot;
    language: string;
    copyrightShort?: string;
    copyrightLong?: DocumentRoot;
    chapterVerseSeparator: string;
    hasStrongs?: boolean;
    lastUpdate?: Date;
}
