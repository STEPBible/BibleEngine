import { DocumentDefault } from './Document';

export interface IBibleVersion {
    version: string;
    title: string;
    description?: DocumentDefault;
    language: string;
    copyrightShort?: string;
    copyrightLong?: DocumentDefault;
    chapterVerseSeparator: string;
    hasStrongs?: boolean;
}
