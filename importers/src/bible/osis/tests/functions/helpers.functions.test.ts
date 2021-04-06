import { getEmptySection } from './../utils';
import { ParserContext } from './../../entities/ParserContext';
import { getCurrentContainer } from '../../functions/helpers.functions';
import { createParagraph } from '../../functions/paragraphs.functions';

describe('getCurrentContainer', () => {
    it('throws error if no valid current container', () => {
        const context = new ParserContext();
        expect(() => {
            getCurrentContainer(context);
        }).toThrowError();
    });
    it('grabs the last item on the container stack', () => {
        const context = new ParserContext();
        context.contentContainerStack.push(createParagraph(), getEmptySection());
        expect(getCurrentContainer(context).type).toBe('section');
    });
});
