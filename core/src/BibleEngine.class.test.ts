import { BookWithContentForInput } from './models/BibleInput';
import { IBibleVersion } from './models/BibleVersion';
import { IBibleBookEntity } from './models/BibleBook';
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
    afterEach(() => {
        getConnection().close();
    });
    describe('BibleVersion', () => {
        let versionEntity: BibleVersionEntity | undefined;

        beforeEach(async () => {
            await sqlBible.addVersion(
                new BibleVersionEntity({
                    uid: 'ESV',
                    title: 'English Standard Version',
                    language: 'en-US',
                    chapterVerseSeparator: ':'
                })
            );
            versionEntity = await sqlBible.getVersion('ESV');
        });

        test('BibleEngine version is set correctly', async () => {
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
