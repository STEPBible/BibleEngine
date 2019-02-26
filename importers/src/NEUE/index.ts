import { resolve } from 'path';
import { createReadStream } from 'fs';
import { parseFragment } from 'parse5';
import { decodeStream, encodeStream } from 'iconv-lite';
import { TreeDocumentFragment } from './models/parse5';

import { BookWithContentForInput, BibleReferenceParser, DocumentRoot } from '@bible-engine/core';

import { visitNode } from './helpers';
import { bookList } from './meta/books';
import copyrightLong from './meta/copyright';
import { BibleEngineImporter } from '../Importer.interface';
import { streamToString } from '../helpers.functions';

export class NeueImporter extends BibleEngineImporter {
    async import() {
        const bcv_parser = require('bible-passage-reference-parser/js/de_bcv_parser').bcv_parser;
        const bcv: BibleReferenceParser = new bcv_parser({});
        bcv.set_options({
            punctuation_strategy: 'eu',
            invalid_passage_strategy: 'include',
            invalid_sequence_strategy: 'include',
            passage_existence_strategy: 'bc'
        });

        const versionUid = 'NEUE';

        const description: DocumentRoot = {
            type: 'root',
            contents: []
        };

        const sourceDir = this.sourcePath || resolve(__dirname) + '/data';

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
            title: 'Neue evangelistische Übersetzung',
            copyrightShort: '© Karl-Heinz Vanheiden',
            copyrightLong,
            description,
            chapterVerseSeparator: ',',
            language: 'de-DE',
            hasStrongs: false
        });

        for (const [bookFile, bookMeta] of bookList.entries()) {
            // if (bookMeta.bookNum !== 2) continue;

            // Convert encoding streaming example
            const bookHtml = await streamToString(
                createReadStream(sourceDir + '/' + bookFile)
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
                versionUid,
                bookData,
                refParser: bcv
            };
            const localState = {
                currentContentGroup: bookData.contents
            };
            for (const node of bibleNodes.childNodes) visitNode(node, globalState, localState);

            // console.dir((<any>bookData.contents[0]).contents[0], { depth: 8 });

            await this.bibleEngine.addBookWithContent(bookData);
        }

        return this.bibleEngine.finalizeVersion(version.id);
    }

    toString() {
        return 'NeÜ (Neue evangelistische Übersetzung)';
    }
}
