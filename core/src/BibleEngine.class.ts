import { createConnection, ConnectionOptions, Raw, EntityManager } from '../typeorm';

import {
    ENTITIES,
    BibleVersionEntity,
    BiblePhraseEntity,
    BibleBookEntity,
    BibleSectionEntity,
    BibleCrossReferenceEntity,
    DictionaryEntryEntity,
    BibleParagraphEntity,
    V11nRuleEntity,
    BibleNoteEntity
} from './entities';
import {
    parsePhraseId,
    generatePhraseId,
    generateNormalizedReferenceFromVersionRange,
    isReferenceNormalized,
    generateReferenceId
} from './functions/reference.functions';
import {
    generatePhraseIdSql,
    generateReferenceIdSql,
    generateBookSectionsSql,
    generateParagraphSql
} from './functions/sql.functions';
import {
    stripUnnecessaryDataFromBibleContent,
    generateBibleDocument,
    convertBibleInputToBookPlaintext,
    generateContextRanges,
    generateContextSections,
    stripUnnecessaryDataFromBibleVersion,
    stripUnnecessaryDataFromBibleBook,
    stripUnnecessaryDataFromBibleReferenceRange,
    stripUnnecessaryDataFromBibleContextData
} from './functions/content.functions';
import { generateMinimizedDbObject, generateMinimizedDbObjects } from './functions/utils.functions';
import { isTestMatching } from './functions/v11n.functions';
import {
    BibleBookPlaintext,
    IDictionaryEntry,
    IBibleVersion,
    IBibleReferenceRange,
    IBibleOutputRich,
    IBibleReferenceRangeNormalized,
    IBibleBook,
    BookWithContentForInput,
    PhraseModifiers,
    IBibleReferenceNormalized,
    IBiblePhraseRef,
    IBibleContent,
    IBiblePhraseWithNumbers,
    IBibleReferenceRangeQuery,
    IBibleReferenceVersion,
    IBibleReferenceRangeVersion,
    IBibleContentForInput,
    IBibleContentGroupForInput
} from './models';

class NoDbConnectionError extends Error {
    constructor() {
        super('calling a method that expects a DB connection to be set in BibleEngine');
        this.name = 'NoDbConnectionError';
    }
}

export class BibleEngine {
    currentVersion?: BibleVersionEntity;
    currentVersionMetadata?: BibleBookEntity[];
    pDB?: Promise<EntityManager>;

    constructor(dbConfig: ConnectionOptions | null, private remoteConfig?: { url: string }) {
        if (dbConfig) {
            this.pDB = createConnection({
                entities: ENTITIES,
                synchronize: false,
                logging: ['error'],
                name: 'bible-engine',
                ...dbConfig
            }).then(conn => conn.manager);
        }
    }

    async addBookWithContent(bookInput: BookWithContentForInput, entityManager?: EntityManager) {
        if (!this.pDB) throw new NoDbConnectionError();

        const contentHasNormalizedNumbers = bookInput.contentHasNormalizedNumbers || false;
        const textData = convertBibleInputToBookPlaintext(bookInput.contents);
        bookInput.book.chaptersCount = [];
        for (const verses of textData.values()) {
            bookInput.book.chaptersCount.push(verses.size);
        }
        await this.addBook(bookInput.book);

        if (entityManager)
            return this.addBibleBookContent(
                entityManager,
                bookInput.contents,
                bookInput.book,
                textData,
                undefined,
                undefined,
                contentHasNormalizedNumbers
            ).catch(e => {
                console.error('Aborting book import: ' + e);
            });

        return await this.pDB.then(async entityManager =>
            entityManager.transaction(transactionEntityManger => {
                return this.addBibleBookContent(
                    transactionEntityManger,
                    bookInput.contents,
                    bookInput.book,
                    textData,
                    undefined,
                    undefined,
                    contentHasNormalizedNumbers
                ).catch(e => {
                    console.error('Aborting book import: ' + e);
                });
            })
        );
    }

    async addDictionaryEntry(dictionaryEntry: IDictionaryEntry) {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        db.save(new DictionaryEntryEntity(dictionaryEntry));
    }

    async addV11nRules(rules: V11nRuleEntity[]) {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        return db.save(rules, { chunk: rules.length / 500 });
    }

