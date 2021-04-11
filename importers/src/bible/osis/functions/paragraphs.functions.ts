import { IBibleContentGroup } from '@bible-engine/core'
import { ParserContext } from '../entities/ParserContext'
import { getCurrentContainer } from '../functions/helpers.functions'

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