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
    ENGLISH_GLOSS = '@StepGloss',
    SIMPLIFIED_CHINESE_GLOSS = '@zh_Gloss',
    TRADITIONAL_CHINESE_GLOSS = '@zh_tw_Gloss',
    ORIGINAL_WORD = '@STEPUnicodeAccented',
    HEBREW_TRANSLITERATION = '@AcadTransAccented',
    GREEK_TRANSLITERATION = '@StrTranslit',
    PRONUNCIATION = '@StrPronunc',
    HEBREW_DEFINITION = '@BdbMedDef',
    GREEK_SHORT_DEFINITION = '@MounceShortDef',
    GREEK_DEFINITION = '@MounceMedDef',
    SIMPLIFIED_CHINESE_DEFINITION = '@zh_Definition',
    TRADITIONAL_CHINESE_DEFINITION = '@zh_tw_Definition'
}

const HEBREW_DICTIONARIES = [
    LexiconEntryType.HEBREW_DEFINITION,
    LexiconEntryType.SIMPLIFIED_CHINESE_DEFINITION,
    LexiconEntryType.TRADITIONAL_CHINESE_DEFINITION,
]
const GREEK_DICTIONARIES = [
    LexiconEntryType.GREEK_SHORT_DEFINITION,
    LexiconEntryType.GREEK_DEFINITION,
    LexiconEntryType.SIMPLIFIED_CHINESE_DEFINITION,
    LexiconEntryType.TRADITIONAL_CHINESE_DEFINITION,
]
const DICTIONARIES = [...GREEK_DICTIONARIES, ...HEBREW_DICTIONARIES]
const DICTIONARY_TO_GLOSS: any = {
    [LexiconEntryType.HEBREW_DEFINITION]: LexiconEntryType.ENGLISH_GLOSS,
    [LexiconEntryType.GREEK_SHORT_DEFINITION]: LexiconEntryType.ENGLISH_GLOSS,
    [LexiconEntryType.GREEK_DEFINITION]: LexiconEntryType.ENGLISH_GLOSS,
    [LexiconEntryType.SIMPLIFIED_CHINESE_DEFINITION]: LexiconEntryType.SIMPLIFIED_CHINESE_GLOSS,
    [LexiconEntryType.TRADITIONAL_CHINESE_DEFINITION]: LexiconEntryType.TRADITIONAL_CHINESE_GLOSS,
}

export class StepLexiconImporter extends BibleEngineImporter {
    async import() {
        await this.importHebrewLexicon()
        await this.importGreekLexicon()
    }

    async importHebrewLexicon() {
        const hebrewLexiconLines = fs
            .readFileSync(`${dirProjectRoot}/stepdata/step-lexicon/data/hebrew_lexicon.txt`)
            .toString()
            .split('\n')

        const hebrewLexiconEntries = this.getStrongsContent(hebrewLexiconLines);
        const hebrewDictionaryEntries = this.getHebrewDictionaryEntries(
            hebrewLexiconEntries,
        );
        await Promise.all(
            hebrewDictionaryEntries.map(
                entry => this.bibleEngine.addDictionaryEntry(entry)
            )
        )
    }

    async importGreekLexicon() {
        const greekLexiconLines = fs
            .readFileSync(`${dirProjectRoot}/stepdata/step-lexicon/data/greek_lexicon.txt`)
            .toString()
            .split('\n')

        const greekLexiconEntries = this.getStrongsContent(greekLexiconLines);
        const greekDictionaryEntries = this.getGreekDictionaryEntries(
            greekLexiconEntries,
        );
        await Promise.all(
            greekDictionaryEntries.map(
                entry => this.bibleEngine.addDictionaryEntry(entry)
            )
        )
    }

    isValidContent(line: string) {
        return (
            line &&
            line.split('=').length >= 2 &&
            line.split('=')[1].trim().length &&
            Object.values(LexiconEntryType).includes(line.split('=')[0].trim() as LexiconEntryType)

        );
    }

    getStrongsContent(lines: string[]) {
        let currentStrongsNum = '';
        const lexiconEntries: any = lines
            .filter((line: string) => this.isValidContent(line))
            .reduce((currentLexiconEntries: any, line: string) => {
                const entryType: any = line.split('=')[0].trim();
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
                if (DICTIONARIES.includes(entryType)) {
                    const definitions = entryValue.split('<br>').filter(elt => elt);
                    currentLexiconEntries[currentStrongsNum][entryType] = definitions;
                    return currentLexiconEntries;
                }
                currentLexiconEntries[currentStrongsNum][entryType] = entryValue;
                return currentLexiconEntries;
            }, {});
        return lexiconEntries;
    }

    getHebrewDictionaryEntries(lexicon: any) {
        const dictionaryEntries: IDictionaryEntry[] = []
        const strongsNums = Object.keys(lexicon)
        for (const strong of strongsNums) {
            const entry = lexicon[strong]
            const lemma = entry[LexiconEntryType.ORIGINAL_WORD]
            const transliteration = entry[LexiconEntryType.HEBREW_TRANSLITERATION]
            const pronunciation = entry[LexiconEntryType.PRONUNCIATION]
            for (const dictionary of HEBREW_DICTIONARIES) {
                if (entry[dictionary]) {
                    const gloss = entry[DICTIONARY_TO_GLOSS[dictionary]]
                    const content = this.getHebrewContentStructure(entry[dictionary]);
                    dictionaryEntries.push({
                        strong,
                        dictionary,
                        lemma,
                        transliteration,
                        pronunciation,
                        gloss,
                        content
                    })
                }
            }
        }
        return dictionaryEntries
    }

    getGreekDictionaryEntries(lexicon: any) {
        const dictionaryEntries: IDictionaryEntry[] = []
        const strongsNums = Object.keys(lexicon)
        for (const strong of strongsNums) {
            const entry = lexicon[strong]
            const lemma = entry[LexiconEntryType.ORIGINAL_WORD]
            const transliteration = entry[LexiconEntryType.GREEK_TRANSLITERATION]
            const pronunciation = entry[LexiconEntryType.PRONUNCIATION]
            for (const dictionary of GREEK_DICTIONARIES) {
                if (entry[dictionary]) {
                    const gloss = entry[DICTIONARY_TO_GLOSS[dictionary]]
                    const content = this.getGreekContentStructure(entry[dictionary]);
                    dictionaryEntries.push({
                        strong,
                        dictionary,
                        lemma,
                        transliteration,
                        pronunciation,
                        gloss,
                        content
                    })
                }
            }
        }
        return dictionaryEntries
    }

    getHebrewContentStructure(definitions: string[]) {
        if (!definitions) {
            return
        }
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

    getStringWithoutXMLTags(str: string) {
        return str.replace(/<(?:.|\n)*?>/gm, '');
    }

    getGreekContentStructure(definition: string[] | undefined) {
        if (!definition) {
            return
        }
        const contents: DocumentElement[] = [];
        definition.forEach((element: string) => {
            const split = element.split('</b>');
            if (split.length > 1) {
                const boldPart = this.getStringWithoutXMLTags(split[0]);
                const nonBoldPart = this.getStringWithoutXMLTags(split[1]);
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
                content: this.getStringWithoutXMLTags(element)
            };
            contents.push(nonBoldElement);
        });
        const content: DocumentRoot = {
            type: 'root',
            contents
        };
        return content;
    }

    toString() {
        return 'STEP Greek and Hebrew Lexicons';
    }
}
