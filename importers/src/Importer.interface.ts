import { BibleEngine } from '@bible-engine/core';

export interface IBibleEngineImporter {
    new (bibleEngine: BibleEngine, sourcePath?: string): BibleEngineImporter;
}

export class BibleEngineImporter {
    constructor(protected bibleEngine: BibleEngine, protected sourcePath?: string) {}

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
