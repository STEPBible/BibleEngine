import { IContentGroup, IBibleBook, IBibleContentPhrase } from '.';
import { IBibleSectionBase } from './BibleSection';
import { ContentGroupType } from './ContentGroup';

export type IBibleContentForInput =
    | IBibleContentSectionForInput
    | IBibleContentGroupForInput<ContentGroupType>
    | IBibleContentPhraseForInput;

export type BookWithContentForInput = {
    book: IBibleBook;
    contents: IBibleContentForInput[];
    contentHasNormalizedNumbers?: boolean;
};

export interface IBibleContentSectionForInput extends IBibleSectionBase {
    readonly type: 'section';
    contents: IBibleContentForInput[];
}

export interface IBibleContentGroupForInput<T extends ContentGroupType> extends IContentGroup<T> {
    readonly type: 'group';
    readonly groupType: T;

    contents: (IBibleContentGroupForInput<ContentGroupType> | IBibleContentPhraseForInput)[];
}

export interface IBibleContentPhraseForInput extends IBibleContentPhrase {
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
                                    linebreak: true,
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
