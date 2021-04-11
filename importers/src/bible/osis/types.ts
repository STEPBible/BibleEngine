import {
    IBibleContentSection,
    ContentGroupType,
    IBibleContentGroup,
    IBibleContent,
} from '@bible-engine/core';
import { OsisXmlNodeName, OsisXmlNodeType, OsisXmlNode } from '../../shared/osisTypes';

export type TagType = OsisXmlNodeName | OsisXmlNodeType;
export interface ITagWithType extends OsisXmlNode {
    type: TagType;
}

export type ParserStackItem =
    | { type: 'root'; contents: IBibleContent[] }
    | IBibleContentSection
    | IBibleContentGroup<ContentGroupType>;

/**
 * The following `IOsis...` interfaces can be used to do type discrimination by using the type
 * `OsisTag` for nodes and test for the `type` and/or `isSelfClosing` attribute. That way you get
 * intellisense (and type checks) on the `attributes` objects.
 *
 * TODO: implement interfaces for all types of tags and use the types in `ParserContext` and parser
 */

export type OsisNodeType = 'milestone' | 'hierarchical';

export interface IOsisNode<T extends OsisNodeType> extends ITagWithType {
    readonly attributes: {
        sID: T extends 'milestone' ? string : undefined;
        eID: T extends 'milestone' ? string : undefined;
    };
    readonly isSelfClosing: T extends 'milestone' ? true : false;
}

export interface IOsisV11n<T extends OsisNodeType> extends IOsisNode<T> {
    readonly attributes: IOsisNode<T>['attributes'] & { osisID: string };
}

export interface IOsisBook extends IOsisV11n<'hierarchical'> {
    type: OsisXmlNodeType.BOOK;
}

export interface IOsisChapter<T extends OsisNodeType> extends IOsisV11n<T> {
    type: OsisXmlNodeName.CHAPTER;
}

export interface IOsisVerse<T extends OsisNodeType> extends IOsisV11n<T> {
    type: OsisXmlNodeName.VERSE;
}

export interface IOsisSection extends IOsisNode<'hierarchical'> {
    type: OsisXmlNodeType.SECTION;
}

export interface IOsisSectionMajor extends IOsisNode<'hierarchical'> {
    type: OsisXmlNodeType.SECTION_MAJOR;
}

export interface IOsisSectionSub extends IOsisNode<'hierarchical'> {
    type: OsisXmlNodeType.SECTION_SUB;
}

export interface IOsisTitle extends IOsisNode<'hierarchical'> {
    type: OsisXmlNodeName.TITLE;
    readonly attributes: IOsisNode<'hierarchical'>['attributes'] & { canonical?: 'true' };
}

export interface IOsisCatchWord extends IOsisNode<'hierarchical'> {
    type: OsisXmlNodeName.CATCH_WORD;
}

export interface IOsisQuote<T extends OsisNodeType> extends IOsisNode<T> {
    type: OsisXmlNodeName.QUOTE;
}

export interface IOsisParagraph<T extends OsisNodeType> extends IOsisNode<T> {
    type: OsisXmlNodeType.PARAGRAPH | OsisXmlNodeName.PARAGRAPH;
}

export type OsisTag =
    | IOsisSection
    | IOsisSectionMajor
    | IOsisSectionSub
    | IOsisTitle
    | IOsisBook
    | IOsisChapter<'milestone'>
    | IOsisChapter<'hierarchical'>
    | IOsisCatchWord;

export type OsisSection =
    | OsisXmlNodeType.SECTION
    | OsisXmlNodeType.SECTION_SUB
    | OsisXmlNodeType.SECTION_MAJOR;
