import {
    IBibleCrossReference,
    IBiblePhraseRef,
    IBibleReference,
    IBibleReferenceNormalized,
    IBibleReferenceRange,
    IBibleReferenceRangeNormalized,
    IBibleSectionGeneric,
} from '../models';
import { pad } from './utils.functions';
import { getBookGenericIdFromOsisId, getOsisIdFromBookGenericId } from './v11n.functions';

/**
 * generates a bible reference range object with the version properties set such that it includes
 * the previous and next chapter of the given range (if exisiting)
 *
 * @param {IBibleReferenceRange} {
 *     versionId,
 *     bookOsisId,
 *     versionChapterNum,
 *     versionChapterEndNum
 * }
 * @returns {IBibleReferenceRange}
 */
export const generateContextRangeFromVersionRange = ({
    versionId,
    bookOsisId,
    versionChapterNum,
    versionChapterEndNum,
}: IBibleReferenceRange): IBibleReferenceRange => {
    const contextRange: IBibleReferenceRange = {
        versionId,
        bookOsisId,
    };
    if (versionChapterNum) {
        // our queries are graceful with out of bounds references, so we don't bother looking
        // at the version metadata here for number of chapters and verses
        contextRange.versionChapterNum = versionChapterNum > 1 ? versionChapterNum - 1 : 1;
        contextRange.versionChapterEndNum = versionChapterEndNum
            ? versionChapterEndNum + 1
            : versionChapterNum + 1;
        contextRange.versionVerseNum = 0;
        contextRange.versionVerseEndNum = 999;
        contextRange.versionSubverseNum = 0;
        contextRange.versionSubverseEndNum = 99;
    }
    return contextRange;
};

/**
 * generates a bible reference object that references the end part of a range object (note: this
 * does not return correct version end-numbers for chapters or verses, but the max value 999
 * instead)
 *
 * @param {IBibleReferenceRangeNormalized} range
 * @returns {IBiblePhraseRef}
 */
export const generateEndReferenceFromRange = (
    range: IBibleReferenceRangeNormalized
): IBiblePhraseRef => {
    return {
        isNormalized: true,
        bookOsisId: range.bookOsisId,
        normalizedChapterNum: range.normalizedChapterEndNum || range.normalizedChapterNum || 999,
        normalizedVerseNum: range.normalizedVerseEndNum
            ? range.normalizedVerseEndNum
            : range.normalizedVerseNum && !range.normalizedChapterEndNum
            ? range.normalizedVerseNum
            : 999,
        normalizedSubverseNum:
            typeof range.normalizedSubverseEndNum !== 'undefined'
                ? range.normalizedSubverseEndNum
                : typeof range.normalizedSubverseNum !== 'undefined' && !range.normalizedVerseEndNum
                ? range.normalizedSubverseNum
                : 99,
        versionId: range.versionId || 999,
        phraseNum: 99,
    };
};

/**
 * this generates a normalized reference object using the version numbers. This does not do
 * normalization! This should only be used if we know that version numbers are identical to the
 * normalized numbers.
 *
 * @param {IBibleReference} range
 * @returns {IBibleReferenceNormalized}
 */