    async addVersion(version: IBibleVersion) {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        return db.save(new BibleVersionEntity(version));
    }

    async finalizeVersion(versionId: number) {
        this.normalizeCrossReferencesForVersion(versionId);
    }

    async generateBookMetadata(book: BibleBookEntity) {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        const metaData = await db
            .createQueryBuilder(BiblePhraseEntity, 'phrase')
            .addSelect('COUNT(DISTINCT phrase.versionVerseNum)', 'numVerses')
            .where({
                id: Raw(col =>
                    generatePhraseIdSql({ isNormalized: true, bookOsisId: book.osisId }, col)
                )
            })
            .orderBy('phrase.versionChapterNum')
            .groupBy('phrase.versionChapterNum')
            .getRawMany();
        book.chaptersCount = metaData.map(chapterMetaDb => chapterMetaDb.numVerses);
        return db.save(book);
    }

    async getBooksForVersion(versionId: number) {
        // TODO: add remote fallback
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        return db.find(BibleBookEntity, {
            where: { versionId },
            order: { number: 'ASC' }
        });
    }

    async getDictionaryEntries(strong: string, dictionary?: string) {
        // TODO: add remote fallback
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        return db.find(DictionaryEntryEntity, { where: { strong, dictionary } });
    }

    async getFullDataForReferenceRange(
        rangeQuery: IBibleReferenceRangeQuery,
        stripUnnecessaryData = false
    ): Promise<IBibleOutputRich> {
        let version: BibleVersionEntity | undefined;
        let db: EntityManager | undefined;
        if (this.pDB) {
            db = await this.pDB;
            version = await db.findOne(BibleVersionEntity, {
                where: { uid: rangeQuery.versionUid }
            });
        }

        if (!version) {
            if (this.remoteConfig) {
                // TODO: refactor this out into a service
                const remoteData = await fetch(
                    this.remoteConfig.url + '/getFullDataForReferenceRange',
                    {
                        body: JSON.stringify(rangeQuery),
                        method: 'post',
                        headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json'
                        }
                    }
                ).then(response => {
                    return response.json();
                });
                // TODO: properly handle error
                return remoteData;
            }
            throw new Error(`can't get formatted text: invalid version`);
        }

        if (!db) throw new NoDbConnectionError();

        const range: IBibleReferenceRangeVersion = { ...rangeQuery, versionId: version.id };

        const book = await this.getBookForVersionReference(range);
        if (!book) throw new Error(`can't get formatted text: invalid book`);

        const bookAbbreviations = await db
            .find(BibleBookEntity, {
                select: ['osisId', 'abbreviation']
            })
            .then(books => {
                const dict: { [index: string]: string } = {};
                for (const _book of books) {
                    dict[_book.osisId] = _book.abbreviation;
                }
                return dict;
            });

        const rangeNormalized = isReferenceNormalized(range)
            ? <IBibleReferenceRangeNormalized>range
            : await this.getNormalizedReferenceRange(range);

        const phrases = await this.getPhrases(rangeNormalized);
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
            .where(generateBookSectionsSql(rangeNormalized, 'section'))
            // sections are inserted in order, so its safe to sort by generated id
            .orderBy('level')
            .addOrderBy('id')
            .getMany();

        /* GENERATE STRUCTURED DATA */
        const context = generateContextSections(phrases, sections);

        const contextRanges = generateContextRanges(
            range,
            rangeNormalized,
            phrases,
            paragraphs,
            context,
            book
        );

        const bibleDocument = generateBibleDocument(
            phrases,
            paragraphs,
            context,
            bookAbbreviations,
            version.chapterVerseSeparator
        );

        if (stripUnnecessaryData) {
            // when we are transmitting the data we want the returned object to be as slim as
            // possible. also: when we transmit to a client, local ids have to be stripped
            // (versionId, sectionId)
            bibleDocument.contents = stripUnnecessaryDataFromBibleContent(bibleDocument.contents);
            stripUnnecessaryDataFromBibleVersion(version);
            stripUnnecessaryDataFromBibleBook(book);
            stripUnnecessaryDataFromBibleReferenceRange(rangeNormalized);
            stripUnnecessaryDataFromBibleContextData(context, contextRanges);
        }

