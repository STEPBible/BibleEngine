import { ParserContext, ChapterXML } from './types';

import {
    OsisXmlNode,
    OsisXmlNodeName,
    OsisXmlNodeType,
    Indentation
} from '../../../shared/osisTypes';

import {
    IBibleCrossReference,
    IBibleReferenceRange,
    IBibleNote,
    DocumentRoot,
    IBibleContentSection,
    IBibleContentPhrase,
    IBibleContentGroup
} from '@bible-engine/core';

const prettifyXML = require('xml-formatter');
const sax = require('sax');

const DEBUG_OUTPUT_ENABLED = false;
const STRICT_MODE_ENABLED = true;

export function getBibleEngineInputFromXML(bookXML: ChapterXML[]): IBibleContentSection[] {
    const context: ParserContext = {
        chapterNum: 1,
        currentNode: undefined,
        currentNoteNode: undefined,
        currentNoteNum: 0,
        currentCrossRefNode: undefined,
        crossRefs: [],
        divineNameNode: undefined,
        verseNum: 0,
        noteText: '',
        osisRef: '',
        notes: [],
        noteCount: 0,
        psalmTitle: undefined,
        psalmTitleContents: [],
        quoteNode: undefined,
        titleSections: [],
        phrases: [],
        titleSection: { type: 'section', contents: [] },
        paragraph: undefined,
        title: undefined,
        titleText: ''
    };

    const parser = sax.parser(STRICT_MODE_ENABLED);

    parser.ontext = (text: string) => parseTextNode(text, context);
    parser.onopentag = (node: OsisXmlNode) => parseOpeningTag(node, context);
    parser.onclosetag = (tagName: string) => parseClosingTag(tagName, context);
    parser.onerror = () => parser.resume();

    for (const [i, chapterXML] of bookXML.entries()) {
        context.chapterNum = i + 1;
        chapterXML.verses.forEach(({ text }, index) => {
            context.verseNum = index + 1;

            const textWithSingleRootNode = `<xml>${text}</xml>`;
            const textWithoutUnusedTags = textWithSingleRootNode.replace(
                /(<catchWord>)|(<\/catchWord>)/g,
                ''
            );

            if (DEBUG_OUTPUT_ENABLED) {
                console.log(prettifyXML(textWithoutUnusedTags));
                console.log('********************************************');
            }
            try {
                parser.write(textWithoutUnusedTags);
                parser.close();
            } catch (error) {
                console.error('Failed to parse this XML: ', prettifyXML(textWithoutUnusedTags))
                throw error
            }
        });
    }

    if (context.titleSection.contents.length) {
        context.titleSections.push(context.titleSection);
    }

    if (!context.titleSections.length && context.phrases) {
        context.titleSections = [
            {
                type: 'section',
                contents: context.phrases
            }
        ];
    }

    const validSections = context.titleSections.map(section => {
        section.contents = section.contents.filter(content => content);
        return section;
    });

    return validSections;
}

