import { TreeElement, DefaultNode } from './models/parse5';
import {
    BookWithContentForInput,
    IBibleContentForInput,
    IBibleContentPhraseForInput,
    IBibleContentSectionForInput,
    IBibleContentGroupForInput
} from '../../models/BibleInput';
import {
    DocumentRoot,
    DocumentSection,
    DocumentPhrase,
    DocumentGroup,
    DocumentElement
} from '../../models/Document';
import { ContentGroupType } from '../../models/ContentGroup';

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
        currentDocument?: DocumentElement[];
        currentContentGroup: IBibleContentForInput[];
    }
) => {
    if (node.nodeName === 'h1') {
        globalState.bookData.book.longTitle = getTextFromNode(node);
        globalState.bookData.book.introduction = { type: 'root', contents: [] };
        localState.currentDocument = globalState.bookData.book.introduction.contents;
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
        globalState.currentChapterNumber = +getTextFromNode(node);
        // if a new chapter is set, it overwrites the backup number
        if (globalState.currentBackupChapterNumber)
            globalState.currentBackupChapterNumber = undefined;
    } else if (node.nodeName === 'span' && hasAttribute(node, 'class', 'vers')) {
        const verseRef = getTextFromNode(node);
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
            title: getTextFromNode(node),
            contents: []
        };
        localState.currentDocument.push(newSection);
        localState.currentDocument = newSection.contents;
    } else if (node.nodeName === 'p' && hasAttribute(node, 'class', 'u1')) {
        if (
            !globalState.bookData.book.introduction ||
            !globalState.bookData.book.introduction.contents[0] ||
            globalState.bookData.book.introduction.contents[0].type !== 'section'
        )
            throw new Error(
                `we expect class=u1 to only occur as a subtitle in the book introduction`
            );

        (<DocumentSection>(
            globalState.bookData.book.introduction.contents[0]
        )).subTitle = getTextFromNode(node);

        // the following condition is included at the top along with the heading tags
        // else if (node.nodeName === 'span' && hasAttribute(node, 'class', 'u2'))
    } else if (node.nodeName === 'p' && hasAttribute(node, 'class', 'u3')) {
        if (!localState.currentDocument)
            throw new Error(`we expect class=u3 to only occur in a book introduction`);
        // skip the outline
        return;
    } else if (node.nodeName === 'div' && hasAttribute(node, 'class', 'fn')) {
        const newNote: DocumentRoot = { type: 'root', contents: [] };
        const childState = {
            ...localState,
            currentDocument: newNote.contents
        };
        for (const childNode of node.childNodes) visitNode(childNode, globalState, childState);
        const firstContentWithPendingNote = globalState.contentWithPendingNotes
            ? globalState.contentWithPendingNotes.shift()
            : undefined;

        const noteText = getTextFromNode(node);

        if (!firstContentWithPendingNote)
            throw new Error(`no content with pending note: ${noteText}`);

        if (firstContentWithPendingNote.type === 'phrase') {
            const expectedNoteReference =
                `${firstContentWithPendingNote.versionChapterNum},` +
                `${firstContentWithPendingNote.versionVerseNum}:`;

            if (noteText.indexOf(expectedNoteReference) !== 0)
                throw new Error(
                    `error matching note (${noteText}) to next pending phrase: ` +
                        `${expectedNoteReference}`
                );

            firstContentWithPendingNote.notes = [{ content: newNote }];
        } else {
            firstContentWithPendingNote.description = newNote;
        }
    } else if (node.nodeName === '#text') {
        const punctuationChars = ['.', ',', ':', '?', '!', ';'];

        const text = node.value
            .trim()
            // .replace(/\r?\n|\r/g, ' ')
            .replace(/\s{2,}/g, ' ');
        if (!text) return;

        const newPhrase: DocumentPhrase = {
            type: 'phrase',
            content: text
        };
        if (punctuationChars.indexOf(text.slice(0, 1)) !== -1) newPhrase.skipSpace = 'before';

        if (localState.currentDocument) {
            if (localState.currentDocument.length === 0) {
                // remove the reference text at the beginning of notes
                const colonIndex = text.indexOf(':');
                if (/^[0-9]{1,3},[0-9]{1,3}:$/.test(text.slice(0, colonIndex + 1))) {
                    const remainingText = text.slice(colonIndex + 1).trim();
                    if (!remainingText) return;
                    else newPhrase.content = remainingText;
                }
            }

            // TODO: parse for bible references and link them

            localState.currentDocument.push(newPhrase);
        } else {
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
                        const phraseText = textByNotes[i].trim();
                        if (phraseText) {
                            const phrase: IBibleContentPhraseForInput = {
                                ...numbers,
                                type: 'phrase',
                                content: phraseText
                            };
                            if (punctuationChars.indexOf(phraseText.slice(0, 1)) !== -1)
                                phrase.skipSpace = 'before';
                            localState.currentContentGroup.push(phrase);
                        }
                    } else {
                        // RADAR: it would be nicer if the note would not in every case only be
                        //        attached to the word directly before the note marker. the notes
                        //        in the NeÜ actually sometimes give a hint to what they are exactly
                        //        referring to by putting this text at the beginning in <em> tags.
                        //        However in order to use this, we would need to look ahead from a
                        //        parsing point of view, which we can't. This isn't trivial to solve
                        //        if at all possible (with reasonable effort), so we stick with the
                        //        "last word approach" for now.

                        // last word should get a note (if index is -1 it gets 0 which is correct)
                        let lastWordIndex = textByNotes[i].lastIndexOf(' ') + 1;
                        if (lastWordIndex > 0) {
                            const startingText = textByNotes[i].slice(0, lastWordIndex - 1).trim();
                            if (startingText) {
                                const phrase: IBibleContentPhraseForInput = {
                                    ...numbers,
                                    type: 'phrase',
                                    content: startingText
                                };
                                if (punctuationChars.indexOf(startingText.slice(0, 1)) !== -1)
                                    phrase.skipSpace = 'before';
                                localState.currentContentGroup.push(phrase);
                            }
                        }
                        const textWithNote = textByNotes[i].slice(lastWordIndex).trim();
                        const phraseWithPendingNote: IBibleContentPhraseForInput = {
                            ...numbers,
                            type: 'phrase',
                            content: textWithNote
                        };
                        if (punctuationChars.indexOf(textWithNote.slice(0, 1)) !== -1)
                            phraseWithPendingNote.skipSpace = 'before';
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

        let groupType: ContentGroupType | undefined;
        if (
            node.nodeName === 'p' ||
            (node.nodeName === 'div' &&
                node.attrs.find(attr => attr.name === 'class' && attr.value === 'e'))
        ) {
            groupType = 'paragraph';
        } else if (node.nodeName === 'b') groupType = 'bold';
        else if (node.nodeName === 'em') groupType = 'emphasis';
        else if (node.nodeName === 'i') groupType = 'italic';

        const childState = {
            ...localState
        };
        let newGroup: DocumentGroup<ContentGroupType> | undefined;
        let newBibleGroup: IBibleContentGroupForInput<ContentGroupType> | undefined;

        // tags that we don't recognize above, have no effect - their child content will be added to
        // the local state
        if (groupType) {
            newGroup = {
                type: 'group',
                groupType,
                contents: []
            };
            newBibleGroup = {
                ...newGroup,
                contents: []
            };

            if (localState.currentDocument) {
                childState.currentDocument = newGroup.contents;
            } else {
                if (node.nodeName === 'p' && hasAttribute(node, 'class', 'einl')) {
                    const titleBibleGroup: IBibleContentGroupForInput<'title'> = {
                        type: 'group',
                        groupType: 'title',
                        contents: []
                    };
                    newBibleGroup.contents.push(titleBibleGroup);
                    childState.currentContentGroup = titleBibleGroup.contents;
                } else if (node.nodeName === 'p' && hasAttribute(node, 'class', 'poet')) {
                    const titlePoetryGroup: IBibleContentGroupForInput<'poetry'> = {
                        type: 'group',
                        groupType: 'poetry',
                        contents: []
                    };
                    newBibleGroup.contents.push(titlePoetryGroup);
                    childState.currentContentGroup = titlePoetryGroup.contents;
                } else {
                    childState.currentContentGroup = newBibleGroup.contents;
                }
            }
        }

        // see comment further down
        const backupCurrentLevel4Section = globalState.currentLevel4Section;

        for (const childNode of node.childNodes) visitNode(childNode, globalState, childState);

        if (localState.currentDocument) {
            if (newGroup && newGroup.contents.length) localState.currentDocument.push(newGroup);
        } else {
            if (newBibleGroup && newBibleGroup.contents.length)
                localState.currentContentGroup.push(newBibleGroup);

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
