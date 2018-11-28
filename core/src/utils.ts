import { getBookGenericIdFromOsisId, getOsisIdFromBookGenericId } from './data/bibleMeta';
import {
    IBiblePhraseRef,
    IBibleReferenceNormalized,
    IBibleReferenceRangeNormalized
} from './models/BibleReference.interface';
import { BiblePhrase, BibleSection, IBibleOutputGroupRoot, BibleOutputGroup } from 'models';
import {
    IBibleOutputGroupSection,
    IBibleOutputGroupParagraph,
    IBibleOutputGroupPhrases,
    IBibleOutputGroupLevelFormatting,
    IBibleOutputGroupBooleanFormatting
} from 'models/BibleOutput.interface';

export const getOutputFormattingGroupsForPhrasesAndSections = (
    phrases: BiblePhrase[],
    sections: BibleSection[]
) => {
    const rootGroup: IBibleOutputGroupRoot = {
        type: 'root',
        parent: undefined,
        numbering: {},
        contents: []
    };

    let activeGroup: BibleOutputGroup = rootGroup;
    const activeModifiers: {
        sections: BibleSection[];
        indentLevel: number;
        quoteLevel: number;
        bold: boolean;
        italic: boolean;
        divineName: boolean;
        jesusWords: boolean;
    } = {
        sections: [],
        indentLevel: 0,
        quoteLevel: 0,
        bold: false,
        italic: false,
        divineName: false,
        jesusWords: false
    };

    for (const phrase of phrases) {
        // RADAR: check if we need section groups within levelGroups

        // go backwards through all groups and check if the current phrase is still within that
        // group. if not, "go out" of that group by setting the activeGroup to its parent
        let _group: BibleOutputGroup = activeGroup;
        while (_group.parent) {
            let isPhraseInGroup = true;
            switch (_group.type) {
                case 'section':
                case 'paragraph': // => this group is tied to a section
                    // check if the current phrase is within the group-section
                    isPhraseInGroup = _group.phraseEndId >= phrase.id;
                    break;
                case 'indentLevel':
                case 'quoteLevel': // => this group has a level (numeric) modifier
                    // check if the current phrase has the same or higher level
                    isPhraseInGroup = !!phrase[_group.type] && phrase[_group.type]! >= _group.level;
                    break;
                case 'phrases':
                case 'root':
                    // we have this case to exlude this type from the default (boolean modifier)
                    break;
                default:
                    // => this group has a boolean modifier
                    isPhraseInGroup = !!phrase[_group.type];
                    break;
            }
            if (!isPhraseInGroup) activeGroup = _group.parent;

            // go up one level in the group hierarchy for the next loop iteration.
            // the rootGroup has no parent, so the loop will exit there
            // RADAR [optimization]: Identify cases where can quit the loop before root
            _group = _group.parent;
        }

        // we need to go through the groups oncemore to determine the active modifiers
        // we can't do this in the previous loop since it is possible that a phrase is 'taken out'
        // of an otherwise matching group by a later iteration (e.g. when a pargraph ends with bold
        // text and the next one starts with bold text)
        _group = activeGroup;
        while (_group.parent) {
            switch (_group.type) {
                case 'section':
                case 'paragraph': // => this group is tied to a section
                    activeModifiers.sections.push(_group);
                    break;
                case 'indentLevel':
                case 'quoteLevel': // => this group has a level (numeric) modifier
                    activeModifiers[_group.type] = _group.level;
                    break;
                case 'phrases':
                case 'root':
                    // we have this case to exlude this type from the default (boolean modifier)
                    break;
                default:
                    // => this group has a boolean modifier
                    activeModifiers[_group.type] = true;
                    break;
            }
            // go up one level in the group hierarchy for the next loop iteration.
            // the rootGroup has no parent, so the loop will exit there
            _group = _group.parent;
        }

        // now go through all sections and the phrases modifiers and create new groups if needed

        // sort sections by level(desc) and phraseStartId(asc)
        sections.sort((a, b) => {
            // higher levels come first
            if (a.level > b.level) return -1;
            else if (b.level > a.level) return 1;
            // lower phraseStartIds come first
            else return a.phraseStartId < b.phraseStartId ? -1 : 1;
        });

        // filter out all sections where the phrase is included
        for (const section of sections.filter(
            // TODO: filter out wrapping sections
            // TODO: make sure that a partial paragraph at beginning or end is still added
            _section => phrase.id >= _section.phraseStartId && phrase.id <= _section.phraseEndId
        )) {
            // is the section already active?
            if (!activeModifiers.sections.find(activeSection => activeSection.id === section.id)) {
                // section can only be children of root or other sections. Else the strucuture got
                // corrupted somewhere. throw an error so we know about it
                if (activeGroup.type !== 'root' && activeGroup.type !== 'section')
                    throw new Error(`can't create formatted output: corrupted structure`);

                let newSectionGroup: IBibleOutputGroupParagraph | IBibleOutputGroupSection;
                if (section.level === 0) {
                    newSectionGroup = {
                        ...section,
                        type: 'paragraph',
                        contents: [],
                        numbering: {},
                        parent: activeGroup
                    };
                } else {
                    newSectionGroup = {
                        ...section,
                        type: 'section',
                        contents: [],
                        numbering: {},
                        parent: activeGroup
                    };
                }
                activeGroup.contents.push(newSectionGroup);
                activeGroup = newSectionGroup;
                activeModifiers.sections.push(newSectionGroup);
            }
        }
        // TODO: loops through modifiers and check if active check if they need to be started
        type LevelModifiers = 'indentLevel' | 'quoteLevel';
        const levelModifiers: LevelModifiers[] = ['indentLevel', 'quoteLevel'];
        for (const levelModifier of levelModifiers) {
            if (phrase[levelModifier] && phrase[levelModifier]! > activeModifiers[levelModifier]) {
                // => this phrase starts a new indent group

                const newLevelGroup: IBibleOutputGroupLevelFormatting = {
                    type: levelModifier,
                    parent: activeGroup,
                    level: phrase[levelModifier]!,
                    numbering: {},
                    contents: []
                };

                // RADAR: TypeScript shows an error if we use 'push()' here. Feels like a bug in TS.
                activeGroup.contents[activeGroup.contents.length] = newLevelGroup;
                activeGroup = newLevelGroup;
                activeModifiers[levelModifier] = phrase[levelModifier]!;
            }
        }

        type BooleanModifiers = 'bold' | 'italic' | 'divineName' | 'jesusWords';
        const booleanModifiers: BooleanModifiers[] = ['bold', 'italic', 'divineName', 'jesusWords'];
        for (const booleanModifier of booleanModifiers) {
            if (phrase[booleanModifier] && !activeModifiers[booleanModifier]) {
                // => this phrase starts a boolean modifier

                const newBooleanGroup: IBibleOutputGroupBooleanFormatting = {
                    type: booleanModifier,
                    parent: activeGroup,
                    numbering: {},
                    contents: []
                };
                // RADAR: TypeScript shows an error if we use 'push()' here. Feels like a bug in TS.
                activeGroup.contents[activeGroup.contents.length] = newBooleanGroup;
                activeGroup = newBooleanGroup;
                activeModifiers[booleanModifier] = true;
            }
        }

        // by now we have built the structure up to the point where we can insert the phrase.
        // if activeGroup is already a phrases-group, it has been set by they previous phrase
        // (and the current phrase didn't change any modifiers)
        if (activeGroup.type !== 'phrases') {
            const newPhrasesGroup: IBibleOutputGroupPhrases = {
                type: 'phrases',
                contents: [],
                numbering: {},
                parent: activeGroup
            };
            // RADAR: TypeScript shows an error if we use 'push()' here. Feels like a bug in TS.
            activeGroup.contents[activeGroup.contents.length] = newPhrasesGroup;
            activeGroup = newPhrasesGroup;
        }

        // finally we can add our phrase to the data structure
        activeGroup.contents.push(phrase);

        // TODO: set numbering
        //    - if already set, a new outputGroupPhrases needs to be created
        //    - numbering needs to be set on the most outer group for wich this is the first phrase
    }
    return rootGroup;
};

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
 * generates SQL for a range-query on the section table
 *
 * @param {IBibleReferenceRangeNormalized} range
 * @param {string} [col='id']
 * @returns {string} SQL
 */
export const generateSectionSql = (
    range: IBibleReferenceRangeNormalized,
    colSectionStart: string,
    colSectionEnd: string
) => {
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
    const rangePhraseIdStart = generatePhraseId(range);
    const rangePhraseIdEnd = generatePhraseId(refEnd);
    // TODO: we have an OR query that only queries colSectionEnd - how does our index work here?
    let sql = `
        ( ${colSectionStart} < ${rangePhraseIdStart} AND ${colSectionEnd} > ${rangePhraseIdEnd} ) OR
        ( ${colSectionStart} >= ${rangePhraseIdStart} AND
          ${colSectionStart} <= ${rangePhraseIdEnd} ) OR
        ( ${colSectionEnd} >= ${rangePhraseIdStart} AND ${colSectionEnd} <= ${rangePhraseIdEnd} )`;

    // if we query for a specific version we need to filter out the
    // version with a little math (due to the nature of our encoded reference integers)
    if (range.versionId)
        sql += `AND cast(${colSectionStart} % 100000000000 / 100000000 as int) = ${
            range.versionId
        }`;

    return sql;
};

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
