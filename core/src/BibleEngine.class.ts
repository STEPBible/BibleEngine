import 'reflect-metadata';
import { createConnection, ConnectionOptions, Raw, EntityManager } from 'typeorm';
// import { deflate } from 'pako';

import {
    ENTITIES,
    BibleVersion,
    BiblePhrase,
    BibleBook,
    BibleSection,
    BibleCrossReference,
    DictionaryEntry,
    BibleParagraph,
    V11nRule
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
    IBibleContentForInput
} from './models';

export class BibleEngine {
    currentVersion?: BibleVersion;
    currentVersionMetadata?: BibleBook[];
    pEntityManager: Promise<EntityManager>;

    constructor(dbConfig: ConnectionOptions, private remoteConfig?: { url: string }) {
        this.pEntityManager = createConnection({
            ...dbConfig,
            entities: ENTITIES,
            synchronize: true,
            logging: ['error']
        }).then(conn => conn.manager);
    }

    async addBookWithContent(bookInput: BookWithContentForInput) {
        const textData = convertBibleInputToBookPlaintext(bookInput.contents);
        bookInput.book.chaptersCount = [];
        for (const verses of textData.values()) {
            bookInput.book.chaptersCount.push(verses.size);
        }
        await this.addBook(bookInput.book);

        await this.addBibleBookContent(bookInput.contents, bookInput.book, textData).catch(e => {
            console.error('Aborting book import: ' + e);
        });
    }

    async addDictionaryEntry(dictionaryEntry: IDictionaryEntry) {
        const entityManager = await this.pEntityManager;
        entityManager.save(new DictionaryEntry(dictionaryEntry));
    }

    async addV11nRules(rules: V11nRule[]) {
        const entityManager = await this.pEntityManager;
        return entityManager.save(rules, { chunk: rules.length / 500 });
    }

    async addVersion(version: IBibleVersion) {
        const entityManager = await this.pEntityManager;
        return entityManager.save(new BibleVersion(version));
    }

    async finalizeVersion(versionId: number) {
        this.normalizeCrossReferencesForVersion(versionId);
    }

    async generateBookMetadata(book: BibleBook) {
        const entityManager = await this.pEntityManager;
        const metaData = await entityManager
            .createQueryBuilder(BiblePhrase, 'phrase')
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
        return entityManager.save(book);
    }

    async getBooksForVersion(versionId: number) {
        const entityManager = await this.pEntityManager;
        return entityManager.find(BibleBook, {
            where: { versionId },
            order: { number: 'ASC' }
        });
    }

    async getDictionaryEntries(strong: string, dictionary?: string) {
        const entityManager = await this.pEntityManager;
        return entityManager.find(DictionaryEntry, { where: { strong, dictionary } });
    }

