const wordGen = require('random-words');

import { BibleEngine } from './classes/BibleEngine.class';
import {
    BiblePhrase,
    BibleNote,
    IBibleSectionWithContent,
    BibleVersion,
    BibleCrossReference
} from './entities';
import { getOsisIdFromBookGenericId } from './data/bibleMeta';

const sqlBible = new BibleEngine({
    type: 'sqlite',
    database: 'bible.db'
});

export const genDb = async () => {
    const esvVersion = await sqlBible.addVersion(
        new BibleVersion({
            version: 'ESV',
            description: 'English Standard Bible',
            language: 'en-US'
        })
    );
    for (let bookNum = 1; bookNum <= 2; bookNum++) {
        const paragraphs: IBibleSectionWithContent[] = [];
        for (let chapter = 1; chapter <= 15; chapter++) {
            for (let paragraph = 0; paragraph < 5; paragraph++) {
                console.log(
                    'adding book ' +
                        bookNum +
                        ' and chapter ' +
                        chapter +
                        ' and paragraph ' +
                        (paragraph + 1)
                );

                let phrases = [];
                for (let verse = paragraph * 5 + 1; verse <= (paragraph + 1) * 5; verse++) {
                    for (let phraseIdx = 1; phraseIdx <= 22; phraseIdx++) {
                        const phrase = new BiblePhrase({
                            bookOsisId: getOsisIdFromBookGenericId(bookNum),
                            versionChapterNum: chapter,
                            versionVerseNum: verse,
                            versionId: esvVersion.id,
                            text: wordGen({ min: 1, max: 2, join: ' ' }),
                            notes:
                                verse % 7 === 0 && phraseIdx === 1
                                    ? [
                                          new BibleNote({
                                              phrases: [
                                                  {
                                                      text: wordGen({ min: 1, max: 30, join: ' ' })
                                                  }
                                              ]
                                          })
                                      ]
                                    : undefined,
                            bold: true,
                            italic: false,
                            indentLevel: 0,
                            quoteLevel: 0,
                            strong: 'G' + phraseIdx * verse,
                            crossReferences:
                                verse % 5 === 0 && phraseIdx === 1
                                    ? [
                                          new BibleCrossReference({
                                              versionId: esvVersion.id,
                                              bookOsisId: 'Gen',
                                              versionChapterNum: 1
                                          })
                                      ]
                                    : undefined
                        });
                        phrases.push(phrase);
                    }
                }
                paragraphs.push({ level: 0, content: { phrases, type: 'phrases' } });
            }
        }
        await sqlBible.addBookWithContent({
            versionId: esvVersion.id,
            number: bookNum,
            osisId: getOsisIdFromBookGenericId(bookNum),
            title: wordGen({ min: 1, max: 3, join: ' ' }),
            type: bookNum < 40 ? 'ot' : 'nt',
            content: { type: 'sections', sections: paragraphs }
        });
    }

    sqlBible.finalizeVersion(esvVersion.id);
};

export const getData = async () => {
    const output = await sqlBible.getFullDataForReferenceRange({
        versionId: 1,
        bookOsisId: 'Gen',
        versionChapterNum: 1,
        versionVerseNum: 5
    });
    console.dir(output, { depth: null });
};

const run = async () => {
    await genDb();
    getData();
};

run();
