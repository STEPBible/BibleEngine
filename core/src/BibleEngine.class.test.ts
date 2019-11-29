import { IBibleVersion } from './models/BibleVersion';
import { BibleEngine } from './BibleEngine.class';
import { getConnection } from 'typeorm';

const BIBLE_VERSION: IBibleVersion = {
    uid: 'ESV',
    title: 'English Standard Version',
    language: 'en-US',
    chapterVerseSeparator: ':',
    dataLocation: 'remote'
};

describe('BibleEngine', () => {
    let sqlBible: BibleEngine;
    beforeEach(() => {
        sqlBible = new BibleEngine({
            type: 'sqlite',
            database: ':memory:'
        });
    });
    afterEach(async () => {
        await getConnection().close();
    });

    describe('BibleVersion', () => {
        test('BibleEngine version is set correctly', async () => {
            await sqlBible.addVersion(BIBLE_VERSION);
            const versionEntity = await sqlBible.getVersion('ESV');
            expect(versionEntity).toBeDefined();
            if (versionEntity) {
                expect(versionEntity.language).toEqual('en-US');
                expect(versionEntity.title).toEqual('English Standard Version');
                expect(versionEntity.uid).toEqual('ESV');
            }
        });
        test('If a Bible version already exists, its updated', async () => {
            await sqlBible.updateVersion(BIBLE_VERSION);
            await sqlBible.updateVersion({ ...BIBLE_VERSION, dataLocation: 'db' });
            const version = await sqlBible.getVersion(BIBLE_VERSION.uid);
            expect(version!.dataLocation).toBe('db');
        });
    });
});
