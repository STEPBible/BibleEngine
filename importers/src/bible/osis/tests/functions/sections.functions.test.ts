import { resolve } from 'path';
import { getContextFromSource } from '../utils';
import { getCurrentSection } from './../../functions/sections.functions';
import { SUB_SECTIONS_PARSED } from '../fixtures/subSectionsParsed';

it('parses hierarchical sections', async () => {
    const sourcePath = resolve(__dirname) + '/../fixtures/subSections.xml';
    const context = await getContextFromSource(sourcePath);

    expect(context.books[0]).toStrictEqual(SUB_SECTIONS_PARSED.books[0]);

    // this test works since we only close sections when another one opens.
    // so context still has the section stack.
    expect(context.sectionStack.length).toBe(2);
});

it('gets the last opened section', () => {
    const currentSection = getCurrentSection(SUB_SECTIONS_PARSED);
    // the subsection has level 1 (and the main section 0)
    expect(currentSection?.level).toBe(1);
    // the titles text should be connected to the correct sections
    expect(currentSection?.title).toBe('sub-section');
});
