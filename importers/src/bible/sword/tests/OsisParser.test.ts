import { getBibleEngineInputFromXML } from '../src/OsisParser';
import { ChapterXML } from '../src/types';

describe('OsisParser', () => {
    const psalmsXML: ChapterXML = require('./Psa23EsvXmlResult.json');

    const createSingleVerseXmlObject = (text: string): ChapterXML[] => ([
        {
            intro: '',
            verses: [{
                text,
                verse: 1
            }]
        }
    ])

    test('footnote associated with phrase that comes before, not after', async () => {
        const psalm23verse2 = [psalmsXML.verses[1]];
        const bookJson = getBibleEngineInputFromXML([{ intro: '', verses: psalm23verse2 }]);
        const footnoteText = 'waters of rest';
        expect(JSON.stringify(bookJson)).toEqual(expect.stringContaining(footnoteText));
    });

    test('section header is included in psalms', () => {
        const bookJson = getBibleEngineInputFromXML([{ intro: '', verses: psalmsXML.verses }]);
        const sectionHeader = 'The LORD Is My Shepherd';
        expect(JSON.stringify(bookJson)).toEqual(expect.stringContaining(sectionHeader));
    });

    test('psalm title is included', () => {
        const bookJson = getBibleEngineInputFromXML([{ intro: '', verses: psalmsXML.verses }]);
        let titleGroupExists = false;
        const queue = [bookJson[0]];
        while (queue.length) {
            const top: any = queue.pop();
            if (top['groupType'] === 'title') {
                titleGroupExists = true;
                return;
            }
            if ('contents' in top) {
                queue.push(...top['contents']);
            }
        }
        const partOfPsalmTitle = 'David';
        expect(titleGroupExists).toBe(true);
        expect(JSON.stringify(bookJson)).toEqual(expect.stringContaining(partOfPsalmTitle));
    });

    describe('Chinese Union Version Simplified with Strongs', () => {
        const genesisXml: ChapterXML = require('./Gen1CuvXmlResult.json');
        test('nonempty content returned', () => {
            const bookJson = getBibleEngineInputFromXML([{ intro: '', verses: genesisXml.verses }]);
            expect(bookJson.length).toBeGreaterThan(0);
        });
    });

    it(`Correctly parses multiple strongs numbers`, () => {
        const VERSE = `
            <w lemma="strong:H0168 strong:H0413 strong:H9033 strong:H9006">
                tent
            </w>
        `
        const XML = createSingleVerseXmlObject(VERSE)
        const json: any = getBibleEngineInputFromXML(XML)
        const strongs = json[0].contents[0].strongs
        expect(strongs).toStrictEqual(['H0168', 'H0413', 'H9033', 'H9006'])
    })
    it(`Correctly parses a single strongs number`, () => {
        const VERSE = `
            <w lemma="strong:H0168">
                tent
            </w>
        `
        const XML = createSingleVerseXmlObject(VERSE)
        const json: any = getBibleEngineInputFromXML(XML)
        const strongs = json[0].contents[0].strongs
        expect(strongs).toStrictEqual(['H0168'])
    })
})
