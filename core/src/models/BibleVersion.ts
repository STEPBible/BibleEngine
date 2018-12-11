import { Document } from './Document';

export interface IBibleVersion {
    version: string;
    title: string;
    description?: Document;
    language: string;
    copyrightShort?: string;
    copyrightLong?: Document;
    chapterVerseSeparator: string;
    hasStrongs?: boolean;
}
