import { TreeElement, DefaultNode, TreeTextNode } from './models/parse5';
import {
    BookWithContentForInput,
    IBibleContentForInput,
    IBibleContentPhraseForInput,
    IBibleContentSectionForInput,
    IBibleContentGroupForInput
} from '../../models/BibleInput';
import {
    DocumentDefault,
    DocumentSection,
    DocumentPhrase,
    DocumentGroup
} from '../../models/Document';
import { IContentGroup } from '../../models';

export const getTextFromNode = (node: DefaultNode) => {
    if (node.nodeName === '#text') return node.value;
    else {
        let text = '';
        for (const childNode of node.childNodes) text += getTextFromNode(childNode);
        return text.trim();
    }
};

export const hasAttribute = (node: TreeElement, name: string, value?: string) =>
    node.attrs.find(attr => attr.name === name && (!value || attr.value === value));

export const visitNode = (
    node: DefaultNode,
    globalState: {
        bookData: BookWithContentForInput;
        currentChapterNumber?: number;
        currentBackupChapterNumber?: number;
        currentVerseNumber?: number;
        currentLevel1Section?: IBibleContentSectionForInput;
        currentLevel2Section?: IBibleContentSectionForInput;
        currentLevel3Section?: IBibleContentSectionForInput;
        currentLevel4Section?: IBibleContentSectionForInput;
        contentWithPendingNotes?: (IBibleContentPhraseForInput | IBibleContentSectionForInput)[];
    },
    localState: {
        currentDocument?: DocumentDefault;
        currentContentGroup: IBibleContentForInput[];
    }
) => {
    if (node.nodeName === 'h1') {
        globalState.bookData.book.longTitle = (<TreeTextNode>node.childNodes[0]).value;
        globalState.bookData.book.introduction = [];
        localState.currentDocument = globalState.bookData.book.introduction;
    } else if (
        node.nodeName === 'h2' ||
        node.nodeName === 'h3' ||
        node.nodeName === 'h4' ||
        (node.nodeName === 'span' && hasAttribute(node, 'class', 'u2'))
    ) {
        if (
            node.nodeName === 'span' &&
            hasAttribute(node, 'class', 'u2') &&
            localState.currentDocument
        )
            throw new Error(`we expect class=u2 to only occur in a bible-section context`);

        let sectionTitle = getTextFromNode(node);

        // introduction is finished and bible text is starting
        localState.currentDocument = undefined;
        const newSection: IBibleContentSectionForInput = {
            type: 'section',
            title: sectionTitle,
            contents: []
        };

        // look for a note marker in the section title
        if (sectionTitle.indexOf('*') !== -1) {
            sectionTitle = sectionTitle.replace('*', '');
            newSection.title = sectionTitle;
            if (!globalState.contentWithPendingNotes) globalState.contentWithPendingNotes = [];
            globalState.contentWithPendingNotes.push(newSection);
        }

        // since sections are not hierarchical in HTML (but only indicated by heading tags), we need
        // to keep track of the level of sections to know where we need to stay in the level or go
        // up / down one level
        // we have some additional complexity here since sections level are sometimes skipped
        if (node.nodeName === 'h2') {
            // top level section always go to the root of the document
            globalState.bookData.contents.push(newSection);
            globalState.currentLevel1Section = newSection;
            globalState.currentLevel2Section = undefined;
            globalState.currentLevel3Section = undefined;
            globalState.currentLevel4Section = undefined;
        } else if (node.nodeName === 'h3') {
            // if there is a skipped section level we need to add the section the next higher level
            if (!globalState.currentLevel1Section) {
                globalState.bookData.contents.push(newSection);
            } else {
                globalState.currentLevel1Section.contents.push(newSection);
            }

            globalState.currentLevel2Section = newSection;
            globalState.currentLevel3Section = undefined;
            globalState.currentLevel4Section = undefined;
        } else if (node.nodeName === 'h4') {
            // if there is a skipped section level we need to add the section the next higher level
            if (!globalState.currentLevel2Section) {
                if (!globalState.currentLevel1Section) {
                    globalState.bookData.contents.push(newSection);
                } else {
                    globalState.currentLevel1Section.contents.push(newSection);
                }
            } else {
                globalState.currentLevel2Section.contents.push(newSection);
            }

            globalState.currentLevel3Section = newSection;
            globalState.currentLevel4Section = undefined;
        } else if (node.nodeName === 'span' && hasAttribute(node, 'class', 'u2')) {
            // if there is a skipped section level we need to add the section the next higher level
            if (!globalState.currentLevel3Section) {
                if (!globalState.currentLevel2Section) {
                    if (!globalState.currentLevel1Section) {
                        globalState.bookData.contents.push(newSection);
                    } else {
                        globalState.currentLevel1Section.contents.push(newSection);
                    }
                } else {
                    globalState.currentLevel2Section.contents.push(newSection);
                }
            } else {
                globalState.currentLevel3Section.contents.push(newSection);
            }

            globalState.currentLevel4Section = newSection;
        }

        // add following content to this section
        localState.currentContentGroup = newSection.contents;
    } else if (node.nodeName === 'span' && hasAttribute(node, 'class', 'kap')) {
        globalState.currentChapterNumber = +(<TreeTextNode>node.childNodes[0]).value;
        // if a new chapter is set, it overwrites the backup number
        if (globalState.currentBackupChapterNumber)
            globalState.currentBackupChapterNumber = undefined;
    } else if (node.nodeName === 'span' && hasAttribute(node, 'class', 'vers')) {
        const verseRef = (<TreeTextNode>node.childNodes[0]).value;
        const verseParts = verseRef.split(',');
        if (verseParts.length > 1) {
            globalState.currentBackupChapterNumber = globalState.currentChapterNumber;
            globalState.currentChapterNumber = +verseParts[0];
            globalState.currentVerseNumber = +verseParts[1];
        } else {
            globalState.currentVerseNumber = +verseRef;
            if (globalState.currentBackupChapterNumber) {
                globalState.currentChapterNumber = globalState.currentBackupChapterNumber;
                globalState.currentBackupChapterNumber = undefined;
            }
        }
    } else if (node.nodeName === 'p' && hasAttribute(node, 'class', 'u0')) {
        if (!localState.currentDocument)
            throw new Error(`we expect class=u0 to only occur in a book introduction`);

        const newSection: DocumentSection = {
            type: 'section',
            title: (<TreeTextNode>node.childNodes[0]).value,
            contents: []
        };
        localState.currentDocument.push(newSection);
        localState.currentDocument = newSection.contents;
    } else if (node.nodeName === 'p' && hasAttribute(node, 'class', 'u1')) {
        if (
            !globalState.bookData.book.introduction ||
            !globalState.bookData.book.introduction[0] ||
            globalState.bookData.book.introduction[0].type !== 'section'
        )
            throw new Error(
                `we expect class=u1 to only occur as a subtitle in the book introduction`
            );

        (<DocumentSection>globalState.bookData.book.introduction[0]).subTitle = (<TreeTextNode>(
            node.childNodes[0]
        )).value;

        // the following condition is included at the top along with the heading tags
        // else if (node.nodeName === 'span' && hasAttribute(node, 'class', 'u2'))
    } else if (node.nodeName === 'p' && hasAttribute(node, 'class', 'u3')) {
        if (!localState.currentDocument)
            throw new Error(`we expect class=u3 to only occur in a book introduction`);
        // skip the outline
        return;
    } else if (node.nodeName === 'div' && hasAttribute(node, 'class', 'fn')) {
        const newNote: DocumentDefault = [];
        const childState = {
            ...localState,
            currentDocument: newNote
        };
        for (const childNode of node.childNodes) visitNode(childNode, globalState, childState);
        const firstContentWithPendingNote = globalState.contentWithPendingNotes
            ? globalState.contentWithPendingNotes.shift()
            : undefined;

        const noteText = getTextFromNode(node);

        if (!firstContentWithPendingNote)
            throw new Error(`no content with pending note: ${noteText}`);

        if (firstContentWithPendingNote.type === 'phrase') {
            const expectedNoteReference = `${firstContentWithPendingNote.versionChapterNum},${
                firstContentWithPendingNote.versionVerseNum
            }:`;

            if (noteText.indexOf(expectedNoteReference) !== 0)
                throw new Error(
                    `error matching note (${noteText}) to next pending phrase: ` +
                        `${expectedNoteReference}`
                );

            firstContentWithPendingNote.notes = [
                {
                    type: 'note',
                    key: '*',
                    content: newNote
                }
            ];
        } else {
            firstContentWithPendingNote.description = newNote;
        }
    } else if (node.nodeName === '#text') {
        const text = node.value
            .trim()
            // .replace(/\r?\n|\r/g, ' ')
            .replace(/\s{2,}/g, ' ');
        if (!text) return;

        const newPhrase: DocumentPhrase = {
            type: 'phrase',
            content: text
        };
        if (localState.currentDocument) localState.currentDocument.push(newPhrase);
        else {
            if (!globalState.currentChapterNumber || !globalState.currentVerseNumber)
                throw new Error(
                    `verse numbers are missing in node: <${node.nodeName}>${text}</${
                        node.nodeName
                    }> / state: ${globalState.currentChapterNumber}:${
                        globalState.currentVerseNumber
                    }`
                );
            const numbers = {
                versionChapterNum: globalState.currentChapterNumber,
                versionVerseNum: globalState.currentVerseNumber
            };

            const textByNotes = text.split('*');

            if (textByNotes.length > 1) {
                for (let i = 0; i < textByNotes.length; i++) {
                    if (i === textByNotes.length - 1) {
                        if (textByNotes[i].trim())
                            localState.currentContentGroup.push({
                                ...numbers,
                                type: 'phrase',
                                content: textByNotes[i].trim()
                            });
                    } else {
                        // last word should get a note (if index is -1 it gets 0 which is correct)
                        let lastWordIndex = textByNotes[i].lastIndexOf(' ') + 1;
                        if (lastWordIndex > 0) {
                            const startingText = textByNotes[i].slice(0, lastWordIndex - 1);
                            if (startingText.trim())
                                localState.currentContentGroup.push({
                                    ...numbers,
                                    type: 'phrase',
                                    content: startingText
                                });
                        }
                        const textWithNote = textByNotes[i].slice(lastWordIndex);
                        const phraseWithPendingNote: IBibleContentPhraseForInput = {
                            ...numbers,
                            type: 'phrase',
                            content: textWithNote
                        };
                        localState.currentContentGroup.push(phraseWithPendingNote);
                        if (!globalState.contentWithPendingNotes)
                            globalState.contentWithPendingNotes = [];
                        globalState.contentWithPendingNotes.push(phraseWithPendingNote);
                    }
                }
            } else {
                const newBiblePhrase: IBibleContentPhraseForInput = {
                    ...newPhrase,
                    ...numbers
                };
                localState.currentContentGroup.push(newBiblePhrase);
            }
        }
    } else {
        // in cases where there are no sections, a chapter marker indicates that introduction is
        // finished and bible text is starting
        if (localState.currentDocument && node.nodeName === 'p' && hasAttribute(node, 'id')) {
            localState.currentDocument = undefined;
        }

        let groupType: IContentGroup['groupType'];
        if (
            node.nodeName === 'p' ||
            (node.nodeName === 'div' &&
                node.attrs.find(attr => attr.name === 'class' && attr.value === 'e'))
        ) {
            groupType = 'paragraph';
        } else if (node.nodeName === 'b') groupType = 'bold';
        else groupType = 'emphasis';

        const newGroup: DocumentGroup = {
            type: 'group',
            groupType,
            contents: []
        };
        const newBibleGroup: IBibleContentGroupForInput<IContentGroup['groupType']> = {
            ...newGroup,
            contents: []
        };
        const childState = {
            ...localState
        };
        if (localState.currentDocument) {
            childState.currentDocument = newGroup.contents;
        } else {
            childState.currentContentGroup = newBibleGroup.contents;
        }

        // see comment further down
        const backupCurrentLevel4Section = globalState.currentLevel4Section;

        for (const childNode of node.childNodes) visitNode(childNode, globalState, childState);

        if (localState.currentDocument) {
            if (newGroup.contents.length) localState.currentDocument.push(newGroup);
        } else {
            if (newBibleGroup.contents.length) localState.currentContentGroup.push(newBibleGroup);

            // we need to check for a special case, when a level 4 section is started within a
            // ContentGroup. due to the way the HTML is structured for the NEUE (Ps119, Hos) we
            // have to manually pull this section to the localState
            if (backupCurrentLevel4Section !== globalState.currentLevel4Section) {
                if (globalState.currentLevel4Section)
                    localState.currentContentGroup = globalState.currentLevel4Section.contents;
            }
        }
    }
};
