import { BibleEngine, IBibleContentSection } from '@bible-engine/core';
import { ConnectionOptions } from 'typeorm';
import { OsisImporter } from '..';
import { enBookMetadata } from '../../../metadata';

const CONNECTION_OPTIONS: ConnectionOptions = {
    type: 'sqlite',
    database: ':memory:',
};

export const TEST_BIBLE_VERSION = {
    uid: 'NASB',
    title: 'New American Standard Bible',
    isPlaintext: false,
    hasStrongs: true,
};

export const getBibleEngineTestInstance = () => {
    return new BibleEngine(CONNECTION_OPTIONS);
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
