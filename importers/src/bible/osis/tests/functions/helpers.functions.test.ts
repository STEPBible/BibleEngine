import {
    printCompactContainerStack,
    printFullContainerStack,
    getErrorMessageWithContextStackTrace,
} from '../../functions/helpers.functions';
import { ParserContext } from '../../types';

const CONTEXT: ParserContext = {
    books: [],
    sectionStack: [],
    skipClosingTags: [],
    hierarchicalTagStack: [],
    contentContainerStack: [
        { type: 'root', contents: [] },
        { type: 'section', level: 0, title: 'The Creation of the World', contents: [] },
        { type: 'group', groupType: 'paragraph', contents: [] },
    ],
    version: {
        uid: 'ESV',
        title: 'English Standard Version',
        chapterVerseSeparator: ':',
        language: 'en',
    },
    currentBook: {
        osisId: 'Gen',
        type: 'ot',
        title: 'Genesis',
        abbreviation: 'Gen',
        number: 0,
    },
    currentChapter: 1,
    currentVerse: 1,
};

describe('getPrintedContainerStack', () => {
    it('prints out the context, including specific group types', () => {
        const print = printCompactContainerStack(CONTEXT.contentContainerStack);
        expect(print).toBe('root > section > paragraph');
    });
});

describe('getContainerStackTrace', () => {
    it('prints out a more full-fledged version of the container stack', () => {
        const print = printFullContainerStack(CONTEXT.contentContainerStack);
        expect(print).toBe(
            `
  root
    The Creation of the World
      paragraph
`
        );
    });
});

describe('getErrorMessageWithContextStackTrace', () => {
    it('prints a message with context and a stack trace', () => {
        const print = getErrorMessageWithContextStackTrace('something cool happened', CONTEXT);
        expect(print).toBe(
            `something cool happened in Gen 1:1

container stack:
  root
    The Creation of the World
      paragraph
`
        );
    });
});
