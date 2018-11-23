import 'reflect-metadata';
import { createConnection, ConnectionOptions, Raw, EntityManager } from 'typeorm';

import {
    ENTITIES,
    BibleVersion,
    BiblePhrase,
    BibleBook,
    BibleSection,
    IBibleReferenceRange,
    IBibleReference,
    BibleCrossReference,
    IBibleBookWithContent,
    IBibleBook,
    BibleInput,
    BibleBookPlaintext,
    IBibleReferenceRangeNormalized,
    IBibleReferenceNormalized,
    DictionaryEntry
} from './models';
import {
    parsePhraseId,
    generatePhraseIdSql,
    generateReferenceIdSql,
    generateSectionSql
} from './utils';
import { IBibleOutputFormatted, IBibleFormattingGroup } from './models/BibleOutput.interface';

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

    async addBookWithContent(book: IBibleBookWithContent) {
        const textData = this.getBookPlaintextFromBibleContent(book.content);
        book.chaptersCount = [];
        for (const verses of textData.values()) {
            book.chaptersCount.push(verses.size);
        }
        await this.addBook(book);
        await this.addBibleContent(book.content, textData);
    }

    async addDictionaryEntry(dictionaryEntry: DictionaryEntry) {
        const entityManager = await this.pEntityManager;
        entityManager.save(dictionaryEntry);
    }

    async addVersion(version: BibleVersion) {
        const entityManager = await this.pEntityManager;
        return entityManager.save(version);
    }

    async createCrossReference(refRange: IBibleReferenceRange) {
        return new BibleCrossReference(await this.getNormalizedReferenceRange(refRange));
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

    async getFormattedTextForRange(range: IBibleReferenceRange): Promise<IBibleOutputFormatted> {
        const entityManager = await this.pEntityManager;
        const version = await entityManager.findOne(BibleVersion, range.versionId);
        if (!version) throw new Error(`can't get formatted text: invalid version`);
        const book = await this.getBookForVersionReference(range);
        if (!book) throw new Error(`can't get formatted text: invalid book`);
        const rangeNormalized = range.isNormalized
            ? <IBibleReferenceRangeNormalized>range
            : await this.getNormalizedReferenceRange(range);
        const phrases = await this.getPhrases(rangeNormalized);
        const sections = await entityManager
            .createQueryBuilder(BibleSection, 'section')
            .where(
                generateSectionSql(rangeNormalized, 'section.phraseStartId', 'section.phraseEndId')
            )
            .orderBy('id')
            .getMany();
        const paragraphs: IBibleFormattingGroup[] = [];
        for (const section of sections) {
            // TODO: we skip non-paragraph sections for now
            if (section.level !== 0) continue;
            // TODO: this works only if all phrases are within a paragraph
            const paragraph: IBibleFormattingGroup = {
                type: 'paragraph',
                content: phrases.filter(
                    phrase => phrase.id >= section.phraseStartId && phrase.id <= section.phraseEndId
                )
            };
            paragraphs.push(paragraph);
        }
        return {
            version,
            versionBook: book,
            range: rangeNormalized,
            paragraphs
        };
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

    private async addBibleContent(content: BibleInput, context: BibleBookPlaintext) {
        const entityManager = await this.pEntityManager;
        if (content.type === 'phrases') {
            return this.addPhrases(content.phrases, context);
        } else {
            const newPhrases: BiblePhrase[] = [];
            for (const section of content.sections) {
                let newSectionPhrases: BiblePhrase[];
                if (section.content.type === 'phrases') {
                    newSectionPhrases = await this.addPhrases(section.content.phrases, context);
                } else {
                    newSectionPhrases = await this.addBibleContent(section.content, context);
                }
                const newSection = new BibleSection({
                    phraseStartId: newSectionPhrases[0].id!,
                    phraseEndId: newSectionPhrases[newSectionPhrases.length - 1].id!,
                    level: section.level,
                    title: section.title,
                    crossReferences: section.crossReferences,
                    notes: section.notes
                });
                entityManager.save(newSection);
                newPhrases.push(...newSectionPhrases);
            }
            return newPhrases;
        }
    }

    private async addBook(book: IBibleBook) {
        const entityManager = await this.pEntityManager;
        return await entityManager.save(new BibleBook(book));
    }

    private async addPhrases(phrases: BiblePhrase[], context: BibleBookPlaintext) {
        const entityManager = await this.pEntityManager;
        let verse,
            phraseNum = 0;
        for (const phrase of phrases) {
            if (!phrase.normalizedChapterNum) {
                const {
                    normalizedChapterNum,
                    normalizedVerseNum
                } = await this.getNormalizedReferenceFromV11nRules(phrase, context);
                if (!normalizedChapterNum || !normalizedVerseNum)
                    throw new Error(`can't add phrases: normalisation failed`);
                phrase.normalizedChapterNum = normalizedChapterNum;
                phrase.normalizedVerseNum = normalizedVerseNum;
            }
            if (!verse || verse !== phrase.normalizedVerseNum) {
                verse = phrase.normalizedVerseNum;
                phraseNum = await this.getNextPhraseIdForNormalizedVerseNum(phrase);
            } else {
                phraseNum++;
            }
            phrase.phraseNum = phraseNum;
        }

        return entityManager.save(phrases);
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

    private async getNextPhraseIdForNormalizedVerseNum(
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
            normalizedChapterNum: refPhrase.normalizedChapterNum,
            normalizedVerseNum: refPhrase.normalizedVerseNum
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

    private getBookPlaintextFromBibleContent(
        content: BibleInput,
        _accChapters: BibleBookPlaintext = new Map()
    ) {
        if (content.type === 'phrases') {
            this.getBookPlaintextFromPhrases(content.phrases, _accChapters);
        } else {
            for (const section of content.sections) {
                this.getBookPlaintextFromBibleContent(section.content, _accChapters);
            }
        }
        return _accChapters;
    }

    private getBookPlaintextFromPhrases(
        phrases: BiblePhrase[],
        _accChapters: BibleBookPlaintext = new Map()
    ) {
        for (const phrase of phrases) {
            if (!_accChapters.has(phrase.versionChapterNum))
                _accChapters.set(phrase.versionChapterNum, new Map());
            const chapter = _accChapters.get(phrase.versionChapterNum)!; // we know it's set
            const verse = chapter.has(phrase.versionVerseNum)
                ? chapter.get(phrase.versionVerseNum) + ' ' + phrase.text
                : phrase.text;
            chapter.set(phrase.versionVerseNum, verse);
        }
        return _accChapters;
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
                const normalizedRange = await this.getNormalizedReferenceRange(cRef);
                if (cRef.versionChapterNum)
                    cRef.normalizedChapterNum = normalizedRange.normalizedChapterNum;
                if (cRef.versionVerseNum)
                    cRef.normalizedVerseNum = normalizedRange.normalizedVerseNum;
                if (cRef.versionChapterEndNum)
                    cRef.versionChapterEndNum = normalizedRange.normalizedChapterEndNum;
                if (cRef.versionVerseEndNum)
                    cRef.versionVerseEndNum = normalizedRange.normalizedVerseEndNum;
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
