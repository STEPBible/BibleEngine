import {
    ContentGroupType,
    DocumentRoot,
    IBibleContent,
    IBibleContentGroup,
    IBibleContentPhrase,
    IBibleContentSection,
} from '@bible-engine/core';
import { writeFileSync } from 'fs';
import {
    CROSS_REFERENCE_CONTAINER_TAGS,
    IGNORED_TAGS,
    IParserContext,
    NOTE_CONTAINER_TAGS,
    ParserStackItem,
    SECTION_TAGS,
    SECTION_TAGS_NORMALIZED,
    TagType,
    UsxXmlNodeStyle,
} from './types';

export class UsxParseError extends Error {
    constructor(message: string, context: IParserContext, dumpContext = false) {
        super(`
    parser location: ${getContextCurrentLocation(context)} 
    current tag: ${context.hierarchicalTagStack[context.hierarchicalTagStack.length - 1]?.name}.${
            context.hierarchicalTagStack[context.hierarchicalTagStack.length - 1]?.attributes.style
        }
    current text: ${context.currentText}
    message: ${message}
        `);
        if (dumpContext) writeFileSync('contextDump.json', JSON.stringify(context));
        this.name = 'UsxParseError';
        Object.setPrototypeOf(this, UsxParseError.prototype);
    }
}

export function addGroupContainerToContext(
    container: IBibleContentGroup<ContentGroupType>,
    context: IParserContext
) {
    const currentContainer = getCurrentContainer(context);
    currentContainer.contents.push(container);
    context.contentContainerStack.push(container);
}

export function closeAllGroups(context: IParserContext) {
    let currentContainer = getCurrentContainer(context);
    while (currentContainer.type === 'group') {
        context.contentContainerStack.pop();
        currentContainer = getCurrentContainer(context);
    }
}

export function closeDocument(context: IParserContext) {
    let container: ParserStackItem | undefined;
    do {
        container = context.contentContainerStack.pop();
        if (container?.type === 'section') context.sectionStack.pop();
    } while (container && container.type !== 'root');
    if (!container) {
        throw new UsxParseError(
            `unclean container stack while closing note or introduction`,
            context
        );
    }
    return container;
}

export function closeGroupContainer(
    groupType: ContentGroupType,
    context: IParserContext,
    levels: number | null = null
) {
    let groupsClosed = 0;
    while (isInsideGroup(groupType, context)) {
        context.contentContainerStack.pop();
        groupsClosed++;
        if (levels && groupsClosed >= levels) return;
    }
}

export function createGroupContainer<T extends ContentGroupType>(
    groupType: T,
    contents: IBibleContentGroup<ContentGroupType>['contents'] = [],
    modifier?: IBibleContentGroup<T>['modifier']
): IBibleContentGroup<ContentGroupType> {
    return {
        type: 'group',
        groupType: groupType,
        modifier,
        contents,
    };
}

export function getContextCurrentLocation(context: IParserContext) {
    return `[${context.version.uid} ${context.book.osisId} ${
        context.currentChapter ? context.currentChapter : ''
    }${context.currentVerse ? ':' + context.currentVerse : ''}]`;
}

export function getCurrentContainer(context: IParserContext) {
    if (!context.contentContainerStack.length) {
        throw new UsxParseError(`missing root container`, context);
    }
    return context.contentContainerStack[context.contentContainerStack.length - 1]!;
}

export function getCurrentGroupContainer<T extends ContentGroupType>(
    groupType: T,
    context: IParserContext
): IBibleContentGroup<T> | null {
    for (
        let containerIndex = context.contentContainerStack.length - 1;
        containerIndex >= 0;
        containerIndex--
    ) {
        const container = context.contentContainerStack[containerIndex]!;
        if (container.type === 'group' && container.groupType === groupType)
            return container as IBibleContentGroup<T>;
    }
    return null;
}

export function getCurrentBiblePhrase(context: IParserContext, createIfMissing = false) {
    if (isInsideDocument(context))
        throw new UsxParseError(`can't get bible phrase from within a document`, context);

    const currentContainer = getCurrentContainer(context);
    let content: IBibleContent | undefined =
        currentContainer.contents[currentContainer.contents.length - 1];
    while (content && (content.type === 'section' || content.type === 'group')) {
        content = content.contents[content.contents.length - 1];
    }

    if (
        content &&
        (!content.type || content.type === 'phrase') &&
        content.versionChapterNum === context.currentChapter &&
        content.versionVerseNum === context.currentVerse
    )
        return content;
    else if (createIfMissing) {
        const emptyPhrase: IBibleContentPhrase = {
            type: 'phrase',
            content: '',
            versionChapterNum: context.currentChapter,
            versionVerseNum: context.currentVerse,
            versionSubverseNum: context.currentSubverse,
        };
        currentContainer.contents.push(emptyPhrase);
        return emptyPhrase;
    } else throw new UsxParseError(`can't find last phrase`, context);
}

