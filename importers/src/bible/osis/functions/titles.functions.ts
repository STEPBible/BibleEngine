import { OsisXmlNodeName, OsisXmlNodeType } from '../../../shared/osisTypes';
import { ParserContext } from '../entities/ParserContext';
import { OsisParseError } from '../errors/OsisParseError';
import { ParserStackItem, TagType } from '../types';

export function updateContextWithTitleText(
    context: ParserContext,
    currentContainer: ParserStackItem,
    tagType: TagType,
    text: string
) {
    // Strongs numbers inside section titles are not supported
    delete context.strongsBuffer;
    if (currentContainer.type !== OsisXmlNodeType.SECTION) {
        throw new OsisParseError(`can't set title to section: no section; "${text}"`, context);
    }
    if (tagType === OsisXmlNodeType.TEXTUAL_NOTE) {
        currentContainer.subTitle = text;
        return;
    }
    const styledText = tagType === OsisXmlNodeName.DIVINE_NAME ? text.toUpperCase() : text;
    if (currentContainer.title) {
        currentContainer.title += ' ' + styledText;
        return;
    }
    currentContainer.title = styledText;
}