        return {
            version,
            versionBook: book,
            range: rangeNormalized,
            content: bibleDocument,
            context,
            contextRanges
        };
    }

    async getNextPhraseNumForNormalizedVerseNum(
        reference: IBibleReferenceNormalized
    ): Promise<number> {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        const lastPhrase = await db.find(BiblePhraseEntity, {
            where: { id: Raw(col => generatePhraseIdSql(reference, col)) },
            order: { id: 'DESC' },
            take: 1,
            select: ['id']
        });
        return lastPhrase.length ? parsePhraseId(lastPhrase[0].id).phraseNum! + 1 : 1;
    }

    async getPhrases(range: IBibleReferenceRangeNormalized | IBibleReferenceRangeVersion) {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        const normalizedRange =
            range.isNormalized === true
                ? <IBibleReferenceRangeNormalized>range
                : await this.getNormalizedReferenceRange(range);
        return db.find(BiblePhraseEntity, {
            where: { id: Raw(col => generatePhraseIdSql(normalizedRange, col)) },
            order: { id: 'ASC' },
            relations: ['notes', 'crossReferences']
        });
    }

    async getRawVersionData(versionUid: string) {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        const versionEntity = await db.findOne(BibleVersionEntity, {
            uid: versionUid
        });
        if (!versionEntity) throw new Error(`version ${versionUid} is not available`);

        const version: IBibleVersion = generateMinimizedDbObject(versionEntity);

        const books: IBibleBook[] = await db
            .find(BibleBookEntity, {
                where: { versionId: versionEntity.id },
                order: { number: 'ASC' }
            })
            .then(generateMinimizedDbObjects);
        const bookData: { book: IBibleBook; content: IBibleContent[] }[] = [];
        for (const book of books) {
            bookData.push({
                book,
                content: await this.getFullDataForReferenceRange({
                    versionUid: version.uid,
                    bookOsisId: book.osisId
                }).then(fullData => stripUnnecessaryDataFromBibleContent(fullData.content.contents))
            });
        }
        // const phrases = await entityManager
        //     .find(BiblePhrase, {
        //         where: { id: Raw(col => generatePhraseIdVersionSql(versionId, col)) },
        //         order: { id: 'ASC' }
        //     })
        //     .then(getMinimizedDbObjects)
        //     .then(_phrases =>
        //         _phrases.map(phrase => {
        //             // data is encoded in phrase.id
        //             delete phrase.reference;
        //             // strongsJoined takes less space
        //             delete phrase.strongs;
        //             return phrase;
        //         })
        //     );
        return { version, bookData };
        // deflate(
        //     JSON.stringify({
        //         version,
        //         books
        //     }),
        //     { to: 'string' }
        // );
    }

    async getReferenceRangeWithAllVersionProperties(
        range: IBibleReferenceRange,
        versionBook?: BibleBookEntity
    ): Promise<IBibleReferenceRange> {
        if (!versionBook) {
            if (!this.pDB) throw new NoDbConnectionError();
            const db = await this.pDB;
            versionBook = await db.findOne(BibleBookEntity, {
                where: { versionId: range.versionId, osisId: range.bookOsisId }
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
            versionVerseEndNum
        };
    }

    async setVersion(version: string) {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        const versionDb = await db.findOne(BibleVersionEntity, { uid: version });
        this.currentVersion = versionDb;
    }

    private async addBibleBookContent(
        entityManger: EntityManager,
        contents: IBibleContentForInput[],
        book: IBibleBook,
        context: BibleBookPlaintext,
        globalState: {
            phraseStack: BiblePhraseEntity[];
            paragraphStack: BibleParagraphEntity[];
            sectionStack: BibleSectionEntity[];
            noteStack: BibleNoteEntity[];
            crossRefStack: BibleCrossReferenceEntity[];
            usedRefIds: Set<number>;
            currentVersionChapter: number;
            currentVersionVerse: number;
            currentVersionSubverse?: number;
            currentPhraseNum: number;
            currentNormalizedReference?: IBibleReferenceNormalized;
            currentSourceTypeId?: number;
            currentJoinToRefId?: number;
        } = {
            phraseStack: [],
            paragraphStack: [],
            sectionStack: [],
            noteStack: [],
            crossRefStack: [],
            usedRefIds: new Set(),
            currentPhraseNum: 0,
            currentVersionChapter: 0,
            currentVersionVerse: -1,
            currentVersionSubverse: 0
        },
        localState: {
            modifierState: PhraseModifiers;
            columnModifierState: { quoteWho?: string; person?: string };
            sectionLevel: number;
            recursionLevel: number;
        } = {
            modifierState: { quoteLevel: 0, indentLevel: 0 },
            columnModifierState: {},
            sectionLevel: 0,
            recursionLevel: 0
        },
        inputHasNormalizedNumbering = false
    ): Promise<{ firstPhraseId: number | undefined; lastPhraseId: number | undefined }> {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = entityManger;
        let firstPhraseId: number | undefined, lastPhraseId: number | undefined;
        for (const content of contents) {
            if (content.type === 'phrase' || !content.type) {
                // does this phrase start a new (sub-)verse? if yes, we need to look for v11n-rules
                // and determine the normalized numbering. if needed we also need to create empty
                // verses (if a verse of the standard version does not exist in our source version
                // or when one source verse is a verse range in the standard version)
                // also: this updates all the current* attributes on the state object
                if (
                    !globalState.currentNormalizedReference ||
                    (content.versionChapterNum &&
                        (content.versionChapterNum !== globalState.currentVersionChapter ||
                            content.versionVerseNum !== globalState.currentVersionVerse ||
                            content.versionSubverseNum !== globalState.currentVersionSubverse)) ||
                    content.numbering
                ) {
                    if (content.versionChapterNum) {
                        // input uses numbering on each phrase
                        globalState.currentVersionChapter = content.versionChapterNum;
                        globalState.currentVersionVerse = content.versionVerseNum;
                        globalState.currentVersionSubverse = content.versionSubverseNum;
                    } else if (content.numbering) {
                        // input uses numbering objects on number change
                        if (content.numbering.versionChapterIsStartingInRange)
                            globalState.currentVersionChapter =
                                content.numbering.versionChapterIsStartingInRange;
                        if (content.numbering.versionVerseIsStarting)
                            globalState.currentVersionVerse;
                        if (content.numbering.versionSubverseIsStarting)
                            globalState.currentVersionSubverse;
                    } else {
                        throw new Error(`missing reference information in input`);
                    }
                    globalState.currentJoinToRefId = undefined;
                    globalState.currentSourceTypeId = undefined;
                    // currentPhraseNum will be dealt with on the basis of the normalized numbers

                    let nRef: IBibleReferenceNormalized | undefined;

                    if (inputHasNormalizedNumbering) {
                        // normalized input already has join and sourceType attributes
                        globalState.currentJoinToRefId = content.joinToRefId;
                        globalState.currentSourceTypeId = content.sourceTypeId;

                        if (content.normalizedReference) {
                            // input uses the normalizedReference object on each phrase
                            nRef = {
                                ...content.normalizedReference,
                                bookOsisId: book.osisId,
                                isNormalized: true
                            };
                        } else {
                            // input uses numbering objects on number change
                            nRef = globalState.currentNormalizedReference
                                ? { ...globalState.currentNormalizedReference }
                                : {
                                      bookOsisId: book.osisId,
                                      isNormalized: true
                                  };
                            if (
                                content.numbering &&
                                content.numbering.normalizedChapterIsStartingInRange
                            )
                                nRef.normalizedChapterNum =
                                    content.numbering.normalizedChapterIsStartingInRange;
                            if (content.numbering && content.numbering.normalizedVerseIsStarting)
                                nRef.normalizedVerseNum =
                                    content.numbering.normalizedVerseIsStarting;
                            if (content.numbering && content.numbering.normalizedSubverseIsStarting)
                                nRef.normalizedSubverseNum =
                                    content.numbering.normalizedSubverseIsStarting;
                        }
                    } else {
                        const reference = {
                            versionId: book.versionId,
                            bookOsisId: book.osisId,
                            versionChapterNum: globalState.currentVersionChapter,
                            versionVerseNum: globalState.currentVersionVerse,
                            versionSubverseNum: globalState.currentVersionSubverse
                        };
                        let firstStandardRefId: number | undefined;

                        const normalisationRules = await this.getNormalisationRulesForRange(
                            reference
                        );

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
                                normalizedSubverseNum: rule.standardRef.normalizedSubverseNum || 0,
                                phraseNum: 0
                            };

                            if (rule.action === 'Empty verse') {
                                // since this phrase does not relate to any verse in the
                                // source version, we set the versionNumbers to the standardRef
                                const emptyPhrase = {
                                    content: '',
                                    versionChapterNum: rule.standardRef.normalizedChapterNum!,
                                    versionVerseNum: rule.standardRef.normalizedVerseNum!
                                };

                                globalState.phraseStack.push(
                                    new BiblePhraseEntity(emptyPhrase, emptyPhraseReference, {
                                        ...localState.modifierState
                                    })
                                );
                            } else if (rule.action === 'Renumber verse') {
                                // only the first standardRef is relevant for creating the
                                // normalized reference for this phrase. Additional refs occur when
                                // the sourceRef generates a range. we create an empty phrase for
                                // each of them and keep track of last ref of the range to link the
                                // content-phrase to it later
                                if (firstStandardRefId)
                                    throw new Error(
                                        `v11n: trying to renumber an already renumbered ref: ` +
                                            `${firstStandardRefId}`
                                    );

                                nRef = rule.standardRef;
                                firstStandardRefId = rule.standardRefId;
                            } else if (rule.action === 'Merged above') {
                                if (!firstStandardRefId)
                                    throw new Error(
                                        `v11n: trying to continue a range that wasn't started`
                                    );

                                const emptyPhrase: IBiblePhraseWithNumbers = {
                                    content: '',
                                    versionChapterNum: content.versionChapterNum,
                                    versionVerseNum: content.versionVerseNum,
                                    // we link the empty phrases to the first standardRef
                                    joinToRefId: firstStandardRefId
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

                                // the last standardRefId in this range needs to be linked on the
                                // starting verse of the range
                                if (
                                    !globalState.currentJoinToRefId ||
                                    globalState.currentJoinToRefId < rule.standardRefId
                                )
                                    globalState.currentJoinToRefId = rule.standardRefId;
                            }
                        }

                        // no rule updpated the numbering
                        if (!nRef) nRef = generateNormalizedReferenceFromVersionRange(reference);
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
                        if (globalState.usedRefIds.has(newRefId))
                            throw new Error(
                                `normalization caused the duplicate reference ${newRefId} - this ` +
                                    `is caused by inconsistencies in the v11n rules and would ` +
                                    `cause the reference to be overwritten`
                            );

                        globalState.usedRefIds.add(newRefId);
                        globalState.currentPhraseNum = 1;
                        globalState.currentNormalizedReference = nRef;
                    }
                    // end new version verse handling
                } else {
                    globalState.currentPhraseNum++;
                }

                if (
                    !globalState.currentNormalizedReference.normalizedChapterNum ||
                    !globalState.currentNormalizedReference.normalizedVerseNum
                )
                    throw new Error(`can't add phrases: normalisation failed`);

                // we are using a phraseStack to improve performance when adding to the database
                const phraseRef: Required<IBiblePhraseRef> = {
                    isNormalized: true,
                    bookOsisId: book.osisId,
                    normalizedChapterNum:
                        globalState.currentNormalizedReference.normalizedChapterNum,
                    normalizedVerseNum: globalState.currentNormalizedReference.normalizedVerseNum,
                    normalizedSubverseNum:
                        globalState.currentNormalizedReference.normalizedSubverseNum || 0,
                    versionId: book.versionId,
                    phraseNum: globalState.currentPhraseNum
                };
                const phraseId = generatePhraseId(phraseRef);
                if (!firstPhraseId) firstPhraseId = phraseId;
                lastPhraseId = phraseId;

                if (localState.columnModifierState.quoteWho)
                    content.quoteWho = localState.columnModifierState.quoteWho;
                if (localState.columnModifierState.person)
                    content.person = localState.columnModifierState.person;
                if (globalState.currentJoinToRefId)
                    content.joinToRefId = globalState.currentJoinToRefId;
                if (globalState.currentSourceTypeId !== undefined)
                    content.sourceTypeId = globalState.currentSourceTypeId;

                // check if input content uses numbering object (i.e. does not have version numbers)
                if (!content.versionChapterNum) {
                    content.versionChapterNum = globalState.currentVersionChapter;
                    content.versionVerseNum = globalState.currentVersionVerse;
                    content.versionSubverseNum = globalState.currentVersionSubverse;
                }

                if (content.notes) {
                    for (const note of content.notes) {
                        globalState.noteStack.push(new BibleNoteEntity(note, phraseId));
                    }
                }
                if (content.crossReferences) {
                    for (const crossRef of content.crossReferences) {
                        if (!crossRef.range.versionId) crossRef.range.versionId = book.versionId;
                        globalState.crossRefStack.push(
                            new BibleCrossReferenceEntity(crossRef, true, phraseId)
                        );
                    }
                }

                globalState.phraseStack.push(
                    new BiblePhraseEntity(content, phraseRef, { ...localState.modifierState })
                );
            } else if (content.type === 'group' && content.groupType !== 'paragraph') {
                const childState = {
                    modifierState: { ...localState.modifierState },
                    columnModifierState: { ...localState.columnModifierState },
                    sectionLevel: localState.sectionLevel,
                    recursionLevel: localState.recursionLevel + 1
                };

                if (content.groupType === 'quote') {
                    if (!childState.modifierState.quoteLevel)
                        childState.modifierState.quoteLevel = 0;
                    childState.modifierState.quoteLevel++;
                    childState.columnModifierState.quoteWho = content.modifier;
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
                    childState.modifierState.title = (<IBibleContentGroupForInput<'title'>>(
                        content
                    )).modifier = content.modifier === 'pullout' ? 'pullout' : 'inline';
                else if (content.groupType === 'poetry') childState.modifierState.poetry = true;
                else if (content.groupType === 'sela') childState.modifierState.sela = true;
                else if (content.groupType === 'link')
                    childState.modifierState.link = content.modifier;
                else if (content.groupType === 'translationChange')
                    childState.modifierState.translationChange = content.modifier;
                else if (content.groupType === 'person')
                    childState.columnModifierState.person = content.modifier;
                else if (content.groupType === 'orderedListItem')
                    childState.modifierState.orderedListItem = content.modifier;
                else if (content.groupType === 'unorderedListItem')
                    childState.modifierState.orderedListItem = content.modifier;
                const {
                    firstPhraseId: groupFirstPhraseId,
                    lastPhraseId: groupLastPhraseId
                } = await this.addBibleBookContent(
                    db,
                    content.contents,
                    book,
                    context,
                    globalState,
                    childState
                );
                if (groupFirstPhraseId && !firstPhraseId) firstPhraseId = groupFirstPhraseId;
                if (groupLastPhraseId) lastPhraseId = groupLastPhraseId;
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
                    recursionLevel: localState.recursionLevel + 1
                };

                let {
                    firstPhraseId: sectionFirstPhraseId,
                    lastPhraseId: sectionLastPhraseId
                } = await this.addBibleBookContent(
                    db,
                    content.contents,
                    book,
                    context,
                    globalState,
                    childState
                );

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
                                crossReferences: content.crossReferences,
                                description: content.description
                            })
                        );
                    }

                    if (!firstPhraseId) firstPhraseId = sectionFirstPhraseId;
                    lastPhraseId = sectionLastPhraseId;
                }
            }
        }

        if (localState.recursionLevel === 0) {
            // we are at the end of the root method => persist everything
            const chunkSize = 100;

            // await db.save(globalState.phraseStack, {
            //     reload: false
            //     // transaction: false
            //     // chunk: Math.ceil(globalState.phraseStack.length / 100)
            // });
            for (let index = 0; index < globalState.phraseStack.length; index += chunkSize) {
                db.createQueryBuilder()
                    .insert()
                    .into(BiblePhraseEntity)
                    .values(globalState.phraseStack.slice(index, index + chunkSize))
                    .execute();
            }

            for (let index = 0; index < globalState.noteStack.length; index += chunkSize) {
                db.createQueryBuilder()
                    .insert()
                    .into(BibleNoteEntity)
                    .values(globalState.noteStack.slice(index, index + chunkSize))
                    .execute();
            }

            for (let index = 0; index < globalState.crossRefStack.length; index += chunkSize) {
                db.createQueryBuilder()
                    .insert()
                    .into(BibleCrossReferenceEntity)
                    .values(globalState.crossRefStack.slice(index, index + chunkSize))
                    .execute();
            }

            // await db.save(globalState.paragraphStack, {
            //     reload: false
            //     // transaction: false
            // });
            for (let index = 0; index < globalState.paragraphStack.length; index += chunkSize) {
                db.createQueryBuilder()
                    .insert()
                    .into(BibleParagraphEntity)
                    .values(globalState.paragraphStack.slice(index, index + chunkSize))
                    .execute();
            }

            // since there are not that many sections, we use the save method here, taking advantage
            // of the automatic relations handling (since sections can have notes)
            await db.save(globalState.sectionStack);
            // for (let index = 0; index < globalState.sectionStack.length; index += chunkSize) {
            //     db.createQueryBuilder()
            //         .insert()
            //         .into(BibleSectionEntity)
            //         .values(globalState.sectionStack.slice(index, index + chunkSize))
            //         .execute();
            // }
        }

        return { firstPhraseId, lastPhraseId };
    }

    private async addBook(book: IBibleBook) {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        return await db.save(new BibleBookEntity(book));
    }

    private async getBookForVersionReference({ versionId, bookOsisId }: IBibleReferenceVersion) {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        const where = { osisId: bookOsisId, versionId };

        return db.findOne(BibleBookEntity, { where });
    }

    private async getNormalizedReferenceRange(
        range: IBibleReferenceRangeVersion
    ): Promise<IBibleReferenceRangeNormalized> {
        if (isReferenceNormalized(range)) return { ...range, isNormalized: true };

        // if reference has not data that can cause normalisation changes, return the reference
        // (-range) right away
        if (!range.versionId || !range.versionChapterNum || !range.versionVerseNum)
            return generateNormalizedReferenceFromVersionRange(range);

        const rules = await this.getNormalisationRulesForRange(range);

        // there are no rules for this reference(-range) than can cause normalisation changes
        if (!rules.length) return generateNormalizedReferenceFromVersionRange(range);

        // now we need to determine the normalized range that the given version range could
        // potentially end up in - thus we can narrow down the phrases we need to look at
        let standardRefIdStart: number | undefined;
        let standardRefStart: IBibleReferenceNormalized | undefined;
        let standardRefIdEnd: number | undefined;
        let standardRefEnd: IBibleReferenceNormalized | undefined;
        for (const rule of rules) {
            if (!standardRefIdStart || standardRefIdStart > rule.standardRefId) {
                standardRefIdStart = rule.standardRefId;
                standardRefStart = rule.standardRef;
            }
            if (!standardRefIdEnd || standardRefIdEnd < rule.standardRefId) {
                standardRefIdEnd = rule.standardRefId;
                standardRefEnd = rule.standardRef;
            }
        }
        const potentialNormalizedRange: IBibleReferenceRangeNormalized = {
            isNormalized: true,
            versionId: range.versionId,
            bookOsisId: range.bookOsisId,
            normalizedChapterNum: standardRefStart!.normalizedChapterNum,
            normalizedVerseNum: standardRefStart!.normalizedVerseNum,
            normalizedSubverseNum: standardRefStart!.normalizedSubverseNum,
            normalizedChapterEndNum: standardRefEnd!.normalizedChapterNum,
            normalizedVerseEndNum: standardRefEnd!.normalizedVerseNum,
            normalizedSubverseEndNum: standardRefEnd!.normalizedSubverseNum
        };

        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        // const phraseStart = await entityManager.findOne(BiblePhrase, {
        //     where: {
        //         id: Raw(col => generatePhraseIdSql(pontentialNormalizedRange, col)),
        //         versionChapterNum: range.versionChapterNum,
        //         // if there was no verseNum we would have returned above already
        //         versionVerseNum: range.versionVerseNum
        //     }
        // });

        const { phraseIdStart } = await db
            .createQueryBuilder(BiblePhraseEntity, 'phrase')
            .select('MIN(phrase.id)', 'phraseIdStart')
            .where(
                generatePhraseIdSql(potentialNormalizedRange, 'phrase.id') +
                    ' AND phrase.versionChapterNum = :cNum AND phrase.versionVerseNum = :vNum',
                { cNum: range.versionChapterNum, vNum: range.versionVerseNum }
            )
            .getRawOne();

        if (!phraseIdStart) throw new Error(`can't get normalized refrence: version data missing`);
        const phraseStart = parsePhraseId(phraseIdStart);

        const normRange: IBibleReferenceRangeNormalized = {
            ...range,
            isNormalized: true,
            normalizedChapterNum: phraseStart.normalizedChapterNum,
            normalizedVerseNum: phraseStart.normalizedVerseNum,
            normalizedSubverseNum: phraseStart.normalizedSubverseNum || undefined
        };

        // we only come here when there is a verseNum - in this case an end chapter without an end
        // verse wouldn't make sense, so we can safely ignore this case
        if (range.versionVerseEndNum) {
            // const phraseEnd = await entityManager.findOne(BiblePhrase, {
            //     where: {
            //         id: Raw(col => generatePhraseIdSql(pontentialNormalizedRange, col)),
            //         versionChapterNum: range.versionChapterEndNum
            //             ? range.versionChapterEndNum
            //             : range.versionChapterNum,
            //         versionVerseNum: range.versionVerseEndNum
            //     }
            // });
            const { phraseIdEnd } = await db
                .createQueryBuilder(BiblePhraseEntity, 'phrase')
                .select('MAX(phrase.id)', 'phraseIdEnd')
                .where(
                    generatePhraseIdSql(potentialNormalizedRange, 'phrase.id') +
                        ' AND phrase.versionChapterNum = :cNum AND phrase.versionVerseNum = :vNum',
                    {
                        cNum: range.versionChapterEndNum
                            ? range.versionChapterEndNum
                            : range.versionChapterNum,
                        vNum: range.versionVerseEndNum
                    }
                )
                .getRawOne();

            if (!phraseIdEnd)
                throw new Error(`can't get normalized refrence: version data missing`);
            const phraseEnd = parsePhraseId(phraseIdEnd);

            normRange.normalizedChapterEndNum = phraseEnd.normalizedChapterNum;
            normRange.normalizedVerseEndNum = phraseEnd.normalizedVerseNum;
            if (phraseEnd.normalizedSubverseNum)
                normRange.normalizedSubverseEndNum = phraseEnd.normalizedSubverseNum;
        }

        return normRange;
    }

    private async getNormalisationRulesForRange(range: IBibleReferenceRangeVersion) {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        return db.find(V11nRuleEntity, {
            where: {
                sourceRefId: Raw(col =>
                    generateReferenceIdSql(generateNormalizedReferenceFromVersionRange(range), col)
                )
            },
            order: { id: 'ASC' }
        });
    }

    private async normalizeCrossReferencesForVersion(versionId: number) {
        if (!this.pDB) throw new NoDbConnectionError();
        const db = await this.pDB;
        // go through each bible book seperately
        for (const book of await db.find(BibleBookEntity)) {
            // fetch all cross reference for that version and book
            for (const cRef of await db.find(BibleCrossReferenceEntity, {
                where: {
                    versionId,
                    normalizedRefId: Raw(col =>
                        generateReferenceIdSql({ isNormalized: true, bookOsisId: book.osisId }, col)
                    )
                }
            })) {
                // get normalized reference range
                // we know that this crossRef has a versionId since we queried for it
                const normalizedRange = await this.getNormalizedReferenceRange(
                    // prettier-ignore
                    <IBibleReferenceRangeVersion>cRef.range
                );
                if (cRef.versionChapterNum)
                    cRef.range.normalizedChapterNum = normalizedRange.normalizedChapterNum;
                if (cRef.versionVerseNum)
                    cRef.range.normalizedVerseNum = normalizedRange.normalizedVerseNum;
                if (cRef.versionChapterEndNum)
                    cRef.range.normalizedChapterEndNum = normalizedRange.normalizedChapterEndNum;
                if (cRef.versionVerseEndNum)
                    cRef.range.normalizedVerseEndNum = normalizedRange.normalizedVerseEndNum;
                // and save cross reference back to db
                db.save(cRef);
            }
        }
    }
}
