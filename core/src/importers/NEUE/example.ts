import { BibleEngine } from '../../BibleEngine.class';
import { resolve } from 'path';

const dirProjectRoot = resolve(__dirname + '/../../..');

const sqlBible = new BibleEngine({
    type: 'sqlite',
    database: `${dirProjectRoot}/output/bible.db`
});

sqlBible
    .getFullDataForReferenceRange(
        {
            versionUid: 'NEUE',
            bookOsisId: 'Gen',
            versionChapterNum: 1,
            versionChapterEndNum: 2
        },
        true
    )
    .then(data => console.dir(data.content, { depth: 10 }));
