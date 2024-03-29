import { OsisXmlNodeName, OsisXmlNodeType } from './../../../shared/osisTypes';
import { IBibleContentGroup } from '@bible-engine/core';
import Logger from '../../../shared/Logger';
import { ParserContext } from '../entities/ParserContext';
import { OsisParseError } from '../errors/OsisParseError';
import { getCurrentContainer } from '../functions/helpers.functions';
import { stackHasParagraph } from './validators.functions';

export function isBeginningOfParagraph(context: ParserContext) {
    const currentContainer: any = getCurrentContainer(context);
    return currentContainer?.groupType === 'paragraph' && !currentContainer?.contents?.length;
}

export const createParagraph = (
    contents: IBibleContentGroup<'paragraph'>['contents'] = []
): IBibleContentGroup<'paragraph'> => {
    return {
        type: 'group',
        groupType: 'paragraph',
        contents,
    };
};

export const startNewParagraph = (context: ParserContext) => {
    let currentContainer = getCurrentContainer(context);
    if (stackHasParagraph(context, currentContainer)) {
        if (!context.autoGenMissingParagraphs)
            throw new OsisParseError('Cannot start new paragraph inside a paragraph', context);
        else closeCurrentParagraph(context);
    }
    const paragraph = createParagraph();
    currentContainer.contents.push(paragraph);
    context.contentContainerStack.push(paragraph);
    return paragraph;
};

export const closeCurrentParagraph = (context: ParserContext) => {
    const paragraph = getCurrentContainer(context);
    if (!paragraph || paragraph.type !== 'group' || paragraph.groupType !== 'paragraph') {
        const errorMsg = `can't close paragraph: no paragraph on end of stack`;
        throw new OsisParseError(errorMsg, context);
    }
    if (!paragraph.contents?.length) {
        Logger.warning('Attempting to close empty paragraph: possibly a parse error?', context);
    }
    return context.contentContainerStack.pop();
};

export const sourceTextHasParagraphs = (xml: string) => {
    return (
        xml.includes(`<${OsisXmlNodeName.PARAGRAPH}>`) ||
        xml.includes(`type="${OsisXmlNodeType.PARAGRAPH}"`) ||
        xml.includes(`type="${OsisXmlNodeType.SWORD_PILCROW}"`)
    );
};
