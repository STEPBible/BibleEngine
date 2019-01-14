import { IContentGroup, IBibleBook } from '.';
import { IBibleSectionBase } from './BibleSection';
import { IBiblePhraseWithNumbers } from './BiblePhrase';

export type IBibleContentForInput =
    | IBibleContentSectionForInput
    | IBibleContentGroupForInput<IContentGroup['groupType']>
    | IBibleContentPhraseForInput;

export type BookWithContentForInput = {
    book: IBibleBook;
    contents: IBibleContentForInput[];
};

export interface IBibleContentSectionForInput extends IBibleSectionBase {
    readonly type: 'section';
    contents: IBibleContentForInput[];
}

export interface IBibleContentGroupForInput<T extends IContentGroup['groupType']>
    extends IContentGroup {
    readonly type: 'group';
    readonly groupType: T;

    contents: (
        | IBibleContentGroupForInput<IContentGroup['groupType']>
        | IBibleContentPhraseForInput)[];
}

export interface IBibleContentPhraseForInput extends IBiblePhraseWithNumbers {
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
