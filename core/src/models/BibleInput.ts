import { IBibleSectionBase } from './BibleSection';
import { IBiblePhrase } from './BiblePhrase';
import { IContentGroup } from './ContentGroup';
import { IBibleBook } from './BibleBook';

export type BookWithContent = {
    book: IBibleBook;
    contents: IBibleInput[];
};

export type IBibleInput = IBibleInputSection | IBibleInputGroup | IBibleInputPhrase;

export interface IBibleInputSection extends IBibleSectionBase {
    readonly type: 'section';
    contents: IBibleInput[];
}

export interface IBibleInputGroup extends IContentGroup {
    readonly type: 'group';

    contents: (IBibleInputGroup | IBibleInputPhrase)[];
}

export interface IBibleInputPhrase extends IBiblePhrase {
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
