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
    crossRefConnectToPhrase?: 'before' | 'after';
    noteConnectToPhrase?: 'before' | 'after';
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
    constructor(protected bibleEngine: BibleEngine, public options: IImporterOptions = {}) {
        // set defaults so that new options are backwards compatible
        if (!this.options.crossRefConnectToPhrase) this.options.crossRefConnectToPhrase = 'after';
        if (!this.options.noteConnectToPhrase) this.options.noteConnectToPhrase = 'before';
    }

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
