import { getBookGenericIdFromOsisId, getOsisIdFromBookGenericId } from './data/bibleMeta';
import {
    IBiblePhraseRef,
    IBibleReferenceNormalized,
    IBibleReferenceRangeNormalized
} from './models/BibleReference.interface';

/**
 * encodes a normalized reference object into an integer to use in database operations
 * @param {IBibleReferenceNormalized} reference
 * @returns {number}
 */
export const generateReferenceId = (reference: IBibleReferenceNormalized): number => {
    let refId = pad(getBookGenericIdFromOsisId(reference.bookOsisId), 2);
    if (reference.normalizedChapterNum) refId += '' + pad(reference.normalizedChapterNum, 3);
    else refId += '000';
    if (reference.normalizedVerseNum) refId += '' + pad(reference.normalizedVerseNum, 3);
    else refId += '000';
    return +refId;
};

/**
 * encodes a bible phrase reference object into an integer to use in database operations
 * @param {IBiblePhraseRef} reference
 * @returns {number}
 */
export const generatePhraseId = (reference: IBiblePhraseRef): number => {
    let refId = '' + generateReferenceId(reference);
    if (reference.versionId) refId += '' + pad(reference.versionId, 3);
    else refId += '000';
    if (reference.phraseNum) refId += '' + pad(reference.phraseNum, 2);
    else refId += '00';
    return +refId;
};

/**
 * generates SQL for a range-query on the id of the phrases table
 *
 * @param {IBibleReferenceRangeNormalized} range
 * @param {string} [col='id']
 * @returns {string} SQL
 */
export const generatePhraseIdSql = (range: IBibleReferenceRangeNormalized, col = 'id') => {
    const refEnd: IBiblePhraseRef = {
        isNormalized: true,
        bookOsisId: range.bookOsisId,
        normalizedChapterNum: range.normalizedChapterEndNum || range.normalizedChapterNum || 999,
        normalizedVerseNum:
            range.normalizedVerseEndNum ||
            (range.normalizedVerseNum && !range.normalizedChapterEndNum)
                ? range.normalizedVerseNum
                : 999,
        versionId: range.versionId || 999,
        phraseNum: 99
    };
    let sql = `${col} BETWEEN '${generatePhraseId(range)}' AND '${generatePhraseId(refEnd)}'`;

    // if we query for more than just one verse in a specific version we need to filter out the
    // version with a little math (due to the nature of our encoded reference integers)
    if (
        range.versionId &&
        !// condition for a query for a single verse
        (
            !!range.normalizedChapterNum &&
            !!range.normalizedVerseNum &&
            ((range.normalizedChapterNum === range.normalizedChapterEndNum &&
                range.normalizedVerseNum === range.normalizedVerseEndNum) ||
                (!range.normalizedChapterEndNum && !range.normalizedVerseEndNum))
        )
    )
        sql += `AND cast(${col} % 100000000000 / 100000000 as int) = ${range.versionId}`;

    return sql;
};

/**
 * generates SQL for a range-query for reference ids
 *
 * @param {IBibleReferenceRangeNormalized} range
 * @param {string} [col='id']
 * @returns {string} SQL
 */
export const generateReferenceIdSql = (range: IBibleReferenceRangeNormalized, col = 'id') => {
    const refEnd: IBibleReferenceRangeNormalized = {
        isNormalized: true,
        bookOsisId: range.bookOsisId,
        normalizedChapterNum: range.normalizedChapterEndNum || range.normalizedChapterNum || 999,
        normalizedVerseNum:
            range.normalizedVerseEndNum ||
            (range.normalizedVerseNum && !range.normalizedChapterEndNum)
                ? range.normalizedVerseNum
                : 999
    };
    let sql = `${col} BETWEEN '${generateReferenceId(range)}' AND '${generateReferenceId(refEnd)}'`;

    return sql;
};

/**
 * generates a random uppercase char
 * @returns {string}
 */
export function generateRandomChar(): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // abcdefghijklmnopqrstuvwxyz0123456789
    return possible.charAt(Math.floor(Math.random() * possible.length));
}

/**
 * returns a zero-padded string of a number
 * @param {number} n the number to be padded
 * @param {number} width the length or the resulting string
 * @param {string} [z='0'] padding character
 * @returns {string}
 */
export function pad(n: number, width: number, z?: string): string {
    z = z || '0';
    let nStr = n + '';
    return nStr.length >= width ? nStr : new Array(width - nStr.length + 1).join(z) + n;
}

/**
 * parses a database reference id into a normalized bible reference object
 * @param {number} id
 * @returns {IBibleReferenceNormalized}
 */
export const parseReferenceId = (id: number): IBibleReferenceNormalized => {
    let _id = id;
    const normalizedVerseNum = _id % 1000;
    _id -= normalizedVerseNum;
    _id /= 1000;
    const normalizedChapterNum = _id % 1000;
    _id -= normalizedChapterNum;
    _id /= 1000;
    const normalizedBookNum = _id;

    return {
        isNormalized: true,
        bookOsisId: getOsisIdFromBookGenericId(normalizedBookNum),
        normalizedChapterNum,
        normalizedVerseNum
    };
};

/**
 * parses a database phrase id into a bible phrase reference object
 * @param {number} id database phrase id
 * @returns {IBiblePhraseRef}
 */
export const parsePhraseId = (id: number): IBiblePhraseRef => {
    let _id = id;

    const phraseNum = _id % 100;
    _id -= phraseNum;
    _id /= 100;
    const versionId = _id % 1000;
    _id -= versionId;
    _id /= 1000;

    return {
        ...parseReferenceId(_id),
        versionId,
        phraseNum
    };
};
