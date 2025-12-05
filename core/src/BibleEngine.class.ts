import {
    BibleCrossReference,
    BibleNote,
    BibleParagraph,
    BiblePhrase,
    BibleSection,
    DB,
} from '@bible-engine/db-schema/generated/db';
import { Insertable, Kysely, sql, Transaction } from 'kysely';
import { jsonArrayFrom as mysqlJsonArrayFrom } from 'kysely/helpers/mysql';
import { jsonArrayFrom as sqliteJsonArrayFrom } from 'kysely/helpers/sqlite';
import {
    convertBibleInputToBookPlaintext,
    generateBibleDocument,
    generateContextRanges,
    generateContextSections,
    normalizeDocumentContents,
    PhraseVersionNumbersById,
    stripUnnecessaryDataFromBibleBook,
    stripUnnecessaryDataFromBibleContent,
    stripUnnecessaryDataFromBibleContextData,
    stripUnnecessaryDataFromBibleReferenceRange,
    stripUnnecessaryDataFromBibleVersion,
} from './functions/content.functions.js';
import { isSqlite } from './functions/kysely.functions.js';
import {
    generateEndReferenceFromRange,
    generateNormalizedRangeFromVersionRange,
    generatePhraseId,
    generateReferenceId,
    generateVersionReferenceId,
    isReferenceNormalized,
    MAX_SUBVERSE_NUMBER,
    parsePhraseId,
    parseReferenceId,
} from './functions/reference.functions.js';
import {
    generateBookSectionsSql,
    generateParagraphSql,
    generatePhraseIdSql,
    generateReferenceIdSql,
} from './functions/sql.functions.js';
import { isTestMatching } from './functions/v11n.functions.js';
import {
    getBookChapterVerseCount,
    parseBookFromDatabase,
    prepareBookForDatabase,
} from './models/BibleBook.js';
import {
    IBibleCrossReference,
    parseCrossReferenceFromDatabase,
    prepareCrossReferenceForDatabase,
} from './models/BibleCrossReference.js';
import { parseNoteFromDatabase, prepareNoteForDatabase } from './models/BibleNote.js';
import {
    IBiblePhraseEntity,
    parsePhraseFromDatabase,
    preparePhraseForDatabase,
} from './models/BiblePhrase.js';
import { IBibleReferenceVersionNormalized } from './models/BibleReference.js';
import { IBibleSearchOptions } from './models/BibleSearch.js';
import {
    IBibleSectionEntity,
    IBibleSectionHierarchical,
    parseSectionFromDatabase,
    prepareSectionForDatabase,
} from './models/BibleSection.js';
import {
    IBibleVersionEntity,
    parseVersionFromDatabase,
    prepareVersionForDatabase,
} from './models/BibleVersion.js';
import {
    BibleBookPlaintext,
    BiblePlaintext,
    BookWithContentForInput,
    IBibleBookEntity,
    IBibleContent,
    IBibleContentGroup,
    IBibleOutputRich,
    IBiblePhraseRef,
    IBiblePhraseWithNumbers,
    IBibleReferenceNormalized,
    IBibleReferenceRange,
    IBibleReferenceRangeNormalized,
    IBibleReferenceRangeQuery,
    IBibleReferenceRangeVersion,
    IBibleReferenceVersion,
    IBibleSearchResult,
    IBibleVersion,
    IDictionaryEntry,
    PhraseModifiers,
} from './models/index.js';
import {
    IV11nRule,
    parseV11nRuleFromDatabase,
    prepareV11nRuleForDatabase,
} from './models/V11nRule.js';

export class NoDbConnectionError extends Error {
    constructor() {
        super('calling a method that expects a DB connection to be set in BibleEngine');
        this.name = 'NoDbConnectionError';
    }
}

export class BibleVersionInvalidError extends Error {
    httpCode: number;
    constructor() {
        super('accessing an invalid bible version');
        this.name = 'BibleVersionInvalidError';
        this.httpCode = 404;
    }
}

export class BibleVersionRemoteOnlyError extends Error {
    constructor() {
        super('accessing content of a bible version that is only remote');
        this.name = 'BibleVersionRemoteOnlyError';
    }
}

export class BibleVersionNotImportedError extends Error {
    constructor() {
        super('accessing content of a bible version that is not imported yet');
        this.name = 'BibleVersionNotImportedError';
    }
}

export class BibleBookContentNotImportedError extends Error {
    constructor() {
        super('accessing content of a bible book that has not been imported yet');
        this.name = 'BibleBookContentNotImportedError';
    }
}

export class BibleBookContentImportingError extends Error {
    constructor() {
        super('accessing content of a bible book that is being imported');
        this.name = 'BibleBookContentImportingError';
    }
}

export class BibleEngineRemoteError extends Error {
    constructor(message: string) {
        super(`Error from BibleEngine server: ${message}`);
        this.name = 'BibleEngineRemoteError';
    }
}

export interface BibleEngineOptions {
    /**
     * Indicates if an existing database connection will be reused.
     * This option is useful during debug and development.
     */
    checkForExistingConnection?: boolean;

    /**
     * Allows for performance optimization for large INSERTs outside of the possibilites of TypeORM
     */
    executeSqlSetOverride?: (
        set: { statement: string; values: readonly unknown[] }[]
    ) => Promise<any>;

    /**
     * Enables the creation and use of a full text index. Supported environments:
     * - SQLite (only when `executeSqlSetOverride` is set as well)
     * - MySQL with `ngram` support (should be default)
     * - MariaDB with Mroonga plugin installed
     */
    fts?: boolean;

    /**
     * The type of database to use. If not set, the type will be inferred from the database connection.
     */
    dbType?: 'mysql' | 'sqlite';
}

export function isCjkLanguage(langCode: string) {
    // return true if first two characters of langCode are a CJK language code
    return ['zh', 'ja', 'ko'].includes(langCode.slice(0, 2));
}

export class BibleEngine {
    static DEBUG = false;
    dbType?: 'mysql' | 'sqlite';
    executeSqlSetOverride?: BibleEngineOptions['executeSqlSetOverride'];
    fts?: BibleEngineOptions['fts'];
    db: Kysely<DB>;

    constructor(db: Kysely<DB>, options?: BibleEngineOptions) {
        this.db = db;
        this.dbType = options?.dbType;
        this.fts = options?.fts;
        if (options?.executeSqlSetOverride)
            this.executeSqlSetOverride = options.executeSqlSetOverride;
    }

    async getDbType() {
        if (this.dbType) return this.dbType;
        const isSqliteCheck = await isSqlite(this.db);
        this.dbType = isSqliteCheck ? 'sqlite' : 'mysql';
        return this.dbType;
    }

    async getDbJsonArrayFrom() {
        const dbType = await this.getDbType();
        return dbType === 'sqlite' ? sqliteJsonArrayFrom : mysqlJsonArrayFrom;
    }

    getBook(versionId: number, osisId: string) {
        return this.db
            .selectFrom('bible_book')
            .where('versionId', '=', versionId)
            .where('osisId', '=', osisId)
            .selectAll()
            .executeTakeFirst()
            .then((book) => parseBookFromDatabase(book));
    }

    async addBook(book: IBibleBookEntity, tx?: Transaction<DB>) {
        const db = tx || this.db;

        await db.insertInto('bible_book').values(prepareBookForDatabase(book)).execute();

        return book;
    }

    async addBookWithContent(
        version: IBibleVersionEntity,
        bookInput: BookWithContentForInput,
        options: {
            tx?: Transaction<DB>;
            skipCrossRefs?: boolean;
            skipNotes?: boolean;
            skipStrongs?: boolean;
            ignoreSectionsWithoutTitle?: boolean;
        } = {}
    ) {
        const db = options.tx || this.db;

        let bookEntity = await this.getBook(version.id, bookInput.book.osisId);

        const inputHasNormalizedNumbering = bookInput.contentHasNormalizedNumbers || false;

        // if we have pre-generated normalized numbers as well as chapter counts we don't need to
        // generate the bible plaintext structure
        let textData: BibleBookPlaintext = new Map();
        let chaptersCount = bookInput.book.chaptersCount;
        if (!inputHasNormalizedNumbering || !chaptersCount || !chaptersCount.length || this.fts) {
            textData = convertBibleInputToBookPlaintext(bookInput.contents);
            chaptersCount = [];
            for (const verses of textData.values()) {
                // we need to fetch the actual key of the last verse (which is the last verse number)
                // not only the length of the array, since there might be skipped verses in versions
                // however `chaptersCount` needs to contain the last verse number not number of
                // unskipped verses within a chapter
                // there are occurences of verses in the wrong order in source files so we need to
                // specifically look for the max key in `verses`
                chaptersCount.push(verses.size ? Math.max(...verses.keys()) : 0);
            }
        }

        let bookImportPhraseRange: { firstPhraseId?: number; lastPhraseId?: number } | undefined;

        if (bookInput.book.introduction)
            bookInput.book.introduction = {
                type: 'root',
                contents: normalizeDocumentContents(bookInput.book.introduction.contents),
            };

        if (options.tx) {
            // mark the book as importing (and save missing book meta-data)

            if (!bookEntity) {
                bookEntity = await this.addBook(
                    {
                        ...bookInput.book,
                        chaptersCount,
                        versionId: version.id,
                        dataLocation: 'importing',
                    },
                    options.tx
                );
            } else {
                bookEntity = await this.updateBook(
                    bookEntity,
                    { ...bookInput.book, dataLocation: 'importing' },
                    options.tx
                );
            }

            bookImportPhraseRange = await this.addBibleBookContent({
                db: options.tx,
                contents: bookInput.contents,
                version,
                book: bookEntity,
                context: textData,
                inputHasNormalizedNumbering,
                skip: {
                    strongs: options.skipStrongs,
                    notes: options.skipNotes,
                    crossRefs: options.skipCrossRefs,
                },
                ignoreSectionsWithoutTitle: options.ignoreSectionsWithoutTitle,
            });

            bookEntity = await this.updateBook(bookEntity, { dataLocation: 'db' }, options.tx);
        } else {
            await db.transaction().execute(async (tx) => {
                // mark the book as importing (and save missing book meta-data)

                if (!bookEntity) {
                    bookEntity = await this.addBook(
                        {
                            ...bookInput.book,
                            chaptersCount: chaptersCount!,
                            versionId: version.id,
                            dataLocation: 'importing',
                        },
                        tx
                    );
                } else {
                    bookEntity = await this.updateBook(
                        bookEntity,
                        { ...bookInput.book, dataLocation: 'importing' },
                        tx
                    );
                }

                bookImportPhraseRange = await this.addBibleBookContent({
                    db: tx,
                    contents: bookInput.contents,
                    version,
                    book: bookEntity,
                    context: textData,
                    inputHasNormalizedNumbering,
                    skip: {
                        strongs: options.skipStrongs,
                        notes: options.skipNotes,
                        crossRefs: options.skipCrossRefs,
                    },
                    ignoreSectionsWithoutTitle: options.ignoreSectionsWithoutTitle,
                });

                bookEntity = await this.updateBook(bookEntity, { dataLocation: 'db' }, tx);
            });
        }

        return bookImportPhraseRange;
    }

