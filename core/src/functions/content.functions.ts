import {
    BibleBookPlaintext,
    BibleContentGeneratorContainer,
    BooleanModifiers,
    ContentGroupType,
    IBibleContent,
    IBibleContentGeneratorGroup,
    IBibleContentGeneratorPhrase,
    IBibleContentGeneratorRoot,
    IBibleContentGeneratorSection,
    IBibleContentGroup,
    IBibleContentPhrase,
    IBibleContentSection,
    IBibleOutputRich,
    IBibleOutputRoot,
    PhraseModifiers,
    ValueModifiers,
    IBibleNumbering,
    IBibleReferenceRange,
    IBibleReferenceRangeNormalized,
    IBibleSection,
    IBibleNote,
    IBibleVersion,
    IBibleBook,
    IBibleReferenceRangeQuery
} from '../models';
import {
    BiblePhraseEntity,
    BibleParagraphEntity,
    BibleSectionEntity,
    BibleBookEntity,
    BibleVersionEntity
} from '../entities';
import {
    generateReferenceRangeLabel,
    slimDownCrossReference,
    generateRangeFromGenericSection,
    slimDownReferenceRange
} from './reference.functions';
import { getNormalizedChapterCountForOsisId, getNormalizedVerseCount } from './v11n.functions';

/**
 * turns BibleEngine input-data into a plain two-level Map of chapters and verses with plain text
 * @param {IBibleContent[]} contents
 * @param {BibleBookPlaintext} _accChapters
 * @returns {IBibleBookPlaintext}
 */
export const convertBibleInputToBookPlaintext = (
    contents: IBibleContent[],
    useNormalizedNumbers = false,
    _currentNumbers: {
        chapter?: number;
        verse?: number;
        subverse?: number;
    } = {},
    _accChapters: BibleBookPlaintext = new Map()
) => {
    for (const content of contents) {
        if (content.type !== 'section') {
            if (content.type === 'phrase' && content.versionChapterNum && content.versionVerseNum) {
                if (useNormalizedNumbers) {
                    if (!content.normalizedReference) throw new Error(`missing normalized numbers`);
                    _currentNumbers.chapter = content.normalizedReference.normalizedChapterNum;
                    _currentNumbers.verse = content.normalizedReference.normalizedVerseNum;
                    _currentNumbers.subverse = content.normalizedReference.normalizedSubverseNum;
                } else {
                    _currentNumbers.chapter = content.versionChapterNum;
                    _currentNumbers.verse = content.versionVerseNum;
                    _currentNumbers.subverse = content.versionSubverseNum;
                }
            } else if (content.numbering) {
                if (useNormalizedNumbers) {
                    if (content.numbering.normalizedChapterIsStartingInRange)
                        _currentNumbers.chapter =
                            content.numbering.normalizedChapterIsStartingInRange;
                    if (content.numbering.normalizedVerseIsStarting) {
                        _currentNumbers.verse = content.numbering.normalizedVerseIsStarting;
                        delete _currentNumbers.subverse;
                    }
                    if (content.numbering.normalizedSubverseIsStarting)
                        _currentNumbers.subverse = content.numbering.normalizedSubverseIsStarting;
                } else {
                    if (content.numbering.versionChapterIsStartingInRange)
                        _currentNumbers.chapter = content.numbering.versionChapterIsStartingInRange;
                    if (content.numbering.versionVerseIsStarting) {
                        _currentNumbers.verse = content.numbering.versionVerseIsStarting;
                        delete _currentNumbers.subverse;
                    }
                    if (content.numbering.versionSubverseIsStarting)
                        _currentNumbers.subverse = content.numbering.versionSubverseIsStarting;
                }
            }
        }

        if (content.type === 'group' || content.type === 'section') {
            convertBibleInputToBookPlaintext(
                content.contents,
                useNormalizedNumbers,
                _currentNumbers,
                _accChapters
            );
        } else {
            if (!_currentNumbers.chapter || !_currentNumbers.verse) {
                throw new Error(`missing numbering in input`);
            }

            const subverseNum = _currentNumbers.subverse || 0;
            if (!_accChapters.has(_currentNumbers.chapter))
                _accChapters.set(_currentNumbers.chapter, new Map());
            const chapter = _accChapters.get(_currentNumbers.chapter)!; // we know it's set
            if (!chapter.has(_currentNumbers.verse)) chapter.set(_currentNumbers.verse, []);
            const verse = chapter.get(_currentNumbers.verse)!; // we know it's set
            const subverse = verse[subverseNum]
                ? verse[subverseNum] + ' ' + content.content
                : content.content;
            verse[subverseNum] = subverse;
        }
    }

    return _accChapters;
};

