import { IBibleSectionBase } from './BibleSection';
import { IBiblePhrase, IBiblePhraseWithNumbers } from './BiblePhrase';
import { IContentGroup } from './ContentGroup';
import { IBibleBook } from './BibleBook';

export type IBibleContent =
    | IBibleContentSection
    | IBibleContentGroup<IContentGroup['groupType']>
    | IBibleContentPhrase;

export interface IBibleNumbering {
    /**
     * this property has NO effect when importing bible data, its a helper in output data
     */
    numbering?: {
        normalizedChapterIsStarting?: number;
        normalizedChapterIsStartingInRange?: number;
        normalizedVerseIsStarting?: number;
        versionChapterIsStarting?: number;
        versionChapterIsStartingInRange?: number;
        versionVerseIsStarting?: number;
    };
}
export interface IBibleContentSection extends IBibleSectionBase, IBibleNumbering {
    readonly type: 'section';
    contents: IBibleContent[];
}

export interface IBibleContentGroup<T extends IContentGroup['groupType']>
    extends IContentGroup,
        IBibleNumbering {
    readonly type: 'group';
    readonly groupType: T;

    contents: (IBibleContentGroup<T> | IBibleContentPhrase)[];
}

export interface IBibleContentPhrase extends IBiblePhrase, IBibleNumbering {
    readonly type: 'phrase';
}

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

    contents: (IBibleContentGroupForInput<T> | IBibleContentPhraseForInput)[];
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