export function getCurrentSection(context: IParserContext) {
    for (
        let containerIndex = context.contentContainerStack.length - 1;
        containerIndex >= 0;
        containerIndex--
    ) {
        const container = context.contentContainerStack[containerIndex]!;
        if (container.type === 'section') return container;
    }
    return null;
}

export function getCurrentTag(context: IParserContext) {
    if (!context.hierarchicalTagStack.length) {
        throw new UsxParseError(`unexpected empty tag stack`, context);
    }
    return context.hierarchicalTagStack[context.hierarchicalTagStack.length - 1]!;
}

export function isCrossRefContainerTag(
    tagType: TagType
): tagType is typeof CROSS_REFERENCE_CONTAINER_TAGS[number] {
    return (
        CROSS_REFERENCE_CONTAINER_TAGS.indexOf(
            tagType as typeof CROSS_REFERENCE_CONTAINER_TAGS[number]
        ) !== -1
    );
}

export function isInTag(tagType: TagType, context: IParserContext) {
    for (let tagIndex = context.hierarchicalTagStack.length - 1; tagIndex >= 0; tagIndex--) {
        const tag = context.hierarchicalTagStack[tagIndex]!;
        if (tag.type === tagType) return true;
    }
    return false;
}

export function isInCrossRefContainerTag(context: IParserContext) {
    for (let tagIndex = context.hierarchicalTagStack.length - 1; tagIndex >= 0; tagIndex--) {
        const tag = context.hierarchicalTagStack[tagIndex]!;
        if (isCrossRefContainerTag(tag.type)) return true;
    }
    return false;
}

export function isInNoteContainerTag(context: IParserContext) {
    for (let tagIndex = context.hierarchicalTagStack.length - 1; tagIndex >= 0; tagIndex--) {
        const tag = context.hierarchicalTagStack[tagIndex]!;
        if (isNoteContainerTag(tag.type)) return true;
    }
    return false;
}

export function isInSectionTag(context: IParserContext) {
    for (let tagIndex = context.hierarchicalTagStack.length - 1; tagIndex >= 0; tagIndex--) {
        const tag = context.hierarchicalTagStack[tagIndex]!;
        if (isSectionTag(tag.type, context.enableChapterLabels)) return true;
    }
    return false;
}

export function isInsideDocument(context: IParserContext) {
    for (
        let containerIndex = context.contentContainerStack.length - 1;
        containerIndex >= 0;
        containerIndex--
    ) {
        const container = context.contentContainerStack[containerIndex]!;
        if (container.type === 'root') return true;
    }
    return false;
}

export function isInsideIgnoredContent(context: IParserContext) {
    return !!context.hierarchicalTagStack.find((tag) => isTagIgnored(tag.type));
}

export function isInsideGroup(groupType: ContentGroupType, context: IParserContext) {
    for (
        let containerIndex = context.contentContainerStack.length - 1;
        containerIndex >= 0;
        containerIndex--
    ) {
        const container = context.contentContainerStack[containerIndex]!;
        if (container.type === 'group' && container.groupType === groupType) return true;

        // we break if we encounter a root document container
        if (container.type === 'root') return false;
    }
    return false;
}

export function isNoteContainerTag(
    tagType: TagType
): tagType is typeof NOTE_CONTAINER_TAGS[number] {
    return NOTE_CONTAINER_TAGS.indexOf(tagType as typeof NOTE_CONTAINER_TAGS[number]) !== -1;
}

export function isSectionTag(
    tagType: TagType,
    enableChapterLabels?: boolean
): tagType is typeof SECTION_TAGS[number] {
    if (!enableChapterLabels && tagType === UsxXmlNodeStyle.CHAPTER_LABEL) return false;
    return SECTION_TAGS.indexOf(tagType as typeof SECTION_TAGS[number]) !== -1;
}

export function isTagIgnored(tagType: TagType) {
    return IGNORED_TAGS.includes(tagType);
}

export function startDocument(context: IParserContext) {
    const content: DocumentRoot = { type: 'root', contents: [] };
    context.contentContainerStack.push(content);
    return content;
}

export function startGroupContainer<T extends ContentGroupType>(
    groupType: T,
    context: IParserContext,
    modifier?: IBibleContentGroup<T>['modifier']
) {
    const container = createGroupContainer(groupType, [], modifier);
    addGroupContainerToContext(container, context);
}