/**
 * turns list of phrases, paragraphs and sections into a structured bible document
 * @param {BiblePhraseEntity[]} phrases
 * @param {BibleParagraphEntity[]} paragraphs
 * @param {IBibleOutputRich['context']} context
 * @returns {IBibleContentGeneratorRoot}
 */
export const generateBibleDocument = (
    phrases: BiblePhraseEntity[],
    paragraphs: BibleParagraphEntity[],
    context: IBibleOutputRich['context'],
    bookAbbreviations: { [index: string]: string },
    chapterVerseSeparator: string,
    rangeQuery: IBibleReferenceRangeQuery
): IBibleOutputRoot => {
    const rootGroup: IBibleContentGeneratorRoot = {
        type: 'root',
        parent: undefined,
        contents: []
    };
    if (!phrases.length) return rootGroup;

    const firstPhraseId = phrases[0].id;
    const lastPhraseId = phrases[phrases.length - 1].id;
    let activeGroup: BibleContentGeneratorContainer = rootGroup;
    let previousPhrase: IBibleContentGeneratorPhrase | undefined;

    const currentNumbering: {
        normalizedChapter: number;
        normalizedVerse: number;
        normalizedSubverse: number;
        versionChapter: number;
        versionVerse: number;
        versionSubverse?: number;
    } = {
        normalizedChapter: 0,
        normalizedVerse: -1, // we have zero-verses (psalms in some versions)
        normalizedSubverse: 0,
        versionChapter: 0,
        versionVerse: -1 // we have zero-verses (psalms in some versions)
    };

    for (const phrase of phrases) {
        const activeSections: { level: number; phraseStartId: number; phraseEndId: number }[] = [];
        let activeParagraph: IBibleContentGeneratorGroup<'paragraph'>['meta'] | undefined;
        const activeModifiers: PhraseModifiers & { quoteWho?: string; person?: string } = {
            indentLevel: 0,
            quoteLevel: 0
        };

        // go backwards through all groups and check if the current phrase is still within that
        // group. if not, "go out" of that group by setting the activeGroup to its parent
        let _group = <BibleContentGeneratorContainer>activeGroup;
        let isIndentDowngrade = false;
        while (_group.parent) {
            let isPhraseInGroup = true;
            if (_group.type === 'section') {
                // check if the current phrase is within the group-section
                isPhraseInGroup = _group.meta.phraseEndId >= phrase.id;
            } else if (_group.type === 'group') {
                if (_group.groupType === 'paragraph') {
                    isPhraseInGroup =
                        (<IBibleContentGeneratorGroup<'paragraph'>>_group).meta.phraseEndId >=
                        phrase.id;
                } else if (_group.groupType === 'indent') {
                    // => this group has a level (numeric) modifier
                    // check if the current phrase has the same or higher level
                    isPhraseInGroup =
                        !isIndentDowngrade &&
                        !!phrase.getModifierValue('indentLevel') &&
                        phrase.getModifierValue('indentLevel')! >=
                            (<IBibleContentGeneratorGroup<'indent'>>_group).meta.level;

                    // if an indent group ends we want to set up new indent groups from root level
                    // (we need this for UI-rendering, especially related to showing verse numbers
                    //  on a consistent line and not indented)
                    if (!isPhraseInGroup && phrase.getModifierValue('indentLevel') !== undefined) {
                        isIndentDowngrade = true;
                    }
                } else if (_group.groupType === 'quote') {
                    isPhraseInGroup =
                        phrase.quoteWho === _group.modifier &&
                        !!phrase.getModifierValue('quoteLevel') &&
                        phrase.getModifierValue('quoteLevel')! >=
                            (<IBibleContentGeneratorGroup<'quote'>>_group).meta.level;
                } else if (
                    _group.groupType === 'line' ||
                    _group.groupType === 'orderedListItem' ||
                    _group.groupType === 'unorderedListItem' ||
                    _group.groupType === 'translationChange' ||
                    _group.groupType === 'title' ||
                    _group.groupType === 'link'
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
                    activeParagraph = (<IBibleContentGeneratorGroup<'paragraph'>>_group).meta;
                } else if (_group.groupType === 'indent') {
                    // => this group has a level (numeric) modifier - the highest level is active
                    const indentLevel = (<IBibleContentGeneratorGroup<'indent'>>_group).meta.level;
                    if (
                        !activeModifiers['indentLevel'] ||
                        indentLevel > activeModifiers['indentLevel']
                    )
                        activeModifiers['indentLevel'] = indentLevel;
                } else if (_group.groupType === 'quote') {
                    const quoteLevel = (<IBibleContentGeneratorGroup<'quote'>>_group).meta.level;
                    if (
                        !activeModifiers['quoteLevel'] ||
                        quoteLevel > activeModifiers['quoteLevel']
                    )
                        activeModifiers['quoteLevel'] = quoteLevel;
                    activeModifiers['quoteWho'] = (_group as IBibleContentGeneratorGroup<
                        'quote'
                    >).modifier;
                } else if (
                    _group.groupType === 'line' ||
                    _group.groupType === 'orderedListItem' ||
                    _group.groupType === 'unorderedListItem' ||
                    _group.groupType === 'translationChange' ||
                    _group.groupType === 'title' ||
                    _group.groupType === 'person' ||
                    _group.groupType === 'link'
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
            const section = context[level].startingSections.find(
                _section =>
                    phrase.id >= _section.phraseStartId &&
                    phrase.id <= _section.phraseEndId &&
                    // in some situations (like verse reference popups) we don't want to show
                    // sections that start at the first phrase of the query and end after the last
                    // phrase
                    !(
                        rangeQuery.skipPartialWrappingSectionsInDocument &&
                        _section.phraseStartId === firstPhraseId &&
                        _section.phraseEndId > lastPhraseId
                    )
            );
            // is the section already active?
            if (
                section &&
                !activeSections.find(
                    activeSection =>
                        activeSection.level === level &&
                        activeSection.phraseStartId === section.phraseStartId &&
                        activeSection.phraseEndId === section.phraseEndId
                )
            ) {
                if (
                    // section can only be children of root or other sections. Else the strucuture
                    // got corrupted somewhere. throw an error so we know about it
                    (activeGroup.type !== 'root' && activeGroup.type !== 'section') ||
                    // throw error if creating a section in the wrong level order
                    activeSections.find(activeSection => activeSection.level >= level)
                ) {
                    console.log(activeGroup);
                    console.log(activeSections);
                    console.log(level);
                    console.log(section);
                    console.log(phrase);
                    throw new Error(`can't create output object: corrupted structure (section)`);
                }

                const newSectionMeta = {
                    level,
                    phraseStartId: section.phraseStartId,
                    phraseEndId: section.phraseEndId
                };
                const newSection: IBibleContentGeneratorSection = {
                    ...section,
                    type: 'section',
                    meta: newSectionMeta,
                    level,
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
            const newParagraph: IBibleContentGeneratorGroup<'paragraph'> = {
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
            'indentLevel',
            'quoteLevel',
            'title',
            'linegroup',
            'line',
            'unorderedListItem',
            'orderedListItem',
            'emphasis',
            'bold',
            'italic',
            'link',
            'translationChange',
            'person',
            'divineName',
            'sela'
        ];

        for (const modifier of modifiers) {
            let newGroup = null;
            if (modifier === 'indentLevel') {
                if (
                    phrase.getModifierValue('indentLevel') !== undefined &&
                    (activeModifiers['indentLevel'] === undefined ||
                        phrase.getModifierValue('indentLevel')! > activeModifiers['indentLevel']!)
                ) {
                    // => this phrase starts a new indent group
                    newGroup = <IBibleContentGeneratorGroup<'indent'>>{
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

                    newGroup = <IBibleContentGeneratorGroup<'quote'>>{
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
                modifier === 'translationChange' ||
                modifier === 'title' ||
                modifier === 'link' ||
                modifier === 'line'
            ) {
                if (
                    phrase.getModifierValue(modifier) &&
                    phrase.getModifierValue(modifier) !== activeModifiers[modifier]
                ) {
                    newGroup = <IBibleContentGeneratorGroup<ValueModifiers>>{
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
                    newGroup = <IBibleContentGeneratorGroup<'person'>>{
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

                    newGroup = <IBibleContentGeneratorGroup<BooleanModifiers>>{
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
        let numberingGroup: IBibleContentGeneratorGroup<ContentGroupType> | null = null;
        let numberingGroupSection: IBibleContentGeneratorSection | null = null;
        let _numberingGroupTmp: BibleContentGeneratorContainer | undefined = activeGroup;
        do {
            if (_numberingGroupTmp.type === 'root') continue;
            else if (_numberingGroupTmp === activeGroup) {
                if (_numberingGroupTmp.contents.length === 0) {
                    if (_numberingGroupTmp.type === 'section')
                        numberingGroupSection = _numberingGroupTmp;
                    else if (_numberingGroupTmp.groupType !== 'paragraph')
                        numberingGroup = _numberingGroupTmp;
                } else break;
            } else {
                // as soon as we hit a group with more than one content we can break, otherwise it
                // is a valid numbering group(=> if a parent has only one member it is the one from
                // where we navigated via the parent attribute)
                // tslint:disable-next-line:one-line
                if (_numberingGroupTmp.contents.length > 1) break;
                else if (_numberingGroupTmp.contents.length === 1) {
                    if (_numberingGroupTmp.type === 'section')
                        numberingGroupSection = _numberingGroupTmp;
                    else if (_numberingGroupTmp.groupType !== 'paragraph')
                        numberingGroup = _numberingGroupTmp;
                }
                // there should be no group that is not a phrase group and has no child
                else if (_numberingGroupTmp.contents.length === 0)
                    throw new Error(
                        `can't create output object: corrupted structure (empty ancestor group)`
                    );
            }
        } while (!!(_numberingGroupTmp = _numberingGroupTmp.parent));

        const numbering: IBibleNumbering['numbering'] = {};

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
        if (
            currentNumbering.normalizedSubverse !== phrase.normalizedReference.normalizedSubverseNum
        ) {
            numbering.normalizedSubverseIsStarting =
                phrase.normalizedReference.normalizedSubverseNum;
            currentNumbering.normalizedSubverse = phrase.normalizedReference.normalizedSubverseNum;
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
        if (currentNumbering.versionSubverse !== phrase.versionSubverseNum) {
            numbering.versionSubverseIsStarting = phrase.versionSubverseNum;
            currentNumbering.versionSubverse = phrase.versionSubverseNum;
        }

        const outputPhrase: IBibleContentGeneratorPhrase = {
            ...phrase,
            type: 'phrase',
            parent: activeGroup
        };
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

            if (numberingGroupSection) numberingGroupSection.numberingInternal = numbering;
        }

        if (outputPhrase.skipSpace === 'before') {
            delete outputPhrase.skipSpace;
            if (previousPhrase) {
                previousPhrase.skipSpace = 'after';
            }
        }

        // finally we can add our phrase to the data structure
        activeGroup.contents[activeGroup.contents.length] = outputPhrase;
        previousPhrase = outputPhrase;
    }

    return rootGroup;
};

export const generateContextSections = (
    phrases: BiblePhraseEntity[],
    sections: BibleSectionEntity[]
) => {
    const context: IBibleOutputRich['context'] = {};

    if (phrases.length) {
        const firstPhraseId = phrases[0].id;
        const lastPhraseId = phrases[phrases.length - 1].id;
        for (const section of sections) {
            if (section.level > 1) {
                let isSectionWithinParentLevel = false;
                for (const parentSection of [
                    ...context[section.level - 1].startingSections,
                    context[section.level - 1].wrappingSection,
                    context[section.level - 1].endingPartialSection
                ]) {
                    if (
                        parentSection &&
                        ((section.phraseStartId >= parentSection.phraseStartId &&
                            section.phraseStartId <= parentSection.phraseEndId) ||
                            (section.phraseEndId >= parentSection.phraseStartId &&
                                section.phraseEndId <= parentSection.phraseEndId))
                    ) {
                        isSectionWithinParentLevel = true;
                        break;
                    }
                }

                if (!isSectionWithinParentLevel) continue;
            }

            if (!context[section.level]) {
                context[section.level] = {
                    startingSections: [],
                    previousSections: [],
                    nextSections: []
                };
            }

            // check if this section is before the range
            if (section.phraseEndId < firstPhraseId)
                context[section.level].previousSections.push(section);
            // check if this section is after the range
            else if (section.phraseStartId > lastPhraseId)
                context[section.level].nextSections.push(section);
            // check if this section starts within the range
            else if (
                section.phraseStartId >= firstPhraseId &&
                section.phraseStartId <= lastPhraseId
            )
                context[section.level].startingSections.push(section);
            // check if this section ends within the range
            else if (
                section.phraseStartId < firstPhraseId &&
                section.phraseEndId >= firstPhraseId &&
                section.phraseEndId <= lastPhraseId
            )
                context[section.level].endingPartialSection = section;
            else {
                // this seciton wraps the entire range (by exclusion above)
                context[section.level].wrappingSection = section;
            }
        }
    }
    return context;
};

export const generateContextRanges = (
    range: IBibleReferenceRange,
    rangeNormalized: IBibleReferenceRangeNormalized,
    phrases: BiblePhraseEntity[],
    paragraphs: BibleParagraphEntity[],
    context: IBibleOutputRich['context'],
    book: BibleBookEntity
) => {
    const contextRanges: IBibleOutputRich['contextRanges'] = {
        paragraph: {},
        sections: {},
        versionChapter: {},
        normalizedChapter: {}
    };

    if (phrases.length) {
        const firstPhraseId = phrases[0].id;
        const lastPhraseId = phrases[phrases.length - 1].id;

        // paragraph context ranges
        for (const paragraph of paragraphs) {
            // paragraphs are sequentially sorted

            // the last paragraph before the range not included in the range will end up as
            // 'previousRange'
            if (paragraph.phraseEndId < firstPhraseId)
                contextRanges.paragraph.previousRange = generateRangeFromGenericSection(paragraph);
            // the first paragraph after the range not included in the range will be set as
            // 'nextRange'
            else if (paragraph.phraseStartId > lastPhraseId && !contextRanges.paragraph.nextRange)
                contextRanges.paragraph.nextRange = generateRangeFromGenericSection(paragraph);
            else if (
                paragraph.phraseStartId < firstPhraseId &&
                paragraph.phraseEndId > lastPhraseId
            )
                contextRanges.paragraph.completeRange = generateRangeFromGenericSection(paragraph);
            else if (
                paragraph.phraseStartId < firstPhraseId &&
                paragraph.phraseEndId >= firstPhraseId &&
                paragraph.phraseEndId <= lastPhraseId
            )
                contextRanges.paragraph.completeStartingRange = generateRangeFromGenericSection(
                    paragraph
                );
            else if (
                paragraph.phraseStartId >= firstPhraseId &&
                paragraph.phraseStartId <= lastPhraseId &&
                paragraph.phraseEndId > lastPhraseId
            )
                contextRanges.paragraph.completeEndingRange = generateRangeFromGenericSection(
                    paragraph
                );
        }
        if (
            paragraphs.length === 1 &&
            (paragraphs[0].phraseStartId < firstPhraseId ||
                paragraphs[0].phraseEndId > lastPhraseId)
        ) {
            contextRanges.paragraph.completeRange = generateRangeFromGenericSection(paragraphs[0]);
        }

        // context ranges for chapter (version & normalized)
        if (range.versionChapterNum) {
            if (range.versionChapterNum > 1)
                contextRanges.versionChapter.previousRange = {
                    bookOsisId: book.osisId,
                    versionChapterNum: range.versionChapterNum - 1
                };
            if (
                (range.versionChapterEndNum &&
                    range.versionChapterEndNum < book.chaptersCount.length) ||
                (!range.versionChapterEndNum &&
                    range.versionChapterNum &&
                    range.versionChapterNum < book.chaptersCount.length)
            ) {
                contextRanges.versionChapter.nextRange = {
                    bookOsisId: book.osisId,
                    versionChapterNum: range.versionChapterEndNum
                        ? range.versionChapterEndNum + 1
                        : range.versionChapterNum! + 1
                };
            }
            if (
                (!range.versionChapterEndNum ||
                    range.versionChapterNum === range.versionChapterEndNum) &&
                range.versionVerseNum &&
                (!range.versionVerseEndNum ||
                    range.versionVerseNum > 1 ||
                    range.versionVerseEndNum < book.getChapterVerseCount(range.versionChapterNum))
            ) {
                contextRanges.versionChapter.completeRange = {
                    bookOsisId: book.osisId,
                    versionChapterNum: range.versionChapterNum
                };
            }
            if (
                range.versionVerseNum &&
                range.versionVerseNum > 1 &&
                range.versionChapterEndNum &&
                range.versionChapterEndNum > range.versionChapterNum
            ) {
                contextRanges.versionChapter.completeStartingRange = {
                    bookOsisId: book.osisId,
                    versionChapterNum: range.versionChapterNum
                };
            }
            if (
                range.versionChapterEndNum &&
                range.versionChapterEndNum !== range.versionChapterNum &&
                range.versionVerseEndNum &&
                range.versionVerseEndNum < book.getChapterVerseCount(range.versionChapterEndNum)
            ) {
                contextRanges.versionChapter.completeEndingRange = {
                    bookOsisId: book.osisId,
                    versionChapterNum: range.versionChapterEndNum
                };
            }
        }
        if (rangeNormalized.normalizedChapterNum) {
            if (rangeNormalized.normalizedChapterNum > 1)
                contextRanges.normalizedChapter.previousRange = {
                    bookOsisId: book.osisId,
                    normalizedChapterNum: rangeNormalized.normalizedChapterNum - 1
                };
            if (
                (rangeNormalized.normalizedChapterEndNum &&
                    rangeNormalized.normalizedChapterEndNum <
                        getNormalizedChapterCountForOsisId(book.osisId)) ||
                (!rangeNormalized.normalizedChapterEndNum &&
                    rangeNormalized.normalizedChapterNum &&
                    rangeNormalized.normalizedChapterNum <
                        getNormalizedChapterCountForOsisId(book.osisId))
            ) {
                contextRanges.normalizedChapter.nextRange = {
                    bookOsisId: book.osisId,
                    normalizedChapterNum: rangeNormalized.normalizedChapterEndNum
                        ? rangeNormalized.normalizedChapterEndNum + 1
                        : rangeNormalized.normalizedChapterNum! + 1
                };
            }
            if (
                (!rangeNormalized.normalizedChapterEndNum ||
                    rangeNormalized.normalizedChapterNum ===
                        rangeNormalized.normalizedChapterEndNum) &&
                rangeNormalized.normalizedVerseNum &&
                (!rangeNormalized.normalizedVerseEndNum ||
                    rangeNormalized.normalizedVerseNum > 1 ||
                    rangeNormalized.normalizedVerseEndNum <
                        getNormalizedVerseCount(book.osisId, rangeNormalized.normalizedChapterNum))
            ) {
                contextRanges.normalizedChapter.completeRange = {
                    bookOsisId: book.osisId,
                    normalizedChapterNum: rangeNormalized.normalizedChapterNum
                };
            }
            if (
                rangeNormalized.normalizedVerseNum &&
                rangeNormalized.normalizedVerseNum > 1 &&
                rangeNormalized.normalizedChapterEndNum &&
                rangeNormalized.normalizedChapterEndNum > rangeNormalized.normalizedChapterNum
            ) {
                contextRanges.normalizedChapter.completeStartingRange = {
                    bookOsisId: book.osisId,
                    normalizedChapterNum: rangeNormalized.normalizedChapterNum
                };
            }
            if (
                rangeNormalized.normalizedChapterEndNum &&
                rangeNormalized.normalizedChapterEndNum !== rangeNormalized.normalizedChapterNum &&
                rangeNormalized.normalizedVerseEndNum &&
                rangeNormalized.normalizedVerseEndNum <
                    getNormalizedVerseCount(book.osisId, rangeNormalized.normalizedChapterEndNum)
            ) {
                contextRanges.normalizedChapter.completeEndingRange = {
                    bookOsisId: book.osisId,
                    normalizedChapterNum: rangeNormalized.normalizedChapterEndNum
                };
            }
        }

        for (const sectionLevel of Object.keys(context).map(_sectionLevel => +_sectionLevel)) {
            if (!contextRanges.sections[sectionLevel]) contextRanges.sections[sectionLevel] = {};

            if (context[sectionLevel] && context[sectionLevel].wrappingSection) {
                contextRanges.sections[
                    sectionLevel
                ].completeRange = generateRangeFromGenericSection(
                    context[sectionLevel].wrappingSection!
                );
            } else if (context[sectionLevel].endingPartialSection) {
                contextRanges.sections[
                    sectionLevel
                ].completeStartingRange = generateRangeFromGenericSection(
                    context[sectionLevel].endingPartialSection!
                );
            } else if (context[sectionLevel].startingSections.length > 0) {
                // => if there is a wrapping section, there can't be startingSections on the
                //    same level
                if (context[sectionLevel].startingSections[0].phraseStartId < firstPhraseId) {
                    contextRanges.sections[
                        sectionLevel
                    ].completeStartingRange = generateRangeFromGenericSection(
                        context[sectionLevel].startingSections[0]
                    );
                }
                if (
                    context[sectionLevel].startingSections[
                        context[sectionLevel].startingSections.length - 1
                    ].phraseEndId > lastPhraseId
                ) {
                    contextRanges.sections[
                        sectionLevel
                    ].completeEndingRange = generateRangeFromGenericSection(
                        context[sectionLevel].startingSections[
                            context[sectionLevel].startingSections.length - 1
                        ]
                    );
                }
            }

            if (context[sectionLevel] && context[sectionLevel].previousSections.length)
                contextRanges.sections[
                    sectionLevel
                ].previousRange = generateRangeFromGenericSection(
                    context[sectionLevel].previousSections[
                        context[sectionLevel].previousSections.length - 1
                    ]
                );
            if (context[sectionLevel] && context[sectionLevel].nextSections.length)
                contextRanges.sections[sectionLevel].nextRange = generateRangeFromGenericSection(
                    context[sectionLevel].nextSections[0]
                );
        }
    }
    return contextRanges;
};

export const stripUnnecessaryDataFromBibleBook = (
    bookEntity: BibleBookEntity,
    stripDocuments = false
): IBibleBook => {
    const book: IBibleBook = {
        osisId: bookEntity.osisId,
        number: bookEntity.number,
        abbreviation: bookEntity.abbreviation,
        title: bookEntity.title,
        type: bookEntity.type,
        chaptersCount: bookEntity.chaptersCount,
        longTitle: bookEntity.longTitle
    };
    if (bookEntity.introduction && !stripDocuments) book.introduction = bookEntity.introduction;
    return book;
};

/**
 * remove everything from 'data' that is not needed for input, mainly to reduce JSON size
 * @param {IBibleContent[]} data
 * @returns {IBibleContent[]}
 */
export const stripUnnecessaryDataFromBibleContent = (data: IBibleContent[]): IBibleContent[] => {
    const inputData: IBibleContent[] = [];
    for (const obj of data) {
        if (obj.type === 'phrase') {
            const phrase = obj;
            // we only leave the numbering object on the phrase and strip the version*Num
            // attributes. They are redudant.
            const inputPhrase: IBibleContentPhrase = {
                // type: 'phrase',
                content: phrase.content
                // versionChapterNum: phrase.versionChapterNum,
                // versionVerseNum: phrase.versionVerseNum
            };
            if (phrase.versionSubverseNum)
                inputPhrase.versionSubverseNum = phrase.versionSubverseNum;
            if (phrase.sourceTypeId) inputPhrase.sourceTypeId = phrase.sourceTypeId;
            if (phrase.joinToRefId) inputPhrase.joinToRefId = phrase.joinToRefId;
            if (phrase.linebreak) inputPhrase.linebreak = true;
            if (phrase.skipSpace) inputPhrase.skipSpace = phrase.skipSpace;
            if (phrase.quoteWho) inputPhrase.quoteWho = phrase.quoteWho;
            if (phrase.person) inputPhrase.person = phrase.person;
            if (phrase.strongs && phrase.strongs.length) inputPhrase.strongs = phrase.strongs;
            if (phrase.notes && phrase.notes.length)
                inputPhrase.notes = phrase.notes.map(({ key, type, content }) => {
                    const note: IBibleNote = {
                        content
                    };
                    if (key) note.key = key;
                    if (type) note.type = type;
                    return note;
                });
            if (phrase.crossReferences && phrase.crossReferences.length)
                inputPhrase.crossReferences = phrase.crossReferences.map(slimDownCrossReference);

            if (phrase.numbering) inputPhrase.numbering = phrase.numbering;

            inputData.push({ ...inputPhrase });
        } else if (obj.type === 'group') {
            const inputGroup: IBibleContentGroup<ContentGroupType> = {
                type: 'group',
                groupType: obj.groupType,
                modifier: obj.modifier,
                contents: <(IBibleContentGroup<ContentGroupType> | IBibleContentPhrase)[]>(
                    stripUnnecessaryDataFromBibleContent(obj.contents)
                )
            };
            if (obj.numbering) inputGroup.numbering = obj.numbering;
            inputData.push(inputGroup);
        } else if (obj.type === 'section') {
            const inputSection: IBibleContentSection = {
                type: 'section',
                contents: stripUnnecessaryDataFromBibleContent(obj.contents)
            };
            if (obj.level !== undefined) inputSection.level = obj.level;
            if (obj.title) inputSection.title = obj.title;
            if (obj.subTitle) inputSection.subTitle = obj.subTitle;
            if (obj.description) inputSection.description = obj.description;
            if (obj.crossReferences && obj.crossReferences.length)
                inputSection.crossReferences = obj.crossReferences.map(slimDownCrossReference);
            if (obj.numberingInternal) inputSection.numberingInternal = obj.numberingInternal;
            inputData.push(inputSection);
        }
    }
    return inputData;
};

export const stripUnnecessaryDataFromBibleContextData = (
    context: IBibleOutputRich['context'],
    contextRanges: IBibleOutputRich['contextRanges']
) => {
    for (const rangeContext of <('paragraph' | 'versionChapter' | 'normalizedChapter')[]>[
        'paragraph',
        'versionChapter',
        'normalizedChapter'
    ]) {
        for (const rangeType of <(keyof IBibleOutputRich['contextRanges']['paragraph'])[]>(
            Object.keys(contextRanges[rangeContext])
        )) {
            contextRanges[rangeContext][rangeType] = slimDownReferenceRange(
                contextRanges[rangeContext][rangeType]!
            );
        }
    }

    for (const level of Object.keys(context).map(_level => +_level)) {
        for (const rangeType of <(keyof IBibleOutputRich['contextRanges']['sections'][0])[]>(
            Object.keys(contextRanges['sections'][level])
        )) {
            contextRanges['sections'][level][rangeType] = slimDownReferenceRange(
                contextRanges['sections'][level][rangeType]!
            );
        }

        // local helper
        const slimDownBibleSection = (section: IBibleSection): IBibleSection => {
            const slimSection: IBibleSection = {
                phraseStartId: section.phraseStartId,
                phraseEndId: section.phraseEndId
            };
            if (section.title) slimSection.title = section.title;
            if (section.subTitle) slimSection.subTitle = section.subTitle;
            if (section.description) slimSection.description = section.description;
            if (section.crossReferences)
                slimSection.crossReferences = section.crossReferences.map(slimDownCrossReference);
            return slimSection;
        };
        if (context[level].wrappingSection)
            context[level].wrappingSection = slimDownBibleSection(context[level].wrappingSection!);
        context[level].startingSections = context[level].startingSections.map(slimDownBibleSection);
        context[level].nextSections = context[level].nextSections.map(slimDownBibleSection);
        context[level].previousSections = context[level].previousSections.map(slimDownBibleSection);
    }
};

export const stripUnnecessaryDataFromBibleReferenceRange = (
    rangeNormalized: IBibleReferenceRangeNormalized
) => {
    delete rangeNormalized.versionId;
    delete rangeNormalized.isNormalized;
};

export const stripUnnecessaryDataFromBibleVersion = (
    versionEntity: BibleVersionEntity,
    stripDocuments = false
): IBibleVersion => {
    const version: IBibleVersion = {
        uid: versionEntity.uid,
        title: versionEntity.title,
        language: versionEntity.language,
        chapterVerseSeparator: versionEntity.chapterVerseSeparator,
        lastUpdate: versionEntity.lastUpdate
    };
    if (versionEntity.copyrightLong && !stripDocuments)
        version.copyrightLong = versionEntity.copyrightLong;
    if (versionEntity.description && !stripDocuments)
        version.description = versionEntity.description;
    if (versionEntity.copyrightShort) version.copyrightShort = versionEntity.copyrightShort;
    if (versionEntity.hasStrongs) version.hasStrongs = versionEntity.hasStrongs;
    return version;
};