function parseOpeningTag(node: OsisXmlNode, context: ParserContext) {
    context.currentNode = node;
    switch (node.name) {
        case OsisXmlNodeName.CATCH_WORD:
        case OsisXmlNodeName.FOREIGN_WORD:
        case OsisXmlNodeName.HIGHLIGHT:
        case OsisXmlNodeName.LEMMA:
        case OsisXmlNodeName.LINE_GROUP:
        case OsisXmlNodeName.WORK:
        case OsisXmlNodeName.CHAPTER:
        case OsisXmlNodeName.DATE:
        case OsisXmlNodeName.DESCRIPTION:
        case OsisXmlNodeName.IDENTIFIER:
        case OsisXmlNodeName.LANGUAGE:
        case OsisXmlNodeName.MILESTONE:
        case OsisXmlNodeName.NAME:
        case OsisXmlNodeName.OSIS_HEADER:
        case OsisXmlNodeName.PUBLISHER:
        case OsisXmlNodeName.REF_SYSTEM:
        case OsisXmlNodeName.REVISION_DESC:
        case OsisXmlNodeName.RIGHTS:
        case OsisXmlNodeName.TYPE:
        case OsisXmlNodeName.VERSION_SCOPE:
        case OsisXmlNodeName.WORD:
        case OsisXmlNodeName.WORD_SEGMENT:
        case OsisXmlNodeName.XML:
        case OsisXmlNodeName.XML_ROOT: {
            // handled in parseTextNode or parseClosingTag, or ignored
            break;
        }
        case OsisXmlNodeName.NOTE: {
            context.currentNoteNode = node;
            break;
        }
        case OsisXmlNodeName.REFERENCE: {
            context.currentCrossRefNode = node;
            const crossRef = getCrossReference(context);
            context.crossRefs.push(crossRef);
            break;
        }
        case OsisXmlNodeName.TITLE: {
            if (node.attributes.type === OsisXmlNodeType.PSALM) {
                context.psalmTitle = node;
                break;
            }
            context.title = node;
            if (context.titleSection.contents.length) {
                context.titleSections.push(context.titleSection);
                context.titleSection = { type: 'section', contents: [] };
            }
            break;
        }
        case OsisXmlNodeName.LINE: {
            if (node.attributes.eID) {
                console.assert(context.phrases);
                const indentGroup = getIndentGroup(node, context);
                context.phrases = [];
                if (context.paragraph) {
                    context.paragraph!.contents.push(indentGroup);
                    return;
                }
                context.titleSection.contents.push(indentGroup);
            }
            break;
        }
        case OsisXmlNodeName.DIVINE_NAME: {
            context.divineNameNode = node;
            break;
        }
        case OsisXmlNodeName.DIVISION: {
            if (isStartOfParagraph(node)) {
                if (context.paragraph && context.paragraph!.contents.length) {
                    throw new Error("Can't add a paragraph when one already exists");
                }
                context.paragraph = getNewParagraph();
            }
            if (isEndOfParagraph(node)) {
                if (!context.paragraph) {
                    context.paragraph = getNewParagraph();
                }
                context.paragraph!.contents = context.phrases;
                context.phrases = [];
                context.titleSection!.contents.push(context.paragraph!);
                context.paragraph = undefined;
            }
            break;
        }
        case OsisXmlNodeName.QUOTE: {
            if (!node.attributes.marker) return
            const isClosingQuote = node.attributes.eID
            if (isClosingQuote) {
                context.phrases[context.phrases.length - 1].content += node.attributes.marker
                break;
            }
            context.quoteNode = node
            break;
        }
        default: {
            throw new Error(`unrecognized osis xml tag: ${node.name}`)
        }
    }
}

function isStartOfParagraph(node: OsisXmlNode) {
    return node.attributes.type === OsisXmlNodeType.PARAGRAPH && node.attributes.sID;
}

function isEndOfParagraph(node: OsisXmlNode) {
    return node.attributes.type === OsisXmlNodeType.PARAGRAPH && node.attributes.eID;
}

function parseTextNode(text: string, context: ParserContext) {
    const { currentNode: node } = context;
    let formattedText = text.trim();
    if (formattedText.length === 0) {
        return;
    }
    if (node && node.name === OsisXmlNodeName.HIGHLIGHT) {
        formattedText = getPhraseWithHighlighting(formattedText, context);
    }
    if (context.quoteNode) {
        formattedText = context.quoteNode?.attributes.marker + formattedText
        context.quoteNode = undefined
    }
    if (isFootnote(context.currentNoteNode)) {
        context.currentNoteNum =
            Number(context.currentNoteNode!.attributes.n) || Number(context.noteCount);
        context.noteText += formattedText + ' ';
        return;
    }
    if (context.currentNoteNode) {
        return;
    }
    if (context.divineNameNode) {
        formattedText = formattedText.toUpperCase();
    }
    if (context.psalmTitle) {
        const titlePhrase = getPhrase(formattedText, context);
        context.psalmTitleContents.push(titlePhrase);
        return;
    }
    if (context.title) {
        if (node && node.name === OsisXmlNodeName.DIVINE_NAME) {
            context.titleText += text.toUpperCase();
            return;
        }
        context.titleText += text;
        return;
    }
    if (isPunctuation(formattedText)) {
        const { phrases } = context;
        if (!phrases.length) {
            return;
        }
        phrases[phrases.length - 1].content += formattedText;
        return;
    }
    if (isPunctuation(formattedText[0])) {
        const { phrases } = context;
        phrases[phrases.length - 1].content += formattedText[0];
        formattedText = formattedText.slice(1).trim();
    }
    if (node) {
        switch (node.name) {
            case OsisXmlNodeName.TITLE:
                context.titleText += formattedText;
                break;
            default:
                const phrase = getPhrase(formattedText, context);
                context.phrases.push(phrase);
                break;
        }
    } else {
        const phrase = getPhrase(formattedText, context);
        context.phrases.push(phrase);
    }
}

