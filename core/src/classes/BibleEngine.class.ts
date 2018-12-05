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
    BibleParagraph
} from '../entities';
import {
    parsePhraseId,
    generatePhraseIdSql,
    generateReferenceIdSql,
    generateBookSectionsSql,
    getOutputFormattingGroupsForPhrasesAndSections,
    generatePhraseId,
    generateParagraphSql,
    getMinimizedDbObject,
    getMinimizedDbObjects,
    getBibleInputFromOutputData
} from '../utils';
import {
    BibleBookPlaintext,
    IDictionaryEntry,
    IBibleVersion,
    IBibleReferenceRange,
    IBibleOutputRich,
    IBibleReferenceRangeNormalized,
    IBibleBook,
    BookWithContent,
    PhraseModifiers,
    IBibleReference,
    IBibleReferenceNormalized,
    IBiblePhraseRef,
    IBibleInput
} from '../models';

export class BibleEngine {
    currentVersion?: BibleVersion;
    currentVersionMetadata?: BibleBook[];
    pEntityManager: Promise<EntityManager>;

    constructor(dbConfig: ConnectionOptions) {
        this.pEntityManager = createConnection({
            ...dbConfig,
            entities: ENTITIES,
            synchronize: true,
            logging: ['error']
        }).then(conn => conn.manager);
    }

    async addBookWithContent(bookInput: BookWithContent) {
        const textData = this.getBookPlaintextFromBibleContent(bookInput.contents);
        bookInput.book.chaptersCount = [];
        for (const verses of textData.values()) {
            bookInput.book.chaptersCount.push(verses.size);
        }
        await this.addBook(bookInput.book);
        await this.addBibleContent(bookInput.contents, {
            book: bookInput.book,
            context: textData,
            modifierState: { quoteLevel: 0, indentLevel: 0 },
            phraseStack: [],
            paragraphStack: [],
            sectionStack: [],
            currentPhraseNum: 0,
            currentNormalizedChapter: 0,
            currentNormalizedVerse: -1,
            sectionLevel: 0,
            recursionLevel: 0
        });
    }

