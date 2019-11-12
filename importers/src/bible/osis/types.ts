import {
    IBibleVersion,
    IBibleBook,
    IBibleContentSection,
    BookWithContentForInput,
    ContentGroupType,
    IBibleContentGroup,
    IBibleContent,
    IBibleCrossReference
} from '@bible-engine/core';
import { Tag } from 'sax';

export type TagWithType = Tag & { type?: string };

export type ParserContext = {
    version?: IBibleVersion;
    books: BookWithContentForInput[];
    currentBook?: IBibleBook;
    currentChapter?: number;
    currentVerse?: number;
    crossRefBuffer?: {
        key: string;
        refs: IBibleCrossReference[];
    };
    contentContainerStack: (
        | { type: 'root'; contents: IBibleContent[] }
        | IBibleContentSection
        | IBibleContentGroup<ContentGroupType>)[];
    hierarchicalTagStack: TagWithType[];
    openedSelfClosingTag?: Tag;
    skipClosingTags: string[];
    sectionStack: ('majorSection' | 'section' | 'subSection')[];
};
