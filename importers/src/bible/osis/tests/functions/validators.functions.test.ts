import { IBibleContentGroup } from '@bible-engine/core';
import { validateGroup } from '../../functions/validators.functions'

describe('validateGroup', () => {
    it('throws an error when the top stack item has a different type than expected', () => {
        const TOP_STACK_ITEM: IBibleContentGroup<'lineGroup'> = {
            type: 'group',
            groupType: 'lineGroup',
            contents: [],
        };
        const EXPECTED_GROUP = 'emphasis'
        expect(() => validateGroup(TOP_STACK_ITEM, EXPECTED_GROUP, {} as any)).toThrow()
    })
})