    async addDictionaryEntry(dictionaryEntry: IDictionaryEntry) {
        const entityManager = await this.pEntityManager;
        entityManager.save(new DictionaryEntry(dictionaryEntry));
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
        range: IBibleReferenceRange & { versionId: number }
    ): Promise<IBibleOutputRich> {
        const entityManager = await this.pEntityManager;

        const version = await entityManager.findOne(BibleVersion, range.versionId);
        if (!version) throw new Error(`can't get formatted text: invalid version`);

        const book = await this.getBookForVersionReference(range);
        if (!book) throw new Error(`can't get formatted text: invalid book`);

        const rangeNormalized = range.isNormalized
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
            .orderBy('id')
            .getMany();

        const context: IBibleOutputRich['context'] = {};
        const contextRanges: IBibleOutputRich['contextRanges'] = {
            paragraph: {},
            section: {},
            chapter: {}
        };

        if (phrases.length) {
            const firstPhraseId = phrases[0].id;
            const lastPhraseId = phrases[phrases.length - 1].id;
            for (const section of sections) {
                if (!context[section.level])
                    context[section.level] = {
                        includedSections: [],
                        previousSections: [],
                        nextSections: []
                    };

                // check if this section wraps the entire range
                if (section.phraseStartId < firstPhraseId && section.phraseEndId > lastPhraseId)
                    context[section.level].wrappingSection = section;
                // check if this section starts or ends within the range
                else if (
                    section.phraseStartId >= firstPhraseId ||
                    section.phraseEndId <= lastPhraseId
                )
                    context[section.level].includedSections.push(section);
                // check if this section is before the range
                else if (section.phraseEndId < firstPhraseId)
                    context[section.level].previousSections.push(section);
                // check if this section is after the range
                else if (section.phraseStartId > lastPhraseId)
                    context[section.level].nextSections.push(section);
            }

            // generate contextRanges
            if (
                paragraphs.length === 1 &&
                (paragraphs[0].phraseStartId < firstPhraseId ||
                    paragraphs[0].phraseEndId > lastPhraseId)
            ) {
                contextRanges.paragraph.completeRange = paragraphs[0].getReferenceRange();
            }
            // TODO: generate next/previous contextRanges for paragraphs
            //       (possibly add a new query method for requesting next/previous sections by
            //        current section id)

            if (context[1] && context[1].wrappingSection) {
                // tslint:disable-next-line:max-line-length
                contextRanges.section.completeRange = context[1].wrappingSection.getReferenceRange();
            }
            if (
                context[1] &&
                context[1].includedSections.length === 1 &&
                (context[1].includedSections[0].phraseStartId < firstPhraseId ||
                    context[1].includedSections[0].phraseEndId > lastPhraseId)
            ) {
                // tslint:disable-next-line:max-line-length
                contextRanges.section.completeRange = context[1].includedSections[0].getReferenceRange();
            }

            if (context[1] && context[1].previousSections.length)
                contextRanges.section.previousRange = context[1].previousSections[
                    context[1].previousSections.length - 1
                ].getReferenceRange();
            if (context[1] && context[1].nextSections.length)
                // tslint:disable-next-line:max-line-length
                contextRanges.section.previousRange = context[1].nextSections[0].getReferenceRange();

            // TODO: generate context ranges for chapter (how to deal with normalization here?)
        }

        return {
            version,
            versionBook: book,
            range: rangeNormalized,
            content: getOutputFormattingGroupsForPhrasesAndSections(phrases, paragraphs, context),
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

    async getPhrases(range: IBibleReferenceRange) {
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
            .then(getMinimizedDbObject);
        const books: IBibleBook[] = await entityManager
            .find(BibleBook, { where: { versionId }, order: { number: 'ASC' } })
            .then(getMinimizedDbObjects);
        const bookData: { book: IBibleBook; content: IBibleInput[] }[] = [];
        for (const book of books) {
            bookData.push({
                book,
                content: await this.getFullDataForReferenceRange({
                    versionId,
                    bookOsisId: book.osisId
                }).then(fullData => getBibleInputFromOutputData(fullData.content.contents))
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
        range: IBibleReferenceRange
    ): Promise<IBibleReferenceRange> {
        const entityManager = await this.pEntityManager;
        const versionBook = await entityManager.findOne(BibleBook, {
            where: { versionId: range.versionId, osisId: range.bookOsisId }
        });
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
        return {
            versionId: range.versionId,
            bookOsisId: range.bookOsisId,
            versionChapterNum: range.versionChapterNum || 1,
            versionChapterEndNum,
            versionVerseNum: range.versionVerseNum || 1,
            versionVerseEndNum:
                range.versionVerseEndNum || versionBook.getChapterVerseCount(versionChapterEndNum)
        };
    }

    async setVersion(version: string) {
        const entityManager = await this.pEntityManager;

        const versionDb = await entityManager.findOne(BibleVersion, { version });
        this.currentVersion = versionDb;
    }

    private async addBibleContent(
        contents: IBibleInput[],
        state: {
            book: IBibleBook;
            context: BibleBookPlaintext;
            modifierState: PhraseModifiers;
            phraseStack: BiblePhrase[];
            paragraphStack: BibleParagraph[];
            sectionStack: BibleSection[];
            currentNormalizedChapter: number;
            currentNormalizedVerse: number;
            currentPhraseNum: number;
            sectionLevel: number;
            recursionLevel: number;
        }
    ): Promise<{ firstPhraseId: number | undefined; lastPhraseId: number | undefined }> {
        const entityManager = await this.pEntityManager;
        let firstPhraseId: number | undefined, lastPhraseId: number | undefined;
        for (const content of contents) {
            if (content.type === 'phrase') {
                const nRef = await this.getNormalizedReferenceFromV11nRules(
                    {
                        versionId: state.book.versionId,
                        bookOsisId: state.book.osisId,
                        versionChapterNum: content.versionChapterNum,
                        versionVerseNum: content.versionVerseNum
                    },
                    state.context
                );
                if (!nRef.normalizedChapterNum || !nRef.normalizedVerseNum)
                    throw new Error(`can't add phrases: normalisation failed`);

                if (
                    nRef.normalizedChapterNum === state.currentNormalizedChapter &&
                    nRef.normalizedVerseNum === state.currentNormalizedVerse
                ) {
                    state.currentPhraseNum++;
                } else {
                    // chapter switch?
                    // if (
                    //     nRef.normalizedChapterNum !== state.currentNormalizedChapter &&
                    //     state.phraseStack.length
                    // ) {
                    //     // we save the stack for each chapter (otherwise it might become too big)
                    //     // RADAR: test if we have to save more often (low-mem devices?)
                    //     entityManager.save(state.phraseStack);
                    //     state.phraseStack = [];
                    // }

                    state.currentPhraseNum = 1;
                    state.currentNormalizedChapter = nRef.normalizedChapterNum;
                    state.currentNormalizedVerse = nRef.normalizedVerseNum;

                    /*
                     * RADAR: we disable the following block since we actually don't want content
                     *        from the same verse in the same version be saved in two instances.
                     *        Let's rather have a db-uniqe error then to know something went bad.
                     *        For now, we leave the code for reference.

                    // since we have a verse switch we check if there are already phrases for this
                    // verse and version in the database and fetch the next phraseNum accordingly
                    state.currentPhraseNum = await this.getNextPhraseNumForNormalizedVerseNum(nRef);
                    */
                }

                // we are using a phraseStack to improve performance when adding to the database
                const phraseRef: Required<IBiblePhraseRef> = {
                    isNormalized: true,
                    bookOsisId: state.book.osisId,
                    normalizedChapterNum: nRef.normalizedChapterNum,
                    normalizedVerseNum: nRef.normalizedVerseNum,
                    versionId: state.book.versionId,
                    phraseNum: state.currentPhraseNum
                };
                const phraseId = generatePhraseId(phraseRef);
                if (!firstPhraseId) firstPhraseId = phraseId;
                lastPhraseId = phraseId;

                state.phraseStack.push(new BiblePhrase(content, phraseRef, state.modifierState));
            } else if (content.type === 'group' && content.groupType !== 'paragraph') {
                const backupModifierState = { ...state.modifierState };

                if (content.groupType === 'quote') {
                    state.modifierState.quoteLevel++;
                    state.modifierState.quoteWho = content.modifier;
                } else if (content.groupType === 'indent') state.modifierState.indentLevel++;
                else if (content.groupType === 'bold') state.modifierState.bold = true;
                else if (content.groupType === 'divineName') state.modifierState.divineName = true;
                else if (content.groupType === 'emphasis') state.modifierState.emphasis = true;
                else if (content.groupType === 'italic') state.modifierState.italic = true;
                else if (content.groupType === 'translationChange')
                    state.modifierState.translationChange = content.modifier;
                else if (content.groupType === 'person')
                    state.modifierState.person = content.modifier;
                else if (content.groupType === 'listItem')
                    state.modifierState.listItem = content.modifier;
                state.recursionLevel++;
                const {
                    firstPhraseId: groupFirstPhraseId,
                    lastPhraseId: groupLastPhraseId
                } = await this.addBibleContent(content.contents, state);
                state.recursionLevel--;
                if (groupFirstPhraseId && !firstPhraseId) firstPhraseId = groupFirstPhraseId;
                if (groupLastPhraseId) lastPhraseId = groupLastPhraseId;

                state.modifierState = backupModifierState;
            } else if (
                (content.type === 'group' && content.groupType === 'paragraph') ||
                content.type === 'section'
            ) {
                if (content.type === 'section') state.sectionLevel++;

                state.recursionLevel++;
                let {
                    firstPhraseId: sectionFirstPhraseId,
                    lastPhraseId: sectionLastPhraseId
                } = await this.addBibleContent(content.contents, state);
                state.recursionLevel--;

                if (sectionFirstPhraseId && sectionLastPhraseId) {
                    if (content.type === 'group' && content.groupType === 'paragraph') {
                        state.paragraphStack.push(
                            new BibleParagraph(
                                state.book.versionId,
                                sectionFirstPhraseId,
                                sectionLastPhraseId
                            )
                        );
                    } else if (content.type === 'section') {
                        state.sectionStack.push(
                            new BibleSection({
                                versionId: state.book.versionId,
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

    private async getBookForVersionReference({ versionId, bookOsisId }: IBibleReference) {
        const entityManager = await this.pEntityManager;
        return entityManager.findOne(BibleBook, {
            where: {
                versionId,
                osisId: bookOsisId
            }
        });
    }

    private getBookPlaintextFromBibleContent(
        contents: IBibleInput[],
        _accChapters: BibleBookPlaintext = new Map()
    ) {
        for (const content of contents) {
            if (content.type !== 'phrase')
                this.getBookPlaintextFromBibleContent(content.contents, _accChapters);
            else {
                if (!_accChapters.has(content.versionChapterNum))
                    _accChapters.set(content.versionChapterNum, new Map());
                const chapter = _accChapters.get(content.versionChapterNum)!; // we know it's set
                const verse = chapter.has(content.versionVerseNum)
                    ? chapter.get(content.versionVerseNum) + ' ' + content.content
                    : content.content;
                chapter.set(content.versionVerseNum, verse);
            }
        }

        return _accChapters;
    }

    private getContextRangeForVersionRange({
        versionId,
        bookOsisId,
        versionChapterNum,
        versionChapterEndNum
    }: IBibleReferenceRange): IBibleReferenceRange {
        const contextRange: IBibleReferenceRange = {
            versionId,
            bookOsisId
        };
        if (versionChapterNum) {
            // our queries are graceful with out of bounds references, so we don't bother looking
            // at the version metadata here for number of chapters and verses
            contextRange.versionChapterNum = versionChapterNum > 1 ? versionChapterNum - 1 : 1;
            contextRange.versionChapterEndNum = versionChapterEndNum
                ? versionChapterEndNum + 1
                : versionChapterNum + 1;
            contextRange.versionVerseNum = 1;
            contextRange.versionVerseEndNum = 999;
        }
        return contextRange;
    }

    // we excpect this to be an async method in the future
    // - to not break code then we make it async already
    private async getNormalizedReference(
        reference: IBibleReference
    ): Promise<IBibleReferenceNormalized> {
        if (reference.isNormalized) return <IBibleReferenceNormalized>reference;
        // if reference has not data that can cause normalisation changes, return the reference
        // (-range) right away
        if (
            !reference.versionId ||
            !reference.versionChapterNum ||
            !reference.versionVerseNum // RADAR: is it safe to return here if no versionVerse?
        )
            return this.getNormalizedReferenceFromVersionNumbers(reference);

        // RADAR: test if it is really faster to check for the existence of v11n rules for this
        // reference before looking into the phrases table
        const normalisationRules = await this.getNormalisationRulesForReference(reference);

        // there are no rules for this reference(-range) than can cause normalisation changes
        if (!normalisationRules.length)
            return this.getNormalizedReferenceFromVersionNumbers(reference);

        // see if we already have the reference in the database
        const referenceContextRange = this.getContextRangeForVersionRange(reference);
        const entityManager = await this.pEntityManager;
        const refPhrase = await entityManager.findOne(BiblePhrase, {
            where: {
                id: Raw(col =>
                    generatePhraseIdSql(
                        {
                            isNormalized: true,
                            bookOsisId: reference.bookOsisId,
                            normalizedChapterNum: referenceContextRange.versionChapterNum,
                            normalizedVerseNum: referenceContextRange.versionVerseNum,
                            normalizedChapterEndNum: referenceContextRange.versionChapterEndNum,
                            normalizedVerseEndNum: referenceContextRange.versionVerseEndNum,
                            versionId: reference.versionId
                        },
                        col
                    )
                ),
                versionChapterNum: reference.versionChapterNum,
                versionVerseNum: reference.versionVerseNum
            }
        });

        if (!refPhrase) throw new Error(`can't get normalized reference: version data not in DB`);

        return {
            ...reference,
            isNormalized: true,
            normalizedChapterNum: refPhrase.normalizedReference.normalizedChapterNum,
            normalizedVerseNum: refPhrase.normalizedReference.normalizedVerseNum
        };
    }

    private async getNormalizedReferenceFromV11nRules(
        reference: IBibleReference,
        context: BibleBookPlaintext
    ): Promise<IBibleReferenceNormalized> {
        if (reference.isNormalized) return <IBibleReferenceNormalized>reference;

        // if reference has not data that can cause normalisation changes or if normalisation data
        // already there, return the reference(-range) right away
        if (
            !reference.versionId ||
            !reference.versionChapterNum ||
            !reference.versionVerseNum // RADAR: is it safe to return here if no versionVerse?
        )
            return this.getNormalizedReferenceFromVersionNumbers(reference);

        const normalisationRules = await this.getNormalisationRulesForReference(reference);

        // there are no rules for this reference(-range) than can cause normalisation changes
        if (!normalisationRules.length)
            return this.getNormalizedReferenceFromVersionNumbers(reference);

        for (const rule of normalisationRules) {
            this.runV11nRuleOnReference(reference, rule, context);
        }

        // TODO: normalize this using the v11n-normalisation data from STEPData
        return this.getNormalizedReferenceFromVersionNumbers(reference);
    }

    private getNormalizedReferenceFromVersionNumbers(
        reference: IBibleReference
    ): IBibleReferenceNormalized {
        return {
            ...reference,
            isNormalized: true,
            normalizedChapterNum: reference.normalizedChapterNum || reference.versionChapterNum,
            normalizedVerseNum: reference.normalizedVerseNum || reference.versionVerseNum
        };
    }

    private async getNormalizedReferenceRange(
        range: IBibleReferenceRange
    ): Promise<IBibleReferenceRangeNormalized> {
        if (range.isNormalized) return <IBibleReferenceRangeNormalized>range;
        const { normalizedChapterNum, normalizedVerseNum } = await this.getNormalizedReference(
            range
        );
        const normRange: IBibleReferenceRangeNormalized = {
            ...range,
            isNormalized: true,
            normalizedChapterNum,
            normalizedVerseNum
        };
        if (range.versionChapterEndNum || range.versionVerseEndNum) {
            const {
                normalizedChapterNum: normalizedChapterEndNum,
                normalizedVerseNum: normalizedVerseEndNum
            } = await this.getNormalizedReference({
                versionId: range.versionId,
                bookOsisId: range.bookOsisId,
                versionChapterNum: range.versionChapterEndNum,
                versionVerseNum: range.versionVerseEndNum
            });
            normRange.normalizedChapterEndNum = normalizedChapterEndNum;
            normRange.normalizedVerseEndNum = normalizedVerseEndNum;
        }

        return normRange;
    }

    private async getNormalisationRulesForReference(_: IBibleReferenceRange) {
        return [];
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
                const normalizedRange = await this.getNormalizedReferenceRange(cRef.range);
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

    private runV11nRuleOnReference(
        reference: IBibleReference,
        rule: any,
        context: BibleBookPlaintext
    ) {
        // TODO: implement
        return !rule || !context ? reference : reference;
    }
}
