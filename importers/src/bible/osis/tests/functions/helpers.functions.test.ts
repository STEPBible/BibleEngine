import { getEmptyParagraph, getEmptySection } from './../utils';
import { ParserContext } from './../../entities/ParserContext';
import { getCurrentContainer, isBeginningOfParagraph } from '../../functions/helpers.functions';

describe('getCurrentContainer', () => {
    it('throws error if no valid current container', () => {
        const context = new ParserContext()
        expect(() => { getCurrentContainer(context) }).toThrowError()
    })
    it('grabs the last item on the container stack', () => {
        const context = new ParserContext()
        context.contentContainerStack.push(getEmptyParagraph(), getEmptySection())
        expect(getCurrentContainer(context).type).toBe('section')
    })
})

describe('isBeginningOfParagraph', () => {
    it('identifies empty paragraphs', () => {
        const context = new ParserContext()
        context.contentContainerStack.push(getEmptyParagraph())
        expect(isBeginningOfParagraph(context)).toBe(true)
    })
})