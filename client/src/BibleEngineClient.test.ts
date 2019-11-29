import { BibleVersionEntity } from '@bible-engine/core';
// import { getConnection } from 'typeorm';
import { BibleEngineClient } from './BibleEngineClient';
import 'cross-fetch/polyfill';

const ESV_ONLINE = new BibleVersionEntity({
    uid: 'ESV',
    title: 'English Standard Version',
    language: 'en-US',
    chapterVerseSeparator: ':',
    dataLocation: 'remote'
});

const ESV_OFFLINE = new BibleVersionEntity({
    ...ESV_ONLINE,
    dataLocation: 'db'
});

const CUV_ONLINE = new BibleVersionEntity({
    ...ESV_ONLINE,
    uid: 'CUV'
});

describe('BibleEngineClient', () => {
    let client: BibleEngineClient;
    beforeAll(() => {
        client = new BibleEngineClient({
            bibleEngineOptions: {
                type: 'sqlite',
                database: ':memory:'
            },
            apiBaseUrl: ''
        });
    });
    afterEach(async () => {
        const db = await client.localBibleEngine.pDB;
        await db.connection.synchronize(true);
    });
    describe('getMergedOfflineAndOnlineVersions', () => {
        test('If both local and remote version exists, only show local one', () => {
            const result = client.getMergedOfflineAndOnlineVersions([ESV_OFFLINE], [ESV_ONLINE]);
            expect(result).toBeTruthy();
            expect(result[0].dataLocation).toBe(ESV_OFFLINE.dataLocation);
        });
        test('Remote-only versions are included', () => {
            const result = client.getMergedOfflineAndOnlineVersions(
                [ESV_OFFLINE],
                [ESV_ONLINE, CUV_ONLINE]
            );
            expect(result.length).toBe(2);
        });
    });
});
