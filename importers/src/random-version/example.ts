import 'isomorphic-fetch';
import { resolve } from 'path';

import {
    BibleEngine,
    BibleVersionEntity,
    getOsisIdFromBookGenericId,
    IBibleContentSection,
    IBibleContentGroup,
    IBibleContentPhrase
} from '@bible-engine/core';

const wordGen = require('random-words');

const dirProjectRoot = resolve(__dirname + '/../../..');

const sqlBible = new BibleEngine(
    {
        type: 'sqlite',
        database: `${dirProjectRoot}/output/bible.db`
    },
    {
        url: 'http://localhost:3456'
    }
);

export const genDb = async () => {
    const esvVersion = await sqlBible.addVersion(
        new BibleVersionEntity({
            uid: 'ESV',
            title: 'English Standard Bible',
            language: 'en-US',
            chapterVerseSeparator: ':'
        })
    );
    for (let bookNum = 1; bookNum <= 66; bookNum++) {
        console.log(
            'adding book ' + bookNum
            // ' and chapter ' +
            // chapter +
            // ' and paragraph ' +
            // (paragraph + 1)
        );
        const sectionsLevel1: IBibleContentSection[] = [];
        for (let sectionLevel1Num = 1; sectionLevel1Num <= 5; sectionLevel1Num++) {
            const sectionsLevel2: IBibleContentSection[] = [];
            // three chapters in each of the 5 sectionLevel1
            for (let chapterModifier = 1; chapterModifier <= 3; chapterModifier++) {
                const chapter = (sectionLevel1Num - 1) * 3 + chapterModifier;
                let verse = 0;
                // three sectionsLevel2 in each sectionLevel1
                for (let sectionLevel2Num = 1; sectionLevel2Num <= 3; sectionLevel2Num++) {
                    const paragraphs: IBibleContentGroup<'paragraph'>[] = [];
                    // two paragraphs in each sectionLevel2
                    for (let paragraphNum = 0; paragraphNum < 2; paragraphNum++) {
                        let phrases = [];
                        // 5 verses in each paragraph
                        for (let verseNum = 0; verseNum < 5; verseNum++) {
                            verse++;
                            for (let phraseIdx = 1; phraseIdx <= 22; phraseIdx++) {
                                const phrase: IBibleContentPhrase = {
                                    type: 'phrase',
                                    versionChapterNum: chapter,
                                    versionVerseNum: verse,
                                    content: wordGen({ min: 1, max: 2, join: ' ' }),
                                    notes:
                                        verse % 7 === 0 && phraseIdx === 1
                                            ? [
                                                  {
                                                      type: 'study',
                                                      key: '1',
                                                      content: {
                                                          type: 'root',
                                                          contents: [
                                                              {
                                                                  type: 'phrase',
                                                                  content: wordGen({
                                                                      min: 1,
                                                                      max: 30,
                                                                      join: ' '
                                                                  })
                                                              }
                                                          ]
                                                      }
                                                  }
                                              ]
                                            : undefined,
                                    strongs: ['G' + phraseIdx * verse],
                                    crossReferences:
                                        verse % 5 === 0 && phraseIdx === 1
                                            ? [
                                                  {
                                                      key: 'a',
                                                      range: {
                                                          bookOsisId: 'Exod',
                                                          versionChapterNum: 1,
                                                          versionVerseNum: 5,
                                                          versionVerseEndNum: 7
                                                      }
                                                  }
                                              ]
                                            : undefined
                                };
                                phrases.push(phrase);
                            }
                        }
                        paragraphs.push({
                            type: 'group',
                            groupType: 'paragraph',
                            contents: phrases
                        });
                    }
                    sectionsLevel2.push({
                        type: 'section',
                        contents: paragraphs
                    });
                }
            }
            sectionsLevel1.push({
                type: 'section',
                contents: sectionsLevel2
            });
        }

        await sqlBible.addBookWithContent(esvVersion, {
            book: {
                number: bookNum,
                osisId: getOsisIdFromBookGenericId(bookNum),
                abbreviation: wordGen({ min: 1, max: 1, join: ' ' }),
                title: wordGen({ min: 1, max: 3, join: ' ' }),
                type: bookNum < 40 ? 'ot' : 'nt'
            },
            contents: sectionsLevel1
        });
    }

    sqlBible.finalizeVersion(esvVersion.id);
};

export const getData = async () => {
    const output = await sqlBible.getFullDataForReferenceRange(
        {
            versionUid: 'ESV',
            bookOsisId: 'Gen',
            versionChapterNum: 1,
            versionChapterEndNum: 4,
            versionVerseNum: 4,
            versionVerseEndNum: 6
        },
        true
    );
    console.dir(output, { depth: 6 });

    // const versionData = await sqlBible.getVersionFullData(1);
    // console.dir(versionData.bookData[0].content, { depth: 7 });

    // fs.writeFile(
    //     `${versionData.version.version}.beifz`,
    //     deflate(JSON.stringify(versionData), { to: 'string' }),
    //     (err: any) => console.log(err)
    // );

    // fs.writeFile(`${versionData.version.version}.beif`, JSON.stringify(versionData));
};

const run = async () => {
    await genDb();
    getData();
};

run();
