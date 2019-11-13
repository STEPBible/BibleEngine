import { BibleEngine, IBibleVersion } from '@bible-engine/core';

export interface IImporterOptions {
    sourceData?: string;
    sourcePath?: string;
    sourceEncoding?: string;
    versionMeta?: Partial<IBibleVersion>;
    bookMeta?: Map<string, { abbreviation: string; title: string; number: number }>;
}

export interface IBibleEngineImporter {
    new (bibleEngine: BibleEngine, options: IImporterOptions): BibleEngineImporter;
}

export class BibleEngineImporter {
    constructor(protected bibleEngine: BibleEngine, protected options: IImporterOptions = {}) {}

    import() {}

    async run() {
        await this.bibleEngine.pDB;
        console.log(`running importer: ${this}`);
        return await this.import();
    }

    toString() {
        return 'Unnamed Importer';
    }
}
