/**
 * TODO: parse version meta/index file
 */

import { BibleEngine } from '../../BibleEngine.class';
import { resolve } from 'path';
import { createReadStream } from 'fs';
import { parseFragment } from 'parse5';
import { decodeStream, encodeStream } from 'iconv-lite';

import { bookList } from './meta/books';
import { TreeDocumentFragment } from './models/parse5';
import { BookWithContentForInput } from '../../models/BibleInput';
import { visitNode } from './helpers';
import { BibleReferenceParser } from '../../models/BibleReference';

function streamToString(stream: NodeJS.ReadWriteStream): Promise<string> {
    const chunks: Uint8Array[] = [];
    return new Promise((_resolve, reject) => {
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => _resolve(Buffer.concat(chunks).toString('utf8')));
    });
}

const dirProjectRoot = resolve(__dirname + '/../../..');

const sqlBible = new BibleEngine({
    type: 'sqlite',
    database: `${dirProjectRoot}/output/bible.db`
});

const bcv_parser = require('bible-passage-reference-parser/js/de_bcv_parser').bcv_parser;
const bcv: BibleReferenceParser = new bcv_parser({});
bcv.set_options({
    punctuation_strategy: 'eu',
    invalid_passage_strategy: 'include',
    invalid_sequence_strategy: 'include',
    passage_existence_strategy: 'bc'
});

(async () => {
    const version = await sqlBible.addVersion({
        version: 'NEUE',
        title: 'Neue evangelistische Übersetzung',
        chapterVerseSeparator: ',',
        language: 'de-DE'
    });

    for (const [bookFile, bookMeta] of bookList.entries()) {
        // if (bookMeta.bookNum !== 2) continue;

        // Convert encoding streaming example
        const bookHtml = await streamToString(
            createReadStream(resolve(__dirname) + '/html/' + bookFile)
                .pipe(decodeStream('windows1252'))
                .pipe(encodeStream('utf8'))
        );

        // const bookHtmlLatin1 = readFileSync(resolve(__dirname) + '/html/' + bookFile, 'latin1');
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
            refParser: bcv,
            bookData
        };
        const localState = {
            currentContentGroup: bookData.contents
        };
        for (const node of bibleNodes.childNodes) visitNode(node, globalState, localState);

        // console.dir((<any>bookData.contents[0]).contents[0], { depth: 8 });

        await sqlBible.addBookWithContent(bookData);
    }

    sqlBible.finalizeVersion(version.id);
})().catch(e => {
    console.error(e);
});
