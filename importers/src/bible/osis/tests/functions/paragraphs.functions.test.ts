import { ParserContext } from './../../entities/ParserContext';
import { isBeginningOfParagraph, getEmptyParagraph } from './../../functions/paragraphs.functions'

describe('isBeginningOfParagraph', () => {
    it('identifies empty paragraphs', () => {
        const context = new ParserContext()
        context.contentContainerStack.push(getEmptyParagraph())
        expect(isBeginningOfParagraph(context)).toBe(true)
    })
})