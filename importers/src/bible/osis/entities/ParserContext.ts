import {
    IBibleVersion,
    BookWithContentForInput,
    IBibleBook,
    IBibleCrossReference,
    IBibleReference,
    BibleReferenceParser,
} from '@bible-engine/core';
import { OsisXmlNodeType } from '../../../shared/osisTypes';
import { ParserStackItem, TagType, ITagWithType } from './../types';

export class ParserContext {
    version?: IBibleVersion;
    books: BookWithContentForInput[] = [];
    currentBook?: IBibleBook;
    currentChapter?: number;
    currentVerse?: number;
    isCurrentVerseImplicit?: boolean;
    currentSubverse?: number;
    crossRefBuffer?: {
        key?: string;
        refs?: IBibleCrossReference[];
    };
    strongsBuffer?: string[];
    contentContainerStack: ParserStackItem[] = [];
    hierarchicalTagStack: ITagWithType[] = [];
    currentVerseJoinToVersionRef?: IBibleReference;
    openedSelfClosingTag?: ITagWithType;
    skipClosingTags: TagType[] = [];
    sectionStack: (
        | OsisXmlNodeType.SECTION_MAJOR
        | OsisXmlNodeType.SECTION
        | OsisXmlNodeType.SECTION_SUB
    )[] = [];
    hasSectionsInSourceText: boolean;
    hasParagraphsInSourceText: boolean;
    autoGenMissingParagraphs?: boolean;
    bcv?: BibleReferenceParser;
}
