import { PARSED_SWORD_PARAGRAPHS } from './fixtures/OsisImporter.fixtures';
import { resolve } from 'path';
import { getContextFromSource } from './utils';
import { IBibleContentSection } from '@bible-engine/core';

describe('OSIS Parser', () => {
    it('wraps each section in a paragraph, if no paragraphs exist in the source text', async () => {
        const sourcePath = resolve(__dirname) + '/fixtures/sectionsButNoParagraphs.xml';
        const context = await getContextFromSource(sourcePath);
        expect(context.books.length);
        const SECTION = context.books[0].contents[0] as IBibleContentSection;
        expect(SECTION.type).toBe('section');
        const PARAGRAPH: any = SECTION.contents[0];
        expect(PARAGRAPH.groupType).toBe('paragraph');
    });
    it('handles natural paragraphs and sections, when included together', async () => {
        const sourcePath = resolve(__dirname) + '/fixtures/sectionsPlusParagraphs.xml';
        const context = await getContextFromSource(sourcePath);
        expect(context.books.length);
        const SECTION = context.books[0].contents[0] as IBibleContentSection;
        expect(SECTION.type).toBe('section');
        const PARAGRAPH: any = SECTION.contents[0];
        expect(PARAGRAPH.groupType).toBe('paragraph');
    });
    it('treates Sword module paragraph markers as normal paragraphs', async () => {
        const sourcePath = resolve(__dirname) + '/fixtures/swordParagraphs.xml';
        const context = await getContextFromSource(sourcePath);
        expect(context.contentContainerStack).toStrictEqual(PARSED_SWORD_PARAGRAPHS);;
    });
});
