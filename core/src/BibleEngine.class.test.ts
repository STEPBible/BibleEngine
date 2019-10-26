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
const BIBLE_BOOK: IBibleBookEntity = {
    type: 'ot',
    dataLocation: 'importing',
    osisId: 'Gen',
    abbreviation: 'Gen',
    number: 0,
    title: 'Genesis',
    chaptersCount: [1],
    versionId: 1
};
const BOOK_INPUT: BookWithContentForInput = {
    book: {
        osisId: 'Jude',
        number: 65,
        abbreviation: 'Jude',
        title: 'Jude',
        type: 'nt',
        chaptersCount: [25]
    },
    contents: [
        {
            content: 'Jesus',
            strongs: ['G2424'],
            numbering: {
                normalizedChapterIsStarting: 1,
                normalizedChapterIsStartingInRange: 1,
                normalizedVerseIsStarting: 1,
                versionChapterIsStarting: 1,
                versionChapterIsStartingInRange: 1,
                versionVerseIsStarting: 1
            }
        }
    ],
    contentHasNormalizedNumbers: true
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
    describe('versionIsDownloaded', () => {
        test('If version doesnt exist in database at all, mark not downloaded', async () => {
            expect(await sqlBible.versionIsDownloaded('ESV', '')).not.toBeTruthy();
        });
        test('If version is only remote, mark not downloaded', async () => {
            await sqlBible.addVersion(BIBLE_VERSION);
            expect(await sqlBible.versionIsDownloaded('ESV', '')).not.toBeTruthy();
        });
        test('If a version is only partially imported, mark not downloaded', async () => {
            await sqlBible.addVersion({ ...BIBLE_VERSION, dataLocation: 'db' });
            await sqlBible.addBook(BIBLE_BOOK);
            expect(await sqlBible.versionIsDownloaded('ESV', '')).not.toBeTruthy();
        });
        test('If not all books are present in database, mark not downloaded', async () => {
            jest.spyOn(BibleEngine.prototype, 'getBookIndexFile').mockResolvedValue([{}, {}]);
            await sqlBible.addVersion({ ...BIBLE_VERSION, dataLocation: 'db' });
            await sqlBible.addBook({ ...BIBLE_BOOK, dataLocation: 'db' });
            expect(await sqlBible.versionIsDownloaded('ESV', '')).not.toBeTruthy();
        });
    });

    describe('addBookWithContent', () => {
        test('addBookWithContent safely skips phrases that already exist', async () => {
            const version = await sqlBible.addVersion({ ...BIBLE_VERSION, dataLocation: 'db' });
            const entityManager = await sqlBible.pDB;
            const result = await sqlBible.addBookWithContent(version, BOOK_INPUT, {
                entityManager
            });
            const result2 = await sqlBible.addBookWithContent(version, BOOK_INPUT, {
                entityManager
            });
            expect(result).toBeTruthy();
            expect(result2).toBeTruthy();
        });
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