    async addDictionaryEntries(dictionaryEntries: IDictionaryEntry[]) {
        const chunkSize = 100;
        // Split the array into chunks and insert in batches
        for (let i = 0; i < dictionaryEntries.length; i += chunkSize) {
            const chunk = dictionaryEntries.slice(i, i + chunkSize);
            await this.db.insertInto('dictionary_entry').values(chunk).execute();
        }
        const dbType = await this.getDbType();
        if (dbType === 'mysql') {
            // https://stackoverflow.com/questions/60059084/what-does-using-join-buffer-block-nested-loop-mean-with-explain-mysql-command
            // https://bugs.mysql.com/bug.php?id=69721
            await sql`OPTIMIZE TABLE dictionary_entry`.execute(this.db);
        }
    }

    async addV11nRules(rules: IV11nRule[]) {
        const chunkSize = 100;
        // Split the array into chunks and insert in batches
        for (let i = 0; i < rules.length; i += chunkSize) {
            const chunk = rules.slice(i, i + chunkSize);
            await this.db
                .insertInto('v11n_rule')
                .values(chunk.map((rule) => prepareV11nRuleForDatabase(rule)))
                .execute();
        }
        const dbType = await this.getDbType();
        if (dbType === 'mysql') {
            // https://stackoverflow.com/questions/60059084/what-does-using-join-buffer-block-nested-loop-mean-with-explain-mysql-command
            // https://bugs.mysql.com/bug.php?id=69721
            await sql`OPTIMIZE TABLE v11n_rule`.execute(this.db);
        }
        return;
    }

    async addVersion(version: IBibleVersion): Promise<IBibleVersionEntity> {
        return this.db
            .insertInto('bible_version')
            .values(prepareVersionForDatabase(version))
            .executeTakeFirstOrThrow()
            .then((insertResult) => ({
                ...version,
                id: Number(insertResult.insertId),
                lastUpdate: new Date(),
            }));
    }

    async finalizeVersion(versionId: number) {
        await this.normalizeCrossReferencesForVersion(versionId);
        const dbType = await this.getDbType();
        if (dbType === 'mysql') {
            // https://stackoverflow.com/questions/60059084/what-does-using-join-buffer-block-nested-loop-mean-with-explain-mysql-command
            // https://bugs.mysql.com/bug.php?id=69721
            await sql`OPTIMIZE TABLE bible_book`.execute(this.db);
            await sql`OPTIMIZE TABLE bible_cross_reference`.execute(this.db);
            await sql`OPTIMIZE TABLE bible_note`.execute(this.db);
            await sql`OPTIMIZE TABLE bible_paragraph`.execute(this.db);
            await sql`OPTIMIZE TABLE bible_phrase`.execute(this.db);
            await sql`OPTIMIZE TABLE bible_phrase_original_word`.execute(this.db);
            await sql`OPTIMIZE TABLE bible_section`.execute(this.db);
            await sql`OPTIMIZE TABLE bible_version`.execute(this.db);
        }
        return;
    }

    // RADAR: while migrating this method to kysely, I noticed that this method doesn't seem to be
    // used anywhere. also, it seems to be wrong because it doesn't query for the versionId of the
    // book. So this should be either deleted or if still needed properly implemented and tested.
    async generateBookMetadata(book: IBibleBookEntity) {
        const metaData = await this.db
            .selectFrom('bible_phrase as phrase')
            .select([sql<number>`COUNT(DISTINCT phrase.versionVerseNum)`.as('numVerses')])
            .where(
                sql<boolean>`${generatePhraseIdSql(
                    { isNormalized: true, bookOsisId: book.osisId },
                    'phrase'
                )}`
            )
            .groupBy('phrase.versionChapterNum')
            .orderBy('phrase.versionChapterNum')
            .execute();

        const bookUpdates = {
            chaptersCount: metaData.map((chapter) => chapter.numVerses).join(','),
        };

        await this.db
            .updateTable('bible_book')
            .set(bookUpdates)
            .where('versionId', '=', book.versionId)
            .where('osisId', '=', book.osisId)
            .execute();

        return bookUpdates;
    }

    async getBookForVersionReference({ versionId, bookOsisId }: IBibleReferenceVersion) {
        return this.db
            .selectFrom('bible_book')
            .where('osisId', '=', bookOsisId)
            .where('versionId', '=', versionId)
            .selectAll()
            .executeTakeFirst()
            .then((book) => parseBookFromDatabase(book));
    }

    async getBooksForVersion(versionId: number) {
        return this.db
            .selectFrom('bible_book')
            .selectAll()
            .where('versionId', '=', versionId)
            .orderBy('number')
            .execute()
            .then((books) => books.map((book) => parseBookFromDatabase(book)));
    }

    async getBooksForVersionUid(versionUid: string) {
        const version = await this.db
            .selectFrom('bible_version')
            .where('uid', '=', versionUid)
            .select(['id'])
            .executeTakeFirst();
        if (!version) throw new Error(`missing version ${versionUid}`);
        return this.getBooksForVersion(version.id);
    }

    async getBookSections(
        version: { id: number; chapterVerseSeparator: string },
        book: { osisId: string; chaptersCount: number[] }
    ) {
        const query = this.db
            .selectFrom('bible_section as section')
            .selectAll()
            .innerJoin('bible_phrase as phraseStart', 'phraseStart.id', 'section.phraseStartId')
            .select('phraseStart.versionChapterNum as versionChapterStart')
            .select('phraseStart.versionVerseNum as versionVerseStart')
            .innerJoin('bible_phrase as phraseEnd', 'phraseEnd.id', 'section.phraseEndId')
            .select('phraseEnd.versionChapterNum as versionChapterEnd')
            .select('phraseEnd.versionVerseNum as versionVerseEnd')
            .where(
                sql<boolean>`${generateBookSectionsSql(
                    { versionId: version.id, bookOsisId: book.osisId, isNormalized: true },
                    'section'
                )}`
            )
            .orderBy('section.level', 'asc')
            .orderBy('section.phraseStartId', 'asc');
        return query.execute().then((sections) => {
            const sectionsWithVersionNumbers: IBibleSectionHierarchical[] = sections.map(
                (section) => {
                    let rangeLabel: string = `${section.versionChapterStart}`;
                    if (
                        section.versionVerseStart > 1 ||
                        book.chaptersCount?.[section.versionChapterEnd - 1] !==
                            section.versionVerseEnd
                    )
                        rangeLabel += `${version.chapterVerseSeparator}${section.versionVerseStart}`;
                    if (
                        section.versionChapterStart !== section.versionChapterEnd ||
                        section.versionVerseStart > 1 ||
                        book.chaptersCount?.[section.versionChapterEnd - 1] !==
                            section.versionVerseEnd
                    )
                        rangeLabel += '-';
                    if (section.versionChapterEnd !== section.versionChapterStart)
                        rangeLabel += section.versionChapterEnd;
                    if (
                        section.versionVerseStart > 1 ||
                        book.chaptersCount?.[section.versionChapterEnd - 1] !==
                            section.versionVerseEnd
                    ) {
                        if (section.versionChapterEnd !== section.versionChapterStart)
                            rangeLabel += version.chapterVerseSeparator;
                        rangeLabel += section.versionVerseEnd;
                    }
                    return {
                        ...parseSectionFromDatabase(section),
                        title: section.title
                            ?.replace(`${rangeLabel}: `, '')
                            .replace(` (${rangeLabel})`, ''),
                        versionChapterStart: section.versionChapterStart,
                        versionVerseStart: section.versionVerseStart,
                        versionChapterEnd: section.versionChapterEnd,
                        versionVerseEnd: section.versionVerseEnd,
                        rangeLabel,
                        subSections: [],
                    };
                }
            );
            const sectionsHierarchical: IBibleSectionHierarchical[] = [];
            for (const section of sectionsWithVersionNumbers) {
                // we only support three levels of sections for this method
                if (section.level > 2) break;

                if (section.level === 0) {
                    sectionsHierarchical.push(section);
                } else {
                    const parent = sectionsHierarchical.find(
                        (parent) =>
                            (parent.versionChapterStart < section.versionChapterStart ||
                                (parent.versionChapterStart === section.versionChapterStart &&
                                    parent.versionVerseStart <= section.versionVerseStart)) &&
                            (parent.versionChapterEnd > section.versionChapterEnd ||
                                (parent.versionChapterEnd === section.versionChapterEnd &&
                                    parent.versionVerseEnd >= section.versionVerseEnd))
                    );
                    if (!parent)
                        throw new Error(
                            `missing parent for section level ${section.level} ${section.phraseStartId}-${section.phraseEndId}`
                        );
                    if (section.level === 1) {
                        parent.subSections.push(section);
                    } else if (section.level === 2) {
                        const parent2 = parent.subSections.find(
                            (_parent2) =>
                                (_parent2.versionChapterStart < section.versionChapterStart ||
                                    (_parent2.versionChapterStart === section.versionChapterStart &&
                                        _parent2.versionVerseStart <= section.versionVerseStart)) &&
                                (_parent2.versionChapterEnd > section.versionChapterEnd ||
                                    (_parent2.versionChapterEnd === section.versionChapterEnd &&
                                        _parent2.versionVerseEnd >= section.versionVerseEnd))
                        );
                        if (!parent2)
                            throw new Error(
                                `missing parent for section level ${section.level} ${section.phraseStartId}-${section.phraseEndId}`
                            );
                        parent2.subSections.push(section);
                    }
                }
            }
            return sectionsHierarchical;
        });
    }

    async getBookSectionsForVersionUid(versionUid: string, bookOsisId: string) {
        const version = await this.db
            .selectFrom('bible_version')
            .where('uid', '=', versionUid)
            .select(['id', 'chapterVerseSeparator'])
            .executeTakeFirst();

        if (!version) throw new Error(`missing version ${versionUid}`);

        const book = await this.db
            .selectFrom('bible_book')
            .where('versionId', '=', version.id)
            .where('osisId', '=', bookOsisId)
            .select(['osisId', 'chaptersCount'])
            .executeTakeFirst();

        if (!book) throw new Error(`missing book ${bookOsisId}`);

        return this.getBookSections(version, {
            osisId: book.osisId,
            chaptersCount: book.chaptersCount.split(',').map((c) => +c),
        });
    }

    async getDictionaryEntries(strong: string, dictionary?: string): Promise<IDictionaryEntry[]> {
        return this.db
            .selectFrom('dictionary_entry')
            .selectAll()
            .where('strong', '=', strong)
            .$if(!!dictionary, (qb) => qb.where('dictionary', '=', dictionary!))
            .execute();
    }

