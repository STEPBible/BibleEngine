import { resolve } from 'path';
import { createReadStream } from 'fs';
import { parseFragment } from 'parse5';
import { decodeStream, encodeStream } from 'iconv-lite';
import { TreeDocumentFragment } from './models/parse5';

import { BookWithContentForInput, BibleReferenceParser, DocumentRoot } from '@bible-engine/core';

import { visitNode } from './helpers';
import { bookList } from './meta/books';
import copyrightLong from './meta/copyright';
import { BibleEngineImporter } from '../../shared/Importer.interface';
import { streamToString } from '../../shared/helpers.functions';

export class NeueImporter extends BibleEngineImporter {
    async import() {
        const bcv_parser = require('bible-passage-reference-parser/js/de_bcv_parser').bcv_parser;
        const bcv: BibleReferenceParser = new bcv_parser({});
        bcv.set_options({
            punctuation_strategy: 'eu',
            invalid_passage_strategy: 'include',
            invalid_sequence_strategy: 'include',
            passage_existence_strategy: 'bc',
            consecutive_combination_strategy: 'separate',
        });

        const versionUid = 'NEUE';

        const description: DocumentRoot = {
            type: 'root',
            contents: [],
        };

        const sourceDir = this.options.sourcePath || resolve(__dirname) + '/data';

        const descriptionHtml = await streamToString(
            createReadStream(sourceDir + '/index.htm')
                .pipe(decodeStream('windows1252'))
                .pipe(encodeStream('utf8'))
        );

        const descriptionNodes = <TreeDocumentFragment>(
            parseFragment(
                descriptionHtml.substring(
                    descriptionHtml.indexOf('<h2'),
                    descriptionHtml.lastIndexOf('</td>')
                )
            )
        );
        if (!descriptionNodes) throw new Error(`can't parse index.html`);

        const descriptionGlobalState = { versionUid, refParser: bcv, documentRoot: description };
        const descriptionLocalState = { currentDocument: description.contents };
        for (const node of descriptionNodes.childNodes)
            visitNode(node, descriptionGlobalState, descriptionLocalState);

        const version = await this.bibleEngine.addVersion({
            uid: versionUid,
            abbreviation: 'NeÜ',
            title: 'Neue evangelistische Übersetzung',
            copyrightShort: '© Karl-Heinz Vanheiden',
            copyrightLong,
            description,
            chapterVerseSeparator: ',',
            language: 'de-DE',
            type: 'dynamic',
            hasStrongs: false,
        });

        for (const [bookFile, bookMeta] of bookList.entries()) {
            // if (bookMeta.bookNum !== 2) continue;

            // Convert encoding streaming example
            let bookHtml = await streamToString(
                createReadStream(sourceDir + '/' + bookFile)
                    .pipe(decodeStream('windows1252'))
                    .pipe(encodeStream('utf8'))
            );

            // strip beginning and end of the html doc (we only need the content itself)
            bookHtml = bookHtml.substring(bookHtml.indexOf('<h1'), bookHtml.indexOf('<hr'));

            // replace poetry line breaks by actual html ones
            bookHtml = bookHtml.replace(/ \/ /g, '<br />');

            // const bookHtmlLatin1 = readFileSync(resolve(__dirname) + '/html/' + bookFile, 'latin1');
            const bibleNodes = <TreeDocumentFragment>parseFragment(bookHtml);
            if (!bibleNodes) throw new Error(`can't parse file ${bookFile}`);

            // console.log(`parsing book: ${bookMeta.title}`);
            const bookData: BookWithContentForInput = {
                book: {
                    type: bookMeta.bookNum < 40 ? 'ot' : 'nt',
                    number: bookMeta.bookNum,
                    abbreviation: bookMeta.abbvreviation,
                    title: bookMeta.title,
                    osisId: bookMeta.osisId,
                },
                contents: [],
            };
            const globalState = {
                versionUid,
                bookData,
                refParser: bcv,
            };
            const localState = {
                currentContentGroup: bookData.contents,
            };
            for (const node of bibleNodes.childNodes) visitNode(node, globalState, localState);

            // console.dir((<any>bookData.contents[0]).contents[0], { depth: 8 });

            await this.bibleEngine.addBookWithContent(version, bookData);
        }

        return this.bibleEngine.finalizeVersion(version.id);
    }

    toString() {
        return 'NeÜ (Neue evangelistische Übersetzung)';
    }
}
