import { IBibleContentSection } from '@bible-engine/core';
import { OsisXmlNodeType } from '../../../shared/osisTypes';
import { OsisParseError } from '../errors/OsisParseError';
import { OsisSection } from '../types';
import { ParserContext } from './../entities/ParserContext';
import { getCurrentContainer } from './helpers.functions';
import { startNewParagraph } from './paragraphs.functions';

export const startNewSection = (context: ParserContext, elementType: OsisSection) => {
    // since we have some osis files where subSections are ended too early, we only
    // close sections when the next one is started - this leads to this rather
    // complicated code where we look which kind of section is currently open in order
    // to determine if we close the section(s)
    let currentContainer = getCurrentContainer(context);

    // if a section starts, we close all still open groups (even if the file
    // isn't buggy, this can happen, since we sometimes auto open certain
    // groups)
    while (currentContainer.type !== 'section' && currentContainer.type !== 'root') {
        context.contentContainerStack.pop();
        currentContainer = getCurrentContainer(context);
    }
    // => currentContainer is now either a section or the root node
    if (context.sectionStack.length) {
        const sectionOrder = [
            OsisXmlNodeType.SECTION_MAJOR,
            OsisXmlNodeType.SECTION,
            OsisXmlNodeType.SECTION_SUB,
        ];
        const elementSectionOsisLevel = sectionOrder.indexOf(elementType);
        let currentSectionOsisLevel = sectionOrder.indexOf(
            context.sectionStack[context.sectionStack.length - 1]!
        );

        while (elementSectionOsisLevel <= currentSectionOsisLevel) {
            context.sectionStack.pop();
            // also works when sectionStack is empty
            currentSectionOsisLevel = sectionOrder.indexOf(
                context.sectionStack[context.sectionStack.length - 1]!
            );

            context.contentContainerStack.pop();
            currentContainer = getCurrentContainer(context);
        }
    }

    if (currentContainer.type !== 'root' && currentContainer.type !== 'section')
        throw new OsisParseError(`sections can only start within sections or at root`, context);

    const section: IBibleContentSection = {
        type: 'section',
        level: context.sectionStack.length,
        contents: [],
    };

    context.sectionStack.push(elementType);
    currentContainer.contents.push(section);
    context.contentContainerStack.push(section);

    if (!context.hasParagraphsInSourceText || context.autoGenMissingParagraphs) {
        startNewParagraph(context);
    }
};

export const getCurrentSection = (context: ParserContext) => {
    for (let i = context.contentContainerStack.length - 1; i >= 0; i--) {
        if (context.contentContainerStack[i]!.type === 'section') {
            return context.contentContainerStack[i] as IBibleContentSection;
        }
    }
    return undefined;
};
