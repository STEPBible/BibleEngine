import { BibleEngine, IBibleContentSection } from '@bible-engine/core';
import { DB } from '@bible-engine/db-schema/generated/db';
import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import { OsisImporter } from '..';
import { enBookMetadata } from '../../../metadata';

const db: Kysely<DB> = new Kysely<DB>({
    dialect: new SqliteDialect({
        database: new Database(':memory:'),
    }),
});

export const TEST_BIBLE_VERSION = {
    uid: 'NASB',
    title: 'New American Standard Bible',
    isPlaintext: false,
    hasStrongs: true,
};

export const getBibleEngineTestInstance = () => {
    return new BibleEngine(db);
};

export const getEmptySection = (): IBibleContentSection => {
    return {
        type: 'section',
        level: 0,
        contents: [],
    };
};

export const getContextFromSource = async (sourcePath: string) => {
    const bibleEngine = getBibleEngineTestInstance();
    const importer = new OsisImporter(bibleEngine, {
        sourcePath,
        bookMeta: enBookMetadata,
        versionMeta: TEST_BIBLE_VERSION,
    });
    const xml = await importer.getXmlFromOptions({
        sourcePath,
        bookMeta: enBookMetadata,
    });
    return importer.getContextFromXml(xml);
};
