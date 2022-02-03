import { ConnectionOptions } from 'typeorm';
import { BibleEngineImporter } from './shared/Importer.interface';
import { BibleEngine } from '@bible-engine/core';

interface Constructable<T> {
    new (...args: any): T;
}

export class BeDatabaseCreator {
    bibleEngine: BibleEngine;
    private importers: BibleEngineImporter[] = [];

    constructor(dbConfig: ConnectionOptions) {
        this.bibleEngine = new BibleEngine(dbConfig);
    }

    addImporter<T extends BibleEngineImporter>(
        Importer: Constructable<T>,
        options: T['options'] = {}
    ) {
        this.importers.push(new Importer(this.bibleEngine, options));
    }

    async createDatabase() {
        for (const importer of this.importers) {
            await importer.run();
        }
    }
}
