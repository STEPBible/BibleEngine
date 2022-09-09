import { ContentGroupType } from '@bible-engine/core';
import { ParserContext } from '../entities/ParserContext';
import { OsisParseError } from '../errors/OsisParseError';
import { ParserStackItem } from '../types';

export function validateGroup(
    topStackItem: ParserStackItem | undefined,
    groupName: ContentGroupType,
    context: ParserContext
) {
    const type: string = (topStackItem as any)?.groupType || topStackItem?.type;
    if (!type || type !== groupName) {
        throw new OsisParseError(
            `unclean container stack while closing "${groupName}" group. Found "${type}"`,
            context
        );
    }
}

export function stackHasParagraph(context: ParserContext, currentContainer: ParserStackItem) {
    for (let i = context.contentContainerStack.length - 1; i >= 0; i--) {
        const container = context.contentContainerStack[i]!;
        if (container.type === 'group' && container.groupType === 'paragraph') return true;

        if (container !== currentContainer) {
            const lastContent = container.contents[container.contents.length - 1];
            if (lastContent?.type === 'group' && lastContent?.groupType === 'paragraph')
                return true;
        }
    }
    return false;
}
