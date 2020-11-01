import { reactive } from 'vue'
import { BibleEngine, IBibleReferenceRangeQuery } from '@bible-engine/core';
import { useSqlite } from './useSqlite';

const BIBLE_DATABASE_NAME = 'bibles_v1.db'
const CONNECTION_OPTIONS: any = {
    type: 'cordova',
    location: 'default',
    database: BIBLE_DATABASE_NAME,
    synchronize: false,
}

export async function useBibleEngine() {
    await useSqlite(BIBLE_DATABASE_NAME)
    const bibleEngine = new BibleEngine(CONNECTION_OPTIONS)
    const range: IBibleReferenceRangeQuery = reactive({
        bookOsisId: 'Gen',
        normalizedChapterNum: 1,
        versionUid: 'ESV'
    })
    return { bibleEngine, range }
}