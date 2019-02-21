import { BibleEngine } from './BibleEngine.class';
import { BibleVersionEntity } from './entities';

const sqlBible = new BibleEngine({
    type: 'sqlite',
    database: ':memory:'
});

beforeAll(async () => {
    await sqlBible.addVersion(
        new BibleVersionEntity({
            uid: 'ESV',
            title: 'English Standard Bible',
            language: 'en-US',
            chapterVerseSeparator: ':'
        })
    );
    await sqlBible.setVersion('ESV');
});

test('BibleEngine version is set correctly', async () => {
    expect(sqlBible.currentVersion!.language).toEqual('en-US');
    expect(sqlBible.currentVersion!.title).toEqual('English Standard Bible');
    expect(sqlBible.currentVersion!.uid).toEqual('ESV');
});
