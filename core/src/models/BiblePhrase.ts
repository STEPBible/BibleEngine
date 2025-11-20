import { BiblePhrase } from '@bible-engine/db-schema/generated/db';
import { Insertable, Selectable, Updateable } from 'kysely';
import { generatePhraseId, parsePhraseId } from '../functions/reference.functions.js';
import { IBibleCrossReference } from './BibleCrossReference.js';
import { IBibleNote } from './BibleNote.js';
import {
    IBiblePhraseRef,
    IBibleReferenceNormalizedNumbers,
    IBibleReferenceVersionNumbers,
} from './BibleReference.js';
import { IContentPhrase } from './ContentPhrase.js';

export interface IBiblePhrase extends IContentPhrase {
    quoteWho?: string;
    person?: string;
    strongs?: string[];
    notes?: IBibleNote[];
    crossReferences?: IBibleCrossReference[];
}

export interface IBiblePhraseWithNumbers extends IBiblePhrase, IBibleReferenceVersionNumbers {
    /**
     * TODO: implement
     * in some cases after normalization we can't be exactly sure where the verse boundaries are
     * within a group of verses. In this case we put all the text in the first verse and add an
     * empty phrase for each of the other verses. The first verse sets 'joinToRefId' to the last
     * verse of the group, all the others set it to the first verse, that contains the content.
     * If a phrase is encountered that has 'joinToRefId' set to a verse before, this has to be
     * fetched instead and the verse indicator needs to show a verse-span instead of a single number
     */
    joinToRefId?: number;
    joinToVersionRefId?: number;

    versionChapterNum?: number; // has to be set
    versionVerseNum?: number; // has to be set
    versionSubverseNum?: number; // has to be set

    /** in case normalized numbers come pre-calculated (e.g. when downloading a version) */
    normalizedReference?: IBibleReferenceNormalizedNumbers;

    sourceTypeId?: number;
}

export type PhraseModifiers = {
    indentLevel?: number;
    quoteLevel?: number;
    line?: number;
    // we have a mix of semantic and style modifiers here - we provide both to be compatible with
    // every bible version while keeping the flexibility for those that use semantic modifiers:
    orderedListItem?: string;
    unorderedListItem?: string;
    translationChange?: string;
    link?: string;
    title?: 'pullout' | 'inline';
    bold?: boolean;
    italic?: boolean;
    divineName?: boolean;
    emphasis?: boolean;
    lineGroup?: boolean;
    sela?: boolean;
};

export type StringModifiers =
    | 'translationChange'
    | 'orderedListItem'
    | 'unorderedListItem'
    | 'link';
export type NumberModifiers = 'line';
export type ValueModifiers = StringModifiers | NumberModifiers | 'title';
export type BooleanModifiers = 'bold' | 'italic' | 'divineName' | 'emphasis' | 'lineGroup' | 'sela';

export interface IBiblePhraseEntity extends IBiblePhraseWithNumbers {
    id: number;
    modifiers?: PhraseModifiers;
    normalizedReference: Required<IBiblePhraseRef>;
    versionChapterNum: number; // has to be set
    versionVerseNum: number; // has to be set
    versionSubverseNum?: number; // has to be set
}

export function createBiblePhraseEntity(
    phrase: IBiblePhraseWithNumbers & {
        versionChapterNum: number;
        versionVerseNum: number;
        versionSubverseNum?: number;
    },
    reference: Required<IBiblePhraseRef>,
    modifiers?: PhraseModifiers
): IBiblePhraseEntity {
    return {
        ...phrase,
        id: generatePhraseId(reference),
        normalizedReference: reference,
        modifiers,
    };
}