    async getFullDataForReferenceRange(
        rangeQuery: IBibleReferenceRangeQuery,
        stripUnnecessaryData = false
    ): Promise<IBibleOutputRich> {
        const entityManager = await this.pEntityManager;

        const version = await entityManager.findOne(BibleVersion, {
            where: { version: rangeQuery.queryVersion }
        });
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

        const range: IBibleReferenceRangeVersion = { ...rangeQuery, versionId: version.id };

        const book = await this.getBookForVersionReference(range);
        if (!book) throw new Error(`can't get formatted text: invalid book`);

        const bookAbbreviations = await entityManager
            .find(BibleBook, {
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
        const paragraphs = await entityManager
            .createQueryBuilder(BibleParagraph, 'paragraph')
            .where(
                generateParagraphSql(
                    { ...rangeNormalized, versionId: rangeNormalized.versionId! },
                    'paragraph'
                )
            )
            .orderBy('id')
            .getMany();
        const sections = await entityManager
            .createQueryBuilder(BibleSection, 'section')
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
        const entityManager = await this.pEntityManager;
        const lastPhrase = await entityManager.find(BiblePhrase, {
            where: { id: Raw(col => generatePhraseIdSql(reference, col)) },
            order: { id: 'DESC' },
            take: 1,
            select: ['id']
        });
        return lastPhrase.length ? parsePhraseId(lastPhrase[0].id).phraseNum! + 1 : 1;
    }

    async getPhrases(range: IBibleReferenceRangeNormalized | IBibleReferenceRangeVersion) {
        const entityManager = await this.pEntityManager;
        const normalizedRange =
            range.isNormalized === true
                ? <IBibleReferenceRangeNormalized>range
                : await this.getNormalizedReferenceRange(range);
        return entityManager.find(BiblePhrase, {
            where: { id: Raw(col => generatePhraseIdSql(normalizedRange, col)) },
            order: { id: 'ASC' },
            relations: ['notes', 'crossReferences']
        });
    }

    async getRawVersionData(versionId: number) {
        const entityManager = await this.pEntityManager;
        const version: IBibleVersion = await entityManager
            .findOne(BibleVersion, versionId)
            .then(generateMinimizedDbObject);
        const books: IBibleBook[] = await entityManager
            .find(BibleBook, { where: { versionId }, order: { number: 'ASC' } })
            .then(generateMinimizedDbObjects);
        const bookData: { book: IBibleBook; content: IBibleContent[] }[] = [];
        for (const book of books) {
            bookData.push({
                book,
                content: await this.getFullDataForReferenceRange({
                    queryVersion: version.version,
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
        versionBook?: BibleBook
    ): Promise<IBibleReferenceRange> {
        if (!versionBook) {
            const entityManager = await this.pEntityManager;
            versionBook = await entityManager.findOne(BibleBook, {
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
        const entityManager = await this.pEntityManager;

        const versionDb = await entityManager.findOne(BibleVersion, { version });
        this.currentVersion = versionDb;
    }

    private async addBibleBookContent(
        contents: IBibleContentForInput[],
        book: IBibleBook,
        context: BibleBookPlaintext,
        state: {
            modifierState: PhraseModifiers;
            columnModifierState: { quoteWho?: string; person?: string };
            sectionLevel: number;
            recursionLevel: number;
            phraseStack: BiblePhrase[];
            paragraphStack: BibleParagraph[];
            sectionStack: BibleSection[];
            usedRefIds: Set<number>;
            currentVersionChapter: number;
            currentVersionVerse: number;
            currentVersionSubverse?: number;
            currentPhraseNum: number;
            currentNormalizedReference?: IBibleReferenceNormalized;
            currentSourceTypeId?: number;
            currentJoinToRefId?: number;
        } = {
            modifierState: { quoteLevel: 0, indentLevel: 0 },
            columnModifierState: {},
            sectionLevel: 0,
            recursionLevel: 0,
            phraseStack: [],
            paragraphStack: [],
            sectionStack: [],
            usedRefIds: new Set(),
            currentPhraseNum: 0,
            currentVersionChapter: 0,
            currentVersionVerse: -1,
            currentVersionSubverse: 0
        }
    ): Promise<{ firstPhraseId: number | undefined; lastPhraseId: number | undefined }> {
        const entityManager = await this.pEntityManager;
        let firstPhraseId: number | undefined, lastPhraseId: number | undefined;
        for (const content of contents) {
            if (content.type === 'phrase') {
                // does this phrase start a new (sub-)verse? if yes, we need to look for v11n-rules
                // and determine the normalized numbering. if needed we also need to create empty
                // verses (if a verse of the standard version does not exist in our source version
                // or when one source verse is a verse range in the standard version)
                // also: this updates all the current* attributes on the state object
                if (
                    !state.currentNormalizedReference ||
                    content.versionChapterNum !== state.currentVersionChapter ||
                    content.versionVerseNum !== state.currentVersionVerse ||
                    content.versionSubverseNum !== state.currentVersionSubverse
                ) {
                    state.currentVersionChapter = content.versionChapterNum;
                    state.currentVersionVerse = content.versionVerseNum;
                    state.currentVersionSubverse = content.versionSubverseNum;
                    state.currentJoinToRefId = undefined;
                    state.currentSourceTypeId = undefined;
                    // currentPhraseNum will be dealt with on the basis of the normalized numbers

                    let nRef: IBibleReferenceNormalized | undefined;

                    if (content.normalizedReference) {
                        state.currentJoinToRefId = content.joinToRefId;
                        state.currentSourceTypeId = content.sourceTypeId;
                        nRef = {
                            ...content.normalizedReference,
                            bookOsisId: book.osisId,
                            isNormalized: true
                        };
                    } else {
                        const reference = {
                            versionId: book.versionId,
                            bookOsisId: book.osisId,
                            versionChapterNum: content.versionChapterNum,
                            versionVerseNum: content.versionVerseNum,
                            versionSubverseNum: content.versionSubverseNum
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
                            state.currentSourceTypeId = rule.sourceTypeId;

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

                                state.phraseStack.push(
                                    new BiblePhrase(
                                        emptyPhrase,
                                        emptyPhraseReference,
                                        state.modifierState
                                    )
                                );
                            } else if (rule.action === 'Renumber verse') {
                                // only the first standardRef is relevant for creating the
                                // normalized reference for this phrase. Additional refs occur when
                                // the sourceRef generates a range. we create an empty phrase for
                                // each of them and keep track of last ref of the range to link the
                                // content-phrase to it laster
                                if (firstStandardRefId)
                                    throw new Error(
                                        `v11n: trying to renumber an already renumbered ref`
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

                                state.phraseStack.push(
                                    new BiblePhrase(
                                        emptyPhrase,
                                        // this is set to the standardRef of the current rule
                                        // above
                                        emptyPhraseReference,
                                        state.modifierState
                                    )
                                );

                                // the last standardRefId in this range needs to be linked on the
                                // starting verse of the range
                                if (
                                    !state.currentJoinToRefId ||
                                    state.currentJoinToRefId < rule.standardRefId
                                )
                                    state.currentJoinToRefId = rule.standardRefId;
                            }
                        }

                        // no rule updpated the numbering
                        if (!nRef) nRef = generateNormalizedReferenceFromVersionRange(reference);
                    }

                    if (
                        state.currentNormalizedReference &&
                        nRef.normalizedChapterNum ===
                            state.currentNormalizedReference.normalizedChapterNum &&
                        nRef.normalizedVerseNum ===
                            state.currentNormalizedReference.normalizedVerseNum &&
                        nRef.normalizedSubverseNum ===
                            state.currentNormalizedReference.normalizedSubverseNum
                    ) {
                        state.currentPhraseNum++;
                    } else {
                        const newRefId = generateReferenceId(nRef);
                        if (state.usedRefIds.has(newRefId))
                            throw new Error(
                                `normalization caused the duplicate reference ${newRefId} - this ` +
                                    `is caused by inconsistencies in the v11n rules and would ` +
                                    `cause the reference to be overwritten`
                            );

                        state.usedRefIds.add(newRefId);
                        state.currentPhraseNum = 1;
                        state.currentNormalizedReference = nRef;
                    }
                    // end new version verse handling
                } else {
                    state.currentPhraseNum++;
                }

                if (
                    !state.currentNormalizedReference.normalizedChapterNum ||
                    !state.currentNormalizedReference.normalizedVerseNum
                )
                    throw new Error(`can't add phrases: normalisation failed`);

                // we are using a phraseStack to improve performance when adding to the database
                const phraseRef: Required<IBiblePhraseRef> = {
                    isNormalized: true,
                    bookOsisId: book.osisId,
                    normalizedChapterNum: state.currentNormalizedReference.normalizedChapterNum,
                    normalizedVerseNum: state.currentNormalizedReference.normalizedVerseNum,
                    normalizedSubverseNum:
                        state.currentNormalizedReference.normalizedSubverseNum || 0,
                    versionId: book.versionId,
                    phraseNum: state.currentPhraseNum
                };
                const phraseId = generatePhraseId(phraseRef);
                if (!firstPhraseId) firstPhraseId = phraseId;
                lastPhraseId = phraseId;

                if (state.columnModifierState.quoteWho)
                    content.quoteWho = state.columnModifierState.quoteWho;
                if (state.columnModifierState.person)
                    content.person = state.columnModifierState.person;
                if (state.currentJoinToRefId) content.joinToRefId = state.currentJoinToRefId;
                if (state.currentSourceTypeId) content.sourceTypeId = state.currentSourceTypeId;

                state.phraseStack.push(new BiblePhrase(content, phraseRef, state.modifierState));
            } else if (content.type === 'group' && content.groupType !== 'paragraph') {
                const backupModifierState = { ...state.modifierState };
                const backupColumnModifierState = { ...state.columnModifierState };

                if (content.groupType === 'quote') {
                    if (!state.modifierState.quoteLevel) state.modifierState.quoteLevel = 0;
                    state.modifierState.quoteLevel++;
                    state.columnModifierState.quoteWho = content.modifier;
                } else if (content.groupType === 'indent') {
                    if (!state.modifierState.indentLevel) state.modifierState.indentLevel = 0;
                    state.modifierState.indentLevel++;
                } else if (content.groupType === 'bold') state.modifierState.bold = true;
                else if (content.groupType === 'divineName') state.modifierState.divineName = true;
                else if (content.groupType === 'emphasis') state.modifierState.emphasis = true;
                else if (content.groupType === 'italic') state.modifierState.italic = true;
                else if (content.groupType === 'title') state.modifierState.title = true;
                else if (content.groupType === 'translationChange')
                    state.modifierState.translationChange = content.modifier;
                else if (content.groupType === 'person')
                    state.columnModifierState.person = content.modifier;
                else if (content.groupType === 'orderedListItem')
                    state.modifierState.orderedListItem = content.modifier;
                else if (content.groupType === 'unorderedListItem')
                    state.modifierState.orderedListItem = content.modifier;
                state.recursionLevel++;
                const {
                    firstPhraseId: groupFirstPhraseId,
                    lastPhraseId: groupLastPhraseId
                } = await this.addBibleBookContent(content.contents, book, context, state);
                state.recursionLevel--;
                if (groupFirstPhraseId && !firstPhraseId) firstPhraseId = groupFirstPhraseId;
                if (groupLastPhraseId) lastPhraseId = groupLastPhraseId;

                state.modifierState = backupModifierState;
                state.columnModifierState = backupColumnModifierState;
            } else if (
                (content.type === 'group' && content.groupType === 'paragraph') ||
                content.type === 'section'
            ) {
                if (content.type === 'section') state.sectionLevel++;

                state.recursionLevel++;
                let {
                    firstPhraseId: sectionFirstPhraseId,
                    lastPhraseId: sectionLastPhraseId
                } = await this.addBibleBookContent(content.contents, book, context, state);
                state.recursionLevel--;

                if (sectionFirstPhraseId && sectionLastPhraseId) {
                    if (content.type === 'group' && content.groupType === 'paragraph') {
                        state.paragraphStack.push(
                            new BibleParagraph(
                                book.versionId,
                                sectionFirstPhraseId,
                                sectionLastPhraseId
                            )
                        );
                    } else if (content.type === 'section') {
                        state.sectionStack.push(
                            new BibleSection({
                                versionId: book.versionId,
                                phraseStartId: sectionFirstPhraseId,
                                phraseEndId: sectionLastPhraseId,
                                level: state.sectionLevel,
                                title: content.title,
                                crossReferences: content.crossReferences,
                                description: content.description
                            })
                        );
                    }

                    if (!firstPhraseId) firstPhraseId = sectionFirstPhraseId;
                    lastPhraseId = sectionLastPhraseId;
                }

                if (content.type === 'section') state.sectionLevel--;
            }
        }

        if (state.recursionLevel === 0) {
            // we are at the end of the root method => persist everything
            await entityManager.save(state.phraseStack, { chunk: state.phraseStack.length / 500 });
            await entityManager.save(state.paragraphStack);
            await entityManager.save(state.sectionStack);
        }

        return { firstPhraseId, lastPhraseId };
    }

    private async addBook(book: IBibleBook) {
        const entityManager = await this.pEntityManager;
        return await entityManager.save(new BibleBook(book));
    }

    private async getBookForVersionReference({ versionId, bookOsisId }: IBibleReferenceVersion) {
        const entityManager = await this.pEntityManager;
        const where = { osisId: bookOsisId, versionId };

        return entityManager.findOne(BibleBook, { where });
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

        const entityManager = await this.pEntityManager;
        // const phraseStart = await entityManager.findOne(BiblePhrase, {
        //     where: {
        //         id: Raw(col => generatePhraseIdSql(pontentialNormalizedRange, col)),
        //         versionChapterNum: range.versionChapterNum,
        //         // if there was no verseNum we would have returned above already
        //         versionVerseNum: range.versionVerseNum
        //     }
        // });

        const { phraseIdStart } = await entityManager
            .createQueryBuilder(BiblePhrase, 'phrase')
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
            const { phraseIdEnd } = await entityManager
                .createQueryBuilder(BiblePhrase, 'phrase')
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
        const entityManager = await this.pEntityManager;
        return entityManager.find(V11nRule, {
            where: {
                sourceRefId: Raw(col =>
                    generateReferenceIdSql(generateNormalizedReferenceFromVersionRange(range), col)
                )
            },
            order: { id: 'ASC' }
        });
    }

    private async normalizeCrossReferencesForVersion(versionId: number) {
        const entityManager = await this.pEntityManager;
        // go through each bible book seperately
        for (const book of await entityManager.find(BibleBook)) {
            // fetch all cross reference for that version and book
            for (const cRef of await entityManager.find(BibleCrossReference, {
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
                entityManager.save(cRef);
            }
        }
    }
}
