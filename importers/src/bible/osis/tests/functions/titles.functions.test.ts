import { IBibleContentSection, IBibleContentGroup } from '@bible-engine/core'
import { OsisXmlNodeName, OsisXmlNodeType } from '../../../../shared/osisTypes'
import { ParserContext } from '../../entities/ParserContext'
import { updateContextWithTitleText } from '../../functions/titles.functions'

const SECTION: IBibleContentSection = {
    type: 'section',
    level: 0,
    contents: [],
};
const PARAGRAPH: IBibleContentGroup<'paragraph'> = {
    type: 'group',
    groupType: 'paragraph',
    contents: [],
};
const TITLE_TEXT = 'some text'

describe('updateContextWithTitleText', () => {

    it('prevents associating strongs words with section titles', () => {
        const context = new ParserContext();
        context.strongsBuffer = [];
        updateContextWithTitleText(
            context,
            SECTION,
            OsisXmlNodeType.TEXTUAL_NOTE,
            ''
        );
        expect(context.strongsBuffer).toBeUndefined();
    })
    it('throws an error if tries to assign title to anything other than a section', () => {
        const context = new ParserContext();
        expect(() => {
            updateContextWithTitleText(
                context,
                PARAGRAPH,
                OsisXmlNodeType.TEXTUAL_NOTE,
                ''
            )
        }).toThrowError()
    })
    it('parses textual notes as section subtitles', () => {
        const currentContainer = { ...SECTION }
        const context = new ParserContext();
        updateContextWithTitleText(
            context,
            currentContainer,
            OsisXmlNodeType.TEXTUAL_NOTE,
            TITLE_TEXT,
        );
        expect(currentContainer.subTitle).toBe(TITLE_TEXT)
    })
    it('capitalizes text if it is a divine name', () => {
        const currentContainer = { ...SECTION }
        const context = new ParserContext();
        updateContextWithTitleText(
            context,
            currentContainer,
            OsisXmlNodeName.DIVINE_NAME,
            'Lord',
        );
        expect(currentContainer.title).toBe('LORD')
    })
    it('adds a space for subsequent words', () => {
        const currentContainer = { ...SECTION }
        currentContainer.title = 'Save Me'
        const context = new ParserContext();
        updateContextWithTitleText(
            context,
            currentContainer,
            OsisXmlNodeName.DIVINE_NAME,
            'Lord',
        );
        expect(currentContainer.title).toBe('Save Me LORD')
    })
})