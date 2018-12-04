import { getBookGenericIdFromOsisId, getOsisIdFromBookGenericId } from './data/bibleMeta';
import {
    IBiblePhraseRef,
    IBibleReferenceNormalized,
    IBibleReferenceRangeNormalized
} from './models/BibleReference';
import { BiblePhrase, BibleParagraph } from './entities';
import {
    IBibleOutputRich,
    IBibleOutputRoot,
    BibleOutput,
    IBibleOutputGroup,
    PhraseModifiers
} from './models';
import {
    IBibleOutputSection,
    IBibleOutputPhrases,
    IBibleOutputNumbering
} from 'models/BibleOutput';

export const getOutputFormattingGroupsForPhrasesAndSections = (
    phrases: BiblePhrase[],
    paragraphs: BibleParagraph[],
    context: IBibleOutputRich['context']
) => {
    type LevelGroups = 'indent' | 'quote';
    const levelGroups: LevelGroups[] = ['indent', 'quote'];
    type BooleanModifiers =
        | 'bold'
        | 'italic'
        | 'divineName'
        | 'emphasis'
        | 'translationChange'
        | 'listItem';
    const booleanModifiers: BooleanModifiers[] = [
        'bold',
        'italic',
        'divineName',
        'emphasis',
        'translationChange',
        'listItem'
    ];

    const rootGroup: IBibleOutputRoot = {
        type: 'root',
        parent: undefined,
        contents: []
    };

    let activeGroup: BibleOutput | IBibleOutputRoot = rootGroup;

    const currentNumbering = {
        normalizedChapter: 0,
        normalizedVerse: -1, // we have zero-verses (psalms in some versions)
        versionChapter: 0,
        versionVerse: -1 // we have zero-verses (psalms in some versions)
    };

    for (const phrase of phrases) {
        const activeSections: { sectionId: number; level: number }[] = [];
        let activeParagraph: IBibleOutputGroup<'paragraph'>['meta'] | undefined;
        const activeModifiers: PhraseModifiers = {
            indentLevel: 0,
            quoteLevel: 0,
            bold: false,
            italic: false,
            emphasis: false,
            divineName: false
        };

        // go backwards through all groups and check if the current phrase is still within that
        // group. if not, "go out" of that group by setting the activeGroup to its parent
        let _group = <BibleOutput | IBibleOutputRoot>activeGroup;
        while (_group.parent) {
            let isPhraseInGroup = true;
            if (_group.type === 'section') {
                // check if the current phrase is within the group-section
                isPhraseInGroup = _group.phraseEndId >= phrase.id;
            } else if (_group.type === 'group') {
                if (_group.groupType === 'paragraph') {
                    isPhraseInGroup =
                        (<IBibleOutputGroup<'paragraph'>>_group).meta.phraseEndId >= phrase.id;
                } else if (_group.groupType === 'indent' || _group.groupType === 'quote') {
                    const modifierName =
                        _group.groupType === 'indent' ? 'indentLevel' : 'quoteLevel';
                    // => this group has a level (numeric) modifier
                    // check if the current phrase has the same or higher level
                    isPhraseInGroup =
                        !!phrase.modifiers[modifierName] &&
                        phrase.modifiers[modifierName]! >=
                            (<IBibleOutputGroup<LevelGroups>>_group).meta.level;
                } else {
                    // => this group has a boolean modifier
                    isPhraseInGroup = !!phrase.modifiers[_group.groupType];
                }
            }

            if (!isPhraseInGroup) activeGroup = _group.parent!;

            // go up one level in the group hierarchy for the next loop iteration.
            // the rootGroup has no parent, so the loop will exit there
            // RADAR [optimization]: Identify cases where can quit the loop before root
            _group = _group.parent!;
        }

        // we need to go through the groups oncemore to determine the active modifiers
        // we can't do this in the previous loop since it is possible that a phrase is 'taken out'
        // of an otherwise matching group by a later iteration (e.g. when a pargraph ends with bold
        // text and the next one starts with bold text)
        _group = activeGroup;
        while (_group.parent) {
            if (_group.type === 'section') {
                // check if the current phrase is within the group-section
                activeSections.push(_group.meta);
            } else if (_group.type === 'group') {
                if (_group.groupType === 'paragraph') {
                    activeParagraph = (<IBibleOutputGroup<'paragraph'>>_group).meta;
                } else if (_group.groupType === 'indent' || _group.groupType === 'quote') {
                    const modifierName =
                        _group.groupType === 'indent' ? 'indentLevel' : 'quoteLevel';
                    // => this group has a level (numeric) modifier
                    activeModifiers[modifierName] = (<IBibleOutputGroup<'indent' | 'quote'>>(
                        _group
                    )).meta.level;
                } else {
                    // => this group has a boolean modifier
                    activeModifiers[_group.groupType] = true;
                }
            }

            // go up one level in the group hierarchy for the next loop iteration.
            // the rootGroup has no parent, so the loop will exit there
            _group = _group.parent!;
        }

        /*
         * now go through all sections and the phrases modifiers and create new groups if needed
         */

        // look for the paragraph where the phrase is in (if any) and open it if necessary
        const paragraph = paragraphs.find(
            _paragraph =>
                phrase.id >= _paragraph.phraseStartId && phrase.id <= _paragraph.phraseEndId
        );
        if (paragraph && activeParagraph && activeParagraph.paragraphId !== paragraph.id) {
            // paragraphs can not be children of paragraphs. Else the structure got
            // corrupted somewhere. throw an error so we know about it
            throw new Error(
                `can't create output object: corrupted structure (multilevel paragraphs)`
            );
        } else if (paragraph && !activeParagraph) {
            const newParagraphMeta = {
                paragraphId: paragraph.id,
                phraseStartId: paragraph.phraseStartId,
                phraseEndId: paragraph.phraseEndId
            };
            const newParagraph: IBibleOutputGroup<'paragraph'> = {
                type: 'group',
                groupType: 'paragraph',
                meta: newParagraphMeta,
                contents: [],
                parent: activeGroup
            };
            activeGroup.contents[activeGroup.contents.length] = newParagraph;
            activeGroup = newParagraph;
            activeParagraph = newParagraphMeta;
        }

        // go through all levels of context, starting by the highest
        for (const level of Object.keys(context)
            .sort()
            .reverse()
            .map(key => +key)) {
            // look for the section where the phrase is in (if any) and open it if necessary
            const section = context[level].includedSections.find(
                _section => phrase.id >= _section.phraseStartId && phrase.id <= _section.phraseEndId
            );
            // is the section already active?
            if (
                section &&
                !activeSections.find(activeSection => activeSection.sectionId === section.id)
            ) {
                if (
                    // section can only be children of root or other sections. Else the strucuture
                    // got corrupted somewhere. throw an error so we know about it
                    (activeGroup.type !== 'root' && activeGroup.type !== 'section') ||
                    // throw error if creating a section in the wrong level order
                    activeSections.find(activeSection => activeSection.level <= level)
                )
                    throw new Error(`can't create output object: corrupted structure (section)`);

                const newSectionMeta = {
                    sectionId: section.id,
                    level: section.level
                };
                const newSection: IBibleOutputSection = {
                    ...section,
                    type: 'section',
                    meta: newSectionMeta,
                    contents: [],
                    parent: activeGroup
                };
                activeGroup.contents.push(newSection);
                activeGroup = newSection;
                activeSections.push(newSectionMeta);
            }
        }

        // loop through modifiers and check if active check if they need to be started

        for (const levelGroup of levelGroups) {
            const levelModifier = levelGroup === 'indent' ? 'indentLevel' : 'quoteLevel';
            if (
                phrase.modifiers[levelModifier] &&
                phrase.modifiers[levelModifier]! > activeModifiers[levelModifier]
            ) {
                // => this phrase starts a new indent group

                const newLevelGroup: IBibleOutputGroup<LevelGroups> = {
                    type: 'group',
                    groupType: levelGroup,
                    parent: activeGroup,
                    meta: { level: phrase.modifiers[levelModifier]! },
                    contents: []
                };

                // RADAR: TypeScript shows an error if we use 'push()' here. Feels like a bug in TS.
                activeGroup.contents[activeGroup.contents.length] = newLevelGroup;
                activeGroup = newLevelGroup;
                activeModifiers[levelModifier] = phrase.modifiers[levelModifier]!;
            }
        }

        for (const booleanModifier of booleanModifiers) {
            if (phrase.modifiers[booleanModifier] && !activeModifiers[booleanModifier]) {
                // => this phrase starts a boolean modifier

                const newBooleanGroup: IBibleOutputGroup<BooleanModifiers> = {
                    type: 'group',
                    meta: undefined, // TypeScript wants that (bug?)
                    groupType: booleanModifier,
                    parent: activeGroup,
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
            const newPhrasesGroup: IBibleOutputPhrases = {
                type: 'phrases',
                contents: [],
                parent: activeGroup
            };
            // RADAR: TypeScript shows an error if we use 'push()' here. Feels like a bug in TS.
            activeGroup.contents[activeGroup.contents.length] = newPhrasesGroup;
            activeGroup = newPhrasesGroup;
        }

        // set numbering
        // get the most outer group for wich this is the first phrase
        let numberingGroup: BibleOutput | IBibleOutputRoot | null = null;
        _group = <BibleOutput | IBibleOutputRoot>activeGroup;
        do {
            // if we are at the top level (phrases can't have groups as content)
            if (_group.type === 'phrases') {
                // if there is already content in the phrase group => we can't use that one
                if (_group.contents.length) break;
                else numberingGroup = _group;
            }
            // as soon as we hit a group with more than one content we can break, otherwise it is a
            // valid numbering group(=> if a parent has only one member it is the one from where we
            // navigated via the parent attribute)
            // tslint:disable-next-line:one-line
            else if (_group.contents.length > 1) break;
            else if (_group.contents.length === 1) numberingGroup = _group;
            // there should be no group that is not a phrase group and has no child
            else if (_group.contents.length === 0)
                throw new Error(
                    `can't create output object: corrupted structure (empty ancestor group)`
                );

            if (_group.parent) _group = _group.parent;
        } while (!!_group.parent);

        const numbering: IBibleOutputNumbering = {};

        // if this phrase switches any numbers (verse/chapter, normalized/version), the related
        // value is set on the numbering object of the topmost group where this phrase is the
        // (current) only member
        if (currentNumbering.normalizedChapter !== phrase.reference.normalizedChapterNum) {
            // psalms can have verse number zero
            if (phrase.reference.normalizedVerseNum <= 1)
                numbering.normalizedChapterIsStarting = phrase.reference.normalizedChapterNum;
            numbering.normalizedChapterIsStartingInRange = phrase.reference.normalizedChapterNum;
            currentNumbering.normalizedChapter = phrase.reference.normalizedChapterNum;
        }
        if (currentNumbering.normalizedVerse !== phrase.reference.normalizedVerseNum) {
            numbering.normalizedVerseIsStarting = phrase.reference.normalizedVerseNum;
            currentNumbering.normalizedVerse = phrase.reference.normalizedVerseNum;
        }
        if (currentNumbering.versionChapter !== phrase.versionChapterNum) {
            // psalms can have verse number zero
            if (phrase.versionVerseNum <= 1)
                numbering.versionChapterIsStarting = phrase.versionChapterNum;
            numbering.versionChapterIsStartingInRange = phrase.versionChapterNum;
            currentNumbering.versionChapter = phrase.versionChapterNum;
        }
        if (currentNumbering.versionVerse !== phrase.versionVerseNum) {
            numbering.normalizedVerseIsStarting = phrase.versionVerseNum;
            currentNumbering.versionVerse = phrase.versionVerseNum;
        }

        if (Object.keys(numbering).length) {
            // we have no suitable numberingGroup => a new outputGroupPhrases needs to be created
            if (numberingGroup === null) {
                const newPhrasesGroup: IBibleOutputPhrases = {
                    type: 'phrases',
                    contents: [],
                    parent: activeGroup.parent
                };
                // RADAR: TypeScript shows an error if we use 'push()' here. Feels like a bug in TS.
                activeGroup.parent.contents[activeGroup.parent.contents.length] = newPhrasesGroup;
                activeGroup = newPhrasesGroup;
                numberingGroup = activeGroup;
            }

            // if the numberingGroup we figured out already has numbering values set we screwed up
            // somewhere
            if (numberingGroup.numbering)
                throw new Error(
                    `can't create output object: corrupted structure (unexpected numbering group)`
                );

            numberingGroup.numbering = numbering;
        }

        // finally we can add our phrase to the data structure
        activeGroup.contents.push(phrase);
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

export const generateParagraphSql = (
    range: IBibleReferenceRangeNormalized & { versionId: number },
    tableAlias: string
) => {
    const refEnd: IBiblePhraseRef = getEndReferenceForRangeQuery(range);
    const rangePhraseIdStart = generatePhraseId(range);
    const rangePhraseIdEnd = generatePhraseId(refEnd);
    const colVersion = `${tableAlias}.versionId`;
    const colSectionStart = `${tableAlias}.phraseStartId`;
    const colSectionEnd = `${tableAlias}.phraseEndId`;

    // since this is an OR query the query optimizer may/will use different indexes for each
    // https://www.sqlite.org/optoverview.html#or_optimizations
    // thats also why we repeat the versionId condition.
    //
    // the three conditions select:
    // - paragraphs that wrap around the range
    // - paragraphs that start within the range
    // - paragraphs that end within the range (seperate index)
    //
    // (paragraphs that are fully contained in the range or selected by both the 2nd and 3rd
    //  condition)
    return `
        ( ${colVersion} = ${range.versionId} AND (
                ( ${colSectionStart} < ${rangePhraseIdStart} AND
                    ${colSectionEnd} > ${rangePhraseIdEnd} ) OR
                ( ${colSectionStart} >= ${rangePhraseIdStart} AND
                    ${colSectionStart} <= ${rangePhraseIdEnd} )
            )
        ) OR (
            ${colVersion} = ${range.versionId} AND
            ${colSectionEnd} >= ${rangePhraseIdStart} AND
            ${colSectionEnd} <= ${rangePhraseIdEnd}
        )`;
};

/**
 * generates SQL for a range-query on the section table
 *
 * @param {IBibleReferenceRangeNormalized} range
 * @param {string} [col='id']
 * @returns {string} SQL
 */
export const generateBookSectionsSql = (
    range: IBibleReferenceRangeNormalized,
    tableAlias: string
) => {
    const bookPhraseIdStart = generatePhraseId({
        bookOsisId: range.bookOsisId,
        isNormalized: true
    });
    const bookPhraseIdEnd = generatePhraseId({
        bookOsisId: range.bookOsisId,
        normalizedChapterNum: 999,
        isNormalized: true
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

export function getEndReferenceForRangeQuery(
    range: IBibleReferenceRangeNormalized
): IBiblePhraseRef {
    return {
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
