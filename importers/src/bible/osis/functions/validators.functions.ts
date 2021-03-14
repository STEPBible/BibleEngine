import { ContentGroupType } from '@bible-engine/core';
import { OsisParseError } from '../errors/OsisParseError';
import { ParserContext, ParserStackItem } from '../types';

export function validateGroup(
    topStackItem: ParserStackItem | undefined,
    groupName: ContentGroupType,
    context: ParserContext
) {
    if (
        !topStackItem ||
        topStackItem.type !== 'group' ||
        topStackItem.groupType !== groupName
    ) {
        throw new OsisParseError(`unclean container stack while closing "${groupName}" group`, context)
    }
}