/**
 * TODO: parse cross-refs and link them
 * TODO: better link notes to correct text if possible
 * TODO: parse version meta/index file
 * TODO: add poetry type (p class="poet")
 * TODO: look for missed group types
 * TODO: entities are not decoded (at least in book titles)
 * TODO: some characters are not recoginzed (10020120000101)
 * TODO: some phrases start with space (10010260000104)
 * TODO: look for solution for single-punctuation-phrases (must not add space before in client) -
 *       happens when splitting phrase after noteMarker
 */

import { BibleEngine } from '../../BibleEngine.class';
import { resolve } from 'path';
import { readFileSync } from 'fs-extra';
import { parseFragment } from 'parse5';

import { bookList } from './meta/books';
import { TreeDocumentFragment } from './models/parse5';
import { BookWithContentForInput } from '../../models/BibleInput';
import { visitNode } from './helpers';

const dirProjectRoot = resolve(__dirname + '/../../..');

const sqlBible = new BibleEngine({
    type: 'sqlite',
    database: `${dirProjectRoot}/output/bible.db`
});

(async () => {
    const version = await sqlBible.addVersion({
        version: 'NEUE',
        title: 'Neue evangelistische Übersetzung',
        chapterVerseSeparator: ',',
        language: 'de-DE'
    });

    for (const [bookFile, bookMeta] of bookList.entries()) {
        // if (bookMeta.bookNum !== 19) continue;

        const bookHtml = readFileSync(resolve(__dirname) + '/html/' + bookFile, 'utf-8');
        const bibleNodes = <TreeDocumentFragment>(
            parseFragment(bookHtml.substring(bookHtml.indexOf('<h1'), bookHtml.indexOf('<hr')))
        );
        if (!bibleNodes) throw new Error(`can't parse file ${bookFile}`);

        console.log(`parsing book: ${bookMeta.title}`);
        const bookData: BookWithContentForInput = {
            book: {
                versionId: version.id,
                type: bookMeta.bookNum < 40 ? 'ot' : 'nt',
                number: bookMeta.bookNum,
                abbreviation: bookMeta.abbvreviation,
                title: bookMeta.title,
                osisId: bookMeta.osisId
            },
            contents: []
        };
        const globalState = {
            bookData
        };
        const localState = {
            currentContentGroup: bookData.contents
        };
        for (const node of bibleNodes.childNodes) visitNode(node, globalState, localState);

        // console.dir(bookData, { depth: 3 });

        await sqlBible.addBookWithContent(bookData);
    }

    sqlBible.finalizeVersion(version.id);
})().catch(e => {
    console.error(e);
});
