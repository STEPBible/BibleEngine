import { resolve } from 'path';
import { getBibleEngineTestInstance, TEST_BIBLE_VERSION } from './utils';
import { OsisImporter } from '../../../../src';
import { enBookMetadata } from './../../../metadata/index';
import { IBibleContentSection } from '@bible-engine/core';

const bibleEngine = getBibleEngineTestInstance();

describe('OSIS Parser', () => {
    describe('getContextFromXml', () => {
        it('wraps each section in a paragraph, if no paragraphs exist in the source text', async () => {
            const sourcePath = resolve(__dirname) + '/data/sectionsButNoParagraphs.xml';
            const importer = new OsisImporter(bibleEngine, {
                sourcePath,
                bookMeta: enBookMetadata,
                versionMeta: TEST_BIBLE_VERSION,
            });

            const xml = await importer.getXmlFromOptions({ sourcePath, bookMeta: enBookMetadata });
            const context = await importer.getContextFromXml(xml);
            expect(context.books.length);
            const SECTION = context.books[0].contents[0] as IBibleContentSection;
            expect(SECTION.type).toBe('section');
            const PARAGRAPH: any = SECTION.contents[0];
            expect(PARAGRAPH.groupType).toBe('paragraph');
        });
    });
});
