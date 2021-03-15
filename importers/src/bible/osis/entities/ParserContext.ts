import {
    IBibleVersion,
    BookWithContentForInput,
    IBibleBook,
    IBibleCrossReference,
    IBibleReference
} from '@bible-engine/core';
import { OsisXmlNodeType } from '../../../shared/osisTypes';
import { ParserStackItem, TagType, ITagWithType } from './../types';

export class ParserContext {
    version?: IBibleVersion;
    books: BookWithContentForInput[] = [];
    currentBook?: IBibleBook;
    currentChapter?: number;
    currentVerse?: number;
    crossRefBuffer?: {
        key?: string;
        refs: IBibleCrossReference[];
    };
    strongsBuffer?: string[]
    contentContainerStack: ParserStackItem[] = [];
    hierarchicalTagStack: ITagWithType[] = []
    currentVerseJoinToVersionRef?: IBibleReference;
    openedSelfClosingTag?: ITagWithType;
    skipClosingTags: TagType[] = [];
    sectionStack: (
        | OsisXmlNodeType.SECTION_MAJOR
        | OsisXmlNodeType.SECTION
        | OsisXmlNodeType.SECTION_SUB
    )[] = [];
}