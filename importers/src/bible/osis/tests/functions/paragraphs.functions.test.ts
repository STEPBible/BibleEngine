import { ParserContext } from './../../entities/ParserContext';
import {
    isBeginningOfParagraph,
    getEmptyParagraph,
    sourceTextHasParagraphs,
    closeCurrentParagraph,
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

describe('closeCurrentParagraph', () => {
    it('throws an error if there is no paragraph on end of stack', () => {
        const context = new ParserContext();
        expect(() => closeCurrentParagraph(context)).toThrowError();
    });
});
