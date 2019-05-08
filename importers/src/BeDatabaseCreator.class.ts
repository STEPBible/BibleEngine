import { ConnectionOptions } from 'typeorm';
import { BibleEngineImporter, IBibleEngineImporter, IImporterOptions } from './Importer.interface';
import { BibleEngine } from '@bible-engine/core';

export class BeDatabaseCreator {
    private bibleEngine: BibleEngine;
    private importers: BibleEngineImporter[] = [];

    constructor(dbConfig: ConnectionOptions) {
        this.bibleEngine = new BibleEngine(dbConfig);
    }

    addImporter(Importer: IBibleEngineImporter, options: IImporterOptions = {}) {
        this.importers.push(new Importer(this.bibleEngine, options));
    }

    async createDatabase() {
        for (const importer of this.importers) {
            await importer.run();
        }
    }
}
