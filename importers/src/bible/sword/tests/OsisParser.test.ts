import { IBibleContent } from '@bible-engine/core';
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

    describe('Strongs number parsing', () => {
        it(`Correctly parses multiple strongs numbers`, () => {
            const VERSE = `
                <w lemma='strong:H0168 strong:H0413 strong:H9033 strong:H9006'>
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
                <w lemma='strong:H0168'>
                    tent
                </w>
            `
            const XML = createSingleVerseXmlObject(VERSE)
            const json: any = getBibleEngineInputFromXML(XML)
            const strongs = json[0].contents[0].strongs
            expect(strongs).toStrictEqual(['H0168'])
        })
    })

    describe('Quotation mark parsing', () => {
        it(`Wraps quote blocks in quotation marks`, () => {
            const VERSE = `
                <w lemma='strong:H0430'>
                    God
                </w>
                <w lemma='strong:H0559'>
                    said
                </w>
                ,
                <q level='1' marker='“'/>
                Let there
                <w lemma='strong:H1961'>
                    be
                </w>
                <w lemma='strong:H0216'>
                    light
                </w>
                ,
                <q eID='01001003.1' level='1' marker='”'/>
                and there was
                <w lemma='strong:H0216 strong:H1961'>
                    light
                </w>
            `
            const EXPECTED_JSON: IBibleContent[] = [
                {
                    type: 'section',
                    contents: [
                        {
                            type: 'phrase',
                            content: 'God',
                            versionChapterNum: 1,
                            versionVerseNum: 1,
                            strongs: [
                                'H0430'
                            ]
                        },
                        {
                            type: 'phrase',
                            content: 'said,',
                            versionChapterNum: 1,
                            versionVerseNum: 1,
                            strongs: [
                                'H0559'
                            ]
                        },
                        {
                            type: 'phrase',
                            content: '“Let there',
                            versionChapterNum: 1,
                            versionVerseNum: 1
                        },
                        {
                            type: 'phrase',
                            content: 'be',
                            versionChapterNum: 1,
                            versionVerseNum: 1,
                            strongs: [
                                'H1961'
                            ]
                        },
                        {
                            type: 'phrase',
                            content: 'light,”',
                            versionChapterNum: 1,
                            versionVerseNum: 1,
                            strongs: [
                                'H0216'
                            ]
                        },
                        {
                            type: 'phrase',
                            content: 'and there was',
                            versionChapterNum: 1,
                            versionVerseNum: 1
                        },
                        {
                            type: 'phrase',
                            content: 'light',
                            versionChapterNum: 1,
                            versionVerseNum: 1,
                            strongs: [
                                'H0216',
                                'H1961'
                            ]
                        }
                    ]
                }
            ]
            const XML = createSingleVerseXmlObject(VERSE)
            const json: any = getBibleEngineInputFromXML(XML)
            expect(json).toStrictEqual(EXPECTED_JSON)
        })
    })


})
