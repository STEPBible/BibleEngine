import { IBibleReferenceRange } from '@bible-engine/core';
import { ParserContext, ParserStackItem } from '../types';

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

export function printCompactContainerStack(stack: ParserStackItem[]) {
    return stack.map((container) => (container as any).groupType || container.type).join(' > ');
}

export function printFullContainerStack(stack: ParserStackItem[]) {
    let trace = '';
    stack.forEach((container: any, index) => {
        const indent = ' '.repeat((index + 1) * 2);
        const identifier = container.title || container.groupType || container.type;
        trace += `\n${indent}${identifier}`;
    });
    return trace + '\n';
}

export function getErrorMessageWithContextStackTrace(message: string, context: ParserContext) {
    return `${message} in ${getCurrentVerse(context)}

container stack:${printFullContainerStack(context.contentContainerStack)}`;
}

export function getCurrentVerse(context: ParserContext) {
    return `${context.currentBook && context.currentBook.osisId} ${context.currentChapter}${
        context.version?.chapterVerseSeparator || ':'
    }${context.currentVerse}`;
}
