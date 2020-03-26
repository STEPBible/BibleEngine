import { BibleEngineImporter } from '../../shared/Importer.interface';
import { resolve } from 'path';

import {
    DocumentRoot,
    DocumentGroup,
    DocumentPhrase,
    DocumentElement,
    IDictionaryEntry
} from '@bible-engine/core';

const fs = require('fs');

const dirProjectRoot = resolve(__dirname + '/../..');

enum LexiconEntryType {
    STRONGS_NUM = '@StrNo',
    GLOSS = '@StepGloss',
    ORIGINAL_WORD = '@STEPUnicodeAccented',
    HEBREW_TRANSLITERATION = '@STEPTranslitOfStr',
    GREEK_TRANSLITERATION = '@StrTranslit',
    HEBREW_DEFINITION = '@BdbMedDef',
    GREEK_SHORT_DEFINITION = '@MounceShortDef',
    GREEK_DEFINITION = '@MounceMedDef',
    GREEK_LSJ_DEFINITION = '@FLsjDefs'
}

export class StepLexiconImporter extends BibleEngineImporter {
    async import() {
        // Note: You'll need to remove all the comments at the top of the txt file.
        const hebrewLexiconLines = fs
            .readFileSync(`${dirProjectRoot}/stepdata/step-lexicon/data/hebrew_lexicon.txt`)
            .toString()
            .split('\n');

        const hebrewLexiconEntries = getStrongsContent(hebrewLexiconLines);
        const hebrewDictionaryEntries = getDictionaryEntries(
            hebrewLexiconEntries,
            LexiconEntryType.HEBREW_DEFINITION
        );
        for (let entry of hebrewDictionaryEntries) {
            console.log(entry.strong);
            await this.bibleEngine.addDictionaryEntry(entry);
        }

        const greekLexiconLines = fs
            .readFileSync(`${dirProjectRoot}/stepdata/step-lexicon/data/greek_lexicon.txt`)
            .toString()
            .split('\n');

        const greekLexiconEntries = getStrongsContent(greekLexiconLines);
        console.log(Object.values(greekLexiconEntries).length);
        const greekDictionaryEntries = getDictionaryEntries(
            greekLexiconEntries,
            LexiconEntryType.GREEK_DEFINITION
        );

        for (let entry of greekDictionaryEntries) {
            console.log(entry.strong);
            await this.bibleEngine.addDictionaryEntry(entry);
        }
    }

    toString() {
        return 'STEP Greek and Hebrew Lexicons';
    }
}

function isValidContent(line: string) {
    return (
        line &&
        line.split('=').length >= 2 &&
        line.split('=')[1].trim().length &&
        Object.values(LexiconEntryType).includes(line.split('=')[0].trim() as LexiconEntryType)
    );
}

function getStrongsContent(lines: string[]) {
    let currentStrongsNum = '';
    const lexiconEntries: any = lines
        .filter((line: string) => isValidContent(line))
        .reduce((currentLexiconEntries: any, line: string) => {
            const entryType: string = line.split('=')[0].trim();
            const entryValue: string = line
                .split('=')
                .slice(1)
                .join('')
                .trim();
            if (entryType === LexiconEntryType.STRONGS_NUM) {
                currentStrongsNum = entryValue;
                currentLexiconEntries[currentStrongsNum] = {};
                return currentLexiconEntries;
            }
            if (entryType === LexiconEntryType.HEBREW_DEFINITION) {
                const definitions = entryValue.split('<br>').filter(elt => elt);
                currentLexiconEntries[currentStrongsNum][entryType] = definitions;
                return currentLexiconEntries;
            }
            if (
                entryType === LexiconEntryType.GREEK_DEFINITION ||
                entryType === LexiconEntryType.GREEK_SHORT_DEFINITION
            ) {
                currentLexiconEntries[currentStrongsNum][entryType] = entryValue;
                return currentLexiconEntries;
            }
            currentLexiconEntries[currentStrongsNum][entryType] = entryValue;
            return currentLexiconEntries;
        }, {});
    return lexiconEntries;
}

