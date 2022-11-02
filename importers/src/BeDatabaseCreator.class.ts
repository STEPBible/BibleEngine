import { BibleEngine, BibleEngineOptions } from '@bible-engine/core';
import { DataSourceOptions } from 'typeorm';
import { BibleEngineImporter } from './shared/Importer.interface';

interface Constructable<T> {
    new (...args: any): T;
}

export class BeDatabaseCreator {
    bibleEngine: BibleEngine;
    private importers: BibleEngineImporter[] = [];

    constructor(dbConfig: DataSourceOptions, options?: BibleEngineOptions) {
        this.bibleEngine = new BibleEngine(dbConfig, options);
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