    async getFullDataForReferenceRange(
        rangeQuery: IBibleReferenceRangeQuery,
        stripUnnecessaryData = false
    ): Promise<IBibleOutputRich> {
        const versionEntity = await this.db
            .selectFrom('bible_version')
            .where('uid', '=', rangeQuery.versionUid)
            .selectAll()
            .executeTakeFirst()
            .then((version) => parseVersionFromDatabase(version));

        if (!versionEntity) throw new BibleVersionInvalidError();
        if (versionEntity.dataLocation === 'remote') throw new BibleVersionRemoteOnlyError();
        if (versionEntity.dataLocation === 'file') throw new BibleVersionNotImportedError();

        const range = { ...rangeQuery, versionId: versionEntity.id };
        const bookEntity = await this.getBookForVersionReference(range);

        if (!bookEntity) throw new Error(`can't get formatted text: invalid book`);
        if (bookEntity.dataLocation === 'file') throw new BibleBookContentNotImportedError();
        if (bookEntity.dataLocation === 'importing') throw new BibleBookContentImportingError();

        const bookAbbreviations = await this.db
            .selectFrom('bible_book')
            .select(['osisId', 'abbreviation'])
            .where('versionId', '=', versionEntity.id)
            .execute()
            .then((books) => {
                const dict: { [index: string]: string } = {};
                for (const _book of books) {
                    dict[_book.osisId] = _book.abbreviation;
                }
                return dict;
            });

        let rangeNormalized = isReferenceNormalized(range)
            ? <IBibleReferenceRangeNormalized>range
            : await this.getNormalizedReferenceRange(range, bookEntity);

        let phrases = await this.getPhrases(rangeNormalized, bookEntity);

        // check if our range starts with an incomplete verse range. in that
        // case re-fetch the phrases starting from the starting phrase of the
        // range
        if (
            phrases[0] &&
            phrases[0].joinToVersionRefId &&
            phrases[0].joinToVersionRefId <
                generateVersionReferenceId({
                    bookOsisId: bookEntity.osisId,
                    versionChapterNum: phrases[0].versionChapterNum,
                    versionVerseNum: phrases[0].versionVerseNum,
                })
        ) {
            const parsedRefId = parseReferenceId(phrases[0].joinToVersionRefId);
            let hasEndRange =
                range.versionChapterEndNum && range.versionChapterEndNum > range.versionChapterNum!;
            if (
                !hasEndRange &&
                range.versionVerseEndNum &&
                range.versionVerseEndNum > range.versionVerseNum!
            )
                hasEndRange = true;
            if (
                !hasEndRange &&
                range.versionSubverseEndNum &&
                range.versionSubverseEndNum > range.versionSubverseNum!
            )
                hasEndRange = true;
            rangeNormalized = await this.getNormalizedReferenceRange(
                {
                    isNormalized: false,
                    versionId: versionEntity.id,
                    versionUid: versionEntity.uid,
                    bookOsisId: bookEntity.osisId,
                    versionChapterNum: parsedRefId.normalizedChapterNum, // this is actually a version number, it's just named normalized by the parse method
                    versionVerseNum: parsedRefId.normalizedVerseNum, // this is actually a version number, it's just named normalized by the parse method
                    versionSubverseNum: parsedRefId.normalizedSubverseNum, // this is actually a version number, it's just named normalized by the parse method
                    versionChapterEndNum: hasEndRange
                        ? range.versionChapterEndNum
                        : range.versionChapterNum,
                    versionVerseEndNum: hasEndRange
                        ? range.versionVerseEndNum
                        : range.versionVerseNum,
                    versionSubverseEndNum: hasEndRange
                        ? range.versionSubverseEndNum
                        : range.versionSubverseNum,
                },
                bookEntity
            );
            phrases = await this.getPhrases(rangeNormalized, bookEntity);
        }

        const paragraphs = await this.db
            .selectFrom('bible_paragraph as paragraph')
            .where(
                sql<boolean>`${generateParagraphSql(
                    { ...rangeNormalized, versionId: rangeNormalized.versionId! },
                    'paragraph'
                )}`
            )
            .selectAll()
            .orderBy('paragraph.id')
            .execute();
        // we fetch the previous and next paragraphs that we need for the context ranges
        if (paragraphs.length) {
            // paragraphs are inserted in order so we can just fetch the previous and next
            // paragraphs by de-/incrementing the first/last id (paragraphs from other books or
            // versions are filtered out later)
            const nextPreviousParagraphs = await this.db
                .selectFrom('bible_paragraph')
                .selectAll()
                .where('id', 'in', [
                    paragraphs[0]!.id - 1,
                    paragraphs[paragraphs.length - 1]!.id + 1,
                ])
                .execute();
            for (const paragraph of nextPreviousParagraphs) {
                const paragraphPhraseIdParsed = parsePhraseId(paragraph.phraseStartId);
                // in case the query range is at the beginning or end of the book or even the
                // versions we need to filter out the previous / next paragraphs
                if (
                    paragraph.versionId !== rangeNormalized.versionId ||
                    paragraphPhraseIdParsed.bookOsisId !== rangeNormalized.bookOsisId
                )
                    continue;

                if (paragraph.id === paragraphs[0]!.id - 1) paragraphs.unshift(paragraph);
                else if (paragraph.id === paragraphs[paragraphs.length - 1]!.id + 1)
                    paragraphs.push(paragraph);
            }
        }
        const jsonArrayFrom = await this.getDbJsonArrayFrom();
        const sections: IBibleSectionEntity[] = await this.db
            .selectFrom('bible_section as section')
            .selectAll()
            .select((eb) => [
                jsonArrayFrom(
                    eb
                        .selectFrom('bible_cross_reference as crossRef')
                        .select([
                            'id',
                            'key',
                            'normalizedRefId',
                            'normalizedRefIdEnd',
                            'partIndicator',
                            'partIndicatorEnd',
                            'phraseId',
                            'sectionId',
                            'versionChapterEndNum',
                            'versionChapterNum',
                            'versionId',
                            'versionVerseEndNum',
                            'versionVerseNum',
                        ])
                        .whereRef('crossRef.sectionId', '=', 'section.id')
                ).as('crossReferences'),
            ])
            .where(sql<boolean>`${generateBookSectionsSql(rangeNormalized, 'section')}`)
            .orderBy('section.level', 'asc')
            .orderBy('section.phraseStartId', 'asc')
            .execute()
            .then((sections) =>
                sections.map((section) => ({
                    ...parseSectionFromDatabase(section),
                    crossReferences: section.crossReferences.map((crossRef) =>
                        parseCrossReferenceFromDatabase(crossRef)
                    ),
                }))
            );

        /* GENERATE STRUCTURED DATA */

        // generate an array of all phrases keyed by phraseId
        const phraseVersionNumbersById = phrases.reduce((acc, phrase) => {
            if (phrase.sourceTypeId)
                acc[phrase.id] = {
                    chapter: phrase.versionChapterNum,
                    verse: phrase.versionVerseNum,
                    subverse: phrase.versionSubverseNum ?? 1,
                    phraseNum: phrase.normalizedReference.phraseNum,
                };
            return acc;
        }, {} as PhraseVersionNumbersById);
        const context = generateContextSections(phrases, sections);

        const contextRanges = generateContextRanges(
            range,
            rangeNormalized,
            phrases,
            paragraphs,
            context,
            bookEntity
        );

        const bibleDocument = generateBibleDocument(
            phrases,
            paragraphs,
            context,
            bookAbbreviations,
            versionEntity.chapterVerseSeparator,
            rangeQuery,
            phraseVersionNumbersById
        );

        if (stripUnnecessaryData) {
            // when we are transmitting the data we want the returned object to be as slim as
            // possible. also: when we transmit to a client, local ids have to be stripped
            // (versionId, sectionId)

            // TODO: refactor methods to not mutate data
            stripUnnecessaryDataFromBibleReferenceRange(rangeNormalized);
            stripUnnecessaryDataFromBibleContextData(context, contextRanges);

            return {
                version: stripUnnecessaryDataFromBibleVersion(versionEntity, true),
                versionBook: stripUnnecessaryDataFromBibleBook(bookEntity, true),
                range: rangeNormalized,
                content: {
                    ...bibleDocument,
                    contents: stripUnnecessaryDataFromBibleContent(bibleDocument.contents),
                },
                context,
                contextRanges,
            };
        } else {
            return {
                version: versionEntity,
                versionBook: bookEntity,
                range: rangeNormalized,
                content: bibleDocument,
                context,
                contextRanges,
            };
        }
    }

    async getNextPhraseNumForNormalizedVerseNum(
        reference: IBibleReferenceVersionNormalized
    ): Promise<number> {
        const lastPhrase = await this.db
            .selectFrom('bible_phrase')
            .select(['id'])
            .where('id', '>=', generatePhraseId(reference))
            .where('id', '<=', generatePhraseId(generateEndReferenceFromRange(reference)))
            .where('versionId', '=', reference.versionId)
            .orderBy('id', 'desc')
            .limit(1)
            .execute();

        return lastPhrase.length ? parsePhraseId(lastPhrase[0]!.id).phraseNum! + 1 : 1;
    }

    async getPhrases(
        range: IBibleReferenceRangeNormalized | IBibleReferenceRangeVersion,
        book?: IBibleBookEntity
    ): Promise<IBiblePhraseEntity[]> {
        const normalizedRange =
            range.isNormalized === true
                ? <IBibleReferenceRangeNormalized>range
                : await this.getNormalizedReferenceRange(range, book);
        const jsonArrayFrom = await this.getDbJsonArrayFrom();
        return this.db
            .selectFrom('bible_phrase')
            .selectAll()
            .select((eb) => [
                jsonArrayFrom(
                    eb
                        .selectFrom('bible_note')
                        .whereRef('bible_note.phraseId', '=', 'bible_phrase.id')
                        .select(['content', 'id', 'key', 'phraseId', 'type'])
                ).as('notes'),
                jsonArrayFrom(
                    eb
                        .selectFrom('bible_cross_reference')
                        .whereRef('bible_cross_reference.phraseId', '=', 'bible_phrase.id')
                        .select([
                            'id',
                            'key',
                            'normalizedRefId',
                            'normalizedRefIdEnd',
                            'partIndicator',
                            'partIndicatorEnd',
                            'phraseId',
                            'sectionId',
                            'versionChapterEndNum',
                            'versionChapterNum',
                            'versionId',
                            'versionVerseEndNum',
                            'versionVerseNum',
                        ])
                ).as('crossReferences'),
            ])
            .where(
                sql<boolean>`${sql.ref('id')} BETWEEN ${generatePhraseId(
                    normalizedRange
                )} AND ${generatePhraseId(generateEndReferenceFromRange(normalizedRange))}`
            )
            .$if(!!normalizedRange.versionId, (qb) => {
                let _qb = qb.where('versionId', '=', normalizedRange.versionId!);
                if (normalizedRange.versionChapterNum && normalizedRange.versionChapterEndNum)
                    _qb = _qb
                        .where('versionChapterNum', '>=', normalizedRange.versionChapterNum!)
                        .where('versionChapterNum', '<=', normalizedRange.versionChapterEndNum!);
                else if (normalizedRange.versionChapterNum)
                    _qb = _qb.where('versionChapterNum', '=', normalizedRange.versionChapterNum);

                const singleChapter =
                    normalizedRange.versionChapterNum &&
                    (!normalizedRange.versionChapterEndNum ||
                        normalizedRange.versionChapterNum === normalizedRange.versionChapterEndNum);
                if (singleChapter && normalizedRange.versionVerseNum) {
                    if (normalizedRange.versionVerseNum && normalizedRange.versionVerseEndNum)
                        _qb = _qb
                            .where('versionVerseNum', '>=', normalizedRange.versionVerseNum)
                            .where('versionVerseNum', '<=', normalizedRange.versionVerseEndNum);
                    else if (normalizedRange.versionVerseNum)
                        _qb = _qb.where('versionVerseNum', '=', normalizedRange.versionVerseNum);
                }
                return _qb;
            })
            .$if(!!normalizedRange.versionId, (qb) =>
                qb
                    .orderBy('versionChapterNum', 'asc')
                    .orderBy('versionVerseNum', 'asc')
                    .orderBy('versionSubverseNum', 'asc')
            )
            .orderBy('id', 'asc')
            .execute()
            .then((phrases) =>
                phrases.map((phrase) => ({
                    ...parsePhraseFromDatabase(phrase),
                    notes: phrase.notes.map((note) => parseNoteFromDatabase(note)),
                    crossReferences: phrase.crossReferences.map((crossRef) =>
                        parseCrossReferenceFromDatabase(crossRef)
                    ),
                }))
            );
    }

