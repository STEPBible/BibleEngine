import {
    ParserContext,
    OsisXmlNode,
    OsisXmlTag,
    OsisXmlNodeType,
    Indentation,
    ChapterXML
} from '../src/types';

import {
    IBibleCrossReference,
    IBibleReferenceRange,
    IBibleNote,
    DocumentRoot,
    IBibleContentSection,
    IBibleContentPhrase,
    IBibleContentGroup
} from '@bible-engine/core';

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
        quoteNode: undefined,
        verseNum: 0,
        noteText: '',
        osisRef: '',
        notes: [],
        noteCount: 0,
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
                const prettifyXML = require('xml-formatter');
                console.log(prettifyXML(textWithoutUnusedTags));
                console.log('********************************************');
            }

            parser.write(textWithoutUnusedTags);
            parser.close();
        });
    }

    if (context.titleSection.contents.length) {
        context.titleSections.push(context.titleSection);
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
        case OsisXmlTag.NOTE: {
            context.currentNoteNode = node;
            break;
        }
        case OsisXmlTag.CROSS_REFERENCE: {
            context.currentCrossRefNode = node;
            const crossRef = getCrossReference(context);
            context.crossRefs.push(crossRef);
            break;
        }
        case OsisXmlTag.TITLE: {
            context.title = node;
            if (context.titleSection.contents.length) {
                context.titleSections.push(context.titleSection);
                context.titleSection = { type: 'section', contents: [] };
            }
            break;
        }
        case OsisXmlTag.POETIC_LINE: {
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
        case OsisXmlTag.DIVINE_NAME: {
            context.divineNameNode = node;
            break;
        }
        case OsisXmlTag.DIVISION: {
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
    if (node && node.name === OsisXmlTag.HIGHLIGHT) {
        formattedText = getPhraseWithHighlighting(formattedText, context);
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
    if (context.title) {
        if (node && node.name === OsisXmlTag.DIVINE_NAME) {
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
    if (context.quoteNode) {
        parseQuote(formattedText, context);
        return;
    }
    if (node) {
        switch (node.name) {
            case OsisXmlTag.TITLE:
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
        case OsisXmlTag.TITLE: {
            if (!context.title) {
                context.paragraph!.contents = context.phrases;
                context.titleSection!.contents.push(context.paragraph!);
                context.paragraph = undefined;
                context.phrases = [];
                context.verseNum += 1;
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
        case OsisXmlTag.NOTE: {
            if (context.noteText.trim()) {
                const footnote = getFootnote(context);
                context.notes.push(footnote);
                context.noteCount += 1;
            }
            context.noteText = '';
            context.currentNoteNode = undefined;
            break;
        }
        case OsisXmlTag.CROSS_REFERENCE: {
            context.currentCrossRefNode = undefined;
            break;
        }
        case OsisXmlTag.QUOTE: {
            const isClosingQuotationMark = node && node.isSelfClosing && node.attributes.marker;
            if (isClosingQuotationMark) {
                // Add this to phrase: node.attributes.marker;
            }
            if (!node) {
                context.quoteNode = undefined;
            }
            break;
        }
        case OsisXmlTag.LINE_GROUP: {
            if (node!.attributes.sID) {
                context.paragraph! = getNewParagraph();
            }
            if (node!.attributes.eID) {
                context.titleSection!.contents.push(context.paragraph!);
                context.paragraph = undefined;
            }
            break;
        }
        case OsisXmlTag.DIVINE_NAME:
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
    if (context.notes.length) {
        phrase['notes'] = context.notes;
        context.notes = [];
    }
    return phrase;
}

function getCrossReference(context: ParserContext): IBibleCrossReference {
    const key = String(context.currentNoteNode!.attributes.n);
    const { osisRef } = context.currentCrossRefNode!.attributes;
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
    const versionVerseNum = Number(firstVerse[2]);
    const range: IBibleReferenceRange = {
        bookOsisId,
        versionChapterNum,
        versionVerseNum
    };
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

function parseQuote(text: string, context: ParserContext) {
    const strongsNumbers = getStrongsNumbers(context);
    if (context.quoteNode!.attributes.who === 'Jesus' && text) {
        // `$redLetter=${text}`]);
        return;
    }
    // push [text]);
    if (strongsNumbers) {
        // push(strongsNumbers);
    }
}
function isFootnote(node: OsisXmlNode | undefined) {
    return (
        node &&
        node.name === OsisXmlTag.NOTE &&
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
    const strongsNumbersString = lemma.replace(' ', '').replace('!', '');
    const strongsNumbers = strongsNumbersString
        .split('strong:')
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
