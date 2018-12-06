import { BibleEngine } from '../src/BibleEngine';
import { BibleVersion } from '../src/models';

const sqlBible = new BibleEngine({
  type: 'sqlite',
  database: ':memory:'
});

beforeAll(async () => {
  await sqlBible.addVersion(
    new BibleVersion({
        version: 'ESV',
        description: 'English Standard Bible',
        language: 'en-US'
    })
  );
  await sqlBible.setVersion('ESV');
});

test('BibleEngine version is set correctly', async () => {
  expect(sqlBible.currentVersion!.language).toEqual('en-US');
  expect(sqlBible.currentVersion!.description).toEqual('English Standard Bible');
  expect(sqlBible.currentVersion!.version).toEqual('ESV');
})

