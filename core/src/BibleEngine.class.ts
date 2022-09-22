import {
    Between,
    DatabaseType,
    DataSource,
    DataSourceOptions,
    EntityManager,
    FindOptionsWhere,
    Like,
    Raw,
} from 'typeorm';

import {
    BibleBookEntity,
    BibleCrossReferenceEntity,
    BibleNoteEntity,
    BibleParagraphEntity,
    BiblePhraseEntity,
    BibleSectionEntity,
    BibleVersionEntity,
    DictionaryEntryEntity,
    ENTITIES,
    V11nRuleEntity,
} from './entities';
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
} from './functions/content.functions';
import {
    generateEndReferenceFromRange,
    generateNormalizedRangeFromVersionRange,
    generatePhraseId,
    generateReferenceId,
    isReferenceNormalized,
    MAX_SUBVERSE_NUMBER,
    parsePhraseId,
} from './functions/reference.functions';
import {
    generateBookSectionsSql,
    generateParagraphSql,
    generatePhraseIdSql,
    generateReferenceIdSql,
} from './functions/sql.functions';
import { isTestMatching } from './functions/v11n.functions';
import mysqlMigrations from './migrations/mysql';
import postgresMigrations from './migrations/postgres';
import sqliteMigrations from './migrations/sqlite';
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
    IBibleVersion,
    IDictionaryEntry,
    PhraseModifiers,
} from './models';

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
    executeSqlSetOverride?: (set: { statement: string; values: any[] }[]) => Promise<any>;
}

export class BibleEngine {
    static DEBUG = false;
    dataSource: DataSource;
    executeSqlSetOverride?: BibleEngineOptions['executeSqlSetOverride'];
    pDB: Promise<EntityManager>;

    constructor(dbConfig: DataSourceOptions, options?: BibleEngineOptions) {
        if (options?.executeSqlSetOverride)
            this.executeSqlSetOverride = options.executeSqlSetOverride;
        if (options?.checkForExistingConnection) {
            this.pDB = this.findConnection(dbConfig);
            return;
        }
        this.pDB = this.createConnection(dbConfig);
    }

    async findConnection(dbConfig: DataSourceOptions) {
        if (this.dataSource) return this.dataSource.manager;
        else return this.createConnection(dbConfig);
    }

    async createConnection(dbConfig: DataSourceOptions) {
        this.dataSource = new DataSource({
            entities: ENTITIES,
            synchronize: false,
            logging: ['error'],
            migrations: this.getMigrations(dbConfig.type).migrations,
            migrationsRun: true,
            ...dbConfig,
        });
        await this.dataSource.initialize();
        return this.dataSource.manager;
    }

    getMigrations(type: DatabaseType): any {
        const SQLITE_TYPES: DatabaseType[] = [
            'better-sqlite3',
            'capacitor',
            'cordova',
            'expo',
            'react-native',
            'sqlite',
            'sqljs',
        ];
        if (SQLITE_TYPES.includes(type)) {
            return sqliteMigrations;
        } else if (type === 'postgres') {
            return postgresMigrations;
        } else if (type === 'mysql') {
            return mysqlMigrations;
        } else {
            throw new Error('Unsupported database type, cannot run migrations');
        }
    }

    async runMigrations() {
        const entityManager = await this.pDB;
        await entityManager.connection.runMigrations();
    }

    async addBook(book: IBibleBookEntity, entityManager?: EntityManager) {
        if (!entityManager) {
            if (!this.pDB) throw new NoDbConnectionError();
            entityManager = await this.pDB;
        }

        await entityManager
            .createQueryBuilder()
            .insert()
            .into(BibleBookEntity)
            .values(book)
            .execute();

        return book;
    }