    async getVersionFullData(versionUid: string) {
        const versionEntity = await this.db
            .selectFrom('bible_version')
            .where('uid', '=', versionUid)
            .selectAll()
            .executeTakeFirst()
            .then((version) => parseVersionFromDatabase(version));
        if (!versionEntity) throw new Error(`version ${versionUid} is not available`);

        const version: IBibleVersion = stripUnnecessaryDataFromBibleVersion(versionEntity);

        const books: IBibleBookEntity[] = await this.db
            .selectFrom('bible_book')
            .selectAll()
            .where('versionId', '=', versionEntity.id)
            .orderBy('number', 'asc')
            .execute()
            .then((books) => books.map((book) => parseBookFromDatabase(book)));
        const bookData: BookWithContentForInput[] = [];
        for (const book of books) {
            const bookStrippedData = await this.getFullDataForReferenceRange(
                {
                    versionUid: version.uid,
                    bookOsisId: book.osisId,
                },
                true
            );
            bookData.push({
                book: stripUnnecessaryDataFromBibleBook(book),
                contents: bookStrippedData.content.contents,
                contentHasNormalizedNumbers: true,
            });
        }

        return { version, bookData };
    }

    async getVersionPlaintextNormalized(versionUid: string): Promise<BiblePlaintext> {
        const versionEntity = await this.db
            .selectFrom('bible_version')
            .selectAll()
            .where('uid', '=', versionUid)
            .executeTakeFirst()
            .then((version) => parseVersionFromDatabase(version));
        if (!versionEntity) throw new Error(`version ${versionUid} is not available`);

        const plaintextMap = new Map();
        const versionData = await this.getVersionFullData(versionUid);
        for (const bookData of versionData.bookData) {
            plaintextMap.set(
                bookData.book.osisId,
                convertBibleInputToBookPlaintext(bookData.contents, true)
            );
        }
        return plaintextMap;
    }

    async getReferenceRangeWithAllVersionProperties(
        range: IBibleReferenceRange,
        versionBook?: IBibleBookEntity | null
    ): Promise<IBibleReferenceRange> {
        if (!versionBook && range.versionId) {
            versionBook = await this.db
                .selectFrom('bible_book')
                .selectAll()
                .where('versionId', '=', range.versionId)
                .where('osisId', '=', range.bookOsisId)
                .executeTakeFirst()
                .then((book) => parseBookFromDatabase(book));
        }
        if (!versionBook) {
            throw new Error(
                `can't get normalized reference: invalid or missing version or book data`
            );
        }

        // setting all missing properties on reference
        const versionChapterEndNum =
            range.versionChapterEndNum ||
            range.versionChapterNum ||
            versionBook.chaptersCount.length;
        const versionVerseEndNum = range.versionVerseEndNum
            ? range.versionVerseEndNum
            : range.versionVerseNum &&
              (!range.versionChapterEndNum ||
                  range.versionChapterEndNum === range.versionChapterNum)
            ? range.versionVerseNum
            : getBookChapterVerseCount(versionBook, versionChapterEndNum);
        return {
            versionId: range.versionId,
            bookOsisId: range.bookOsisId,
            versionChapterNum: range.versionChapterNum || 1,
            versionChapterEndNum,
            versionVerseNum: range.versionVerseNum || 1,
            versionVerseEndNum,
        };
    }

    async getVersion(versionUid: string) {
        return this.db
            .selectFrom('bible_version')
            .selectAll()
            .where('uid', '=', versionUid)
            .executeTakeFirst()
            .then((version) => parseVersionFromDatabase(version));
    }

    async getVersionLanguage(versionUid: string) {
        return this.db
            .selectFrom('bible_version')
            .where('uid', '=', versionUid)
            .select(['language'])
            .executeTakeFirst()
            .then((version) => version?.language);
    }

    async getVersionLocalId(versionUid: string) {
        return this.db
            .selectFrom('bible_version')
            .where('uid', '=', versionUid)
            .select(['id'])
            .executeTakeFirst()
            .then((version) => version?.id);
    }

    async getVersions(lang?: string | string[]) {
        let query = this.db.selectFrom('bible_version').selectAll();

        if (lang) {
            const langs = typeof lang === 'string' ? [lang] : lang;
            query = query.where((eb) =>
                eb.or(langs.map((lang) => eb('language', 'like', `${lang}%`)))
            );
        }

        return query
            .execute()
            .then((versions) => versions.map((version) => parseVersionFromDatabase(version)));
    }

