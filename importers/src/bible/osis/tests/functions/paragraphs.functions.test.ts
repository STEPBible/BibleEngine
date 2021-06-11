import { getCurrentContainer } from '../../functions/helpers.functions';
import { ParserContext } from './../../entities/ParserContext';
import {
    isBeginningOfParagraph,
    createParagraph,
    sourceTextHasParagraphs,
    closeCurrentParagraph,
    startNewParagraph,
} from './../../functions/paragraphs.functions';

describe('isBeginningOfParagraph', () => {
    it('identifies empty paragraphs', () => {
        const context = new ParserContext();
        context.contentContainerStack.push(createParagraph());
        expect(isBeginningOfParagraph(context)).toBe(true);
    });
});

describe('sourceTextHasParagraphs', () => {
    it('identifies normal paragraph tags', () => {
        const NORMAL_PARAGRAPH = '<p>';
        expect(sourceTextHasParagraphs(NORMAL_PARAGRAPH)).toBe(true);
    });
    it('identifies paragraph attributes', () => {
        const PARAGRAPH_ATTRIBUTES = '<div type="paragraph">';
        expect(sourceTextHasParagraphs(PARAGRAPH_ATTRIBUTES)).toBe(true);
    });
});

describe('startNewParagraph', () => {
    it('links the new paragraph to both the container and the content stack', () => {
        const context = new ParserContext();
        context.contentContainerStack = [{ type: 'root', contents: [] }];
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