export function preparePhraseForDatabase(
    phrase: IBiblePhraseWithNumbers,
    reference: Required<IBiblePhraseRef>,
    modifiers?: PhraseModifiers
): Insertable<BiblePhrase>;
export function preparePhraseForDatabase(
    phrase: Partial<IBiblePhraseWithNumbers>,
    reference: Required<IBiblePhraseRef>,
    modifiers?: PhraseModifiers
): Updateable<BiblePhrase>;
export function preparePhraseForDatabase(
    phrase: IBiblePhraseWithNumbers | Partial<IBiblePhraseWithNumbers>,
    reference: Required<IBiblePhraseRef>,
    modifiers?: PhraseModifiers
): Insertable<BiblePhrase> | Updateable<BiblePhrase> {
    const result: Updateable<BiblePhrase> = {};

    // Always include the ID and versionId as they're required
    result.id = generatePhraseId(reference);
    result.versionId = reference.versionId;

    // Process modifiers if provided
    if (modifiers !== undefined) {
        // we only save active modifiers to save space
        let modifiersReduced: PhraseModifiers = {};
        for (const [key, val] of Object.entries(modifiers) as [
            keyof PhraseModifiers,
            PhraseModifiers[keyof PhraseModifiers]
        ][]) {
            if (val !== false && val !== 0 && val !== null && val !== undefined)
                modifiersReduced[key] = val as any; // we can't find a way to make TS happy here
        }

        // Check if the filtered modifiersReduced has any entries
        result.modifiers =
            Object.keys(modifiersReduced).length === 0 ? null : JSON.stringify(modifiersReduced);
    }

    // Only include other properties if they exist in the input object
    if ('linebreak' in phrase) {
        result.linebreak = phrase.linebreak ? 1 : null;
    }

    if ('strongs' in phrase) {
        result.strongs = phrase.strongs ? phrase.strongs.join(',') : null;
    }

    if ('content' in phrase) result.content = phrase.content;
    if ('versionChapterNum' in phrase) result.versionChapterNum = phrase.versionChapterNum;
    if ('versionVerseNum' in phrase) result.versionVerseNum = phrase.versionVerseNum;
    if ('versionSubverseNum' in phrase) result.versionSubverseNum = phrase.versionSubverseNum;
    if ('joinToRefId' in phrase) result.joinToRefId = phrase.joinToRefId;
    if ('joinToVersionRefId' in phrase) result.joinToVersionRefId = phrase.joinToVersionRefId;
    if ('person' in phrase) result.person = phrase.person;
    if ('quoteWho' in phrase) result.quoteWho = phrase.quoteWho;
    if ('skipSpace' in phrase) result.skipSpace = phrase.skipSpace;
    if ('sourceTypeId' in phrase) result.sourceTypeId = phrase.sourceTypeId;

    return result;
}

export function parsePhraseFromDatabase(phrase: Selectable<BiblePhrase>): IBiblePhraseEntity;
export function parsePhraseFromDatabase(
    phrase: Selectable<BiblePhrase> | null
): IBiblePhraseEntity | null;
export function parsePhraseFromDatabase(
    phrase: Selectable<BiblePhrase> | null
): IBiblePhraseEntity | null {
    if (!phrase) return null;
    // since we got this from the DB we know we have an id and we know it has all the data
    const phraseRef = parsePhraseId(phrase.id);
    return {
        ...phrase,
        joinToRefId: phrase.joinToRefId || undefined,
        joinToVersionRefId: phrase.joinToVersionRefId || undefined,
        linebreak: phrase.linebreak ? true : undefined,
        normalizedReference: {
            isNormalized: true,
            bookOsisId: phraseRef.bookOsisId,
            normalizedChapterNum: phraseRef.normalizedChapterNum!,
            normalizedVerseNum: phraseRef.normalizedVerseNum!,
            normalizedSubverseNum: phraseRef.normalizedSubverseNum!,
            versionId: phraseRef.versionId!,
            phraseNum: phraseRef.phraseNum!,
        },
        person: phrase.person || undefined,
        skipSpace: phrase.skipSpace || undefined,
        strongs: phrase.strongs ? phrase.strongs.split(',') : undefined,
        quoteWho: phrase.quoteWho || undefined,
        sourceTypeId: phrase.sourceTypeId || undefined,
        versionSubverseNum: phrase.versionSubverseNum || undefined,
        modifiers:
            typeof phrase.modifiers === 'string' ? JSON.parse(phrase.modifiers) : phrase.modifiers,
    };
}

export function getPhraseModifierValue<T extends keyof PhraseModifiers>(
    phrase: IBiblePhraseEntity,
    modifier: T
): PhraseModifiers[T] {
    if (phrase.modifiers && phrase.modifiers[modifier]) return phrase.modifiers[modifier];
    else {
        // default values
        if (modifier === 'indentLevel' || modifier === 'quoteLevel') {
            return 0 as PhraseModifiers[T];
        } else if (
            modifier === 'translationChange' ||
            modifier === 'orderedListItem' ||
            modifier === 'unorderedListItem' ||
            modifier === 'title' ||
            modifier === 'link' ||
            modifier === 'line'
        ) {
            return undefined;
        } else {
            return false as PhraseModifiers[T];
        }
    }
}
