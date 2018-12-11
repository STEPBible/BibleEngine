import {
    IBibleInput,
    BibleBookPlaintext,
    IBibleOutputRich,
    IBibleOutputRoot,
    BibleOutput,
    IBibleOutputGroup,
    PhraseModifiers,
    IBiblePhrase,
    IBibleOutputSection,
    IBibleOutputPhrase,
    IBibleOutputNumbering,
    IBibleInputGroup,
    IBibleInputPhrase,
    IBibleInputSection,
    BibleOutputContainer
} from '../models';
import { BiblePhrase, BibleParagraph } from '../entities';
import { BooleanModifiers, ValueModifiers } from '../models/BiblePhrase';
import { generateReferenceRangeLabel } from './reference.functions';

/**
 * turns BibleEngine input-data into a plain two-level Map of chapters and verses with plain text
 * @param {IBibleInput[]} contents
 * @param {BibleBookPlaintext} _accChapters
 * @returns {IBibleBookPlaintext}
 */
export const convertBibleInputToBookPlaintext = (
    contents: IBibleInput[],
    _accChapters: BibleBookPlaintext = new Map()
) => {
    for (const content of contents) {
        if (content.type !== 'phrase')
            convertBibleInputToBookPlaintext(content.contents, _accChapters);
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
};

/**
 * converts output of BibleEngine into format that can be used as input into the BibleEngine schema
 * @param {BibleOutput[]} data
 * @returns {IBibleInput[]}
 */
export const convertBibleOutputToBibleInput = (data: BibleOutput[]): IBibleInput[] => {
    const inputData: IBibleInput[] = [];
    for (const obj of data) {
        if (obj.type === 'phrase') {
            const phrase = obj;
            if (!phrase.versionChapterNum) {
                throw new Error(`can't generate input data: corrupted structure`);
            }
            const inputPhrase: IBiblePhrase = {
                content: phrase.content,
                versionChapterNum: phrase.versionChapterNum,
                versionVerseNum: phrase.versionVerseNum,
                normalizedReference: {
                    normalizedChapterNum: phrase.normalizedReference!.normalizedChapterNum,
                    normalizedVerseNum: phrase.normalizedReference!.normalizedVerseNum
                }
            };
            if (phrase.linebreak) inputPhrase.linebreak = true;
            if (phrase.quoteWho) inputPhrase.quoteWho = phrase.quoteWho;
            if (phrase.person) inputPhrase.person = phrase.person;
            if (phrase.strongs && phrase.strongs.length) inputPhrase.strongs = phrase.strongs;
            if (phrase.notes && phrase.notes.length)
                inputPhrase.notes = phrase.notes.map(({ key, type, content }) => ({
                    key,
                    type,
                    content
                }));
            if (phrase.crossReferences && phrase.crossReferences.length)
                inputPhrase.crossReferences = phrase.crossReferences.map(({ key, range }) => ({
                    key,
                    range
                }));

            inputData.push({ type: 'phrase', ...inputPhrase });
        } else if (obj.type === 'group') {
            inputData.push({
                type: 'group',
                groupType: obj.groupType,
                modifier: obj.modifier,
                contents: <(IBibleInputGroup | IBibleInputPhrase)[]>(
                    convertBibleOutputToBibleInput(obj.contents)
                )
            });
        } else if (obj.type === 'section') {
            const inputSection: IBibleInputSection = {
                type: 'section',
                contents: convertBibleOutputToBibleInput(obj.contents)
            };
            if (obj.title) inputSection.title = obj.title;
            if (obj.subTitle) inputSection.subTitle = obj.subTitle;
            if (obj.description) inputSection.description = obj.description;
            if (obj.crossReferences && obj.crossReferences.length)
                inputSection.crossReferences = obj.crossReferences.map(({ key, range }) => ({
                    key,
                    range
                }));
            inputData.push(inputSection);
        }
    }
    return inputData;
};

/**
 * turns list of phrases, paragraphs and sections into a structured bible document
 * @param {BiblePhrase[]} phrases
 * @param {BibleParagraph[]} paragraphs
 * @param {IBibleOutputRich['context']} context
 * @returns {IBibleOutputRoot}
 */
export const generateBibleDocument = (
    phrases: BiblePhrase[],
    paragraphs: BibleParagraph[],
    context: IBibleOutputRich['context'],
    bookAbbreviations: { [index: string]: string },
    chapterVerseSeparator: string
) => {
    const rootGroup: IBibleOutputRoot = {
        type: 'root',
        parent: undefined,
        contents: []
    };

    let activeGroup: BibleOutputContainer = rootGroup;

    const currentNumbering = {
        normalizedChapter: 0,
        normalizedVerse: -1, // we have zero-verses (psalms in some versions)
        versionChapter: 0,
        versionVerse: -1 // we have zero-verses (psalms in some versions)
    };

    for (const phrase of phrases) {
        const activeSections: { sectionId: number; level: number }[] = [];
        let activeParagraph: IBibleOutputGroup<'paragraph'>['meta'] | undefined;
        const activeModifiers: PhraseModifiers & { quoteWho?: string; person?: string } = {
            indentLevel: 0,
            quoteLevel: 0
        };

        // go backwards through all groups and check if the current phrase is still within that
        // group. if not, "go out" of that group by setting the activeGroup to its parent
        let _group = <BibleOutputContainer>activeGroup;
        while (_group.parent) {
            let isPhraseInGroup = true;
            if (_group.type === 'section') {
                // check if the current phrase is within the group-section
                isPhraseInGroup = _group.phraseEndId >= phrase.id;
            } else if (_group.type === 'group') {
                if (_group.groupType === 'paragraph') {
                    isPhraseInGroup =
                        (<IBibleOutputGroup<'paragraph'>>_group).meta.phraseEndId >= phrase.id;
                } else if (_group.groupType === 'indent') {
                    // => this group has a level (numeric) modifier
                    // check if the current phrase has the same or higher level
                    isPhraseInGroup =
                        !!phrase.getModifierValue('indentLevel') &&
                        phrase.getModifierValue('indentLevel')! >=
                            (<IBibleOutputGroup<'indent'>>_group).meta.level;
                } else if (_group.groupType === 'quote') {
                    isPhraseInGroup =
                        phrase.quoteWho === _group.modifier &&
                        !!phrase.getModifierValue('quoteLevel') &&
                        phrase.getModifierValue('quoteLevel')! >=
                            (<IBibleOutputGroup<'quote'>>_group).meta.level;
                } else if (
                    _group.groupType === 'orderedListItem' ||
                    _group.groupType === 'unorderedListItem' ||
                    _group.groupType === 'translationChange'
                ) {
                    isPhraseInGroup = phrase.getModifierValue(_group.groupType) === _group.modifier;
                } else if (_group.groupType === 'person') {
                    isPhraseInGroup = phrase.person === _group.modifier;
                } else {
                    // => this group has a boolean modifier
                    isPhraseInGroup = !!phrase.getModifierValue(_group.groupType);
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
                } else if (_group.groupType === 'indent') {
                    // => this group has a level (numeric) modifier
                    activeModifiers['indentLevel'] = (<IBibleOutputGroup<'indent'>>(
                        _group
                    )).meta.level;
                } else if (_group.groupType === 'quote') {
                    activeModifiers['quoteLevel'] = (<IBibleOutputGroup<'quote'>>_group).meta.level;
                    activeModifiers['quoteWho'] = _group.modifier;
                } else if (
                    _group.groupType === 'orderedListItem' ||
                    _group.groupType === 'unorderedListItem' ||
                    _group.groupType === 'translationChange' ||
                    _group.groupType === 'person'
                ) {
                    activeModifiers[_group.groupType] = _group.modifier;
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

        // go through all levels of context
        for (const level of Object.keys(context)
            .sort()
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
                    activeSections.find(activeSection => activeSection.level >= level)
                ) {
                    throw new Error(`can't create output object: corrupted structure (section)`);
                }

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

        // loop through modifiers and check if active check if they need to be started

        // force a specific order of modifiers:
        const modifiers: (keyof PhraseModifiers | 'person')[] = [
            'unorderedListItem',
            'orderedListItem',
            'indentLevel',
            'quoteLevel',
            'emphasis',
            'bold',
            'italic',
            'translationChange',
            'person',
            'divineName'
        ];

        for (const modifier of modifiers) {
            let newGroup = null;
            if (modifier === 'indentLevel') {
                if (
                    phrase.getModifierValue('indentLevel') &&
                    (!activeModifiers['indentLevel'] ||
                        phrase.getModifierValue('indentLevel')! > activeModifiers['indentLevel']!)
                ) {
                    // => this phrase starts a new indent group

                    newGroup = <IBibleOutputGroup<'indent'>>{
                        type: 'group',
                        groupType: 'indent',
                        parent: activeGroup,
                        meta: { level: phrase.getModifierValue('indentLevel')! },
                        contents: []
                    };

                    activeModifiers['indentLevel'] = phrase.getModifierValue('indentLevel')!;
                }
            } else if (modifier === 'quoteLevel') {
                if (
                    phrase.getModifierValue('quoteLevel') &&
                    (!activeModifiers['quoteLevel'] ||
                        phrase.getModifierValue('quoteLevel')! > activeModifiers['quoteLevel']!)
                ) {
                    // => this phrase starts a new quote group

                    newGroup = <IBibleOutputGroup<'quote'>>{
                        type: 'group',
                        groupType: 'quote',
                        modifier: phrase.quoteWho,
                        parent: activeGroup,
                        meta: { level: phrase.getModifierValue('quoteLevel')! },
                        contents: []
                    };

                    activeModifiers['quoteLevel'] = phrase.getModifierValue('quoteLevel')!;
                }
            } else if (
                modifier === 'orderedListItem' ||
                modifier === 'unorderedListItem' ||
                modifier === 'translationChange'
            ) {
                if (
                    phrase.getModifierValue(modifier) &&
                    phrase.getModifierValue(modifier) !== activeModifiers[modifier]
                ) {
                    newGroup = <IBibleOutputGroup<ValueModifiers>>{
                        type: 'group',
                        meta: undefined, // TypeScript wants that (bug?)
                        groupType: modifier,
                        modifier: phrase.getModifierValue(modifier),
                        parent: activeGroup,
                        contents: []
                    };
                    activeModifiers[modifier] = phrase.getModifierValue(modifier);
                }
            } else if (modifier === 'person') {
                if (phrase.person && phrase.person !== activeModifiers['person']) {
                    newGroup = <IBibleOutputGroup<'person'>>{
                        type: 'group',
                        meta: undefined, // TypeScript wants that (bug?)
                        groupType: 'person',
                        modifier: phrase.person,
                        parent: activeGroup,
                        contents: []
                    };
                    activeModifiers[modifier] = phrase.person;
                }
            } else {
                if (phrase.getModifierValue(modifier) && !activeModifiers[modifier]) {
                    // => this phrase starts a boolean modifier

                    newGroup = <IBibleOutputGroup<BooleanModifiers>>{
                        type: 'group',
                        meta: undefined, // TypeScript wants that (bug?)
                        groupType: modifier,
                        parent: activeGroup,
                        contents: []
                    };
                    activeModifiers[modifier] = true;
                }
            }
            if (newGroup) {
                activeGroup.contents[activeGroup.contents.length] = newGroup;
                activeGroup = newGroup;
            }
        }

        // set numbering
        // get the most outer group for wich this is the first phrase
        let numberingGroup: BibleOutputContainer | null = null;
        let _numberingGroupTmp: BibleOutputContainer | undefined = activeGroup;
        do {
            if (_numberingGroupTmp === activeGroup) {
                if (_numberingGroupTmp.contents.length === 0) numberingGroup = _numberingGroupTmp;
                else break;
            } else {
                // as soon as we hit a group with more than one content we can break, otherwise it
                // is a valid numbering group(=> if a parent has only one member it is the one from
                // where we navigated via the parent attribute)
                // tslint:disable-next-line:one-line
                if (_numberingGroupTmp.contents.length > 1) break;
                else if (_numberingGroupTmp.contents.length === 1)
                    numberingGroup = _numberingGroupTmp;
                // there should be no group that is not a phrase group and has no child
                else if (_numberingGroupTmp.contents.length === 0)
                    throw new Error(
                        `can't create output object: corrupted structure (empty ancestor group)`
                    );
            }

            _numberingGroupTmp = _numberingGroupTmp.parent;
        } while (!!_numberingGroupTmp);

        const numbering: IBibleOutputNumbering = {};

        // if this phrase switches any numbers (verse/chapter, normalized/version), the related
        // value is set on the numbering object of the topmost group where this phrase is the
        // (current) only member
        if (
            currentNumbering.normalizedChapter !== phrase.normalizedReference.normalizedChapterNum
        ) {
            // psalms can have verse number zero
            if (phrase.normalizedReference.normalizedVerseNum <= 1)
                numbering.normalizedChapterIsStarting =
                    phrase.normalizedReference.normalizedChapterNum;
            numbering.normalizedChapterIsStartingInRange =
                phrase.normalizedReference.normalizedChapterNum;
            currentNumbering.normalizedChapter = phrase.normalizedReference.normalizedChapterNum;
        }
        if (currentNumbering.normalizedVerse !== phrase.normalizedReference.normalizedVerseNum) {
            numbering.normalizedVerseIsStarting = phrase.normalizedReference.normalizedVerseNum;
            currentNumbering.normalizedVerse = phrase.normalizedReference.normalizedVerseNum;
        }
        if (currentNumbering.versionChapter !== phrase.versionChapterNum) {
            // psalms can have verse number zero
            if (phrase.versionVerseNum <= 1)
                numbering.versionChapterIsStarting = phrase.versionChapterNum;
            numbering.versionChapterIsStartingInRange = phrase.versionChapterNum;
            currentNumbering.versionChapter = phrase.versionChapterNum;
        }
        if (currentNumbering.versionVerse !== phrase.versionVerseNum) {
            numbering.versionVerseIsStarting = phrase.versionVerseNum;
            currentNumbering.versionVerse = phrase.versionVerseNum;
        }

        const outputPhrase: IBibleOutputPhrase = { ...phrase, type: 'phrase', parent: activeGroup };
        if (phrase.crossReferences && phrase.crossReferences.length) {
            outputPhrase.crossReferences = phrase.crossReferences.map(crossRef => ({
                ...crossRef,
                label: generateReferenceRangeLabel(
                    crossRef.range,
                    bookAbbreviations[crossRef.range.bookOsisId],
                    chapterVerseSeparator
                )
            }));
        }

        if (Object.keys(numbering).length) {
            // we have no suitable numberingGroup => a new outputGroupPhrases needs to be created
            if (numberingGroup === null) {
                outputPhrase.numbering = numbering;
            } else {
                // if the numberingGroup we figured out already has numbering values set we screwed
                // up somewhere
                if (numberingGroup.numbering)
                    throw new Error(
                        `can't create output object: corrupted structure (unexpected numbering ` +
                            `group)`
                    );

                numberingGroup.numbering = numbering;
            }
        }

        // finally we can add our phrase to the data structure
        activeGroup.contents[activeGroup.contents.length] = outputPhrase;
    }

    return rootGroup;
};
