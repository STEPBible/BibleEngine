import { IBibleContentGroup } from '@bible-engine/core';
import { ParserContext } from '../../entities/ParserContext';
import { validateGroup, stackHasParagraph } from '../../functions/validators.functions'

describe('validateGroup', () => {
    const TOP_STACK_ITEM: IBibleContentGroup<'lineGroup'> = {
        type: 'group',
        groupType: 'lineGroup',
        contents: [],
    };
    it('throws an error when the top stack item has a different type than expected', () => {
        const EXPECTED_GROUP = 'emphasis'
        expect(() => validateGroup(TOP_STACK_ITEM, EXPECTED_GROUP, {} as any)).toThrow()
    })
    it('does not throw error for a valid top of stack', () => {
        const EXPECTED_GROUP = 'lineGroup'
        expect(() => validateGroup(TOP_STACK_ITEM, EXPECTED_GROUP, {} as any)).not.toThrow()
    })
})

describe('stackHasParagraph', () => {
    it('finds a paragraph when one is in the stack', () => {
        const PARAGRAPH: IBibleContentGroup<'paragraph'> = {
            type: 'group',
            groupType: 'paragraph',
            contents: [],
        };
        const context = new ParserContext()
        context.contentContainerStack.push(PARAGRAPH)
        expect(stackHasParagraph(context, PARAGRAPH)).toBe(true)
    })
    it('finds a paragraph when one is in the stack', () => {
        const PARAGRAPH: IBibleContentGroup<'paragraph'> = {
            type: 'group',
            groupType: 'paragraph',
            contents: [],
        };
        const context = new ParserContext()
        expect(stackHasParagraph(context, PARAGRAPH)).toBe(false)
    })
})