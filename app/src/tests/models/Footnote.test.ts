import { Footnote } from './../../models/Footnote';
import { EXAMPLE_FOOTNOTE } from './fixtures/index';

describe('getPlainText', () => {
    it('uses quotes to surround emphasized text', () => {
        const text = Footnote.getPlainText(EXAMPLE_FOOTNOTE)
        const expectedText = 'The singular Hebrew word for "man" ( "ish" ) is used here to portray a representative example of a godly person; see Preface'
        expect(text).toEqual(expectedText)
    })
})