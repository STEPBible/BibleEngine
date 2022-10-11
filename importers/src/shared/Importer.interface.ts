import { BibleEngine, IBibleVersion } from '@bible-engine/core';

export type LogLevel = 'verbose' | 'info' | 'warn' | 'error';
export interface IImporterOptions {
    sourceData?: string;
    sourcePath?: string;
    sourceEncoding?: string;
    versionMeta?: Partial<IBibleVersion>;
    bookMeta?: ImporterBookMetadata;
    skip?: { crossRefs?: boolean; notes?: boolean; strongs?: boolean };
    autoGenMissingParagraphs?: boolean;
    autoGenChapterParagraphs?: boolean;
    /** this is an experimental feature which mostly fails when chapter labels are used parallel
     *  to sections. apart from that, especially when used in infinite scroll context, chapter
     *  labels don't really make sense. Enable this if your source file uses chapter labels instead
     *  of sections, e.g. in Psalms.
     */
    enableChapterLabels?: boolean;
    logLevel?: LogLevel;
}
export type ImporterBookMetadata = Map<string, ImporterBookMetadataBook>;
export type ImporterBookMetadataBook = {
    abbreviation: string;
    number: number;
    title: string;
    longTitle?: string;
    sourcePath?: string;
};

export interface IBibleEngineImporter {
    new (bibleEngine: BibleEngine, options: IImporterOptions): BibleEngineImporter;
}

export class BibleEngineImporter {
    constructor(protected bibleEngine: BibleEngine, public options: IImporterOptions = {}) {}

    import() {}

    async run() {
        await this.bibleEngine.pDB;
        console.log(`running importer: ${this}`);
        if (this.options?.versionMeta?.uid) {
            console.log('version: ', this.options?.versionMeta?.uid);
        }
        return await this.import();
    }

    toString() {
        return 'Unnamed Importer';
    }
}
