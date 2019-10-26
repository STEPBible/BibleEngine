import { BibleEngine } from './BibleEngine.class';
import { BibleVersionEntity } from './entities';
import { getConnection } from 'typeorm';

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
    });
});
