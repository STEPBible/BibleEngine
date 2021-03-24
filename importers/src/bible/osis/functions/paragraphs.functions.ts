import { IBibleContentGroup } from '@bible-engine/core'
import { ParserContext } from '../entities/ParserContext'
import { OsisParseError } from '../errors/OsisParseError'
import { getCurrentContainer } from '../functions/helpers.functions'
import { stackHasParagraph } from './validators.functions'

export function isBeginningOfParagraph(context: ParserContext) {
    const currentContainer: any = getCurrentContainer(context)
    return currentContainer?.groupType === 'paragraph' && !currentContainer?.contents?.length
}

export const getEmptyParagraph = (): IBibleContentGroup<'paragraph'> => {
    return {
        type: 'group',
        groupType: 'paragraph',
        contents: [],
    };
}

export const startNewParagraph = (context: ParserContext) => {
    let currentContainer = getCurrentContainer(context);
    if ((stackHasParagraph(context, currentContainer))) {
        throw new OsisParseError('Cannot start new paragraph inside a paragraph', context)
    }
    const paragraph = getEmptyParagraph()
    currentContainer.contents.push(getEmptyParagraph());
    context.contentContainerStack.push(paragraph);
}
