import { IBiblePhraseRef, IBibleReferenceRangeNormalized } from '../models';
import {
    generateEndReferenceFromRange,
    generatePhraseId,
    generateReferenceId,
    MAX_CHAPTER_NUMBER,
    MAX_SUBVERSE_NUMBER,
    MAX_VERSE_NUMBER,
} from './reference.functions';

/**
 * generates SQL for a range-query on the section table
 */
export const generateBookSectionsSql = (
    range: IBibleReferenceRangeNormalized,
    tableAlias: string
) => {
    const bookPhraseIdStart = generatePhraseId({
        bookOsisId: range.bookOsisId,
        isNormalized: true,
    });
    const bookPhraseIdEnd = generatePhraseId({
        bookOsisId: range.bookOsisId,
        normalizedChapterNum: MAX_CHAPTER_NUMBER,
        isNormalized: true,
    });

    const colVersion = `${tableAlias}.versionId`;
    const colSectionStart = `${tableAlias}.phraseStartId`;
    const colSectionEnd = `${tableAlias}.phraseEndId`;
    let sql = '';

    if (range.versionId) sql += `${colVersion} = ${range.versionId} AND `;

    sql += `${colSectionStart} >= ${bookPhraseIdStart} AND ${colSectionEnd} <= ${bookPhraseIdEnd}`;

    // [REFERENCE] we added the versionId column to the sections table, so we don't need to query
    //             the version via the phraseIds. Since this is not stable, we leave the code for
    //             reference.
    // // if we query for a specific version we need to filter out the
    // // version with a little math (due to the nature of our encoded reference integers)
    // if (range.versionId)
    //     sql += `AND cast(${colSectionStart} % 100000000000 / 100000000 as int) = ${
    //         range.versionId
    //     }`;

    return sql;
};

/**
 * generates SQL-WHERE to filter for all paragraphs "in touch" with the range
 */
export const generateParagraphSql = (
    range: IBibleReferenceRangeNormalized & { versionId: number },
    tableAlias: string
) => {
    const refEnd: IBiblePhraseRef = generateEndReferenceFromRange(range);
    const bookPhraseIdStart = generatePhraseId({
        versionId: range.versionId,
        bookOsisId: range.bookOsisId,
        isNormalized: true,
    });
    const bookPhraseIdEnd = generatePhraseId({
        versionId: range.versionId,
        bookOsisId: range.bookOsisId,
        normalizedChapterNum: 999,
        normalizedVerseNum: 999,
        normalizedSubverseNum: 99,
        isNormalized: true,
    });

    const rangePhraseIdStart = generatePhraseId(range);
    const rangePhraseIdEnd = generatePhraseId(refEnd);

    const colVersion = `${tableAlias}.versionId`;
    const colParagraphStart = `${tableAlias}.phraseStartId`;
    const colParagraphEnd = `${tableAlias}.phraseEndId`;

    // we first filter for the book since the table is indexed by `versionId, phraseStartId,
    // phraseEndId`. otherwise the query or `phraseEndId` would not use the index efficiently.
    // as it is, the query will select all book paragraphs first and then filter for our range.
    //
    // the three conditions select:
    // - paragraphs that start within the range
    // - paragraphs that end within the range
    // - paragraphs that wrap around the range

    return `( 
        ${colVersion} = ${range.versionId} AND ${colParagraphStart} >= ${bookPhraseIdStart} AND ${colParagraphEnd} <= ${bookPhraseIdEnd} AND (
            (${colParagraphStart} >= ${rangePhraseIdStart} AND ${colParagraphStart} <= ${rangePhraseIdEnd}) OR
            (${colParagraphEnd} >= ${rangePhraseIdStart} AND ${colParagraphEnd} <= ${rangePhraseIdEnd}) OR
            (${colParagraphStart} < ${rangePhraseIdStart} AND ${colParagraphEnd} > ${rangePhraseIdEnd})
        )
    )`;
};

/**
 * generates SQL for a range-query on the id of the phrases table
 */
export const generatePhraseIdSql = (range: IBibleReferenceRangeNormalized, tableAlias: string) => {
    const refEnd = generateEndReferenceFromRange(range);
    let sql = `${tableAlias}.id BETWEEN '${generatePhraseId(range)}' AND '${generatePhraseId(
        refEnd
    )}'`;

    // if we query for a specific version we need to filter out the
    // version with a little math (due to the nature of our encoded reference integers)
    if (range.versionId) sql += 'AND ' + generatePhraseIdVersionSql(range.versionId, tableAlias); //, col);

    return sql;
};

/**
 * generates SQL-WHERE for the mod-query on the phraseId-integer to filter for a specific version
 */
export const generatePhraseIdVersionSql = (versionId: number, tableAlias: string) =>
    // `cast(${col} % 100000 / 100 as UNSIGNED) = ${versionId}`;
    `${tableAlias}.versionId = ${versionId}`;

/**
 * generates SQL for a range-query for reference ids
 */
export const generateReferenceIdSql = (range: IBibleReferenceRangeNormalized, col = 'id') => {
    const refStart: IBibleReferenceRangeNormalized = {
        ...range,
        normalizedSubverseNum:
            range.normalizedChapterNum && range.normalizedVerseNum
                ? range.normalizedSubverseNum ?? 0
                : undefined,
    };
    const refEnd: IBibleReferenceRangeNormalized = {
        isNormalized: true,
        bookOsisId: range.bookOsisId,
        normalizedChapterNum:
            range.normalizedChapterEndNum || range.normalizedChapterNum || MAX_CHAPTER_NUMBER,
        normalizedVerseNum: range.normalizedVerseEndNum
            ? range.normalizedVerseEndNum
            : range.normalizedVerseNum && !range.normalizedChapterEndNum
            ? range.normalizedVerseNum
            : MAX_VERSE_NUMBER,
        normalizedSubverseNum:
            typeof range.normalizedSubverseEndNum === 'number' &&
            !isNaN(range.normalizedSubverseEndNum)
                ? range.normalizedSubverseEndNum
                : typeof range.normalizedSubverseNum === 'number' &&
                  !isNaN(range.normalizedSubverseNum) &&
                  !range.normalizedChapterEndNum &&
                  !range.normalizedVerseEndNum
                ? range.normalizedSubverseNum
                : MAX_SUBVERSE_NUMBER,
    };
    let sql = `${col} BETWEEN '${generateReferenceId(refStart)}' AND '${generateReferenceId(
        refEnd
    )}'`;

    return sql;
};
