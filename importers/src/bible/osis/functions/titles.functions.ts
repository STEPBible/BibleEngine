import { getCurrentSection } from './sections.functions';
import { OsisXmlNodeName, OsisXmlNodeType } from '../../../shared/osisTypes';
import { ParserContext } from '../entities/ParserContext';
import { OsisParseError } from '../errors/OsisParseError';
import { TagType } from '../types';

export function updateContextWithTitleText(context: ParserContext, tagType: TagType, text: string) {
    // Strongs numbers inside section titles are not supported
    delete context.strongsBuffer;
    const container = getCurrentSection(context);
    if (!container || container.type !== OsisXmlNodeType.SECTION) {
        throw new OsisParseError(`can't set title to section: no section; "${text}"`, context);
    }
    if (tagType === OsisXmlNodeType.TEXTUAL_NOTE) {
        container.subTitle = text;
        return;
    }
    const styledText = tagType === OsisXmlNodeName.DIVINE_NAME ? text.toUpperCase() : text;
    if (container.title) {
        container.title += ' ' + styledText;
        return;
    }
    container.title = styledText;
}