export const generateNormalizedRangeFromVersionRange = (
    range: IBibleReferenceRange,
    subverseDefault: number | undefined = undefined
): IBibleReferenceRangeNormalized => {
    return {
        ...range,
        isNormalized: true,
        normalizedChapterNum: range.normalizedChapterNum || range.versionChapterNum,
        normalizedVerseNum: range.normalizedVerseNum || range.versionVerseNum,
        normalizedSubverseNum:
            range.normalizedSubverseNum ?? range.versionSubverseNum ?? subverseDefault,
        normalizedChapterEndNum: range.normalizedChapterEndNum || range.versionChapterEndNum,
        normalizedVerseEndNum: range.normalizedVerseEndNum || range.versionVerseEndNum,
        normalizedSubverseEndNum: range.normalizedSubverseEndNum ?? range.versionSubverseEndNum,
    };
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
 * local method to generate an integer reference from osisId, chapter, verse and
 * subverse
 * @param bookNumber
 * @param chapter
 * @param verse
 * @param subverse
 * @returns {number}
 */
const _generateReferenceId = (
    osisId: string,
    chapter?: number,
    verse?: number,
    subverse?: number
) => {
    let refId = pad(getBookGenericIdFromOsisId(osisId), 2);
    if (chapter) refId += '' + pad(chapter, 3);
    else refId += '000';
    if (verse) refId += '' + pad(verse, 3);
    else refId += '000';
    if (typeof subverse === 'number' && !isNaN(subverse)) {
        refId += '' + pad(subverse, 2);
    } else refId += chapter && verse ? '01' : '00';
    return +refId;
};

/**
 * encodes a normalized reference object into an integer to use in database operations
 * @param {IBibleReferenceNormalized} reference
 * @returns {number}
 */
export const generateReferenceId = (reference: IBibleReferenceNormalized): number => {
    return _generateReferenceId(
        reference.bookOsisId,
        reference.normalizedChapterNum,
        reference.normalizedVerseNum,
        reference.normalizedSubverseNum
    );
};

/**
 * encodes a version reference object into an integer to use in database operations
 * @param {IBibleReferenceVersion} reference
 * @returns {number}
 */
export const generateVersionReferenceId = (reference: IBibleReference): number => {
    return _generateReferenceId(
        reference.bookOsisId,
        reference.versionChapterNum,
        reference.versionVerseNum,
        reference.versionSubverseNum
    );
};

/**
 * Generates a range object from two phrase ids
 * @param {number} phraseStartId
 * @param {number} phraseEndId
 * @returns {IBibleReferenceRangeNormalized}
 */
export const generateRangeFromGenericSection = (
    genericSection: IBibleSectionGeneric
): IBibleReferenceRangeNormalized => {
    const refStart = parsePhraseId(genericSection.phraseStartId);
    const refEnd = parsePhraseId(genericSection.phraseEndId);
    return {
        isNormalized: true,
        versionId: refStart.versionId,
        bookOsisId: refStart.bookOsisId,
        normalizedChapterNum: refStart.normalizedChapterNum,
        normalizedVerseNum: refStart.normalizedVerseNum,
        normalizedChapterEndNum: refEnd.normalizedChapterNum,
        normalizedVerseEndNum: refEnd.normalizedVerseNum,
    };
};

/**
 * returns a readable string of the reference range
 *
 * @param {IBibleReferenceRange} range
 * @param {string} bookAbbreviation
 * @param {string} chapterVerseSeparator
 * @returns {string}
 */
export const generateReferenceRangeLabel = (
    range: IBibleReferenceRange,
    bookAbbreviation: string,
    chapterVerseSeparator: string
) => {
    let label = bookAbbreviation;
    if (range.versionChapterNum) label += ` ${range.versionChapterNum}`;
    if (range.versionVerseNum) label += `${chapterVerseSeparator}${range.versionVerseNum}`;
    if (range.versionChapterEndNum || range.versionVerseEndNum) label += '-';
    if (range.versionChapterEndNum && range.versionChapterEndNum !== range.versionChapterNum) {
        label += `${range.versionChapterEndNum}`;
        if (range.versionVerseEndNum) label += chapterVerseSeparator;
    }
    if (range.versionVerseEndNum) label += `${range.versionVerseEndNum}`;
    return label;
};

/**
 * checks if there is any normalized property set (thus it has been normalized) or else if there is
 * no version number set (thus it does not need normalization)
 * @param {IBibleReference} ref
 * @returns {boolean}
 */
export const isReferenceNormalized = (ref: IBibleReference) =>
    // if *ChaperNum is not set we know that there is no other **Num set
    !!ref.normalizedChapterNum || !ref.versionChapterNum;

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
        phraseNum,
    };
};

/**
 * parses a database reference id into a normalized bible reference object
 * @param {number} id
 * @returns {IBibleReferenceNormalized}
 */
export const parseReferenceId = (id: number): IBibleReferenceNormalized => {
    let _id = id;
    const normalizedSubverseNum = _id % 100;
    _id -= normalizedSubverseNum;
    _id /= 100;
    const normalizedVerseNum = _id % 1000;
    _id -= normalizedVerseNum;
    _id /= 1000;
    const normalizedChapterNum = _id % 1000;
    _id -= normalizedChapterNum;
    _id /= 1000;
    const normalizedBookNum = _id;
    const ref: IBibleReferenceNormalized = {
        isNormalized: true,
        bookOsisId: getOsisIdFromBookGenericId(normalizedBookNum),
    };
    if (normalizedChapterNum) ref.normalizedChapterNum = normalizedChapterNum;
    if (normalizedVerseNum) ref.normalizedVerseNum = normalizedVerseNum;
    if (normalizedChapterNum && normalizedVerseNum)
        ref.normalizedSubverseNum = normalizedSubverseNum;

    return ref;
};

/**
 * returns cross reference object with only the necessary data
 * @param {IBibleCrossReference} { key, range, label }
 * @returns {IBibleCrossReference}
 */
export const slimDownCrossReference = ({
    key,
    range,
    label,
}: IBibleCrossReference): IBibleCrossReference => ({
    key,
    label,
    range: slimDownReferenceRange(range),
});

/**
 * returns reference range with only necessary data. also 'versionId', and 'isNormalized' are
 * removed. BibleEngine will detect if the range is normalized, so we can savely strip the property
 * (its main purpose is to enable normalization checks on TS level)
 * @param {IBibleReferenceRange} range
 * @returns {IBibleReferenceRange}
 */
export const slimDownReferenceRange = (range: IBibleReferenceRange) => {
    const refRange: IBibleReferenceRange = {
        bookOsisId: range.bookOsisId,
    };
    if (range.versionChapterNum) refRange.versionChapterNum = range.versionChapterNum;
    if (range.versionVerseNum) refRange.versionVerseNum = range.versionVerseNum;
    if (range.versionChapterEndNum) refRange.versionChapterEndNum = range.versionChapterEndNum;
    if (range.versionVerseEndNum) refRange.versionVerseEndNum = range.versionVerseEndNum;
    if (range.normalizedChapterNum) refRange.normalizedChapterNum = range.normalizedChapterNum;
    if (range.normalizedVerseNum) refRange.normalizedVerseNum = range.normalizedVerseNum;
    if (range.normalizedChapterEndNum)
        refRange.normalizedChapterEndNum = range.normalizedChapterEndNum;
    if (range.normalizedVerseEndNum) refRange.normalizedVerseEndNum = range.normalizedVerseEndNum;
    return refRange;
};
