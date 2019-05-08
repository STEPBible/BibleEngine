import { BibleEngine, IBibleVersion } from '@bible-engine/core';

export interface IImporterOptions {
    sourcePath?: string;
    versionMeta?: Partial<IBibleVersion>;
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