export function startLine(context: IParserContext, elementType: TagType) {
    // - get the current indent level (nothing/paragraph = 0, linegroup = 1, +1 for reach indent group)
    // - special case if we are level 0 and get li4 > treat as paragraph
    // - if tag level < indent level: close indent groups until tag level === indent level
    // - if tag level > indent level: create one indent group
    // - if tag level === indent level: just create line

    const POETRY_LINES: TagType[] = [
        UsxXmlNodeStyle.POETRY,
        UsxXmlNodeStyle.POETRY_LEVEL1,
        UsxXmlNodeStyle.POETRY_LEVEL2,
        UsxXmlNodeStyle.POETRY_LEVEL3,
        UsxXmlNodeStyle.POETRY_LEVEL4,
    ];
    const LIST_LINES: TagType[] = [
        UsxXmlNodeStyle.LIST_ITEM,
        UsxXmlNodeStyle.LIST_ITEM_LEVEL1,
        UsxXmlNodeStyle.LIST_ITEM_LEVEL2,
        UsxXmlNodeStyle.LIST_ITEM_LEVEL3,
        UsxXmlNodeStyle.LIST_ITEM_LEVEL4,
    ];
    const currentIndentLevel = context.contentContainerStack.filter(
        (container) =>
            container.type === 'group' &&
            (container.groupType === 'lineGroup' || container.groupType === 'indent')
    ).length;

    // from what we see in source files, `LIST_ITEM_LEVEL4` mostly has the role of a heading or
    // summary. Therefore we treat it as a single-line paragraph
    if (elementType === UsxXmlNodeStyle.LIST_ITEM_LEVEL4) {
        startNewParagraph(context);
        return;
    }

    let tagLevel = POETRY_LINES.indexOf(elementType);
    if (tagLevel === -1) tagLevel = LIST_LINES.indexOf(elementType);
    if (tagLevel === -1) throw new UsxParseError(`unknown line type ${elementType}`, context);
    // in USX there are two different tag types for the first level, so we combine them here
    if (tagLevel === 0) tagLevel = 1;

    if (!isInsideGroup('paragraph', context)) startNewParagraph(context);
    if (!isInsideGroup('lineGroup', context)) startGroupContainer('lineGroup', context);
    if (tagLevel > 1 && tagLevel > currentIndentLevel) startGroupContainer('indent', context);
    if (tagLevel < currentIndentLevel)
        closeGroupContainer('indent', context, currentIndentLevel - tagLevel);

    const currentLinegroup = getCurrentGroupContainer('lineGroup', context)!;

    const getNumberOfLinesInGroup = (group: IBibleContentGroup<ContentGroupType>) => {
        let n = 0;
        for (const content of group.contents) {
            if (content.type === 'group') {
                if (content.groupType === 'line' || content.groupType === 'unorderedListItem') n++;
                else n += getNumberOfLinesInGroup(content);
            }
        }
        return n;
    };

    const lineNr = getNumberOfLinesInGroup(currentLinegroup) + 1;

    // create line object
    if (POETRY_LINES.indexOf(elementType) !== -1) startGroupContainer('line', context, lineNr);
    else startGroupContainer('unorderedListItem', context, '' + lineNr);
}

export function startNewParagraph(context: IParserContext) {
    closeGroupContainer('paragraph', context);
    startGroupContainer('paragraph', context);
}

export const startSection = (
    context: IParserContext,
    elementType: typeof SECTION_TAGS_NORMALIZED[number]
) => {
    // since we have some osis files where subSections are ended too early, we only
    // close sections when the next one is started - this leads to this rather
    // complicated code where we look which kind of section is currently open in order
    // to determine if we close the section(s)
    let currentContainer = getCurrentContainer(context);

    if (!currentContainer)
        throw new UsxParseError('no open container when starting section', context);

    // if a section starts, we close all still open groups (even if the file
    // isn't buggy, this can happen, since we sometimes auto open certain
    // groups)
    while (
        currentContainer.type !== 'section' &&
        currentContainer.type !== 'book' &&
        currentContainer.type !== 'root'
    ) {
        context.contentContainerStack.pop();
        currentContainer = getCurrentContainer(context);
    }
    // => currentContainer is now either a section or the root node
    if (context.sectionStack.length) {
        const elementSectionOsisLevel = SECTION_TAGS_NORMALIZED.indexOf(elementType);
        let currentSectionOsisLevel = SECTION_TAGS_NORMALIZED.indexOf(
            context.sectionStack[context.sectionStack.length - 1]
        );

        while (elementSectionOsisLevel <= currentSectionOsisLevel && context.sectionStack.length) {
            context.sectionStack.pop();
            // also works when sectionStack is empty
            currentSectionOsisLevel = SECTION_TAGS_NORMALIZED.indexOf(
                context.sectionStack[context.sectionStack.length - 1]
            );

            const closedSection = context.contentContainerStack.pop();
            if (closedSection?.type !== 'section')
                throw new UsxParseError(
                    `closing ${closedSection!.type} when trying to close a section`,
                    context
                );
            currentContainer = getCurrentContainer(context);
        }
    }

    if (
        currentContainer.type !== 'book' &&
        currentContainer.type !== 'root' &&
        currentContainer.type !== 'section'
    )
        throw new UsxParseError(`sections can only start within sections or at root`, context);

    const section: IBibleContentSection = {
        type: 'section',
        level: context.sectionStack.length,
        contents: [],
    };

    context.sectionStack.push(elementType);
    currentContainer.contents.push(section);
    context.contentContainerStack.push(section);
};