    async addBookWithContent(
        version: BibleVersionEntity,
        bookInput: BookWithContentForInput,
        options: {
            entityManager?: EntityManager;
            skipCrossRefs?: boolean;
            skipNotes?: boolean;
            skipStrongs?: boolean;
        } = {}
    ) {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;

        let bookEntity: IBibleBookEntity | null = await db.findOne(BibleBookEntity, {
            where: { versionId: version.id, osisId: bookInput.book.osisId },
        });

        const inputHasNormalizedNumbering = bookInput.contentHasNormalizedNumbers || false;

        // if we have pre-generated normalized numbers as well as chapter counts we don't need to
        // generate the bible plaintext structure
        let textData: BibleBookPlaintext = new Map();
        let chaptersCount = bookInput.book.chaptersCount;
        if (!inputHasNormalizedNumbering || !chaptersCount || !chaptersCount.length) {
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

        if (options.entityManager) {
            // mark the book as importing (and save missing book meta-data)

            if (!bookEntity) {
                bookEntity = await this.addBook(
                    {
                        ...bookInput.book,
                        chaptersCount,
                        versionId: version.id,
                        dataLocation: 'importing',
                    },
                    options.entityManager
                );
            } else {
                bookEntity = await this.updateBook(
                    bookEntity,
                    { ...bookInput.book, dataLocation: 'importing' },
                    options.entityManager
                );
            }

            bookImportPhraseRange = await this.addBibleBookContent({
                entityManger: options.entityManager,
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
            });

            bookEntity = await this.updateBook(
                bookEntity,
                { dataLocation: 'db' },
                options.entityManager
            );
        } else {
            await db.transaction(async (transactionEntityManger) => {
                // mark the book as importing (and save missing book meta-data)

                if (!bookEntity) {
                    bookEntity = await this.addBook(
                        {
                            ...bookInput.book,
                            chaptersCount: chaptersCount!,
                            versionId: version.id,
                            dataLocation: 'importing',
                        },
                        transactionEntityManger
                    );
                } else {
                    bookEntity = await this.updateBook(
                        bookEntity,
                        { ...bookInput.book, dataLocation: 'importing' },
                        transactionEntityManger
                    );
                }

                bookImportPhraseRange = await this.addBibleBookContent({
                    entityManger: transactionEntityManger,
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
                });

                bookEntity = await this.updateBook(
                    bookEntity,
                    { dataLocation: 'db' },
                    transactionEntityManger
                );
            });
        }

        return bookImportPhraseRange;
    }

    async addDictionaryEntries(dictionaryEntries: IDictionaryEntry[]) {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        await db.save(DictionaryEntryEntity, dictionaryEntries, { chunk: 100 });
        if (
            this.dataSource.options.type === 'mysql' ||
            this.dataSource.options.type === 'mariadb'
        ) {
            // https://stackoverflow.com/questions/60059084/what-does-using-join-buffer-block-nested-loop-mean-with-explain-mysql-command
            // https://bugs.mysql.com/bug.php?id=69721
            await db.query('OPTIMIZE TABLE `dictionary_entry`');
        }
    }

    async addV11nRules(rules: V11nRuleEntity[]) {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        await db.save(rules, { chunk: 100 });
        if (
            this.dataSource.options.type === 'mysql' ||
            this.dataSource.options.type === 'mariadb'
        ) {
            // https://stackoverflow.com/questions/60059084/what-does-using-join-buffer-block-nested-loop-mean-with-explain-mysql-command
            // https://bugs.mysql.com/bug.php?id=69721
            await db.query('OPTIMIZE TABLE `v11n_rule`');
        }
        return;
    }

    async addVersion(version: IBibleVersion) {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        return db.save(new BibleVersionEntity(version));
    }

    async finalizeVersion(versionId: number) {
        await this.normalizeCrossReferencesForVersion(versionId);
        if (
            this.dataSource.options.type === 'mysql' ||
            this.dataSource.options.type === 'mariadb'
        ) {
            // https://stackoverflow.com/questions/60059084/what-does-using-join-buffer-block-nested-loop-mean-with-explain-mysql-command
            // https://bugs.mysql.com/bug.php?id=69721
            const db = await this.pDB;
            await db.query('OPTIMIZE TABLE `bible_book`');
            await db.query('OPTIMIZE TABLE `bible_cross_reference`');
            await db.query('OPTIMIZE TABLE `bible_note`');
            await db.query('OPTIMIZE TABLE `bible_paragraph`');
            await db.query('OPTIMIZE TABLE `bible_phrase`');
            await db.query('OPTIMIZE TABLE `bible_phrase_original_word`');
            await db.query('OPTIMIZE TABLE `bible_section`');
            await db.query('OPTIMIZE TABLE `bible_version`');
        }
        return;
    }

    async generateBookMetadata(book: BibleBookEntity) {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        const metaData = await db
            .createQueryBuilder(BiblePhraseEntity, 'phrase')
            .addSelect('COUNT(DISTINCT phrase.versionVerseNum)', 'numVerses')
            .where({
                id: Raw(() =>
                    generatePhraseIdSql({ isNormalized: true, bookOsisId: book.osisId }, 'phrase')
                ),
            })
            .orderBy('phrase.versionChapterNum')
            .groupBy('phrase.versionChapterNum')
            .getRawMany();
        book.chaptersCount = metaData.map((chapterMetaDb) => chapterMetaDb.numVerses);
        return db.save(book);
    }

    async getBookForVersionReference({ versionId, bookOsisId }: IBibleReferenceVersion) {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        return db.findOne(BibleBookEntity, {
            where: { osisId: bookOsisId, versionId },
        });
    }

    async getBooksForVersion(versionId: number) {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        return db.find(BibleBookEntity, {
            where: { versionId },
            order: { number: 'ASC' },
        });
    }

    async getBooksForVersionUid(versionUid: string) {
        const db = await this.pDB;
        const version = await db.findOne(BibleVersionEntity, {
            where: { uid: versionUid },
            select: ['id'],
        });
        if (!version) throw new Error(`missing version ${versionUid}`);
        return this.getBooksForVersion(version.id);
    }

    async getDictionaryEntries(strong: string, dictionary?: string) {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        return db.find(DictionaryEntryEntity, { where: { strong, dictionary } });
    }

    async getFullDataForReferenceRange(
        rangeQuery: IBibleReferenceRangeQuery,
        stripUnnecessaryData = false
    ): Promise<IBibleOutputRich> {
        const db = await this.pDB;
        const versionEntity = await db.findOne(BibleVersionEntity, {
            where: { uid: rangeQuery.versionUid },
        });

        if (!versionEntity) throw new BibleVersionInvalidError();
        if (versionEntity.dataLocation === 'remote') throw new BibleVersionRemoteOnlyError();

        const range = { ...rangeQuery, versionId: versionEntity.id };
        const bookEntity = await this.getBookForVersionReference(range);

        if (!bookEntity) throw new Error(`can't get formatted text: invalid book`);
        if (bookEntity.dataLocation === 'file') throw new BibleBookContentNotImportedError();
        if (bookEntity.dataLocation === 'importing') throw new BibleBookContentImportingError();

        const bookAbbreviations = await db
            .find(BibleBookEntity, {
                select: ['osisId', 'abbreviation'],
                where: { versionId: versionEntity.id },
            })
            .then((books) => {
                const dict: { [index: string]: string } = {};
                for (const _book of books) {
                    dict[_book.osisId] = _book.abbreviation;
                }
                return dict;
            });

        const rangeNormalized = isReferenceNormalized(range)
            ? <IBibleReferenceRangeNormalized>range
            : await this.getNormalizedReferenceRange(range, bookEntity);

        const phrases = await this.getPhrases(rangeNormalized, bookEntity);
        const paragraphs = await db
            .createQueryBuilder(BibleParagraphEntity, 'paragraph')
            .where(
                generateParagraphSql(
                    { ...rangeNormalized, versionId: rangeNormalized.versionId! },
                    'paragraph'
                )
            )
            .orderBy('id')
            .getMany();
        const sections = await db
            .createQueryBuilder(BibleSectionEntity, 'section')
            .select()
            .leftJoinAndSelect('section.crossReferences', 'crossReference')
            .where(generateBookSectionsSql(rangeNormalized, 'section'))
            .orderBy({ 'section.level': 'ASC', 'section.phraseStartId': 'ASC' })
            .getMany();

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
        reference: IBibleReferenceNormalized
    ): Promise<number> {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        const lastPhrase = await db.find(BiblePhraseEntity, {
            where: {
                id: Between(
                    generatePhraseId(reference),
                    generatePhraseId(generateEndReferenceFromRange(reference))
                ),
                versionId: reference.versionId,
            },
            order: { id: 'DESC' },
            take: 1,
            select: ['id'],
        });
        return lastPhrase.length ? parsePhraseId(lastPhrase[0]!.id).phraseNum! + 1 : 1;
    }

    async getPhrases(
        range: IBibleReferenceRangeNormalized | IBibleReferenceRangeVersion,
        book?: BibleBookEntity
    ) {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        const normalizedRange =
            range.isNormalized === true
                ? <IBibleReferenceRangeNormalized>range
                : await this.getNormalizedReferenceRange(range, book);
        const where: FindOptionsWhere<BiblePhraseEntity> = {
            id: Between(
                generatePhraseId(normalizedRange),
                generatePhraseId(generateEndReferenceFromRange(normalizedRange))
            ),
        };
        let order: any = { id: 'ASC' };
        if (normalizedRange.versionId) {
            where.versionId = normalizedRange.versionId;
            if (normalizedRange.versionChapterNum && normalizedRange.versionChapterEndNum)
                where.versionChapterNum = Between(
                    normalizedRange.versionChapterNum,
                    normalizedRange.versionChapterEndNum
                );
            else if (normalizedRange.versionChapterNum)
                where.versionChapterNum = normalizedRange.versionChapterNum;

            const singleChapter =
                normalizedRange.versionChapterNum &&
                (!normalizedRange.versionChapterEndNum ||
                    normalizedRange.versionChapterNum === normalizedRange.versionChapterEndNum);
            if (singleChapter && normalizedRange.versionVerseNum) {
                if (normalizedRange.versionVerseNum && normalizedRange.versionVerseEndNum)
                    where.versionVerseNum = Between(
                        normalizedRange.versionVerseNum,
                        normalizedRange.versionVerseEndNum
                    );
                else if (normalizedRange.versionVerseNum)
                    where.versionVerseNum = normalizedRange.versionVerseNum;
            }

            order = {
                versionChapterNum: 'ASC',
                versionVerseNum: 'ASC',
                versionSubverseNum: 'ASC',
                id: 'ASC',
            };
        }

        return db.find(BiblePhraseEntity, {
            where,
            order,
            relations: ['notes', 'crossReferences'],
        });
    }

    async getVersionFullData(versionUid: string) {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        const versionEntity = await db.findOne(BibleVersionEntity, {
            where: {
                uid: versionUid,
            },
        });
        if (!versionEntity) throw new Error(`version ${versionUid} is not available`);

        const version: IBibleVersion = stripUnnecessaryDataFromBibleVersion(versionEntity);

        const books: BibleBookEntity[] = await db.find(BibleBookEntity, {
            where: { versionId: versionEntity.id },
            order: { number: 'ASC' },
        });
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
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        const versionEntity = await db.findOne(BibleVersionEntity, {
            where: {
                uid: versionUid,
            },
        });
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
        versionBook?: BibleBookEntity | null
    ): Promise<IBibleReferenceRange> {
        if (!versionBook) {
            if (!this.pDB) throw new NoDbConnectionError();
            const db = await this.pDB;
            versionBook = await db.findOne(BibleBookEntity, {
                where: { versionId: range.versionId, osisId: range.bookOsisId },
            });
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
            : versionBook.getChapterVerseCount(versionChapterEndNum);
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
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        return db.findOne(BibleVersionEntity, { where: { uid: versionUid } });
    }

    async getVersionLocalId(versionUid: string) {
        const db = await this.pDB;
        const version = await db.findOne(BibleVersionEntity, {
            where: { uid: versionUid },
            select: ['id'],
        });
        return version?.id;
    }

    async getVersions(lang?: string) {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        return lang
            ? db.find(BibleVersionEntity, { where: { language: Like(`${lang}%`) } })
            : db.find(BibleVersionEntity);
    }

    async updateBook(
        book: IBibleBookEntity,
        updates: Partial<IBibleBookEntity>,
        entityManager?: EntityManager
    ) {
        if (!entityManager) {
            if (!this.pDB) throw new NoDbConnectionError();
            entityManager = await this.pDB;
        }

        await entityManager
            .createQueryBuilder()
            .update(BibleBookEntity)
            .set(updates)
            .where({ versionId: book.versionId, osisId: book.osisId })
            .execute();
        return { ...book, ...updates };
    }

    private async addBibleBookContent({
        entityManger,
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
    }: {
        entityManger: EntityManager;
        contents: IBibleContent[];
        version: BibleVersionEntity;
        book: IBibleBookEntity;
        context: BibleBookPlaintext;
        globalState?: {
            phraseStack: BiblePhraseEntity[];
            paragraphStack: BibleParagraphEntity[];
            sectionStack: BibleSectionEntity[];
            noteStack: BibleNoteEntity[];
            crossRefStack: BibleCrossReferenceEntity[];
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
    }): Promise<{ firstPhraseId: number | undefined; lastPhraseId: number | undefined }> {
        if (BibleEngine.DEBUG && localState.recursionLevel === 0) console.time('db_prepare');
        if (!this.pDB) throw new NoDbConnectionError();
        const db = entityManger;
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
                        if (!isTestMatching(rule.tests, context)) continue;

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
                                new BiblePhraseEntity(emptyPhrase, emptyPhraseReference, {
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
                                new BiblePhraseEntity(
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
                    if (lastContent.skipSpace === 'both') lastPhrase.skipSpace = 'before';
                    else if (lastContent.skipSpace === 'after') lastPhrase.skipSpace = undefined;
                    else if (content.skipSpace === 'before') {
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
                            new BibleNoteEntity(
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
                            new BibleCrossReferenceEntity(crossRef, true, phraseId)
                        );
                    }
                }
                if (content.strongs && skipStrongs) delete content.strongs;

                globalState.phraseStack.push(
                    new BiblePhraseEntity(content, phraseRef, {
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
                    entityManger: db,
                    contents: content.contents,
                    version,
                    book,
                    context,
                    globalState,
                    localState: childState,
                    inputHasNormalizedNumbering,
                    skip,
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
                    lastGroupPhrase!.linebreak = true;
                }
            } else if (
                (content.type === 'group' && content.groupType === 'paragraph') ||
                content.type === 'section'
            ) {
                const childState = {
                    modifierState: { ...localState.modifierState },
                    columnModifierState: { ...localState.columnModifierState },
                    sectionLevel:
                        content.type === 'section'
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
                    entityManger: db,
                    contents: content.contents,
                    version,
                    book,
                    context,
                    globalState,
                    localState: childState,
                    inputHasNormalizedNumbering,
                    skip,
                });

                if (content.type === 'group' && content.groupType === 'paragraph')
                    globalState.isWithinParagraph = false;

                if (sectionFirstPhraseId && sectionLastPhraseId) {
                    if (content.type === 'group' && content.groupType === 'paragraph') {
                        globalState.paragraphStack.push(
                            new BibleParagraphEntity(
                                book.versionId,
                                sectionFirstPhraseId,
                                sectionLastPhraseId
                            )
                        );
                    } else if (content.type === 'section') {
                        globalState.sectionStack.push(
                            new BibleSectionEntity({
                                versionId: book.versionId,
                                phraseStartId: sectionFirstPhraseId,
                                phraseEndId: sectionLastPhraseId,
                                level: localState.sectionLevel,
                                title: content.title,
                                subTitle: content.subTitle,
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
                                description: content.description
                                    ? {
                                          type: 'root',
                                          contents: normalizeDocumentContents(
                                              content.description.contents
                                          ),
                                      }
                                    : undefined,
                                isChapterLabel: content.isChapterLabel,
                            })
                        );
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

            // RADAR: check performance of higher chunkSize
            const chunkSize = 100;

            const sqlSet: { statement: string; values: any[] }[] = [];
            if (this.executeSqlSetOverride) {
                for (const phrase of globalState.phraseStack) {
                    phrase.prepare();
                }
                for (const crossRef of globalState.crossRefStack) {
                    crossRef.prepare();
                }
            }
            for (let index = 0; index < globalState.phraseStack.length; index += chunkSize) {
                const insertQb = db
                    .createQueryBuilder()
                    .insert()
                    .into(BiblePhraseEntity)
                    .values(globalState.phraseStack.slice(index, index + chunkSize));
                if (this.executeSqlSetOverride) {
                    const [statement, values] = insertQb.getQueryAndParameters();
                    sqlSet.push({ statement, values });
                } else await insertQb.execute();
            }

            for (let index = 0; index < globalState.noteStack.length; index += chunkSize) {
                const insertQb = db
                    .createQueryBuilder()
                    .insert()
                    .into(BibleNoteEntity)
                    .values(globalState.noteStack.slice(index, index + chunkSize));
                if (this.executeSqlSetOverride) {
                    const [statement, values] = insertQb.getQueryAndParameters();
                    sqlSet.push({ statement, values });
                } else await insertQb.execute();
            }

            for (let index = 0; index < globalState.paragraphStack.length; index += chunkSize) {
                const insertQb = db
                    .createQueryBuilder()
                    .insert()
                    .into(BibleParagraphEntity)
                    .values(globalState.paragraphStack.slice(index, index + chunkSize));
                if (this.executeSqlSetOverride) {
                    const [statement, values] = insertQb.getQueryAndParameters();
                    sqlSet.push({ statement, values });
                } else await insertQb.execute();
            }

            // since saving entities with a relation is a costly operation, we do it in a second step
            const sectionsWithoutCrossRefs = globalState.sectionStack.filter(
                (section) => !section.crossReferences?.length
            );
            for (let index = 0; index < sectionsWithoutCrossRefs.length; index += chunkSize) {
                const insertQb = db
                    .createQueryBuilder()
                    .insert()
                    .into(BibleSectionEntity)
                    .values(sectionsWithoutCrossRefs.slice(index, index + chunkSize));
                if (this.executeSqlSetOverride) {
                    const [statement, values] = insertQb.getQueryAndParameters();
                    sqlSet.push({ statement, values });
                } else await insertQb.execute();
            }

            // entites with a relation need to be saved one at a time, since the insertId is
            // needed, therefore we save sections with crossrefs separately, with a custom logic
            // optimized for minimal JS > native roundtrips
            const sectionsWithCrossRefs = globalState.sectionStack.filter(
                (section) => !!section.crossReferences?.length
            );
            const insertQb = db
                .createQueryBuilder()
                .insert()
                .into(BibleSectionEntity)
                .values(sectionsWithCrossRefs);
            const sectionsInsertId = (await insertQb.execute()).identifiers;
            if (sectionsInsertId.length !== sectionsWithCrossRefs.length)
                throw new Error('section insertId mismatch');
            for (const section of sectionsWithCrossRefs) {
                const sectionInsertId = sectionsInsertId.shift()!.id;
                globalState.crossRefStack.push(
                    ...section.crossReferences!.map((crossRef) => {
                        crossRef.sectionId = sectionInsertId;
                        crossRef.prepare();
                        return crossRef;
                    })
                );
            }

            for (let index = 0; index < globalState.crossRefStack.length; index += chunkSize) {
                const insertQb = db
                    .createQueryBuilder()
                    .insert()
                    .into(BibleCrossReferenceEntity)
                    .values(globalState.crossRefStack.slice(index, index + chunkSize));
                if (this.executeSqlSetOverride) {
                    const [statement, values] = insertQb.getQueryAndParameters();
                    sqlSet.push({ statement, values });
                } else await insertQb.execute();
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
        book?: BibleBookEntity | null
    ): Promise<IBibleReferenceRangeNormalized> {
        if (isReferenceNormalized(inputRange)) return { ...inputRange, isNormalized: true };

        // no mutation
        const range = { ...inputRange };

        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;

        if (!range.versionId && range.versionUid) {
            const version = await db.findOne(BibleVersionEntity, {
                where: { uid: range.versionUid },
                select: ['id'],
            });
            if (version) range.versionId = version.id;
        }

        // if reference has no data that can cause normalisation changes, return the reference
        // (-range) right away
        if (!range.versionId || !range.versionChapterNum)
            return generateNormalizedRangeFromVersionRange(range);

        if (!range.versionVerseNum) {
            if (!book) {
                book = await db.findOne(BibleBookEntity, {
                    where: { versionId: range.versionId, osisId: range.bookOsisId },
                    select: ['chaptersCount'],
                });
            }
            if (!book)
                throw new Error(
                    `missing book data for ${range.bookOsisId} during reference normalization`
                );

            range.versionVerseNum = 1;
            range.versionVerseEndNum = range.versionChapterEndNum
                ? book.chaptersCount[range.versionChapterEndNum - 1]
                : book.chaptersCount[range.versionChapterNum - 1];
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
        const potentialNormalizedRangeSql =
            generatePhraseIdSql(potentialNormalizedRange, 'phrase') +
            ' AND phrase.versionChapterNum = :cNum' +
            // if the verse num is not set on input, it is auto-set to be 1 and last verse in
            // chapter. since those numbers can switch around after normalisation (so that e.g. the
            // last verse in the version is not the last normalised verse), we need to ignore
            // `versionVerseNum` and only guard for the chapter number so that we make sure to get
            // all phrases within the requested chapter
            (inputRange.versionVerseNum ? ' AND phrase.versionVerseNum = :vNum' : '');

        const { phraseIdStart } = await db
            .createQueryBuilder(BiblePhraseEntity, 'phrase')
            .select('MIN(phrase.id)', 'phraseIdStart')
            .where(potentialNormalizedRangeSql, {
                cNum: range.versionChapterNum,
                vNum: range.versionVerseNum,
            })
            .getRawOne();

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

        // we only come here when there is a verseNum - in this case an end chapter without an end
        // verse wouldn't make sense, so we can safely ignore this case
        if (range.versionVerseEndNum) {
            const { phraseIdEnd } = await db
                .createQueryBuilder(BiblePhraseEntity, 'phrase')
                .select('MAX(phrase.id)', 'phraseIdEnd')
                .where(potentialNormalizedRangeSql, {
                    cNum: range.versionChapterEndNum
                        ? range.versionChapterEndNum
                        : range.versionChapterNum,
                    vNum: range.versionVerseEndNum,
                })
                .getRawOne();

            if (!phraseIdEnd)
                throw new Error(
                    `can't get normalized end reference for ${inputRange.versionUid} ${inputRange.versionId} ${inputRange.bookOsisId} ${inputRange.versionChapterNum}:${inputRange.versionVerseNum}-${inputRange.versionChapterEndNum}:${inputRange.versionVerseEndNum} - version data missing`
                );
            const phraseEnd = parsePhraseId(phraseIdEnd);

            normRange.normalizedChapterEndNum = phraseEnd.normalizedChapterNum;
            normRange.normalizedVerseEndNum = phraseEnd.normalizedVerseNum;
            if (typeof phraseEnd.normalizedSubverseNum !== 'undefined')
                normRange.normalizedSubverseEndNum = phraseEnd.normalizedSubverseNum;
        }

        return normRange;
    }

    private async getNormalisationRulesForRange(range: IBibleReferenceRangeVersion) {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        return db.find(V11nRuleEntity, {
            where: {
                sourceRefId: Raw((col) =>
                    generateReferenceIdSql(generateNormalizedRangeFromVersionRange(range), col)
                ),
                actionId: 2,
            },
            order: { id: 'ASC' },
        });
    }

    private async normalizeCrossReferencesForVersion(versionId: number) {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        // go through each bible book seperately
        for (const book of await db.find(BibleBookEntity, { where: { versionId } })) {
            // fetch all cross reference for that version and book
            for (const cRef of await db.find(BibleCrossReferenceEntity, {
                where: {
                    versionId,
                    normalizedRefId: Raw((col) =>
                        generateReferenceIdSql({ isNormalized: true, bookOsisId: book.osisId }, col)
                    ),
                },
            })) {
                try {
                    // get normalized reference range
                    const normalizedRange = await this.getNormalizedReferenceRange(
                        {
                            versionId,
                            bookOsisId: book.osisId,
                            versionChapterNum: cRef.versionChapterNum,
                            versionVerseNum: cRef.versionVerseNum,
                            versionChapterEndNum: cRef.versionChapterEndNum,
                            versionVerseEndNum: cRef.versionVerseEndNum,
                        },
                        book
                    );
                    if (cRef.versionChapterNum)
                        cRef.range.normalizedChapterNum = normalizedRange.normalizedChapterNum;
                    if (cRef.versionVerseNum)
                        cRef.range.normalizedVerseNum = normalizedRange.normalizedVerseNum;
                    if (cRef.versionChapterEndNum)
                        cRef.range.normalizedChapterEndNum =
                            normalizedRange.normalizedChapterEndNum;
                    if (cRef.versionVerseEndNum)
                        cRef.range.normalizedVerseEndNum = normalizedRange.normalizedVerseEndNum;

                    // we need to call `prepare` manually since typeOrm can't detect that the entity
                    // has changed (in other words: it does not run the method before change
                    // detection) and therefore does not execute an update
                    cRef.prepare();
                    // and save cross reference back to db
                    await db.save(cRef);
                } catch (e) {
                    // we can't avoid that there are invalid cross references, either due to errors
                    // in the source file or due to ambiguities when parsing references from text.
                    // Since a reference that can't be normalized can not be displayed, its best to
                    // just delete it and log the error
                    console.error(
                        `removed cross reference ${cRef.normalizedRefId} for phrase|section ${cRef.phraseId}|${cRef.sectionId} since normalization failed`
                    );
                    await db.remove(cRef);
                }
            }
        }
    }
}
