import { IDictionaryEntry } from '@bible-engine/core';
// import { resolve } from 'path';
import { BibleEngineImporter } from '../../shared/Importer.interface';

// const fs = require('fs');
// const dirProjectRoot = resolve(__dirname + '/../..');

const STRONGS_NUM = '@StrNo';
const ENGLISH_GLOSS = '@StepGloss';
const ORIGINAL_WORD = '@STEPUnicodeAccented';
const HEBREW_DEFINITION = '@BdbMedDef';
const SIMPLIFIED_CHINESE_GLOSS = '@zh_Gloss';
const TRADITIONAL_CHINESE_GLOSS = '@zh_tw_Gloss';
const SIMPLIFIED_CHINESE_DEFINITION = '@zh_Definition';
const TRADITIONAL_CHINESE_DEFINITION = '@zh_tw_Definition';
const GREEK_SHORT_DEFINITION = '@MounceShortDef';
const GREEK_DEFINITION = '@MounceMedDef';
const EXTENDED_GREEK_DEFINITION = '@FLsjDefs'
const TRANSLITERATION = '@StrTranslit';

export class StepLexiconImporter extends BibleEngineImporter {
    async import() {}

    static isValidContent(line: string) {
        return line && line.split('=').length >= 2
    }

    static parseStrongsDefinitions(rawText: string): IDictionaryEntry[] {
        const entries = rawText.split('$=');
        const definitions: IDictionaryEntry[] = [];
        for (const entry of entries) {
            const lines = entry.split('\n').filter(this.isValidContent);
            const attributes: any = {};
            for (const line of lines) {
                const key = line.split('=')[0].trim();
                const value = line.split('=').slice(1).join('=').trim();
                attributes[key] = value;
            }
            for (const attribute of Object.keys(attributes)) {
                if (attribute === HEBREW_DEFINITION) {
                    definitions.push({
                        strong: attributes[STRONGS_NUM],
                        dictionary: HEBREW_DEFINITION,
                        lemma: attributes[ORIGINAL_WORD],
                        transliteration: attributes[TRANSLITERATION],
                        gloss: attributes[ENGLISH_GLOSS],
                        content: attributes[HEBREW_DEFINITION],
                    });
                }
                else if (attribute === GREEK_SHORT_DEFINITION) {
                    definitions.push({
                        strong: attributes[STRONGS_NUM],
                        dictionary: GREEK_SHORT_DEFINITION,
                        lemma: attributes[ORIGINAL_WORD],
                        transliteration: attributes[TRANSLITERATION],
                        gloss: attributes[ENGLISH_GLOSS],
                        content: attributes[GREEK_SHORT_DEFINITION],
                    });
                }
                else if (attribute === GREEK_DEFINITION) {
                    definitions.push({
                        strong: attributes[STRONGS_NUM],
                        dictionary: GREEK_DEFINITION,
                        lemma: attributes[ORIGINAL_WORD],
                        transliteration: attributes[TRANSLITERATION],
                        gloss: attributes[ENGLISH_GLOSS],
                        content: attributes[GREEK_DEFINITION],
                    });
                }
                else if (attribute === EXTENDED_GREEK_DEFINITION) {
                    definitions.push({
                        strong: attributes[STRONGS_NUM],
                        dictionary: EXTENDED_GREEK_DEFINITION,
                        lemma: attributes[ORIGINAL_WORD],
                        transliteration: attributes[TRANSLITERATION],
                        gloss: attributes[ENGLISH_GLOSS],
                        content: attributes[EXTENDED_GREEK_DEFINITION],
                    });
                }
                else if (attribute === SIMPLIFIED_CHINESE_DEFINITION) {
                    definitions.push({
                        strong: attributes[STRONGS_NUM],
                        dictionary: SIMPLIFIED_CHINESE_DEFINITION,
                        lemma: attributes[ORIGINAL_WORD],
                        transliteration: attributes[TRANSLITERATION],
                        gloss: attributes[SIMPLIFIED_CHINESE_GLOSS],
                        content: attributes[SIMPLIFIED_CHINESE_DEFINITION],
                    });
                }
                else if (attribute === TRADITIONAL_CHINESE_DEFINITION) {
                    definitions.push({
                        strong: attributes[STRONGS_NUM],
                        dictionary: TRADITIONAL_CHINESE_DEFINITION,
                        lemma: attributes[ORIGINAL_WORD],
                        transliteration: attributes[TRANSLITERATION],
                        gloss: attributes[TRADITIONAL_CHINESE_GLOSS],
                        content: attributes[TRADITIONAL_CHINESE_DEFINITION],
                    });
                }
            }
        }
        return definitions
    }

    toString() {
        return 'STEP Greek and Hebrew Lexicons';
    }
}