    async search({
        versionUid,
        alternativeVersionUids,
        bookRange,
        query,
        queryMode = 'fuzzy',
        sortMode = 'reference',
        pagination = { page: 1, count: 50 },
    }: IBibleSearchOptions): Promise<IBibleSearchResult[]> {
        // remove all punctuation chars from query
        query = query.replace(
            /[\u2000-\u206F\u2E00-\u2E7F\\!#$%&()*+,\-./:;<=>?@[\]^_`{|}~=]/g,
            ' '
        );
        if (!query) return [];
        const paginationNormalized = {
            page: pagination.page,
            count: pagination.count || 50,
        };

        // Handle CJK languages
        const language = await this.getVersionLanguage(versionUid);
        // since cjk languages don't use spaces between words, a different kind of fts index is
        // needed. currently we only use a special index when the mysql driver is used. for sqlite
        // indexing cjk seems to be possible with fts4 (instead of fts5) and when compiled with the
        // ICU flag. since this is a bit more involved, we leave this for a later time.
        // consequently, a search in cjk language with sqlite will only return matches that
        // start at the beginning of a sentence or after a punctuation mark. until this is
        // implemented it is recommended to fallback on a remote query using BibleEngineClient when
        // working with cjk languages on the client.
        const isCjk = !!language && isCjkLanguage(language);
        if (isCjk) {
            // remove all latin chars from query
            query = query.replace(/[a-zA-Z]/g, ' ');
        }

        // Process query terms
        const queryTermsNormalized = query
            // split words but group terms in quotes together
            .match(/(?:[^\s"']+|['"][^'"]*["'])+/g)
            ?.map((term) => term.replace(/['"]/g, ' ').trim())
            .filter(Boolean);

        if (!queryTermsNormalized) return [];

        const bibleVersionUids = [versionUid, ...(alternativeVersionUids || [])];

        if (this.dbType === 'sqlite') {
            return this.searchSqlite({
                versionUid,
                bibleVersionUids,
                bookRange,
                queryTermsNormalized,
                queryMode,
                sortMode,
                pagination: paginationNormalized,
            });
        } else if (this.dbType === 'mysql') {
            return this.searchMysql({
                versionUid,
                bibleVersionUids,
                bookRange,
                queryTermsNormalized,
                queryMode,
                sortMode,
                pagination: paginationNormalized,
                isCjk,
            });
        }

        throw new Error(`unsupported db type ${this.dbType}`);
    }

    private async searchSqlite({
        versionUid,
        bibleVersionUids,
        bookRange,
        queryTermsNormalized,
        queryMode,
        sortMode,
        pagination,
    }: {
        versionUid: string;
        bibleVersionUids: string[];
        bookRange?: { start: number; end?: number };
        queryTermsNormalized: string[];
        queryMode: string;
        sortMode: string;
        pagination: { page: number; count: number };
    }): Promise<IBibleSearchResult[]> {
        const queryNormalized =
            queryMode === 'fuzzy'
                ? // enclose terms with multiple words in quotes
                  queryTermsNormalized
                      .map((term) => (term.indexOf(' ') !== -1 ? `"${term}" *` : `${term}*`))
                      // put everything back together
                      .join(' ')
                : `"${queryTermsNormalized.join(' ')}" *`;

        if (!queryNormalized) return [];

        const offset = (pagination.page - 1) * pagination.count;

        return sql<{
            verse: string;
            versionUid: string;
            versionBook: number;
            versionChapter: number;
            versionVerse: number;
        }>`
            SELECT 
                verse, versionUid, versionBook, versionChapter, versionVerse, 
                 /* force the current bible version to always be selected by group by */
                MIN(case when versionUid = ${versionUid} then 1 else 2 end) as isCurrentVersion,
                rowid, rank 
            FROM bible_search(${queryNormalized}) 
            WHERE versionUid IN (${sql.join(bibleVersionUids)})
            ${
                bookRange
                    ? sql`AND versionBook BETWEEN ${bookRange.start} AND ${
                          bookRange.end || bookRange.start
                      }`
                    : sql``
            }
            GROUP BY versionBook, versionChapter, versionVerse
            ORDER BY ${
                sortMode === 'reference'
                    ? sql`versionBook, versionChapter, versionVerse`
                    : sql`rank`
            }
            LIMIT ${pagination.count}
            OFFSET ${offset}
        `
            .execute(this.db)
            .then(({ rows }) => this.processSearchResults(rows, queryMode, queryTermsNormalized));
    }

    private async searchMysql({
        versionUid,
        bibleVersionUids,
        bookRange,
        queryTermsNormalized,
        queryMode,
        sortMode,
        pagination,
        isCjk,
    }: {
        versionUid: string;
        bibleVersionUids: string[];
        bookRange?: { start: number; end?: number };
        queryTermsNormalized: string[];
        queryMode: string;
        sortMode: string;
        pagination: { page: number; count: number };
        isCjk: boolean;
    }): Promise<IBibleSearchResult[]> {
        const wildcard = '*';
        let queryNormalized: string;
        let exactSearchRegex: string | undefined;

        if (queryMode === 'exact') {
            // it is (to my knowledge) not possible to an "incomplete phrase search" in mysql
            // therefore we don't use a quoted phrase in exact search but filter the fuzzy results
            // with an additional regex in the query

            queryNormalized =
                queryTermsNormalized
                    .map((term) =>
                        term.indexOf(' ') !== -1
                            ? term
                                  .split(' ')
                                  .map((_term) => `+${term}`)
                                  .join(' ')
                            : `+${term}`
                    )
                    // put everything back together and add a wildcard to the last word
                    .join(' ') + wildcard;

            // the regex ensures that the terms follow each other in the verse with only
            // whitespace or punctuation chars in between. in contrast to the fts phrase search
            // it also allows partial words at the end of the phrase, which isn't possible with
            // the fts phrase search. this is important so that we can show the results without
            // the user having to type out the full phrase.
            exactSearchRegex = queryTermsNormalized
                .map((term) =>
                    term.indexOf(' ') !== -1 ? term.replace(/ /g, '[[:space:][:punct:]]+') : term
                )
                // put everything back together
                .join('[[:space:][:punct:]]+');
        } else {
            // enclose terms with multiple words in quotes
            queryNormalized = queryTermsNormalized
                .map((term) => (term.indexOf(' ') !== -1 ? `"${term}"` : `+${term}${wildcard}`))
                // put everything back together
                .join(' ');
        }

        if (!queryNormalized) return [];

        const offset = (pagination.page - 1) * pagination.count;
        const searchTable = isCjk ? 'bible_search_cjk' : 'bible_search';

        // since mysql has non-deterministic column-results for grouped rows when using an
        // aggregate function, we need to use a subquery to get the correct verse and
        // versionUid for each result
        return sql<{
            verse: string;
            versionUid: string;
            versionBook: number;
            versionChapter: number;
            versionVerse: number;
        }>`
            SELECT s.* FROM (
                SELECT 
                    versionBook, versionChapter, versionVerse,
                    /* replace search version by "1" in the group and then use mysql MIN to 
                       prioritize it for output */
                    MIN(IF(versionUid = ${versionUid}, 1, versionUid)) as versionUidOrOne,
                    /* this will possibly calculate the relevance for the wrong row-column in 
                        the grouped rows, however we need the value for ordering and limiting.
                        This is tolerable since relevance will be similar for the same verse in
                        different versions */
                    MATCH(verse) AGAINST(${queryNormalized} IN BOOLEAN MODE) AS relevance
                FROM ${sql.raw(searchTable)}
                WHERE MATCH(verse) AGAINST(${queryNormalized} IN BOOLEAN MODE)
                    ${exactSearchRegex ? sql`AND verse REGEXP ${exactSearchRegex}` : sql``}
                    AND versionUid IN (${sql.join(bibleVersionUids)})
                    ${
                        bookRange
                            ? sql`AND versionBook BETWEEN ${bookRange.start} AND ${
                                  bookRange.end || bookRange.start
                              }`
                            : sql``
                    }
                GROUP BY versionBook, versionChapter, versionVerse
                ORDER BY ${
                    sortMode === 'reference'
                        ? sql`versionBook, versionChapter, versionVerse`
                        : sql`relevance DESC`
                }
                LIMIT ${pagination.count}
                OFFSET ${offset}
            ) res 
            INNER JOIN ${sql.raw(searchTable)} s ON
                /* undo search version > "1" replacement from above */
                s.versionUid = IF(versionUidOrOne = 1, ${versionUid}, res.versionUidOrOne)
                AND s.versionBook = res.versionBook
                AND s.versionChapter = res.versionChapter
                AND s.versionVerse = res.versionVerse
        `
            .execute(this.db)
            .then(({ rows }) => this.processSearchResults(rows, queryMode, queryTermsNormalized));
    }

    private processSearchResults(
        rows: Array<{
            verse: string;
            versionUid: string;
            versionBook: number;
            versionChapter: number;
            versionVerse: number;
        }>,
        queryMode: string,
        queryTermsNormalized: string[]
    ): IBibleSearchResult[] {
        return rows.map((result) => ({
            versionUid: result.versionUid,
            versionBook: result.versionBook,
            versionChapter: result.versionChapter,
            versionVerse: result.versionVerse,
            // enclose words that start with terms in `queryTermsNormalized` in <b> tags
            content: result.verse.replace(
                new RegExp(
                    queryMode === 'fuzzy'
                        ? `(${queryTermsNormalized
                              // allow any non-word char between words in a term and any
                              // word char after the term
                              .map((term) => term.replace(/ /gi, '[^\\w]+') + '\\w*')
                              .join('|')})`
                        : `(${
                              queryTermsNormalized
                                  // allow any non-word char between words in a term (this is
                                  // necessary here if the user encloses the term in quotes
                                  // while using exact search)
                                  .map((term) => term.replace(/ /gi, '[^\\w]+'))
                                  // allow any non-word char between words in a query
                                  .join('[^\\w]+') + '\\w*'
                          })`,
                    'gi'
                ),
                '<b>$1</b>'
            ),
        }));
    }

    async updateBook(
        book: IBibleBookEntity,
        updates: Partial<IBibleBookEntity>,
        tx?: Transaction<DB>
    ) {
        const db = tx || this.db;

        await db
            .updateTable('bible_book')
            .set(prepareBookForDatabase(updates))
            .where('versionId', '=', book.versionId)
            .where('osisId', '=', book.osisId)
            .execute();
        return { ...book, ...updates };
    }

    private async addBibleBookContent({
        db,
        contents,
        version,
        book,
        context,
        globalState = {
            phraseStack: [],
            paragraphStack: [],
            sectionStack: [],
            noteStack: [],
            crossRefStack: [],
            usedRefIds: new Set(),
            currentPhraseNum: 0,
            currentVersionChapter: 0,
            currentVersionVerse: 0,
        },
        localState = {
            modifierState: { quoteLevel: 0, indentLevel: 0 },
            columnModifierState: {},
            sectionLevel: 0,
            recursionLevel: 0,
        },
        inputHasNormalizedNumbering = false,
        skip = {},
        ignoreSectionsWithoutTitle = false,
    }: {
        db: Kysely<DB> | Transaction<DB>;
        contents: IBibleContent[];
        version: IBibleVersionEntity;
        book: IBibleBookEntity;
        context: BibleBookPlaintext;
        globalState?: {
            phraseStack: Insertable<BiblePhrase>[];
            paragraphStack: Insertable<BibleParagraph>[];
            sectionStack: {
                section: Insertable<BibleSection>;
                crossReferences?: IBibleCrossReference[];
            }[];
            noteStack: Insertable<BibleNote>[];
            crossRefStack: Insertable<BibleCrossReference>[];
            usedRefIds: Set<number>;
            currentVersionChapter: number;
            currentVersionVerse: number;
            currentVersionSubverse?: number;
            currentJoinToVersionRefId?: number;
            currentPhraseNum: number;
            currentNormalizedReference?: IBibleReferenceNormalized;
            currentSourceTypeId?: number;
            currentJoinToRefId?: number;
            isWithinParagraph?: boolean;
        };
        localState?: {
            modifierState: PhraseModifiers;
            columnModifierState: { quoteWho?: string; person?: string };
            sectionLevel: number;
            recursionLevel: number;
        };
        inputHasNormalizedNumbering?: boolean;
        skip?: {
            crossRefs?: boolean;
            notes?: boolean;
            strongs?: boolean;
        };
        ignoreSectionsWithoutTitle?: boolean;
    }): Promise<{ firstPhraseId: number | undefined; lastPhraseId: number | undefined }> {
        if (BibleEngine.DEBUG && localState.recursionLevel === 0) console.time('db_prepare');
        const skipStrongs = skip.strongs || version.hasStrongs === false;
        let firstPhraseId: number | undefined, lastPhraseId: number | undefined;
        let lastContent: IBibleContent | undefined;
        for (const content of contents) {
            let versionNumberingChange = false;
            let phraseMergedWithLast = false;
            let emptyAddedPhraseId: number | undefined;

            if (content.type !== 'section' && content.numbering) {
                versionNumberingChange = true;
                // input uses numbering objects on number change
                if (content.numbering.versionChapterIsStartingInRange) {
                    globalState.currentVersionChapter =
                        content.numbering.versionChapterIsStartingInRange;
                    // in verses where we have subverse zero, `versionVerseIsStarting` is only set
                    // on subverse 1. for the purpose of saving to db, we need to set the version
                    // verse number on subverse 0 as well
                    globalState.currentVersionVerse = 1;
                }
                if (content.numbering.versionVerseIsStarting)
                    globalState.currentVersionVerse = content.numbering.versionVerseIsStarting;
                if (typeof content.numbering.versionSubverseIsStarting !== 'undefined')
                    globalState.currentVersionSubverse =
                        content.numbering.versionSubverseIsStarting;
                globalState.currentJoinToVersionRefId = content.numbering.joinToVersionRefId;
            } else if (
                (content.type === 'phrase' || !content.type) &&
                content.versionChapterNum &&
                content.versionVerseNum &&
                (!globalState.currentNormalizedReference ||
                    content.versionChapterNum !== globalState.currentVersionChapter ||
                    content.versionVerseNum !== globalState.currentVersionVerse ||
                    content.versionSubverseNum !== globalState.currentVersionSubverse)
            ) {
                // input uses numbering on each phrase
                versionNumberingChange = true;
                globalState.currentVersionChapter = content.versionChapterNum;
                globalState.currentVersionVerse = content.versionVerseNum;
                globalState.currentVersionSubverse = content.versionSubverseNum;
                globalState.currentJoinToVersionRefId = content.joinToVersionRefId;
            }

            // if the input uses the `numbering` object, most of the phrases won't have the
            // object, however there always needs to be one existing at a higher point in
            // the input hierarchy
            if (
                (content.type === 'phrase' || !content.type) &&
                !globalState.currentVersionChapter
            ) {
                throw new Error(`missing reference information in input`);
            }

            if (versionNumberingChange) {
                // numbers can't change on a section content, however we need to make this explicit
                // here so that TypeScript has the correct type
                if (content.type === 'section')
                    throw new Error(`invalid numbering change on section content`);

                // does this content start a new (sub-)verse? if yes, we need to look for v11n-rules
                // and determine the normalized numbering. if needed we also need to create empty
                // verses (if a verse of the standard version does not exist in our source version
                // or when one source verse is a verse range in the standard version)
                // also: this updates all the current* attributes on the state object

                globalState.currentJoinToRefId = undefined;
                globalState.currentSourceTypeId = undefined;
                // currentPhraseNum will be dealt with on the basis of the normalized numbers

                let nRef: IBibleReferenceNormalized | undefined;

                if (inputHasNormalizedNumbering) {
                    if (
                        (content.type === 'phrase' || !content.type) &&
                        content.normalizedReference
                    ) {
                        // input uses the normalizedReference object on each phrase
                        nRef = {
                            ...content.normalizedReference,
                            bookOsisId: book.osisId,
                            isNormalized: true,
                        };
                    } else {
                        // input uses numbering objects on number change
                        nRef = globalState.currentNormalizedReference
                            ? { ...globalState.currentNormalizedReference }
                            : {
                                  bookOsisId: book.osisId,
                                  isNormalized: true,
                              };
                        if (
                            content.numbering &&
                            content.numbering.normalizedChapterIsStartingInRange
                        )
                            nRef.normalizedChapterNum =
                                content.numbering.normalizedChapterIsStartingInRange;
                        if (content.numbering && content.numbering.normalizedVerseIsStarting)
                            nRef.normalizedVerseNum = content.numbering.normalizedVerseIsStarting;
                        if (
                            content.numbering &&
                            typeof content.numbering.normalizedSubverseIsStarting !== 'undefined'
                        )
                            nRef.normalizedSubverseNum =
                                content.numbering.normalizedSubverseIsStarting;
                    }
                } else {
                    const reference = {
                        versionId: book.versionId,
                        bookOsisId: book.osisId,
                        versionChapterNum: globalState.currentVersionChapter,
                        versionVerseNum: globalState.currentVersionVerse,
                        versionSubverseNum: globalState.currentVersionSubverse,
                    };
                    let firstStandardRefId: number | undefined;
                    const normalisationRules = await this.getNormalisationRulesForRange(reference);

                    for (const rule of normalisationRules) {
                        if (!rule.tests || !isTestMatching(rule.tests, context)) continue;

                        // if the rule is matching we know the sourceType of the phrase. we save
                        // this with the phrase so that later we can just query for the
                        // sourceType without running the tests (which need context) - also,
                        // phrases that don't have a sourceType then don't have related rules,
                        // saving us the effort to look for rules in the first place
                        // (Note: for rules with the action "Keep verse" assigning this property
                        //        will be the only action taken)
                        globalState.currentSourceTypeId = rule.sourceTypeId;

                        // we need this for both the empty and merge rules
                        const emptyPhraseReference: Required<IBiblePhraseRef> = {
                            isNormalized: true,
                            bookOsisId: rule.standardRef.bookOsisId,
                            versionId: reference.versionId,
                            normalizedChapterNum: rule.standardRef.normalizedChapterNum!,
                            normalizedVerseNum: rule.standardRef.normalizedVerseNum!,
                            normalizedSubverseNum: rule.standardRef.normalizedSubverseNum!,
                            phraseNum: 0,
                        };
                        emptyAddedPhraseId = generatePhraseId(emptyPhraseReference);

                        if (rule.action === 'Empty verse') {
                            // since this phrase does not relate to any verse in the
                            // source version, we set the versionNumbers to the standardRef
                            const emptyPhrase = {
                                content: '',
                                versionChapterNum: rule.standardRef.normalizedChapterNum!,
                                versionVerseNum: rule.standardRef.normalizedVerseNum!,
                                versionSubverseNum: rule.standardRef.normalizedSubverseNum,
                            };

                            globalState.phraseStack.push(
                                preparePhraseForDatabase(emptyPhrase, emptyPhraseReference, {
                                    ...localState.modifierState,
                                })
                            );
                            if (
                                (firstPhraseId && emptyAddedPhraseId < firstPhraseId) ||
                                (lastPhraseId && emptyAddedPhraseId < lastPhraseId)
                            )
                                console.log(
                                    `shuffled phraseId ${emptyAddedPhraseId}: ${firstPhraseId}(first) ${lastPhraseId}(last)`
                                );
                            if (!firstPhraseId) firstPhraseId = emptyAddedPhraseId;
                            lastPhraseId = emptyAddedPhraseId;
                        } else if (rule.action === 'Renumber verse') {
                            // only the first standardRef is relevant for creating the
                            // normalized reference for this phrase. Additional refs occur when
                            // the sourceRef generates a range. we create an empty phrase for
                            // each of them and keep track of last ref of the range to link the
                            // content-phrase to it later
                            if (firstStandardRefId && firstStandardRefId !== rule.standardRefId) {
                                throw new Error(
                                    `v11n: contradictory standardRefId ${rule.standardRefId} (by rule ${rule.id}) to previous ${firstStandardRefId}`
                                );
                            }

                            nRef = rule.standardRef;
                            firstStandardRefId = rule.standardRefId;
                        } else if (rule.action === 'Merged verse') {
                            if (!firstStandardRefId)
                                throw new Error(
                                    `v11n: trying to continue a range that wasn't started`
                                );

                            const emptyPhrase: IBiblePhraseWithNumbers = {
                                content: '',
                                versionChapterNum: globalState.currentVersionChapter,
                                versionVerseNum: globalState.currentVersionVerse,
                                versionSubverseNum: globalState.currentVersionSubverse,
                                // we link the empty phrases to the first standardRef
                                joinToRefId: firstStandardRefId,
                            };

                            globalState.phraseStack.push(
                                preparePhraseForDatabase(
                                    emptyPhrase,
                                    // this is set to the standardRef of the current rule
                                    // above
                                    emptyPhraseReference,
                                    { ...localState.modifierState }
                                )
                            );
                            if (
                                (firstPhraseId && emptyAddedPhraseId < firstPhraseId) ||
                                (lastPhraseId && emptyAddedPhraseId < lastPhraseId)
                            )
                                console.log(
                                    `shuffled phraseId ${emptyAddedPhraseId}: ${firstPhraseId}(first) ${lastPhraseId}(last)`
                                );

                            if (!firstPhraseId) firstPhraseId = emptyAddedPhraseId;
                            lastPhraseId = emptyAddedPhraseId;

                            // the last standardRefId in this range needs to be linked on the
                            // starting verse of the range
                            if (
                                !globalState.currentJoinToRefId ||
                                globalState.currentJoinToRefId < rule.standardRefId
                            )
                                globalState.currentJoinToRefId = rule.standardRefId;
                        } else if (rule.action === 'Keep verse') {
                            firstStandardRefId = rule.standardRefId;
                        }
                    }

                    // no rule updpated the numbering
                    if (!nRef) nRef = generateNormalizedRangeFromVersionRange(reference);
                }

                if (
                    globalState.currentNormalizedReference &&
                    nRef.normalizedChapterNum ===
                        globalState.currentNormalizedReference.normalizedChapterNum &&
                    nRef.normalizedVerseNum ===
                        globalState.currentNormalizedReference.normalizedVerseNum &&
                    nRef.normalizedSubverseNum ===
                        globalState.currentNormalizedReference.normalizedSubverseNum
                ) {
                    globalState.currentPhraseNum++;
                } else {
                    const newRefId = generateReferenceId(nRef);
                    if (globalState.usedRefIds.has(newRefId)) {
                        throw new Error(
                            `normalization caused the duplicate reference ${newRefId} - this ` +
                                `is caused by inconsistencies in the v11n rules and would ` +
                                `cause the reference to be overwritten`
                        );
                    }

                    globalState.usedRefIds.add(newRefId);
                    globalState.currentPhraseNum = 1;
                    globalState.currentNormalizedReference = nRef;
                }
                // end new version verse handling
            } else {
                // check if the last and this content item are both phrases that are only
                // distinguished by strongs - in case we don't want strongs, we merge them
                if (
                    lastContent &&
                    (lastContent.type === 'phrase' || !lastContent.type) &&
                    (!lastContent.strongs || skipStrongs) &&
                    (!lastContent.crossReferences || skip.crossRefs) &&
                    (!lastContent.notes || skip.notes) &&
                    !lastContent.linebreak &&
                    !lastContent.person &&
                    !lastContent.quoteWho &&
                    (content.type === 'phrase' || !content.type) &&
                    (!content.strongs || skipStrongs) &&
                    (!content.crossReferences || skip.crossRefs) &&
                    (!content.notes || skip.notes) &&
                    !content.linebreak &&
                    !content.person &&
                    !content.quoteWho
                ) {
                    const lastPhrase = globalState.phraseStack[globalState.phraseStack.length - 1];
                    if (!lastPhrase)
                        throw new Error(
                            `missing last phrase when parsing ${book.osisId} ${content.versionChapterNum}:${content.versionVerseNum}`
                        );
                    if (lastPhrase.skipSpace === 'both') lastPhrase.skipSpace = 'before';
                    else if (lastPhrase.skipSpace === 'after') lastPhrase.skipSpace = undefined;
                    else if (content.skipSpace === 'before' || content.skipSpace === 'both') {
                    } else lastPhrase.content += ' ';

                    lastPhrase.content += content.content;

                    if (content.skipSpace === 'after' || content.skipSpace === 'both')
                        lastPhrase.skipSpace = 'after';
                    phraseMergedWithLast = true;
                } else globalState.currentPhraseNum++;
            }

            if ((content.type === 'phrase' || !content.type) && !phraseMergedWithLast) {
                if (
                    !globalState.currentNormalizedReference ||
                    !globalState.currentNormalizedReference.normalizedChapterNum ||
                    !globalState.currentNormalizedReference.normalizedVerseNum ||
                    typeof globalState.currentNormalizedReference.normalizedSubverseNum ===
                        'undefined'
                )
                    throw new Error(`can't add phrases: normalisation failed`);

                if (!globalState.isWithinParagraph && !version.isPlaintext)
                    throw new Error(
                        `can't add phrase "${content.content}" (${book.osisId} ${content.versionChapterNum}:${content.versionVerseNum}): not within a paragraph`
                    );

                // we are using a phraseStack to improve performance when adding to the database
                const phraseRef: Required<IBiblePhraseRef> = {
                    isNormalized: true,
                    bookOsisId: book.osisId,
                    normalizedChapterNum:
                        globalState.currentNormalizedReference.normalizedChapterNum,
                    normalizedVerseNum: globalState.currentNormalizedReference.normalizedVerseNum,
                    normalizedSubverseNum:
                        globalState.currentNormalizedReference.normalizedSubverseNum,
                    versionId: book.versionId,
                    phraseNum: globalState.currentPhraseNum,
                };
                const phraseId = generatePhraseId(phraseRef);
                if (
                    (firstPhraseId && phraseId < firstPhraseId) ||
                    (lastPhraseId && phraseId < lastPhraseId && !globalState.currentJoinToRefId)
                )
                    console.log(
                        `shuffled phraseId ${phraseId} (${emptyAddedPhraseId}): ${firstPhraseId}(first) ${lastPhraseId}(last)`
                    );

                if (!firstPhraseId) firstPhraseId = phraseId;
                lastPhraseId = phraseId;

                if (!content.quoteWho && localState.columnModifierState.quoteWho)
                    content.quoteWho = localState.columnModifierState.quoteWho;
                if (!content.person && localState.columnModifierState.person)
                    content.person = localState.columnModifierState.person;
                if (!content.joinToRefId && globalState.currentJoinToRefId)
                    content.joinToRefId = globalState.currentJoinToRefId;
                if (!content.sourceTypeId && globalState.currentSourceTypeId !== undefined)
                    content.sourceTypeId = globalState.currentSourceTypeId;

                // check if input content uses numbering object (i.e. does not have version numbers)
                if (!content.versionChapterNum) {
                    content.versionChapterNum = globalState.currentVersionChapter;
                    content.versionVerseNum = globalState.currentVersionVerse;
                    content.versionSubverseNum = globalState.currentVersionSubverse;
                    content.joinToVersionRefId = globalState.currentJoinToVersionRefId;
                }

                if (content.notes && !skip.notes) {
                    for (const note of content.notes) {
                        globalState.noteStack.push(
                            prepareNoteForDatabase(
                                {
                                    ...note,
                                    content: {
                                        type: 'root',
                                        contents: normalizeDocumentContents(note.content.contents),
                                    },
                                },
                                phraseId
                            )
                        );
                    }
                }
                if (content.crossReferences && !skip.crossRefs) {
                    for (const crossRef of content.crossReferences) {
                        if (!crossRef.range.versionId) crossRef.range.versionId = book.versionId;
                        globalState.crossRefStack.push(
                            prepareCrossReferenceForDatabase(crossRef, { phraseId })
                        );
                    }
                }
                if (content.strongs && skipStrongs) delete content.strongs;

                globalState.phraseStack.push(
                    preparePhraseForDatabase(content, phraseRef, {
                        ...localState.modifierState,
                    })
                );
            } else if (content.type === 'group' && content.groupType !== 'paragraph') {
                const childState = {
                    modifierState: { ...localState.modifierState },
                    columnModifierState: { ...localState.columnModifierState },
                    sectionLevel: localState.sectionLevel,
                    recursionLevel: localState.recursionLevel + 1,
                };

                if (content.groupType === 'quote') {
                    if (!childState.modifierState.quoteLevel)
                        childState.modifierState.quoteLevel = 0;
                    childState.modifierState.quoteLevel++;
                    childState.columnModifierState.quoteWho = (content as IBibleContentGroup<'quote'>).modifier;
                } else if (content.groupType === 'indent') {
                    if (!childState.modifierState.indentLevel)
                        childState.modifierState.indentLevel = 0;
                    childState.modifierState.indentLevel++;
                } else if (content.groupType === 'bold') childState.modifierState.bold = true;
                else if (content.groupType === 'divineName')
                    childState.modifierState.divineName = true;
                else if (content.groupType === 'emphasis') childState.modifierState.emphasis = true;
                else if (content.groupType === 'italic') childState.modifierState.italic = true;
                else if (content.groupType === 'title')
                    childState.modifierState.title = (<IBibleContentGroup<'title'>>(
                        content
                    )).modifier = content.modifier === 'pullout' ? 'pullout' : 'inline';
                else if (content.groupType === 'lineGroup')
                    childState.modifierState.lineGroup = true;
                else if (content.groupType === 'sela') childState.modifierState.sela = true;
                else if (content.groupType === 'line')
                    childState.modifierState.line = (content as IBibleContentGroup<'line'>).modifier;
                else if (content.groupType === 'link')
                    childState.modifierState.link = (content as IBibleContentGroup<'link'>).modifier;
                else if (content.groupType === 'translationChange')
                    childState.modifierState.translationChange = (content as IBibleContentGroup<'translationChange'>).modifier;
                else if (content.groupType === 'person')
                    childState.columnModifierState.person = (content as IBibleContentGroup<'person'>).modifier;
                else if (content.groupType === 'orderedListItem')
                    childState.modifierState.orderedListItem = (content as IBibleContentGroup<'orderedListItem'>).modifier;
                else if (content.groupType === 'unorderedListItem')
                    childState.modifierState.unorderedListItem = (content as IBibleContentGroup<'unorderedListItem'>).modifier;
                const {
                    firstPhraseId: groupFirstPhraseId,
                    lastPhraseId: groupLastPhraseId,
                } = await this.addBibleBookContent({
                    db,
                    contents: content.contents,
                    version,
                    book,
                    context,
                    globalState,
                    localState: childState,
                    inputHasNormalizedNumbering,
                    skip,
                    ignoreSectionsWithoutTitle,
                });
                if (
                    (firstPhraseId && groupFirstPhraseId && groupFirstPhraseId < firstPhraseId) ||
                    (lastPhraseId && groupLastPhraseId && groupLastPhraseId < lastPhraseId)
                )
                    console.log(
                        `shuffled phraseId ${groupFirstPhraseId}-${groupLastPhraseId}: ${firstPhraseId}(first) ${lastPhraseId}(last)`
                    );

                if (groupFirstPhraseId && !firstPhraseId) firstPhraseId = groupFirstPhraseId;
                if (groupLastPhraseId) lastPhraseId = groupLastPhraseId;

                // if we have multiple groups of the same level after each other, we won't be able
                // to persist this information (due to the way the schema works). In this case we
                // add a linebreak to the last phrase, which is equivalent in effect.
                // RADAR: we add the linebreak to every indent group - this shouldn't be a problem,
                //        since an indent is a block group and a linebreak at the end of a block,
                //        shouldn't have an effect. If this causes a problem, we will need to
                //        implement some forward or backward looking magic, which is complex.
                if (
                    globalState.phraseStack.length &&
                    (content.groupType === 'indent' || content.groupType === 'lineGroup')
                ) {
                    const lastGroupPhrase =
                        globalState.phraseStack[globalState.phraseStack.length - 1];
                    lastGroupPhrase!.linebreak = 1;
                }
            } else if (
                (content.type === 'group' && content.groupType === 'paragraph') ||
                content.type === 'section'
            ) {
                const childState = {
                    modifierState: { ...localState.modifierState },
                    columnModifierState: { ...localState.columnModifierState },
                    sectionLevel:
                        content.type === 'section' && (content.title || !ignoreSectionsWithoutTitle)
                            ? localState.sectionLevel + 1
                            : localState.sectionLevel,
                    recursionLevel: localState.recursionLevel + 1,
                };

                if (content.type === 'group' && content.groupType === 'paragraph')
                    globalState.isWithinParagraph = true;

                let {
                    firstPhraseId: sectionFirstPhraseId,
                    lastPhraseId: sectionLastPhraseId,
                } = await this.addBibleBookContent({
                    db,
                    contents: content.contents,
                    version,
                    book,
                    context,
                    globalState,
                    localState: childState,
                    inputHasNormalizedNumbering,
                    skip,
                    ignoreSectionsWithoutTitle,
                });

                if (content.type === 'group' && content.groupType === 'paragraph')
                    globalState.isWithinParagraph = false;

                if (sectionFirstPhraseId && sectionLastPhraseId) {
                    if (content.type === 'group' && content.groupType === 'paragraph') {
                        globalState.paragraphStack.push({
                            versionId: book.versionId,
                            phraseStartId: sectionFirstPhraseId,
                            phraseEndId: sectionLastPhraseId,
                        });
                    } else if (
                        content.type === 'section' &&
                        (content.title || !ignoreSectionsWithoutTitle)
                    ) {
                        globalState.sectionStack.push({
                            section: prepareSectionForDatabase({
                                versionId: book.versionId,
                                phraseStartId: sectionFirstPhraseId,
                                phraseEndId: sectionLastPhraseId,
                                level: localState.sectionLevel,
                                title: content.title,
                                subTitle: content.subTitle,
                                description: content.description
                                    ? {
                                          type: 'root',
                                          contents: normalizeDocumentContents(
                                              content.description.contents
                                          ),
                                      }
                                    : undefined,
                                isChapterLabel: content.isChapterLabel,
                            }),
                            crossReferences:
                                content.crossReferences && !skip.crossRefs
                                    ? content.crossReferences.map((crossRef) => ({
                                          ...crossRef,
                                          range: {
                                              ...crossRef.range,
                                              versionId: book.versionId,
                                          },
                                      }))
                                    : undefined,
                        });
                    }

                    if (
                        (firstPhraseId && sectionFirstPhraseId < firstPhraseId) ||
                        (lastPhraseId && sectionLastPhraseId < lastPhraseId)
                    )
                        console.log(
                            `shuffled phraseId ${sectionFirstPhraseId}-${sectionLastPhraseId}: ${firstPhraseId}(first) ${lastPhraseId}(last)`
                        );

                    if (!firstPhraseId) firstPhraseId = sectionFirstPhraseId;
                    lastPhraseId = sectionLastPhraseId;
                }
            }

            lastContent = content;
        }

        if (localState.recursionLevel === 0) {
            if (BibleEngine.DEBUG) console.timeEnd('db_prepare');
            if (BibleEngine.DEBUG) console.time('db_set');
            // we are at the end of the root method => persist everything

            const sqlSet: { statement: string; values: readonly unknown[] }[] = [];
            const chunkSize = 100;
            for (let index = 0; index < globalState.phraseStack.length; index += chunkSize) {
                const insert = db
                    .insertInto('bible_phrase')
                    .values(globalState.phraseStack.slice(index, index + chunkSize));

                if (this.executeSqlSetOverride) {
                    const compiled = insert.compile();
                    sqlSet.push({ statement: compiled.sql, values: compiled.parameters });
                } else {
                    await insert.execute();
                }
            }

            for (let index = 0; index < globalState.noteStack.length; index += chunkSize) {
                const insert = db
                    .insertInto('bible_note')
                    .values(globalState.noteStack.slice(index, index + chunkSize));

                if (this.executeSqlSetOverride) {
                    const compiled = insert.compile();
                    sqlSet.push({ statement: compiled.sql, values: compiled.parameters });
                } else {
                    await insert.execute();
                }
            }

            for (let index = 0; index < globalState.paragraphStack.length; index += chunkSize) {
                const insert = db
                    .insertInto('bible_paragraph')
                    .values(globalState.paragraphStack.slice(index, index + chunkSize));

                if (this.executeSqlSetOverride) {
                    const compiled = insert.compile();
                    sqlSet.push({ statement: compiled.sql, values: compiled.parameters });
                } else {
                    await insert.execute();
                }
            }

            // since saving entities with a relation is a costly operation, we do it in a second step
            const sectionsWithoutCrossRefs = globalState.sectionStack.filter(
                (section) => !section.crossReferences?.length
            );
            for (let index = 0; index < sectionsWithoutCrossRefs.length; index += chunkSize) {
                const insert = db
                    .insertInto('bible_section')
                    .values(
                        sectionsWithoutCrossRefs
                            .slice(index, index + chunkSize)
                            .map(({ section }) => section)
                    );

                if (this.executeSqlSetOverride) {
                    const compiled = insert.compile();
                    sqlSet.push({ statement: compiled.sql, values: compiled.parameters });
                } else {
                    await insert.execute();
                }
            }

            // Handle sections with cross references one by one to get proper insert IDs
            const sectionsWithCrossRefs = globalState.sectionStack.filter(
                (section) => !!section.crossReferences?.length
            );

            for (const section of sectionsWithCrossRefs) {
                const result = await db
                    .insertInto('bible_section')
                    .values(section.section)
                    .executeTakeFirstOrThrow();

                if (section.crossReferences) {
                    const crossRefs = section.crossReferences.map((crossRef) =>
                        prepareCrossReferenceForDatabase(crossRef, {
                            sectionId: Number(result.insertId),
                        })
                    );
                    globalState.crossRefStack.push(...crossRefs);
                }
            }

            // Insert cross references in batches
            for (let index = 0; index < globalState.crossRefStack.length; index += chunkSize) {
                const insert = db
                    .insertInto('bible_cross_reference')
                    .values(globalState.crossRefStack.slice(index, index + chunkSize));

                if (this.executeSqlSetOverride) {
                    const compiled = insert.compile();
                    sqlSet.push({ statement: compiled.sql, values: compiled.parameters });
                } else {
                    await insert.execute();
                }
            }

            // set up search index
            if (this.fts) {
                const values: Array<[string, string, number, number, number]> = [];
                context.forEach((verses, chapter) => {
                    verses.forEach((subverses, verse) => {
                        const verseText = subverses.join(' ').trim();
                        if (this.dbType === 'sqlite' && this.executeSqlSetOverride) {
                            sqlSet.push({
                                statement: 'INSERT INTO bible_search VALUES (?, ?, ?, ?, ?)',
                                values: [verseText, version.uid, book.number, chapter, verse],
                            });
                        } else if (this.dbType === 'mysql') {
                            values.push([verseText, version.uid, book.number, chapter, verse]);
                        }
                    });
                });
                if (this.dbType === 'mysql') {
                    await sql<void>`
                        INSERT INTO bible_search${sql.raw(
                            isCjkLanguage(version.language) ? '_cjk' : ''
                        )}
                        VALUES ${sql.join(values.map((row) => sql`(${sql.join(row)})`))}
                    `.execute(db);
                }
            }

            if (BibleEngine.DEBUG) console.timeEnd('db_set');

            if (BibleEngine.DEBUG) console.time('db_write');

            if (this.executeSqlSetOverride) await this.executeSqlSetOverride(sqlSet);
            if (BibleEngine.DEBUG) console.timeEnd('db_write');
        }

        return { firstPhraseId, lastPhraseId };
    }

    private async getNormalizedReferenceRange(
        inputRange: IBibleReferenceRangeVersion,
        book?: { chaptersCount: IBibleBookEntity['chaptersCount'] } | null
    ): Promise<IBibleReferenceRangeNormalized> {
        if (isReferenceNormalized(inputRange)) return { ...inputRange, isNormalized: true };

        // no mutation
        const range = { ...inputRange };

        if (!range.versionId && range.versionUid) {
            const version = await this.db
                .selectFrom('bible_version')
                .select(['id'])
                .where('uid', '=', range.versionUid)
                .executeTakeFirst();
            if (version) range.versionId = version.id;
        }

        // if reference has no data that can cause normalisation changes, return the reference
        // (-range) right away
        if (!range.versionId || !range.versionChapterNum)
            return generateNormalizedRangeFromVersionRange(range);

        if (!range.versionVerseNum || range.versionChapterEndNum) {
            if (!book) {
                book = await this.db
                    .selectFrom('bible_book')
                    .where('versionId', '=', range.versionId)
                    .where('osisId', '=', range.bookOsisId)
                    .select(['chaptersCount'])
                    .executeTakeFirst()
                    .then((book) =>
                        book
                            ? {
                                  chaptersCount: book.chaptersCount.split(',').map((n) => +n),
                              }
                            : null
                    );
            }
            if (!book)
                throw new Error(
                    `missing book data for ${range.bookOsisId} during reference normalization`
                );

            if (range.versionChapterEndNum && !book.chaptersCount[range.versionChapterEndNum - 1]) {
                range.versionChapterEndNum = book.chaptersCount.length;
                if (range.versionVerseEndNum)
                    range.versionVerseEndNum = book.chaptersCount[range.versionChapterEndNum - 1];
            }
            if (!range.versionVerseNum) {
                range.versionVerseNum = 1;
                range.versionVerseEndNum = range.versionChapterEndNum
                    ? book.chaptersCount[range.versionChapterEndNum - 1]
                    : book.chaptersCount[range.versionChapterNum - 1];
            }
        }

        const rules = await this.getNormalisationRulesForRange(range);

        // there are no rules for this reference(-range) than can cause normalisation changes
        if (!rules.length) return generateNormalizedRangeFromVersionRange(range);

        // now we need to determine the normalized range that the given version range could
        // potentially end up in - thus we can narrow down the phrases we need to look at
        let standardRefStart: IBibleReferenceNormalized = generateNormalizedRangeFromVersionRange(
            range
        );
        let standardRefEnd: IBibleReferenceNormalized = generateEndReferenceFromRange(
            generateNormalizedRangeFromVersionRange(range)
        );
        let standardRefIdStart: number = generateReferenceId(standardRefStart);
        let standardRefIdEnd: number = generateReferenceId(standardRefEnd);
        for (const rule of rules) {
            if (standardRefIdStart > rule.standardRefId) {
                standardRefIdStart = rule.standardRefId;
                standardRefStart = rule.standardRef;
            }
            if (standardRefIdEnd < rule.standardRefId) {
                standardRefIdEnd = rule.standardRefId;
                standardRefEnd = rule.standardRef;
            }
        }
        const potentialNormalizedRange: IBibleReferenceRangeNormalized = {
            isNormalized: true,
            versionId: range.versionId,
            bookOsisId: range.bookOsisId,
            normalizedChapterNum: standardRefStart.normalizedChapterNum,
            normalizedVerseNum: standardRefStart.normalizedVerseNum,
            normalizedSubverseNum: standardRefStart.normalizedSubverseNum ?? 0,
            normalizedChapterEndNum: standardRefEnd.normalizedChapterNum,
            normalizedVerseEndNum: standardRefEnd.normalizedVerseNum,
            normalizedSubverseEndNum: standardRefEnd.normalizedSubverseNum ?? MAX_SUBVERSE_NUMBER,
        };

        const phraseIdStart = await this.db
            .selectFrom('bible_phrase as phrase')
            .select(sql<number>`MIN(phrase.id)`.as('phraseIdStart'))
            .where(
                sql<boolean>`
                ${generatePhraseIdSql(potentialNormalizedRange, 'phrase')}
                AND phrase.versionChapterNum = ${range.versionChapterNum}
                ${
                    range.versionVerseNum
                        ? sql`AND phrase.versionVerseNum = ${range.versionVerseNum}`
                        : sql``
                }
            `
            )
            .executeTakeFirst()
            .then((result) => result?.phraseIdStart);

        if (!phraseIdStart)
            throw new Error(
                `can't get normalized reference start for ${inputRange.versionUid} ${inputRange.versionId} ${inputRange.bookOsisId} ${inputRange.versionChapterNum}:${inputRange.versionVerseNum}-${inputRange.versionChapterEndNum}:${inputRange.versionVerseEndNum} - version data missing`
            );
        const phraseStart = parsePhraseId(phraseIdStart);

        const normRange: IBibleReferenceRangeNormalized = {
            ...range,
            isNormalized: true,
            normalizedChapterNum: phraseStart.normalizedChapterNum,
            normalizedVerseNum: phraseStart.normalizedVerseNum,
            normalizedSubverseNum: phraseStart.normalizedSubverseNum ?? undefined,
        };

        // since verse might span multiple subverses we need to make a second request to get determine phraseIdEnd
        // (we previously only did this when range.versionVerseEndNum was set)
        const phraseIdEnd = await this.db
            .selectFrom('bible_phrase as phrase')
            .select(sql<number>`MAX(phrase.id)`.as('phraseIdEnd'))
            .where(
                sql<boolean>`
                ${generatePhraseIdSql(potentialNormalizedRange, 'phrase')}
                AND phrase.versionChapterNum = ${
                    range.versionChapterEndNum || range.versionChapterNum
                }
                ${
                    range.versionVerseEndNum || range.versionVerseNum
                        ? sql`AND phrase.versionVerseNum = ${
                              range.versionVerseEndNum || range.versionVerseNum
                          }`
                        : sql``
                }
            `
            )
            .executeTakeFirst()
            .then((result) => result?.phraseIdEnd);

        if (!phraseIdEnd)
            throw new Error(
                `can't get normalized end reference for ${inputRange.versionUid} ${inputRange.versionId} ${inputRange.bookOsisId} ${inputRange.versionChapterNum}:${inputRange.versionVerseNum}-${inputRange.versionChapterEndNum}:${inputRange.versionVerseEndNum} - version data missing`
            );
        const phraseEnd = parsePhraseId(phraseIdEnd);

        if (phraseEnd.normalizedChapterNum !== normRange.normalizedChapterNum)
            normRange.normalizedChapterEndNum = phraseEnd.normalizedChapterNum;
        if (
            phraseEnd.normalizedChapterNum !== normRange.normalizedChapterNum ||
            phraseEnd.normalizedVerseNum !== normRange.normalizedVerseNum
        )
            normRange.normalizedVerseEndNum = phraseEnd.normalizedVerseNum;
        if (
            phraseEnd.normalizedChapterNum !== normRange.normalizedChapterNum ||
            phraseEnd.normalizedVerseNum !== normRange.normalizedVerseNum ||
            phraseEnd.normalizedSubverseNum !== normRange.normalizedSubverseNum
        )
            normRange.normalizedSubverseEndNum = phraseEnd.normalizedSubverseNum;

        return normRange;
    }

    private async getNormalisationRulesForRange(range: IBibleReferenceRangeVersion) {
        return this.db
            .selectFrom('v11n_rule')
            .selectAll()
            .where(
                sql<boolean>`${generateReferenceIdSql(
                    generateNormalizedRangeFromVersionRange(range),
                    'sourceRefId'
                )}`
            )
            .where('actionId', '=', 2)
            .orderBy('id')
            .execute()
            .then((rules) => rules.map((rule) => parseV11nRuleFromDatabase(rule)));
    }

    private async normalizeCrossReferencesForVersion(versionId: number) {
        // go through each bible book separately
        const books = await this.db
            .selectFrom('bible_book')
            .selectAll()
            .where('versionId', '=', versionId)
            .execute()
            .then((books) => books.map((book) => parseBookFromDatabase(book)));

        for (const book of books) {
            // fetch all cross references for that version and book
            const crossRefs = await this.db
                .selectFrom('bible_cross_reference')
                .selectAll()
                .where('versionId', '=', versionId)
                .where(
                    sql<boolean>`${generateReferenceIdSql(
                        { isNormalized: true, bookOsisId: book.osisId },
                        'normalizedRefId'
                    )}`
                )
                .execute()
                .then((crossRefs) =>
                    crossRefs.map((crossRef) => parseCrossReferenceFromDatabase(crossRef))
                );

            for (const cRef of crossRefs) {
                try {
                    // get normalized reference range
                    const normalizedRange = await this.getNormalizedReferenceRange(
                        {
                            versionId,
                            bookOsisId: book.osisId,
                            versionChapterNum: cRef.range.versionChapterNum,
                            versionVerseNum: cRef.range.versionVerseNum,
                            versionChapterEndNum: cRef.range.versionChapterEndNum,
                            versionVerseEndNum: cRef.range.versionVerseEndNum,
                        },
                        book
                    );

                    if (cRef.range.versionChapterNum)
                        cRef.range.normalizedChapterNum = normalizedRange.normalizedChapterNum;
                    if (cRef.range.versionVerseNum)
                        cRef.range.normalizedVerseNum = normalizedRange.normalizedVerseNum;
                    if (cRef.range.versionChapterEndNum)
                        cRef.range.normalizedChapterEndNum =
                            normalizedRange.normalizedChapterEndNum;
                    if (cRef.range.versionVerseEndNum)
                        cRef.range.normalizedVerseEndNum = normalizedRange.normalizedVerseEndNum;

                    // Update the cross reference with normalized values
                    await this.db
                        .updateTable('bible_cross_reference')
                        .set(
                            prepareCrossReferenceForDatabase(cRef, {
                                sectionId: cRef.sectionId,
                                phraseId: cRef.phraseId,
                            })
                        )
                        .where('id', '=', cRef.id)
                        .execute();
                } catch (e) {
                    // we can't avoid invalid cross references, either due to errors in the source file
                    // or due to ambiguities when parsing references from text.
                    // Since a reference that can't be normalized cannot be displayed, it's best to
                    // just delete it and log the error
                    console.error(
                        `removed cross reference ${cRef.normalizedRefId} for phrase|section ${cRef.phraseId}|${cRef.sectionId} since normalization failed`
                    );
                    await this.db
                        .deleteFrom('bible_cross_reference')
                        .where('id', '=', cRef.id)
                        .execute();
                }
            }
        }
    }
}
