import { V11nRule } from '@bible-engine/db-schema/generated/db';
import { Insertable, Selectable, Updateable } from 'kysely';
import { IBibleReference, IBibleReferenceNormalized } from '.';
import {
    generateNormalizedRangeFromVersionRange,
    generateReferenceId,
    parseReferenceId,
} from '../functions/reference.functions';

export interface IV11nRule {
    // one of `sourceRef` or `sourceRefId` is required
    sourceRef?: IBibleReference;
    sourceRefId?: number;

    // one of `standardRef` or `standardRefId` is required
    standardRef?: IBibleReferenceNormalized;
    standardRefId?: number;

    // one of `action` or `actionId` is required
    action?: 'Keep verse' | 'Merged verse' | 'Renumber verse' | 'Empty verse';
    actionId?: number;

    noteMarker: string;
    note: string;
    noteSecondary?: string;
    noteAncientVersions?: string;
    sourceTypeId?: number;
    tests?: string;
}

export interface IV11nRuleEntity extends IV11nRule {
    id: number;
    actionId: number;
    sourceRefId: number;
    standardRefId: number;
    standardRef: IBibleReferenceNormalized;
    sourceRef: IBibleReference;
}

const actionTypes = new Map<number, IV11nRule['action']>([
    [1, 'Keep verse'],
    [2, 'Renumber verse'],
    [3, 'Merged verse'],
    [4, 'Empty verse'],
]);

export const notePhrases = new Map<string, string>([
    ['other', 'In some Bibles the verse numbering here is REF'],
    ['version', 'Normally in this Bible the verse numbering here is REF'],
    [
        'versionMerge',
        'Normally in this Bible this verse and the next occur as one verse that is numbered REF',
    ],
    ['versionTextFrom', 'As normal in this Bible this verse contains the text of REF'],
    [
        'versionTextPrevious',
        'As normal in this Bible the text for this verse is included in the previous verse.',
    ],
    ['versionTextAt', 'As normal in this Bible the text for this verse is included at REF'],
    ['versionWordsFrom', 'Normally in this Bible this verse includes words that are at REF'],
    ['versionWordsAt', 'The extra words are found at REF'],
    ['versionSimilarAt', 'Normally in this Bible similar text is found at REF'],
    ['versionMergedWith', 'As normal in this Bible the text for this verse is merged with REF'],
    ['versionNumbering', 'Normally in this Bible verse numbering here is REF'],
    ['otherSimilarAt', 'In some Bibles similar text is found at REF'],
    ['otherSimliarTo', 'In some Bibles this verse may contain text similar to REF'],
    ['otherNoOrSimilar', 'Some manuscripts have no text here. Others have text similar to REF'],
    ['wordsSimilarAt', 'Similar words are found at REF'],
    ['otherOnlyStart', 'In some Bibles only the start of this verse is present'],
    ['versionOnlyStart', 'Normally in this Bible only the start of this verse is present'],
    ['otherExtraText', 'In some Bibles this verse contains extra text'],
    ['otherNoTextAt', 'Some manuscripts have no text at REF'],
    ['versionEmpty', 'Normally in this Bible this verse does not contain any text'],
    ['otherEmpty', 'In some Bibles this verse may not contain any text'],
    ['maybeEmpty', 'This verse may not contain any text'],
    ['otherChapterSeparateBook', 'In some Bibles this chapter is a separate book'],
    ['otherFollowedBy', 'In some Bibles this verse is followed by the contents of REF'],
    ['versionFollowedBy', 'Normally in this Bible this verse is followed by the contents of REF'],
    ['otherBookAt', 'In some Bibles this book is found at REF'],
    ['otherDifferentStart', 'In some Bibles this verse starts on a different word'],
    [
        'otherAddInformation',
        'At the end of this verse some manuscripts add information such as where this letter was written',
    ],
]);

export function parseV11nRuleFromDatabase(rule: Selectable<V11nRule>): IV11nRuleEntity;
export function parseV11nRuleFromDatabase(
    rule: Selectable<V11nRule> | null
): IV11nRuleEntity | null;
export function parseV11nRuleFromDatabase(
    rule: Selectable<V11nRule> | null
): IV11nRuleEntity | null {
    if (!rule) return null;

    const standardRef = parseReferenceId(rule.standardRefId);
    const _sourceRef = parseReferenceId(rule.sourceRefId);
    // we think of reference ids to always be normalized. in this special case we encode version
    // numbers in it, so we need to do some manual object conversion
    const sourceRef = {
        bookOsisId: _sourceRef.bookOsisId,
        versionChapterNum: _sourceRef.normalizedChapterNum,
        versionVerseNum: _sourceRef.normalizedVerseNum,
        versionSubverseNum: _sourceRef.normalizedSubverseNum,
    };

    const action = actionTypes.get(rule.actionId);
    if (!action) throw new Error(`invalid actionId ${rule.actionId}`);

    return {
        ...rule,
        sourceRef,
        standardRef,
        action,
        noteSecondary: rule.noteSecondary || undefined,
        noteAncientVersions: rule.noteAncientVersions || undefined,
        sourceTypeId: rule.sourceTypeId || undefined,
        tests: rule.tests || undefined,
    };
}

export function prepareV11nRuleForDatabase(rule: IV11nRule): Insertable<V11nRule>;
export function prepareV11nRuleForDatabase(rule: Partial<IV11nRule>): Updateable<V11nRule>;
export function prepareV11nRuleForDatabase(
    rule: IV11nRule | Partial<IV11nRule>
): Insertable<V11nRule> | Updateable<V11nRule> {
    const result: Updateable<V11nRule> = {};

    // Handle sourceRefId
    if ('sourceRef' in rule || 'sourceRefId' in rule) {
        let sourceRefId = rule.sourceRefId;
        if (rule.sourceRef) {
            sourceRefId = generateReferenceId(
                generateNormalizedRangeFromVersionRange(rule.sourceRef, 1)
            );
        }
        result.sourceRefId = sourceRefId;
    }

    // Handle standardRefId
    if ('standardRef' in rule || 'standardRefId' in rule) {
        let standardRefId = rule.standardRefId;
        if (rule.standardRef) {
            standardRefId = generateReferenceId(rule.standardRef);
        }
        result.standardRefId = standardRefId;
    }

    // Handle actionId
    if ('action' in rule || 'actionId' in rule) {
        let actionId = rule.actionId;
        if (rule.action) {
            let newActionId: number | undefined;
            for (const [id, action] of actionTypes) {
                if (action === rule.action) {
                    newActionId = id;
                    break;
                }
            }
            if (!newActionId) throw new Error(`invalid action ${rule.action}`);
            actionId = newActionId;
        }
        result.actionId = actionId;
    }

    // Only include other properties if they exist in the input object
    if ('noteMarker' in rule) result.noteMarker = rule.noteMarker;
    if ('note' in rule) result.note = rule.note;
    if ('noteSecondary' in rule) result.noteSecondary = rule.noteSecondary;
    if ('noteAncientVersions' in rule) result.noteAncientVersions = rule.noteAncientVersions;
    if ('sourceTypeId' in rule) result.sourceTypeId = rule.sourceTypeId;
    if ('tests' in rule) result.tests = rule.tests;

    return result;
}
