import { IBibleReferenceRange } from '@bible-engine/core';
import { OsisXmlNodeName } from '../../../shared/osisTypes';
import { ParserContext } from '../entities/ParserContext';
import { OsisParseError } from '../errors/OsisParseError';

export function getParsedBookChapterVerseRef(osisRef: string): IBibleReferenceRange {
    const firstVerse = osisRef.split('-')[0].split('.');
    const bookOsisId = firstVerse[0];
    const versionChapterNum = Number(firstVerse[1]);
    const range: IBibleReferenceRange = {
        bookOsisId,
        versionChapterNum,
    };
    if (firstVerse[2]) range.versionVerseNum = +firstVerse[2];
    const hasMultipleVerses = osisRef.split('-').length === 2;
    if (hasMultipleVerses) {
        const secondVerse = osisRef.split('-')[1].split('.');
        if(secondVerse[1]) range.versionChapterEndNum = Number(secondVerse[1]);
        if(secondVerse[2]) range.versionVerseEndNum = Number(secondVerse[2]);
    }
    return range;
}

export function getCurrentContainer(context: ParserContext) {
    if (!context.contentContainerStack.length) {
        throw new OsisParseError(`missing root container`, context);
    }
    return context.contentContainerStack[context.contentContainerStack.length - 1];
}

export function isBeginningOfSection(context: ParserContext) {
    const currentContainer = getCurrentContainer(context)
    return currentContainer.type === 'section' && !currentContainer.contents.length
}

export function isInsideDocumentHeader(context: ParserContext) {
    return context.hierarchicalTagStack.find((tag) => tag.name === OsisXmlNodeName.OSIS_HEADER)
}
