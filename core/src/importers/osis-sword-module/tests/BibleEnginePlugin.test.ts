import { BookXML } from './../src/types';
import {
    // getXmlFromModule,
    getInputBookFromXml
} from '../src/BibleEnginePlugin';
import { BibleVersion } from '../../../core/src/entities';
import { BibleEngine } from '../../../core/src/BibleEngine.class';
const fs = require('fs');

const sqlBible = new BibleEngine(
    {
        type: 'sqlite',
        database: `bible.db`
    },
    {
        url: 'http://localhost:3456'
    }
);

const setupSqlBible = async () => {
    await sqlBible.addVersion(
        new BibleVersion({
            version: 'ESV',
            title: 'English Standard Bible',
            language: 'en-US',
            chapterVerseSeparator: ':'
        })
    );
    await sqlBible.setVersion('ESV');
    return sqlBible;
};

test('Database loading works end-to-end', async () => {
    console.log('Extracting XML from module...');
    // const filename = './data/ESV2016_th.zip';
    const books: BookXML[] = JSON.parse(fs.readFileSync('thing.json'));//getXmlFromModule(filename);
    const versionId = 1;
    const versification = 'nsrv';

    const sqlBible = await setupSqlBible();
    console.log(sqlBible.currentVersion);

    console.log('Converting XML to JSON...');
    const booksJson = await Promise.all(
        books
        .map(book => getInputBookFromXml(book, versionId, versification))
    );
    try {
        console.log('Loading content into db...');
        await Promise.all(
            booksJson.map(
                async book =>
                    await sqlBible.addBookWithContent(book)
                )
        )
    } catch (error) {
        throw error;
    }

    expect(true).toBe(true);
}, 100000);
