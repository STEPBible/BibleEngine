import { BiblePhrase, IBibleSectionWithContent } from '.';

type BiblePhraseList = {
    readonly type: 'phrases';
    phrases: BiblePhrase[];
};

type BibleSectionWithContentList = {
    readonly type: 'sections';
    sections: IBibleSectionWithContent[];
};

export type BibleInput = BiblePhraseList | BibleSectionWithContentList;
