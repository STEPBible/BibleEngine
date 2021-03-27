import { getCurrentContainer } from '../../functions/helpers.functions';
import { ParserContext } from './../../entities/ParserContext';
import {
    isBeginningOfParagraph,
    getEmptyParagraph,
    sourceTextHasParagraphs,
    closeCurrentParagraph,
    startNewParagraph,
} from './../../functions/paragraphs.functions';

describe('isBeginningOfParagraph', () => {
    it('identifies empty paragraphs', () => {
        const context = new ParserContext();
        context.contentContainerStack.push(getEmptyParagraph());
        expect(isBeginningOfParagraph(context)).toBe(true);
    });
});

describe('sourceTextHasParagraphs', () => {
    it('identifies normal paragraph tags', () => {
        const NORMAL_PARAGRAPH = '<p>';
        expect(sourceTextHasParagraphs(NORMAL_PARAGRAPH)).toBe(true);
    });
});

describe('startNewParagraph', () => {
    it('links the new paragraph to both the container and the content stack', () => {
        const context = new ParserContext();
        context.contentContainerStack = [{ type: 'root', contents: [] }];;
        startNewParagraph(context);
        const currentContainer: any = getCurrentContainer(context);
        expect(isBeginningOfParagraph(context)).toBe(true);
        expect(currentContainer).toBe(context.contentContainerStack[0].contents[0]);
    });
});

describe('closeCurrentParagraph', () => {
    it('throws an error if there is no paragraph on end of stack', () => {
        const context = new ParserContext();
        expect(() => closeCurrentParagraph(context)).toThrowError();
    });
});
