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