function getHebrewContentStructure(definitions: string[]): DocumentRoot {
    const contents = definitions.map(
        (definition: string): DocumentGroup<'orderedListItem'> => ({
            type: 'group',
            groupType: 'orderedListItem',
            contents: [
                {
                    type: 'phrase',
                    content: definition
                }
            ]
        })
    );
    const content: DocumentRoot = {
        type: 'root',
        contents
    };
    return content;
}

function getStringWithoutXMLTags(str: string) {
    return str.replace(/<(?:.|\n)*?>/gm, '');
}

function getGreekContentStructure(definition: string): DocumentRoot {
    const contents: DocumentElement[] = [];
    definition.split('<b>').forEach((element: string) => {
        const split = element.split('</b>');
        if (split.length > 1) {
            const boldPart = getStringWithoutXMLTags(split[0]);
            const nonBoldPart = getStringWithoutXMLTags(split[1]);
            const boldElement: DocumentGroup<'bold'> = {
                type: 'group',
                groupType: 'bold',
                contents: [
                    {
                        type: 'phrase',
                        content: boldPart
                    }
                ]
            };
            contents.push(boldElement);
            const nonBoldElement: DocumentPhrase = {
                type: 'phrase',
                content: nonBoldPart
            };
            contents.push(nonBoldElement);
            return;
        }
        const nonBoldElement: DocumentPhrase = {
            type: 'phrase',
            content: getStringWithoutXMLTags(element)
        };
        contents.push(nonBoldElement);
    });
    const content: DocumentRoot = {
        type: 'root',
        contents
    };
    return content;
}

function getDictionaryEntries(lexiconEntries: any, dictionary: string): IDictionaryEntry[] {
    const dictionaryEntries: IDictionaryEntry[] = [];
    Object.entries(lexiconEntries).forEach(([strong, entry]) => {
        const lemma: string = (<any>entry)[LexiconEntryType.ORIGINAL_WORD];
        const greekTransliteration: string = (<any>entry)[LexiconEntryType.GREEK_TRANSLITERATION];
        const hebrewTransliteration: string = (<any>entry)[LexiconEntryType.HEBREW_TRANSLITERATION];
        const gloss: string = (<any>entry)[LexiconEntryType.GLOSS];

        const hebrewDefinitions: string[] = (<any>entry)[LexiconEntryType.HEBREW_DEFINITION] || [];

        const greekDefinition: string = (<any>entry)[LexiconEntryType.GREEK_DEFINITION];
        const shortGreekDefinition: string = (<any>entry)[LexiconEntryType.GREEK_SHORT_DEFINITION];

        if (dictionary === LexiconEntryType.HEBREW_DEFINITION) {
            const content = getHebrewContentStructure(hebrewDefinitions);
            const transliteration = hebrewTransliteration;
            const dictionaryEntry: IDictionaryEntry = {
                strong,
                dictionary,
                lemma,
                transliteration,
                gloss,
                content
            };
            dictionaryEntries.push(dictionaryEntry);
            return;
        }
        if (dictionary === LexiconEntryType.GREEK_DEFINITION && greekDefinition) {
            const content = getGreekContentStructure(greekDefinition);
            const transliteration = greekTransliteration;
            const dictionaryEntry: IDictionaryEntry = {
                strong,
                dictionary,
                lemma,
                transliteration,
                gloss,
                content
            };
            dictionaryEntries.push(dictionaryEntry);
        }
        if (dictionary === LexiconEntryType.GREEK_DEFINITION && shortGreekDefinition) {
            const content = getGreekContentStructure(shortGreekDefinition);
            const shortDictionaryName = LexiconEntryType.GREEK_SHORT_DEFINITION;
            const transliteration = greekTransliteration;
            const dictionaryEntry: IDictionaryEntry = {
                strong,
                dictionary: shortDictionaryName,
                lemma,
                transliteration,
                gloss,
                content
            };
            dictionaryEntries.push(dictionaryEntry);
        }
        if (!greekDefinition && !shortGreekDefinition && !hebrewDefinitions.length) {
            const transliteration = greekTransliteration || hebrewTransliteration;
            const dictionaryEntry: IDictionaryEntry = {
                strong,
                dictionary,
                lemma,
                transliteration,
                gloss
            };
            dictionaryEntries.push(dictionaryEntry);
        }
    });
    return dictionaryEntries;
}
