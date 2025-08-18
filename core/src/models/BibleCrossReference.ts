import { BibleCrossReference } from '@bible-engine/db-schema/generated/db';
import { Insertable, Selectable, Updateable } from 'kysely';
import { generateReferenceId, parseReferenceId } from '../functions/reference.functions';
import { IBibleReferenceRange, IBibleReferenceRangeNormalized } from './BibleReference';

export interface IBibleCrossReference {
    key?: string;
    range: IBibleReferenceRange;
    label?: string;
}

export interface IBibleCrossReferenceEntity extends IBibleCrossReference {
    id: number;
    phraseId: number | null;
    sectionId: number | null;
    normalizedRefId: number;
}

export function parseCrossReferenceFromDatabase(
    crossRef: Selectable<BibleCrossReference>
): IBibleCrossReferenceEntity;
export function parseCrossReferenceFromDatabase(
    crossRef: Selectable<BibleCrossReference> | null
): IBibleCrossReferenceEntity | null;
export function parseCrossReferenceFromDatabase(
    crossRef: Selectable<BibleCrossReference> | null
): IBibleCrossReferenceEntity | null {
    if (!crossRef) return null;
    // since we got this from the DB we know we have an id and we know it has all the data
    const normalizedRef = parseReferenceId(crossRef.normalizedRefId);
    const range: IBibleReferenceRangeNormalized = {
        isNormalized: true,
        bookOsisId: normalizedRef.bookOsisId,
        versionId: crossRef.versionId || undefined,
    };
    if (normalizedRef.normalizedChapterNum)
        range.normalizedChapterNum = normalizedRef.normalizedChapterNum;
    if (normalizedRef.normalizedVerseNum)
        range.normalizedVerseNum = normalizedRef.normalizedVerseNum;
    if (crossRef.versionChapterNum) range.versionChapterNum = crossRef.versionChapterNum;
    if (crossRef.versionVerseNum) range.versionVerseNum = crossRef.versionVerseNum;

    if (crossRef.normalizedRefIdEnd) {
        const normalizedRefEnd = parseReferenceId(crossRef.normalizedRefIdEnd);
        if (normalizedRefEnd.normalizedChapterNum)
            range.normalizedChapterEndNum = normalizedRefEnd.normalizedChapterNum;
        if (normalizedRefEnd.normalizedVerseNum)
            range.normalizedVerseEndNum = normalizedRefEnd.normalizedVerseNum;
        if (crossRef.versionChapterEndNum)
            range.versionChapterEndNum = crossRef.versionChapterEndNum;
        if (crossRef.versionVerseEndNum) range.versionVerseEndNum = crossRef.versionVerseEndNum;
    }
    return {
        ...crossRef,
        range,
        key: crossRef.key || undefined,
    };
}

export function prepareCrossReferenceForDatabase(
    crossRef: IBibleCrossReference,
    ref: { phraseId?: number | null; sectionId?: number | null }
): Insertable<BibleCrossReference>;
export function prepareCrossReferenceForDatabase(
    crossRef: Partial<IBibleCrossReference>,
    ref: { phraseId?: number | null; sectionId?: number | null }
): Updateable<BibleCrossReference>;
export function prepareCrossReferenceForDatabase(
    crossRef: IBibleCrossReference | Partial<IBibleCrossReference>,
    ref: { phraseId?: number | null; sectionId?: number | null }
): Insertable<BibleCrossReference> | Updateable<BibleCrossReference> {
    if (!ref.phraseId && !ref.sectionId) throw new Error('phraseId or sectionId is required');

    const result: Updateable<BibleCrossReference> = {};

    // Include reference properties
    result.phraseId = ref.phraseId;
    result.sectionId = ref.sectionId;

    // Only include other properties if they exist in the input object
    if ('key' in crossRef) result.key = crossRef.key;

    // Handle range properties if they exist
    if ('range' in crossRef && crossRef.range) {
        result.normalizedRefId = generateReferenceId(
            crossRef.range as IBibleReferenceRangeNormalized
        );

        if (crossRef.range.normalizedChapterEndNum || crossRef.range.normalizedVerseEndNum) {
            result.normalizedRefIdEnd = generateReferenceId({
                isNormalized: true,
                bookOsisId: crossRef.range.bookOsisId,
                normalizedChapterNum:
                    crossRef.range.normalizedChapterEndNum || crossRef.range.normalizedChapterNum,
                normalizedVerseNum: crossRef.range.normalizedVerseEndNum,
                normalizedSubverseNum: crossRef.range.normalizedSubverseEndNum,
            });
        }

        if (crossRef.range.partIndicator) result.partIndicator = crossRef.range.partIndicator;
        if (crossRef.range.partIndicatorEnd)
            result.partIndicatorEnd = crossRef.range.partIndicatorEnd;

        if (crossRef.range.versionId) {
            result.versionId = crossRef.range.versionId;
            result.versionChapterNum = crossRef.range.versionChapterNum;
            result.versionVerseNum = crossRef.range.versionVerseNum;
            result.versionChapterEndNum = crossRef.range.versionChapterEndNum;
            result.versionVerseEndNum = crossRef.range.versionVerseEndNum;
        }
    }

    return result;
}