function parseClosingTag(tagName: string, context: ParserContext) {
    const { currentNode: node } = context;
    switch (tagName) {
        case OsisXmlNodeName.TITLE: {
            if (context.psalmTitle) {
                const psalmTitle = getPsalmTitle(context);
                context.phrases.push(psalmTitle);
                context.psalmTitle = undefined;
                context.psalmTitleContents = [];
            }
            if (!context.title) {
                if (context.paragraph) {
                    context.paragraph!.contents = context.phrases;
                    context.titleSection!.contents.push(context.paragraph!);
                    context.paragraph = undefined;
                    context.phrases = [];
                    context.verseNum += 1;
                }
                break;
            }
            const title = getStringWithoutXMLTags(context.titleText);
            context.title = undefined;
            context.titleText = '';
            context.titleSection = {
                type: 'section',
                title,
                contents: []
            };
            break;
        }
        case OsisXmlNodeName.NOTE: {
            if (context.noteText.trim()) {
                const footnote = getFootnote(context);
                if (context.phrases.length) {
                    if (!context.phrases[context.phrases.length - 1].notes) {
                        context.phrases[context.phrases.length - 1].notes = [];
                    }
                    context.phrases[context.phrases.length - 1].notes.push(footnote);
                }
                context.noteCount += 1;
            }
            context.noteText = '';
            context.currentNoteNode = undefined;
            break;
        }
        case OsisXmlNodeName.REFERENCE: {
            context.currentCrossRefNode = undefined;
            break;
        }
        case OsisXmlNodeName.LINE_GROUP: {
            if (node!.attributes.sID) {
                context.paragraph! = getNewParagraph();
            }
            if (node!.attributes.eID) {
                context.titleSection!.contents.push(context.paragraph!);
                context.paragraph = undefined;
            }
            break;
        }
        case OsisXmlNodeName.DIVINE_NAME:
            context.divineNameNode = undefined;
    }
    context.currentNode = undefined;
}

function getPhrase(content: string, context: ParserContext): IBibleContentPhrase {
    const strongs = getStrongsNumbers(context);
    const phrase: IBibleContentPhrase = {
        type: 'phrase',
        content,
        versionChapterNum: context.chapterNum,
        versionVerseNum: context.verseNum
    };
    if (strongs && strongs.length) {
        phrase['strongs'] = strongs;
    }
    if (context.crossRefs.length) {
        phrase['crossReferences'] = context.crossRefs;
        context.crossRefs = [];
    }
    return phrase;
}

function getCrossReference(context: ParserContext): IBibleCrossReference {
    const key = String(context.currentNoteNode!.attributes.n);
    const { osisRef } = context.currentCrossRefNode!.attributes;
    if (!osisRef) throw new Error('parsing a cross reference with attribute "osisRef"');

    let { bookOsisId, versionChapterNum, versionVerseNum } = getOsisReferenceEntities(osisRef);
    bookOsisId = String(bookOsisId);
    const crossRef: IBibleCrossReference = {
        key,
        range: {
            bookOsisId,
            versionChapterNum,
            versionVerseNum
        }
    };
    return crossRef;
}

