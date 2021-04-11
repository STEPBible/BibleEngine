import { createParagraph } from './../../functions/paragraphs.functions';
import { OsisXmlNodeName, OsisXmlNodeType } from '../../../../shared/osisTypes';
import { ParserContext } from '../../entities/ParserContext';
import { updateContextWithTitleText } from '../../functions/titles.functions';
import { getEmptySection } from '../utils';

const TITLE_TEXT = 'some text';

describe('updateContextWithTitleText', () => {
    it('prevents associating strongs words with section titles', () => {
        const context = new ParserContext();
        context.contentContainerStack = [getEmptySection()];
        context.strongsBuffer = [];
        updateContextWithTitleText(context, OsisXmlNodeType.TEXTUAL_NOTE, '');
        expect(context.strongsBuffer).toBeUndefined();
    });
    it('throws an error if tries to assign title to anything other than a section', () => {
        const context = new ParserContext();
        context.contentContainerStack = [createParagraph()];
        expect(() => {
            updateContextWithTitleText(context, OsisXmlNodeType.TEXTUAL_NOTE, '');
        }).toThrowError();
    });
    it('parses textual notes as section subtitles', () => {
        const currentContainer = getEmptySection();
        const context = new ParserContext();
        context.contentContainerStack = [currentContainer];
        updateContextWithTitleText(context, OsisXmlNodeType.TEXTUAL_NOTE, TITLE_TEXT);
        expect(currentContainer.subTitle).toBe(TITLE_TEXT);
    });
    it('capitalizes text if it is a divine name', () => {
        const currentContainer = getEmptySection();
        const context = new ParserContext();
        context.contentContainerStack = [currentContainer];
        updateContextWithTitleText(context, OsisXmlNodeName.DIVINE_NAME, 'Lord');
        expect(currentContainer.title).toBe('LORD');
    });
    it('adds a space for subsequent words', () => {
        const currentContainer = getEmptySection();
        currentContainer.title = 'Save Me';
        const context = new ParserContext();
        context.contentContainerStack = [currentContainer];
        updateContextWithTitleText(context, OsisXmlNodeName.DIVINE_NAME, 'Lord');
        expect(currentContainer.title).toBe('Save Me LORD');
    });
});
