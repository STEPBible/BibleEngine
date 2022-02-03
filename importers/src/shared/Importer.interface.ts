import { BibleEngine, IBibleVersion } from '@bible-engine/core';

export interface IImporterOptions {
    sourceData?: string;
    sourcePath?: string;
    sourceEncoding?: string;
    versionMeta?: Partial<IBibleVersion>;
    bookMeta?: ImporterBookMetadata;
    skip?: { crossRefs?: boolean; notes?: boolean; strongs?: boolean };
    autoGenMissingParagraphs?: boolean;
}
export type ImporterBookMetadata = Map<
    string,
    {
        abbreviation: string;
        longTitle?: string;
        number: number;
        title: string;
    }
>;

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