function getOsisReferenceEntities(osisRef: string): IBibleReferenceRange {
    const firstVerse = osisRef.split('-')[0].split('.');
    const bookOsisId = firstVerse[0];
    const versionChapterNum = Number(firstVerse[1]);
    const range: IBibleReferenceRange = {
        bookOsisId,
        versionChapterNum
    };
    if (firstVerse[2]) range.versionVerseNum = +firstVerse[2];
    const hasMultipleVerses = osisRef.split('-').length === 2;
    if (hasMultipleVerses) {
        const secondVerse = osisRef.split('-')[1];
        range.versionVerseEndNum = Number(secondVerse.split('.')[2]);
    }
    return range;
}

function getFootnote(context: ParserContext): IBibleNote {
    const key = context.currentNoteNode!.attributes.n!;
    const type: string = context.currentNoteNode!.attributes.type!;
    const content: DocumentRoot = {
        type: 'root',
        contents: [
            {
                type: 'phrase',
                content: context.noteText
            }
        ]
    };
    return {
        type,
        key,
        content
    };
}

function isPunctuation(str: string): boolean {
    return str.length === 1 && !!str.match(/^[.,:;!?]/);
}

function getNewParagraph(): IBibleContentGroup<'paragraph'> {
    return {
        type: 'group',
        groupType: 'paragraph',
        contents: []
    };
}

function getIndentGroup(node: OsisXmlNode, context: ParserContext): IBibleContentGroup<'indent'> {
    if (node!.attributes.level === Indentation.SMALL) {
        return {
            type: 'group',
            groupType: 'indent',
            contents: context.phrases
        };
    }
    if (node!.attributes.level! >= Indentation.LARGE) {
        return {
            type: 'group',
            groupType: 'indent',
            contents: [
                {
                    type: 'group',
                    groupType: 'indent',
                    contents: context.phrases
                }
            ]
        };
    } else {
        throw new Error(`Unrecognized indentation level: ${JSON.stringify(node.attributes.level)}`);
    }
}

function getPhraseWithHighlighting(phrase: string, context: ParserContext) {
    switch (context.currentNode!.attributes.type) {
        case OsisXmlNodeType.ITALIC:
            return `"${phrase}"`;
        case OsisXmlNodeType.BOLD:
            return `'${phrase}'`;
        case OsisXmlNodeType.UNDERLINE:
            return `"${phrase}"`;
    }
    return phrase;
}

function getPsalmTitle(context: ParserContext) {
    const psalmTitle: IBibleContentGroup<'title'> = {
        type: 'group',
        groupType: 'title',
        contents: context.psalmTitleContents
    };
    return psalmTitle;
}

function isFootnote(node: OsisXmlNode | undefined) {
    return (
        node &&
        node.name === OsisXmlNodeName.NOTE &&
        node.attributes.type !== OsisXmlNodeType.CROSS_REFERENCE
    );
}

function hasStrongsNumbers(node: OsisXmlNode): boolean {
    return node && 'attributes' in node && 'lemma' in node.attributes;
}

function getStrongsNumbers(context: ParserContext): string[] {
    if (!hasStrongsNumbers(context.currentNode!)) {
        return [];
    }
    if (!context.currentNode) {
        return [];
    }
    const lemma = context.currentNode!.attributes.lemma!;
    const strongsNumbersString = lemma.split('strong:').join('')
    const strongsNumbers = strongsNumbersString
        .split(' ')
        .filter(element => element)
        .map(strongsNum => normalizeStrongsNum(strongsNum));
    return strongsNumbers;
}

function normalizeStrongsNum(strongsNum: string): string {
    const lastCharacter = strongsNum[strongsNum.length - 1];
    const startingletter = strongsNum[0].toUpperCase();
    const numberPortion = isNumeric(lastCharacter)
        ? strongsNum.substring(1)
        : strongsNum.substring(1, strongsNum.length - 1);
    const endingLetter = isNumeric(lastCharacter) ? '' : lastCharacter.toLowerCase();
    const paddedNumber = String('0000' + numberPortion).slice(-4);
    return startingletter + paddedNumber + endingLetter;
}

function isNumeric(num: any): num is number {
    return !isNaN(num);
}

function getStringWithoutXMLTags(str: string) {
    return str.replace(/<(?:.|\n)*?>/gm, '');
}
