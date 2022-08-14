import { IDictionaryEntry } from '@bible-engine/core';
import { transliterate } from 'hebrew-transliteration';
import { resolve } from 'path';
import { BibleEngineImporter } from '../../shared/Importer.interface';

const fs = require('fs');
const dirProjectRoot = resolve(__dirname + '/../..');

const ENGLISH_GLOSS = '@StepGloss';
const SPANISH_GLOSS = '@es_Gloss';
const ORIGINAL_WORD = '@STEPUnicodeAccented';
const HEBREW_DEFINITION = '@BdbMedDef';
const SIMPLIFIED_CHINESE_GLOSS = '@zh_Gloss';
const TRADITIONAL_CHINESE_GLOSS = '@zh_tw_Gloss';
const SIMPLIFIED_CHINESE_DEFINITION = '@zh_Definition';
const TRADITIONAL_CHINESE_DEFINITION = '@zh_tw_Definition';
const SPANISH_DEFINITION = '@es_Definition';
const GREEK_SHORT_DEFINITION = '@MounceShortDef';
const GREEK_DEFINITION = '@MounceMedDef';
const TRANSLITERATION = '@StrTranslit';

export class StepLexiconImporter extends BibleEngineImporter {
    async import() {
        const hebrewLexiconLines = fs
            .readFileSync(`${dirProjectRoot}/stepdata/step-lexicon/data/lexicon_hebrew.txt`)
            .toString();
        const greekLexiconLines = fs
            .readFileSync(`${dirProjectRoot}/stepdata/step-lexicon/data/lexicon_greek.txt`)
            .toString();
        const rawText = hebrewLexiconLines + greekLexiconLines;
        const definitions = StepLexiconImporter.parseStrongsDefinitions(rawText);
        await this.bibleEngine.addDictionaryEntries(definitions);
    }

    static parseStrongsDefinitions(rawText: string): IDictionaryEntry[] {
        rawText = rawText
            .replace(/@sp_Gloss/g, '@es_Gloss')
            .replace(/@sp_Definition/g, '@es_Definition');
        const entries = rawText.split('$=').filter((chunk) => !!chunk.trim());
        const definitions: IDictionaryEntry[] = [];
        const seenStrongsNums = new Set();
        for (const entry of entries) {
            const strongsNum = entry.split('=', 1)[0]!.trim();
            if (seenStrongsNums.has(strongsNum)) {
                continue;
            }
            seenStrongsNums.add(strongsNum);
            const lines = entry.split('\n');
            const attributes: any = {};
            for (const line of lines) {
                const key = line.split('=')[0]!.trim();
                const value = line.split('=').slice(1).join('=').trim();
                attributes[key] = value;
            }
            if (!strongsNum) {
                throw new Error(entry);
            }
            const isHebrewStrongs = strongsNum[0]!.toLowerCase() === 'h';
            const hebrewTransliteration = transliterate(attributes[ORIGINAL_WORD] || '', {
                isSimple: true,
            });
            const transliteration = isHebrewStrongs
                ? hebrewTransliteration
                : attributes[TRANSLITERATION];
            for (const attribute of Object.keys(attributes)) {
                if (attribute === HEBREW_DEFINITION) {
                    definitions.push({
                        strong: strongsNum,
                        dictionary: HEBREW_DEFINITION,
                        lemma: attributes[ORIGINAL_WORD],
                        transliteration: hebrewTransliteration,
                        gloss: attributes[ENGLISH_GLOSS] || '',
                        content: attributes[HEBREW_DEFINITION],
                    });
                } else if (attribute === GREEK_SHORT_DEFINITION) {
                    definitions.push({
                        strong: strongsNum,
                        dictionary: GREEK_SHORT_DEFINITION,
                        lemma: attributes[ORIGINAL_WORD],
                        transliteration: attributes[TRANSLITERATION],
                        gloss: attributes[ENGLISH_GLOSS] || '',
                        content: attributes[GREEK_SHORT_DEFINITION],
                    });
                } else if (attribute === GREEK_DEFINITION) {
                    definitions.push({
                        strong: strongsNum,
                        dictionary: GREEK_DEFINITION,
                        lemma: attributes[ORIGINAL_WORD],
                        transliteration: attributes[TRANSLITERATION],
                        gloss: attributes[ENGLISH_GLOSS] || '',
                        content: attributes[GREEK_DEFINITION],
                    });
                } else if (attribute === SIMPLIFIED_CHINESE_DEFINITION) {
                    definitions.push({
                        strong: strongsNum,
                        dictionary: SIMPLIFIED_CHINESE_DEFINITION,
                        lemma: attributes[ORIGINAL_WORD],
                        transliteration: transliteration,
                        gloss: attributes[SIMPLIFIED_CHINESE_GLOSS] || '',
                        content: attributes[SIMPLIFIED_CHINESE_DEFINITION],
                    });
                } else if (attribute === TRADITIONAL_CHINESE_DEFINITION) {
                    definitions.push({
                        strong: strongsNum,
                        dictionary: TRADITIONAL_CHINESE_DEFINITION,
                        lemma: attributes[ORIGINAL_WORD],
                        transliteration: transliteration,
                        gloss: attributes[TRADITIONAL_CHINESE_GLOSS] || '',
                        content: attributes[TRADITIONAL_CHINESE_DEFINITION],
                    });
                } else if (attribute === SPANISH_DEFINITION) {
                    definitions.push({
                        strong: strongsNum,
                        dictionary: SPANISH_DEFINITION,
                        lemma: attributes[ORIGINAL_WORD],
                        transliteration: transliteration,
                        gloss: attributes[SPANISH_GLOSS] || '',
                        content: attributes[SPANISH_DEFINITION],
                    });
                }
            }
        }
        return definitions;
    }

    toString() {
        return 'STEP Greek and Hebrew Lexicons';
    }
}
