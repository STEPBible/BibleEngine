import { OsisXmlNodeType } from '../../../../shared/osisTypes';
import { ParserContext } from '../../entities/ParserContext';

export const SUB_SECTIONS_PARSED: ParserContext = {
    books: [
        {
            book: {
                osisId: 'Gen',
                type: 'ot',
                abbreviation: 'Gen.',
                title: 'Genesis',
                number: 1,
            },
            contents: [
                {
                    type: 'section',
                    level: 0,
                    contents: [
                        {
                            type: 'section',
                            level: 1,
                            contents: [
                                {
                                    type: 'group',
                                    groupType: 'paragraph',
                                    contents: [
                                        {
                                            type: 'phrase',
                                            content: 'paragraph1',
                                            versionChapterNum: 1,
                                            versionVerseNum: 1,
                                            versionSubverseNum: 1,
                                        },
                                    ],
                                },
                            ],
                            title: 'sub-section',
                        },
                    ],
                    title: 'main-section',
                },
            ],
        },
    ],
    contentContainerStack: [
        {
            type: 'root',
            contents: [
                {
                    type: 'section',
                    level: 0,
                    contents: [
                        {
                            type: 'section',
                            level: 1,
                            contents: [
                                {
                                    type: 'group',
                                    groupType: 'paragraph',
                                    contents: [
                                        {
                                            type: 'phrase',
                                            content: 'paragraph1',
                                            versionChapterNum: 1,
                                            versionVerseNum: 1,
                                            versionSubverseNum: 1,
                                        },
                                    ],
                                },
                            ],
                            title: 'sub-section',
                        },
                    ],
                    title: 'main-section',
                },
            ],
        },
        {
            type: 'section',
            level: 0,
            contents: [
                {
                    type: 'section',
                    level: 1,
                    contents: [
                        {
                            type: 'group',
                            groupType: 'paragraph',
                            contents: [
                                {
                                    type: 'phrase',
                                    content: 'paragraph1',
                                    versionChapterNum: 1,
                                    versionVerseNum: 1,
                                    versionSubverseNum: 1,
                                },
                            ],
                        },
                    ],
                    title: 'sub-section',
                },
            ],
            title: 'main-section',
        },
        {
            type: 'section',
            level: 1,
            contents: [
                {
                    type: 'group',
                    groupType: 'paragraph',
                    contents: [
                        {
                            type: 'phrase',
                            content: 'paragraph1',
                            versionChapterNum: 1,
                            versionVerseNum: 1,
                            versionSubverseNum: 1,
                        },
                    ],
                },
            ],
            title: 'sub-section',
        },
    ],
    hasSectionsInSourceText: true,
    hasParagraphsInSourceText: true,
    hierarchicalTagStack: [],
    skipClosingTags: [],
    sectionStack: [OsisXmlNodeType.SECTION, OsisXmlNodeType.SECTION_SUB],
};
