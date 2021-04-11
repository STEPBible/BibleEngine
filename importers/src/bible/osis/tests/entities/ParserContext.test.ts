import { ParserContext } from '../../entities/ParserContext';

describe('constructor', () => {
    it('has empty arrays for stack attributes', () => {
        const context = new ParserContext();
        expect(context.books).toEqual([]);
        expect(context.hierarchicalTagStack).toEqual([]);
        expect(context.contentContainerStack).toEqual([]);
        expect(context.skipClosingTags).toEqual([]);
        expect(context.sectionStack).toEqual([]);
    });
});
