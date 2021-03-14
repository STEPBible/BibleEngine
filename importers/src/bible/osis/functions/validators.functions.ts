import { ContentGroupType } from '@bible-engine/core';
import { OsisParseError } from '../errors/OsisParseError';
import { ParserContext, ParserStackItem } from '../types';

export function validateGroup(
    topStackItem: ParserStackItem | undefined,
    groupName: ContentGroupType,
    context: ParserContext
) {
    const type: string = ((topStackItem as any)?.groupType || topStackItem?.type)
    if (
        !type ||
        type !== groupName
    ) {
        throw new OsisParseError(`unclean container stack while closing "${groupName}" group. Found "${type}"`, context)
    }
}