import { IBibleContentGroup } from '@bible-engine/core';
import { validateGroup } from '../../functions/validators.functions'

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