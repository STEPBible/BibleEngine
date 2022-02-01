import { TreeElement, DefaultNode } from './models/parse5';
import {
    BookWithContentForInput,
    DocumentRoot,
    DocumentSection,
    DocumentPhrase,
    DocumentGroup,
    DocumentElement,
    ContentGroupType,
    BibleReferenceParser,
    getReferencesFromText,
    IBibleContentSection,
    IBibleContentPhrase,
    IBibleContent,
    IBibleContentGroup,
    IBibleReferenceRangeQuery,
} from '@bible-engine/core';
import { startsWithPunctuationChar } from '../../shared/helpers.functions';

export const getAttribute = (node: TreeElement, name: string) => {
    const attr = node.attrs.find((_attr) => _attr.name === name);
    if (attr) return attr.value;
    else return null;
};

export const getTextFromNode = (node: DefaultNode) => {
    if (node.nodeName === '#text') return node.value;
    else {
        let text = '';
        for (const childNode of node.childNodes) text += getTextFromNode(childNode);
        return text.trim();
    }
};

export const hasAttribute = (node: TreeElement, name: string, value?: string) =>
    node.attrs.find((attr) => attr.name === name && (!value || attr.value === value));

export const visitNode = (
    node: DefaultNode,
    globalState: {
        versionUid: string;
        bookData?: BookWithContentForInput;
        refParser: BibleReferenceParser;
        currentChapterNumber?: number;
        currentBackupChapterNumber?: number;
        currentVerseNumber?: number;
        currentLevel1Section?: IBibleContentSection;
        currentLevel2Section?: IBibleContentSection;
        currentLevel3Section?: IBibleContentSection;
        currentLevel4Section?: IBibleContentSection;
        currentLinegroup?: IBibleContentGroup<'lineGroup'>;
        contentWithPendingNotes?: (IBibleContentPhrase | IBibleContentSection)[];
        documentRoot?: DocumentRoot;
        currentDocumentLevel1Section?: DocumentSection;
        currentDocumentLevel2Section?: DocumentSection;
        currentDocumentLevel3Section?: DocumentSection;
    },
    localState: {
        currentDocument?: DocumentElement[];
        currentContentGroup?: IBibleContent[];
    }
) => {
    if (node.nodeName === 'h1' && globalState.bookData) {
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

        if (localState.currentDocument && globalState.documentRoot) {
            const newSection: DocumentSection = {
                type: 'section',
                title: sectionTitle,
                contents: [],
            };

            // since sections are not hierarchical in HTML (but only indicated by heading tags), we
            // need to keep track of the level of sections to know where we need to stay in the
            // level or go up / down one level. we have some additional complexity here since
            // sections level are sometimes skipped
            if (node.nodeName === 'h2') {
                // top level section always go to the root of the document
                globalState.documentRoot.contents.push(newSection);
                globalState.currentDocumentLevel1Section = newSection;
                globalState.currentDocumentLevel2Section = undefined;
                globalState.currentDocumentLevel3Section = undefined;
            } else if (node.nodeName === 'h3') {
                // if there is a skipped level we need to add the section the next higher level
                if (!globalState.currentDocumentLevel1Section) {
                    globalState.documentRoot.contents.push(newSection);
                } else globalState.currentDocumentLevel1Section.contents.push(newSection);
                globalState.currentDocumentLevel2Section = newSection;
                globalState.currentDocumentLevel3Section = undefined;
            } else if (node.nodeName === 'h4') {
                // if there is a skipped level we need to add the section the next higher level
                if (!globalState.currentDocumentLevel2Section) {
                    if (!globalState.currentDocumentLevel1Section) {
                        globalState.documentRoot.contents.push(newSection);
                    } else globalState.currentDocumentLevel1Section.contents.push(newSection);
                } else globalState.currentDocumentLevel2Section.contents.push(newSection);
                globalState.currentDocumentLevel3Section = newSection;
            }

            // add following content to this section
            localState.currentDocument = newSection.contents;
        } else if (globalState.bookData) {
            // in the neÜ-source documents within bible-books (introduction, notes) don't use header
            // tags, in other words: a header tag indicates the start of the bible content
            // => introduction is finished and bible text is starting
            localState.currentDocument = undefined;
            const newSection: IBibleContentSection = {
                type: 'section',
                title: sectionTitle,
                contents: [],
            };

            // look for a note marker in the section title
            if (sectionTitle.indexOf('*') !== -1) {
                sectionTitle = sectionTitle.replace('*', '');
                newSection.title = sectionTitle;
                if (!globalState.contentWithPendingNotes) globalState.contentWithPendingNotes = [];
                globalState.contentWithPendingNotes.push(newSection);
            }

            // since sections are not hierarchical in HTML (but only indicated by heading tags), we
            // need to keep track of the level of sections to know where we need to stay in the
            // level or go up / down one level. we have some additional complexity here since
            // sections level are sometimes skipped
            if (node.nodeName === 'h2') {
                // top level section always go to the root of the document
                globalState.bookData.contents.push(newSection);

                globalState.currentLevel1Section = newSection;
                globalState.currentLevel2Section = undefined;
                globalState.currentLevel3Section = undefined;
                globalState.currentLevel4Section = undefined;
            } else if (node.nodeName === 'h3') {
                // if there is a skipped level we need to add the section the next higher level
                if (!globalState.currentLevel1Section) {
                    globalState.bookData.contents.push(newSection);
                } else globalState.currentLevel1Section.contents.push(newSection);
                globalState.currentLevel2Section = newSection;
                globalState.currentLevel3Section = undefined;
                globalState.currentLevel4Section = undefined;
            } else if (node.nodeName === 'h4') {
                // if there is a skipped level we need to add the section the next higher level
                if (!globalState.currentLevel2Section) {
                    if (!globalState.currentLevel1Section) {
                        globalState.bookData.contents.push(newSection);
                    } else globalState.currentLevel1Section.contents.push(newSection);
                } else globalState.currentLevel2Section.contents.push(newSection);
                globalState.currentLevel3Section = newSection;
                globalState.currentLevel4Section = undefined;
            } else if (node.nodeName === 'span' && hasAttribute(node, 'class', 'u2')) {
                // if there is a skipped level we need to add the section the next higher level
                if (!globalState.currentLevel3Section) {
                    if (!globalState.currentLevel2Section) {
                        if (!globalState.currentLevel1Section) {
                            globalState.bookData.contents.push(newSection);
                        } else globalState.currentLevel1Section.contents.push(newSection);
                    } else globalState.currentLevel2Section.contents.push(newSection);
                } else globalState.currentLevel3Section.contents.push(newSection);
                globalState.currentLevel4Section = newSection;
            }

            // add following content to this section
            localState.currentContentGroup = newSection.contents;
        } else throw new Error(`can't determine container for heading`);
    } else if (
        globalState.bookData &&
        !localState.currentDocument &&
        node.nodeName === 'span' &&
        hasAttribute(node, 'class', 'kap')
    ) {
        globalState.currentChapterNumber = +getTextFromNode(node);
        // if a new chapter is set, it overwrites the backup number
        if (globalState.currentBackupChapterNumber)
            globalState.currentBackupChapterNumber = undefined;
    } else if (
        globalState.bookData &&
        !localState.currentDocument &&
        node.nodeName === 'span' &&
        hasAttribute(node, 'class', 'vers')
    ) {
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
    } else if (globalState.bookData && node.nodeName === 'p' && hasAttribute(node, 'class', 'u0')) {
        if (!localState.currentDocument)
            throw new Error(`we expect class=u0 to only occur in a book introduction`);

        const newSection: DocumentSection = {
            type: 'section',
            title: getTextFromNode(node),
            contents: [],
        };
        localState.currentDocument.push(newSection);
        localState.currentDocument = newSection.contents;
    } else if (globalState.bookData && node.nodeName === 'p' && hasAttribute(node, 'class', 'u1')) {
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
    } else if (globalState.bookData && node.nodeName === 'p' && hasAttribute(node, 'class', 'u3')) {
        if (!localState.currentDocument)
            throw new Error(`we expect class=u3 to only occur in a book introduction`);
        // skip the outline
        return;
    } else if (!globalState.bookData && localState.currentDocument && node.nodeName === 'ul') {
        // skip the document outline
        return;
    } else if (
        globalState.bookData &&
        node.nodeName === 'div' &&
        hasAttribute(node, 'class', 'fn')
    ) {
        const newNote: DocumentRoot = { type: 'root', contents: [] };
        const childState = {
            ...localState,
            currentDocument: newNote.contents,
        };
        for (const childNode of node.childNodes) visitNode(childNode, globalState, childState);
        const firstContentWithPendingNote = globalState.contentWithPendingNotes
            ? globalState.contentWithPendingNotes.shift()
            : undefined;

        const noteText = getTextFromNode(node);

        if (!firstContentWithPendingNote)
            throw new Error(`no content with pending note: ${noteText}`);

        if (firstContentWithPendingNote.type === 'section') {
            firstContentWithPendingNote.description = newNote;
        } else {
            // it's a phrase

            const expectedNoteReference =
                `${firstContentWithPendingNote.versionChapterNum},` +
                `${firstContentWithPendingNote.versionVerseNum}:`;

            if (noteText.indexOf(expectedNoteReference) !== 0)
                throw new Error(
                    `error matching note (${noteText}) to next pending phrase: ` +
                        `${expectedNoteReference}`
                );

            if (
                newNote.contents.length === 1 &&
                newNote.contents[0].type === 'phrase' &&
                (<DocumentPhrase>newNote.contents[0]).bibleReference
            ) {
                // if the note only consists of one phrase with a bible reference, we add it as a
                // cross reference instead
                if (!firstContentWithPendingNote.crossReferences)
                    firstContentWithPendingNote.crossReferences = [];
                firstContentWithPendingNote.crossReferences.push({
                    key: '*',
                    label: (<DocumentPhrase>newNote.contents[0]).content,
                    range: (<DocumentPhrase>newNote.contents[0]).bibleReference!,
                });
            } else {
                if (!firstContentWithPendingNote.notes) firstContentWithPendingNote.notes = [];
                firstContentWithPendingNote.notes.push({ content: newNote });
            }
        }
    } else if (node.nodeName === '#text') {
        const text = node.value
            .trim()
            // .replace(/\r?\n|\r/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .replace('[SELA]', '♪');
        if (!text) return;

        if (localState.currentDocument) {
            const newPhrase: DocumentPhrase = {
                type: 'phrase',
                content: text,
            };
            if (startsWithPunctuationChar(text)) newPhrase.skipSpace = 'before';

            // if this is a bible-note:
            if (
                globalState.bookData &&
                globalState.currentChapterNumber &&
                localState.currentDocument.length === 0
            ) {
                // remove the reference text at the beginning of notes
                const colonIndex = text.indexOf(':');
                if (/^[0-9]{1,3},[0-9]{1,3}:$/.test(text.slice(0, colonIndex + 1))) {
                    const remainingText = text.slice(colonIndex + 1).trim();
                    if (!remainingText) return;
                    else newPhrase.content = remainingText;
                }
            }

            const localRefRegex = /(Kapitel|V\.|Vers) ([0-9,.\-–; ]|(und|bis|Kapitel|V\.|Vers))+/g;
            const textReferences = getReferencesFromText(
                globalState.refParser,
                newPhrase.content,
                globalState.bookData
                    ? {
                          bookOsisId: globalState.bookData.book.osisId,
                          chapterNum: globalState.currentChapterNumber,
                          localRefMatcher: localRefRegex,
                      }
                    : undefined
            );

            if (textReferences.length) {
                // sort reference by starting indices
                textReferences.sort((a, b) => a.indices[0] - b.indices[0]);

                let currentIndex = 0;
                for (const ref of textReferences) {
                    const refText = newPhrase.content.slice(ref.indices[0], ref.indices[1]).trim();

                    if (currentIndex > ref.indices[0])
                        throw new Error(
                            `reference entities overlap at ${globalState.currentChapterNumber}:` +
                                `${globalState.currentVerseNumber} with refText ${refText} ` +
                                `between currentIndex ${currentIndex} and indices[0] ` +
                                `${ref.indices[0]}`
                        );

                    if (currentIndex < ref.indices[0]) {
                        // create phrase from text at range currentIndex to start of reference
                        const fillText = newPhrase.content
                            .slice(currentIndex, ref.indices[0])
                            .trim();
                        if (fillText) {
                            const fillPhrase: DocumentPhrase = {
                                type: 'phrase',
                                content: fillText,
                            };
                            if (startsWithPunctuationChar(fillText))
                                fillPhrase.skipSpace = 'before';
                            localState.currentDocument.push(fillPhrase);
                        }
                    }

                    // create phrase from reference with crossRef attached to it
                    //
                    // This is reference is "hard-coded" into the serialized document in the DB, and
                    // we can only use the version numbmers here (normalization is not available at
                    // this point). In order to be able to use this data across installations (e.g.
                    // in a client-server use-case), we use the universal versionUid instead of
                    // versionId.
                    const bibleReference: IBibleReferenceRangeQuery = {
                        bookOsisId: ref.start.b,
                        versionUid: globalState.versionUid,
                        versionChapterNum: ref.start.c,
                    };
                    if (
                        ref.type === 'v' ||
                        ref.type === 'cv' ||
                        ref.type === 'bcv' ||
                        ref.type === 'integer' ||
                        (ref.type === 'range' && ref.start.type !== 'c' && ref.start.type !== 'bc')
                    ) {
                        bibleReference.versionVerseNum = ref.start.v;
                        if (ref.start.v !== ref.end.v || ref.start.c !== ref.end.c)
                            bibleReference.versionVerseEndNum = ref.end.v;
                    }
                    if (ref.start.c !== ref.end.c) {
                        bibleReference.versionChapterEndNum = ref.end.c;
                    }
                    const refPhrase: DocumentPhrase = {
                        type: 'phrase',
                        content: refText,
                        bibleReference,
                    };
                    if (startsWithPunctuationChar(refText)) refPhrase.skipSpace = 'before';
                    localState.currentDocument.push(refPhrase);

                    currentIndex = ref.indices[1];
                }

                if (currentIndex <= newPhrase.content.length - 1) {
                    // create phrase from text after last reference
                    const endText = newPhrase.content.slice(currentIndex).trim();
                    if (endText) {
                        const endPhrase: DocumentPhrase = {
                            type: 'phrase',
                            content: endText,
                        };
                        if (startsWithPunctuationChar(endText)) endPhrase.skipSpace = 'before';
                        localState.currentDocument.push(endPhrase);
                    }
                }
            } else localState.currentDocument.push(newPhrase);
        } else if (globalState.bookData && localState.currentContentGroup) {
            if (!globalState.currentChapterNumber || !globalState.currentVerseNumber)
                throw new Error(
                    `verse numbers are missing in node: <${node.nodeName}>${text}</${node.nodeName}> / state: ${globalState.currentChapterNumber}:${globalState.currentVerseNumber}`
                );
            const numbers = {
                versionChapterNum: globalState.currentChapterNumber,
                versionVerseNum: globalState.currentVerseNumber,
                versionSubverseNum: 1,
            };

            const textByNotes = text.split('*');

            if (textByNotes.length > 1) {
                for (let i = 0; i < textByNotes.length; i++) {
                    if (i === textByNotes.length - 1) {
                        const phraseText = textByNotes[i].trim();
                        if (phraseText) {
                            const phrase: IBibleContentPhrase = {
                                ...numbers,
                                type: 'phrase',
                                content: phraseText,
                            };
                            if (startsWithPunctuationChar(phraseText)) phrase.skipSpace = 'before';
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
                                const phrase: IBibleContentPhrase = {
                                    ...numbers,
                                    type: 'phrase',
                                    content: startingText,
                                };
                                if (startsWithPunctuationChar(startingText))
                                    phrase.skipSpace = 'before';
                                localState.currentContentGroup.push(phrase);
                            }
                        }
                        const textWithNote = textByNotes[i].slice(lastWordIndex).trim();
                        const phraseWithPendingNote: IBibleContentPhrase = {
                            ...numbers,
                            type: 'phrase',
                            content: textWithNote,
                        };
                        // there are cases when `textWithNote` is an empty string (i.e. when right
                        // after a group node)
                        if (!textWithNote || startsWithPunctuationChar(textWithNote))
                            phraseWithPendingNote.skipSpace = 'before';
                        localState.currentContentGroup.push(phraseWithPendingNote);
                        if (!globalState.contentWithPendingNotes)
                            globalState.contentWithPendingNotes = [];
                        globalState.contentWithPendingNotes.push(phraseWithPendingNote);
                    }
                }
            } else {
                const newBiblePhrase: IBibleContentPhrase = {
                    type: 'phrase',
                    content: text,
                    ...numbers,
                };
                if (startsWithPunctuationChar(text)) newBiblePhrase.skipSpace = 'before';

                localState.currentContentGroup.push(newBiblePhrase);
            }
        } else throw new Error(`can't find container for text node`);
    } else {
        // in cases where there are no sections, a chapter marker indicates that introduction is
        // finished and bible text is starting
        if (localState.currentDocument && node.nodeName === 'p' && hasAttribute(node, 'id')) {
            localState.currentDocument = undefined;
        }

        if (node.nodeName === 'br') {
            const currentContainer = localState.currentDocument
                ? localState.currentDocument
                : localState.currentContentGroup;
            const lastElement =
                currentContainer && currentContainer.length
                    ? currentContainer[currentContainer.length - 1]
                    : null;
            if (!lastElement) return;

            if (lastElement && lastElement.type === 'phrase') {
                lastElement.linebreak = true;
            } else if (
                lastElement.type === 'group' &&
                lastElement.contents.length === 1 &&
                lastElement.contents[0].type === 'phrase'
            ) {
                const lastPhrase = lastElement.contents[0] as IBibleContentPhrase;
                lastPhrase.linebreak = true;
            } else {
                // we put this here to check if this case exist in the source files - in case
                // not, we can safe the effort to implement it
                throw new Error(
                    `can't attach linebreak - last element is not a phrase: ${lastElement.type}`
                );
            }
            return;
        }

        let groupType: ContentGroupType | undefined;
        if (
            node.nodeName === 'p' ||
            (node.nodeName === 'div' && hasAttribute(node, 'class', 'e'))
        ) {
            groupType = 'paragraph';
        } else if (
            node.nodeName === 'a' &&
            hasAttribute(node, 'href') &&
            getAttribute(node, 'href')!.indexOf('http') === 0
        )
            groupType = 'link';
        else if (node.nodeName === 'b') groupType = 'bold';
        else if (
            node.nodeName === 'em' ||
            // we removed all reference link-tags from the source, the remaining ones we convert to
            // an emphasis style (since we have nothing to link to in BibleEngine, but the linked
            // text still represents some kind of entity, that we emphasis in this way)
            node.nodeName === 'a'
        )
            groupType = 'emphasis';
        else if (node.nodeName === 'i') groupType = 'italic';
        else if (node.nodeName === 'span' && hasAttribute(node, 'class', 'sela')) {
            groupType = 'sela';
        } else if (
            // if parsing a document file, the following tag is not a note but a rather an indent
            !globalState.bookData &&
            node.nodeName === 'div' &&
            hasAttribute(node, 'class', 'fn')
        ) {
            groupType = 'indent';
        } else if (node.nodeName === 'l') groupType = 'line';

        const childState = {
            ...localState,
        };
        let newGroup: DocumentGroup<ContentGroupType> | undefined;
        let newBibleGroup: IBibleContentGroup<ContentGroupType> | undefined;

        // tags that we don't recognize above, have no effect - their child content will be added to
        // the local state
        if (groupType) {
            newGroup = {
                type: 'group',
                groupType,
                contents: [],
            };
            newBibleGroup = {
                ...newGroup,
                contents: [],
            };

            if (groupType === 'line') {
                newBibleGroup.modifier = (globalState.currentLinegroup?.contents.length || 0) + 1;
            }

            if (localState.currentDocument) {
                if (groupType === 'link') newGroup.modifier = getAttribute(node, 'href')!;
                childState.currentDocument = newGroup.contents;
            } else {
                if (node.nodeName === 'p' && hasAttribute(node, 'class', 'einl')) {
                    const titleBibleGroup: IBibleContentGroup<'title'> = {
                        type: 'group',
                        groupType: 'title',
                        contents: [],
                    };
                    newBibleGroup.contents.push(titleBibleGroup);
                    childState.currentContentGroup = titleBibleGroup.contents;
                } else if (node.nodeName === 'p' && hasAttribute(node, 'class', 'poet')) {
                    const lineGroupBibleGroup: IBibleContentGroup<'lineGroup'> = {
                        type: 'group',
                        groupType: 'lineGroup',
                        contents: [],
                    };
                    globalState.currentLinegroup = lineGroupBibleGroup;
                    newBibleGroup.contents.push(lineGroupBibleGroup);
                    childState.currentContentGroup = lineGroupBibleGroup.contents;
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
        } else if (globalState.bookData && localState.currentContentGroup) {
            if (newBibleGroup && newBibleGroup.contents.length)
                localState.currentContentGroup.push(newBibleGroup);

            // we need to check for a special case, when a level 4 section is started within a
            // ContentGroup. due to the way the HTML is structured for the NEUE (Ps119, Hos) we
            // have to manually pull this section to the localState
            if (backupCurrentLevel4Section !== globalState.currentLevel4Section) {
                if (globalState.currentLevel4Section)
                    localState.currentContentGroup = globalState.currentLevel4Section.contents;
            }
        } else throw new Error(`can't find container for group node`);
    }
};
