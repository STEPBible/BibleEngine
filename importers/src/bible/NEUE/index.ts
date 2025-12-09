import { bcv_parser } from 'bible-passage-reference-parser/esm/bcv_parser.js';
import * as lang from 'bible-passage-reference-parser/esm/lang/de.js';
import { readFileSync } from 'fs';
import { parseFragment } from 'parse5';
import { resolve } from 'path';
import { TreeDocumentFragment } from './models/parse5';

import { BibleReferenceParser, BookWithContentForInput, DocumentRoot } from '@bible-engine/core';

import { getBibleReferenceParserCustomBooks } from '../../shared/helpers.functions';
import { BibleEngineImporter } from '../../shared/Importer.interface';
import { visitNode } from './helpers';
import { bookList } from './meta/books';
import copyrightLong from './meta/copyright';

const __dirname = new URL('.', import.meta.url).pathname;

export class NeueImporter extends BibleEngineImporter {
    async import() {
        const bcv: BibleReferenceParser = new bcv_parser(lang);
        bcv.set_options({
            punctuation_strategy: 'eu',
            invalid_passage_strategy: 'include',
            invalid_sequence_strategy: 'include',
            passage_existence_strategy: 'bc',
            consecutive_combination_strategy: 'separate',
        });

        if (this.options.bookMeta) {
            bcv.add_books({ books: getBibleReferenceParserCustomBooks(this.options.bookMeta) });
        }

        const versionUid = 'NEUE';

        const description: DocumentRoot = {
            type: 'root',
            contents: [],
        };

        const sourceDir = this.options.sourcePath || resolve(__dirname) + '/data';

        const descriptionHtml = readFileSync(sourceDir + '/index.html', { encoding: 'utf8' });

        const descriptionNodes = <TreeDocumentFragment>(
            parseFragment(
                descriptionHtml.substring(
                    descriptionHtml.indexOf('<h3'),
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
            let bookHtml = readFileSync(sourceDir + '/' + bookFile, { encoding: 'utf8' });

            // strip beginning and end of the html doc (we only need the content itself)
            bookHtml = bookHtml.substring(bookHtml.indexOf('<h1'), bookHtml.indexOf('<hr'));

            // replace poetry line breaks by actual html ones
            bookHtml = bookHtml.replace(/ \/ /g, '<br />');

            // remove anchor tags to bible reference that link to either 1mo.html or 2mo.html
            bookHtml = bookHtml.replace(
                /<a href="(?:(?:1mo|2mo|3mo|4mo|5mo|jos|ri|rut|1sam|2sam|1koe|2koe|1chr|2chr|esra|neh|est|hiob|ps|spr|pred|hl|jes|jer|kla|hes|dan|hos|joel|amos|obadja|jona|mi|nah|hab|zef|hag|sach|mal|mt|mk|lk|jo|apg|roe|1kor|2kor|gal|eph|phil|kol|1thes|2thes|1tim|2tim|tit|phm|hebr|jak|1pt|2pt|1jo|2jo|3jo|jud|off)\.html)?#(?:[a-z0-9_-]+)">(.+?)<\/a>/g,
                (_match, label) => label
            );

            // const bookHtmlLatin1 = readFileSync(resolve(__dirname) + '/html/' + bookFile, 'latin1');
            const bibleNodes = <TreeDocumentFragment>parseFragment(bookHtml);
            if (!bibleNodes) throw new Error(`can't parse file ${bookFile}`);

            // console.log(`parsing book: ${bookMeta.title}`);
            const bookData: BookWithContentForInput = {
                book: {
                    type: bookMeta.bookNum < 40 ? 'ot' : 'nt',
                    number: bookMeta.bookNum,
                    abbreviation: bookMeta.abbreviation,
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
