import * as csv from 'csv-parser';
import { createReadStream } from 'fs';

import {
    BibleEngine,
    BookWithContentForInput,
    IBibleContentGroup,
    IBibleContentPhrase,
    IBibleVersion,
} from '@bible-engine/core';
import {
    BibleEngineImporter,
    IImporterOptions,
    ImporterBookMetadata,
} from '../../shared/Importer.interface';

type Row = {
    osisId: string;
    chapter: string;
    verse: string;
    html: string;
};

export class CsvImporter extends BibleEngineImporter {
    constructor(
        protected bibleEngine: BibleEngine,
        public options: IImporterOptions & {
            sourcePath: string;
            versionMeta: IBibleVersion;
            bookMeta: ImporterBookMetadata;
        }
    ) {
        super(bibleEngine, options);
    }

    async import() {
        let csvStream = createReadStream(this.options.sourcePath);

        if (this.options.sourceEncoding)
            throw new Error('encoding conversion currently not supported');
        // There is a typing issue with the return type of `encodeStream` not being compatible
        // with `ReadStream`. We don't need encoding conversion currently, however leaving this
        // code here if needed later:
        //     csvStream = csvStream
        //         .pipe(decodeStream(this.options.sourceEncoding))
        //         .pipe(encodeStream('utf8'));

        this.log(`importing version ${this.options.versionMeta.uid}`);
        const books: BookWithContentForInput[] = [];
        const state: {
            currentBook?: BookWithContentForInput;
            currentContainer?: IBibleContentGroup<'paragraph' | 'lineGroup' | 'title'>;
            currentChapter?: number;
        } = {};
        csvStream
            .pipe(csv())
            .on('headers', (headers) => {
                if (!['osisId', 'chapter', 'verse', 'html'].every((col) => headers.includes(col))) {
                    throw new Error(
                        'the CSV file needs to have all the following columns: osisId, chapter, verse, html'
                    );
                }
            })
            .on('data', (row: Row) => {
                const lineMode =
                    row.osisId === 'Ps' || (row.osisId === 'Prov' && +row.chapter >= 10);

                if (!state.currentBook || state.currentBook.book.osisId !== row.osisId) {
                    const bookMeta = this.options.bookMeta.get(row.osisId);
                    if (!bookMeta) throw new Error(`invalid/unsupported book: ${row.osisId}`);
                    const newBook: BookWithContentForInput = {
                        book: {
                            ...bookMeta,
                            osisId: row.osisId,
                            type: bookMeta.number <= 39 ? 'ot' : 'nt',
                        },
                        contents: [],
                    };
                    state.currentBook = newBook;
                    state.currentContainer = undefined;
                    state.currentChapter = undefined;
                    books.push(newBook);
                }

                // we want this code to trigger both before and after psalm title, so we check for
                // chapter change and verse 1(psalm title is verse 0)
                if (
                    !state.currentContainer ||
                    state.currentChapter !== +row.chapter ||
                    +row.verse === 1
                ) {
                    state.currentChapter = +row.chapter;
                    const newContainer: IBibleContentGroup<'paragraph'> = {
                        type: 'group',
                        groupType: 'paragraph',
                        contents: [],
                    };

                    if (+row.verse === 0) {
                        const titleContainer: IBibleContentGroup<'title'> = {
                            type: 'group',
                            groupType: 'title',
                            contents: [],
                        };
                        newContainer.contents.push(titleContainer);
                        state.currentContainer = titleContainer;
                    } else if (lineMode) {
                        const lineGroupContainer: IBibleContentGroup<'lineGroup'> = {
                            type: 'group',
                            groupType: 'lineGroup',
                            contents: [],
                        };
                        newContainer.contents.push(lineGroupContainer);
                        state.currentContainer = lineGroupContainer;
                    } else {
                        state.currentContainer = newContainer;
                    }

                    state.currentBook!.contents.push(newContainer);
                }

                const verseContent: (IBibleContentPhrase | IBibleContentGroup<'italic'>)[] = [];
                const getSkipSpaceParamter = (text: string) =>
                    ['.', ',', ';', '!', '?', ':'].indexOf(text[0]!) !== -1 ? 'before' : undefined;

                // since our current requirement only requires detecting strings enclosed in <i></i>,
                // we use this very simple brute-force method of splitting the string at the start
                // and end tags. Though this could be expanded to support more styles, it is advised
                // to switch to a proper html parser in case something more is needed in the future.
                for (const textSplit of row.html.split('<i>').map((str) => str.split('</i>'))) {
                    const phraseTmpl: IBibleContentPhrase = {
                        type: 'phrase',
                        content: '',
                        versionChapterNum: +row.chapter,
                        versionVerseNum: +row.verse === 0 ? 1 : +row.verse,
                        versionSubverseNum: +row.verse === 0 ? 0 : 1,
                    };
                    const textPlainFirst =
                        textSplit.length === 1 ? textSplit[0]!.trim() : undefined;
                    const textItalic = textSplit.length > 1 ? textSplit[0]!.trim() : undefined;
                    const textPlainSecond = textSplit.length > 1 ? textSplit[1]!.trim() : undefined;
                    if (textPlainFirst)
                        verseContent.push({
                            ...phraseTmpl,
                            content: textPlainFirst,
                            skipSpace: getSkipSpaceParamter(textPlainFirst),
                        });
                    if (textItalic)
                        verseContent.push({
                            type: 'group',
                            groupType: 'italic',
                            contents: [
                                {
                                    ...phraseTmpl,
                                    content: textItalic,
                                    skipSpace: getSkipSpaceParamter(textItalic),
                                },
                            ],
                        });
                    if (textPlainSecond)
                        verseContent.push({
                            ...phraseTmpl,
                            content: textPlainSecond,
                            skipSpace: getSkipSpaceParamter(textPlainSecond),
                        });
                }

                if (lineMode && +row.verse !== 0) {
                    const lineGroup: IBibleContentGroup<'line'> = {
                        type: 'group',
                        groupType: 'line',
                        modifier: state.currentContainer!.contents.length + 1,
                        contents: [...verseContent],
                    };
                    state.currentContainer!.contents.push(lineGroup);
                } else {
                    state.currentContainer!.contents.push(...verseContent);
                }
            })
            .on('end', () => {
                this.log(`finished import of ${this.options.versionMeta.uid}`);
            });

        const version = await this.bibleEngine.addVersion(this.options.versionMeta);

        for (const book of books) {
            await this.bibleEngine.addBookWithContent(version, book);
        }

        return this.bibleEngine.finalizeVersion(version.id);
    }

    log(msg: string) {
        console.log(msg);
    }

    toString() {
        return 'CSV';
    }
}
