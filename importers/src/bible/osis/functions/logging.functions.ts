import { ParserContext } from '../entities/ParserContext';
import { ParserStackItem } from '../types';

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
    }${context.currentVerse} ${context.version?.uid || ''}`;
}