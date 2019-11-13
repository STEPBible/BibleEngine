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
import { OsisXmlNodeName, OsisXmlNodeType, OsisXmlNode } from '../../shared/osisTypes';

export type TagType = OsisXmlNodeName | OsisXmlNodeType;
export interface ITagWithType extends OsisXmlNode {
    type: TagType;
}

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
        | IBibleContentGroup<ContentGroupType>
    )[];
    hierarchicalTagStack: ITagWithType[];
    openedSelfClosingTag?: ITagWithType;
    skipClosingTags: TagType[];
    sectionStack: (
        | OsisXmlNodeType.SECTION_MAJOR
        | OsisXmlNodeType.SECTION
        | OsisXmlNodeType.SECTION_SUB
    )[];
};
