import {
    IBibleContent,
    IBibleContentGroup,
    IBibleContentPhrase,
    IBibleContentSection,
    IBibleOutputRich,
    IBibleOutputRoot,
    IBibleVersion,
} from '../models';
import { IBibleParagraphEntity } from '../models/BibleParagraph';
import { createBiblePhraseEntity, IBiblePhraseEntity } from '../models/BiblePhrase';
import { IBibleSectionEntity } from '../models/BibleSection';
import { generateBibleDocument, PhraseVersionNumbersById } from './content.functions';

describe('generateBibleDocument', () => {
    let doc: IBibleOutputRoot;

    const version: IBibleVersion = {
        uid: 'ESV',
        title: 'ESV',
        chapterVerseSeparator: ':',
        language: 'en-US',
    };

    const bookAbbreviations = {
        Gen: 'Gen',
        Ps: 'Ps',
    };

    const phrase1: IBiblePhraseEntity = createBiblePhraseEntity(
        {
            content: 'phrase1',
            versionChapterNum: 1,
            versionVerseNum: 1,
        },
        {
            isNormalized: true,
            versionId: 1,
            bookOsisId: 'Gen',
            normalizedChapterNum: 1,
            normalizedVerseNum: 1,
            normalizedSubverseNum: 0,
            phraseNum: 1,
        }
    );

    const phrase2: IBiblePhraseEntity = createBiblePhraseEntity(
        {
            content: 'phrase2',
            versionChapterNum: 1,
            versionVerseNum: 1,
        },
        {
            isNormalized: true,
            versionId: 1,
            bookOsisId: 'Gen',
            normalizedChapterNum: 1,
            normalizedVerseNum: 2,
            normalizedSubverseNum: 0,
            phraseNum: 1,
        },
        { quoteLevel: 1 }
    );

    const phrase3: IBiblePhraseEntity = createBiblePhraseEntity(
        {
            content: 'phrase3',
            versionChapterNum: 1,
            versionVerseNum: 2,
        },
        {
            isNormalized: true,
            versionId: 1,
            bookOsisId: 'Gen',
            normalizedChapterNum: 1,
            normalizedVerseNum: 3,
            normalizedSubverseNum: 0,
            phraseNum: 1,
        },
        { quoteLevel: 1 }
    );

    const phrase4: IBiblePhraseEntity = createBiblePhraseEntity(
        {
            content: 'phrase4',
            versionChapterNum: 1,
            versionVerseNum: 2,
        },
        {
            isNormalized: true,
            versionId: 1,
            bookOsisId: 'Gen',
            normalizedChapterNum: 1,
            normalizedVerseNum: 3,
            normalizedSubverseNum: 0,
            phraseNum: 2,
        },
        { translationChange: 'change' }
    );

    const paragraph1: IBibleParagraphEntity = {
        id: 1,
        phraseStartId: phrase1.id,
        phraseEndId: phrase3.id,
        versionId: 1,
    };

    const section1: IBibleSectionEntity = {
        versionId: 1,
        level: 1,
        title: 'section1',
        phraseStartId: phrase1.id,
        phraseEndId: phrase3.id,
        id: 1,
    };
    const section2: IBibleSectionEntity = {
        versionId: 1,
        level: 1,
        title: 'section2',
        phraseStartId: phrase4.id,
        phraseEndId: phrase4.id,
        id: 2,
    };
    const section2_1: IBibleSectionEntity = {
        versionId: 1,
        level: 2,
        title: 'section2_1',
        phraseStartId: phrase4.id,
        phraseEndId: phrase4.id,
        id: 3,
    };

    /** should be section1 group */
    let item1: IBibleContent;
    /** should be paragraph group */
    let item1_1: IBibleContent;
    /** should be `phrase1` */
    let item1_1_1: IBibleContent;
    /** should be quote group with numbering object */
    let item1_1_2: IBibleContent;
    /** should be `phrase2`, i.e. first phrase of quote group without numbering object */
    let item1_1_2_1: IBibleContent;
    /** should be `phrase3`, i.e. second phrase of quote group with numbering object */
    let item1_1_2_2: IBibleContent;
    /** should be section2 group */
    let item2: IBibleContent;
    /** should be section 2_1 group */
    let item2_1: IBibleContent;

    beforeAll(() => {
        const phrases = [phrase1, phrase2, phrase3, phrase4];
        const paragraphs: IBibleParagraphEntity[] = [paragraph1];
        const context: IBibleOutputRich['context'] = {
            1: {
                startingSections: [section1, section2],
                nextSections: [],
                previousSections: [],
            },
            2: {
                startingSections: [section2_1],
                nextSections: [],
                previousSections: [],
            },
        };
        const phraseVersionNumbersById = phrases.reduce((acc, phrase) => {
            if (phrase.sourceTypeId)
                acc[phrase.id] = {
                    chapter: phrase.versionChapterNum,
                    verse: phrase.versionVerseNum,
                    subverse: phrase.versionSubverseNum ?? 1,
                    phraseNum: phrase.normalizedReference.phraseNum,
                };
            return acc;
        }, {} as PhraseVersionNumbersById);
        doc = generateBibleDocument(
            phrases,
            paragraphs,
            context,
            bookAbbreviations,
            version.chapterVerseSeparator,
            { versionUid: version.uid, bookOsisId: 'Gen' },
            phraseVersionNumbersById
        );
        item1 = doc!.contents![0]!;
        item1_1 = (item1 as IBibleContentSection).contents![0]!;
        item1_1_1 = (item1_1 as IBibleContentGroup<'paragraph'>)!.contents[0]!;
        item1_1_2 = (item1_1 as IBibleContentGroup<'paragraph'>)!.contents[1]!;
        item1_1_2_1 = (item1_1_2 as IBibleContentGroup<'quote'>)!.contents[0]!;
        item1_1_2_2 = (item1_1_2 as IBibleContentGroup<'quote'>)!.contents[1]!;
        item2 = doc.contents![1]!;
        item2_1 = (item2 as IBibleContentSection).contents![0]!;
    });

    test('should return a root output node', () => {
        expect(doc.type).toBe('root');
    });

    test('should put level 1 section on the top off the hierarchy', () => {
        expect(item1.type === 'section' && item1.title === 'section1').toBe(true);
    });

    test('should arrange sections in the correct order', () => {
        expect(item2.type === 'section' && item2.title === 'section2').toBe(true);
        expect(item2_1.type === 'section' && item2_1.title === 'section2_1').toBe(true);
    });

    test('should group sequential phrases with the same modifier', () => {
        expect(
            item1_1_2 &&
                item1_1_2.type === 'group' &&
                item1_1_2.groupType === 'quote' &&
                item1_1_2.contents.length === 2
        ).toBe(true);
    });

    test('should add numbering object on verse change', () => {
        expect((item1_1_1 as IBibleContentPhrase).numbering).toBeDefined();
        expect((item1_1_2_2 as IBibleContentPhrase).numbering).toBeDefined();
    });

    test('should create numbering group on the most outer content group possible', () => {
        expect((item1_1_2 as IBibleContentGroup<'quote'>).numbering).toBeDefined();
        expect((item1_1_2_1 as IBibleContentPhrase).numbering).not.toBeDefined();
    });
});
