import { IBibleSectionInput } from './BibleSection';
import { IBiblePhrase } from './BiblePhrase';
import { IContentGroup } from './ContentGroup';

export type IBibleContent = IBibleContentSection | IBibleContentGroup | IBibleContentPhrase;

export interface IBibleContentSection extends IBibleSectionInput {
    readonly type: 'section';
    contents: IBibleContent[];
}

export interface IBibleContentGroup extends IContentGroup {
    readonly type: 'group';

    contents: (IBibleContentGroup | IBibleContentPhrase)[];
}

export interface IBibleContentPhrase extends IBiblePhrase {
    readonly type: 'phrase';
}

/* REFERENCE
{
    book: { osisId: 'Gen' ... },
    contents: [
        {
            type: 'section',
            title: 'New Title',
            contents: [
                {
                    type: 'group',
                    groupType: 'paragraph',
                    contents: [
                        {
                            type: 'phrase',
                            versionChapterNum: 1,
                            versionVerseNum: 1,
                            content: 'In the'
                        },
                        {
                            type: 'group',
                            groupType: 'bold',
                            contents: [{
                                type: 'phrase',
                                versionChapterNum: 1,
                                versionVerseNum: 1,
                                content: 'beginning',
                                strongs: 'G123'
                            }]
                        },
                        {
                            type: 'group',
                            groupType: 'indent',
                            contents: [
                                {
                                    type: 'group',
                                    groupType: 'italic',
                                    contents: [{
                                        type: 'phrase',
                                        content: 'was',
                                        ...
                                    }]
                                },
                                {
                                    type: 'phrase',
                                    content: 'light',
                                    ...
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
}
*/
