import {
    getBookGenericIdFromOsisId,
    getOsisIdFromBookString,
    getSourceTypeId,
    V11nRuleEntity,
} from '@bible-engine/core';
import { createReadStream } from 'fs';
import { resolve } from 'path';
import { createInterface } from 'readline';
import { BibleEngineImporter } from '../../shared/Importer.interface';

const DEBUG = false;

const replaceNoteVars = (note?: string) => {
    if (!note) return undefined;
    return note.replace(/%(.*)%(.*)/, (_, text: string, ref: string) => {
        for (const phraseEntry of V11nRuleEntity.notePhrases.entries()) {
            if (phraseEntry[1].indexOf(text) === 0) {
                if (!ref || ref === '.') return `%${phraseEntry[0]}%`;
                else {
                    const refNorm =
                        ref.slice(-1) === '.' ? ref.slice(0, -1).trimLeft() : ref.trim();
                    return `%${phraseEntry[0]}% <${refNorm}>`;
                }
            }
        }
        throw new Error(`unknown v11n note phrase ${note}`);
    });
};

export class V11nImporter extends BibleEngineImporter {
    async import() {
        const p = new Promise((promiseResolve) => {
            const rd = createInterface({
                input: createReadStream(resolve(__dirname) + '/data/v11n-rules.tsv'),
            });

            let lineNr = 0;
            const rules: V11nRuleEntity[] = [];
            let ignoredRules = 0;
            const ignoredRulesSourceTypes: string[] = [];
            let ignoredRulesNonAp = 0;
            const ignoredRulesNonApSourceTypes: string[] = [];
            rd.on('line', (line) => {
                let ruleNotSupported = false;
                lineNr++;

                const row = line.split('\t');
                if (lineNr === 1 || row.length <= 1 || !row[1]) {
                    return;
                }

                // get action and normalize
                if (!row[3]) throw new Error(`v11n import error: missing row[3] for row ${row[1]}`);
                let action = row[3].replace('Verse', 'verse');
                if (action.slice(-1) === '*') action = action.slice(0, -1);
                if (action === 'Psalm Title') action = 'Keep verse';
                else if (action === 'Renumber Title') action = 'Renumber verse';

                if (
                    action !== 'Keep verse' &&
                    action !== 'Merged verse' &&
                    action !== 'Renumber verse' &&
                    action !== 'Empty verse'
                )
                    throw new Error(`invalid action ${action}`);

                const sourceRef = row[1].replace('Title', '1.0').split('.');
                const sourceBookOsisId = getOsisIdFromBookString(sourceRef[0]!);
                if (!sourceRef[1])
                    throw new Error(`v11n import error: missing sourceRef[1]: ${sourceRef}`);
                const sourceRefNumbers = sourceRef[1].split(':');
                if (!sourceRefNumbers[1])
                    throw new Error(
                        `v11n import error: missing sourceRefNumbers[1]: ${sourceRefNumbers}`
                    );
                const sourceRefVerseInfo = sourceRefNumbers[1].split('.');

                if (!row[2]) throw new Error(`v11n import error: missing row[2] for row ${row[1]}`);
                const standardRef = row[2].replace('Title', '1.0').split('.');
                const standardBookOsisId = getOsisIdFromBookString(standardRef[0]!);
                if (!standardRef[1])
                    throw new Error(`v11n import error: missing standardRef[1]: ${standardRef}`);
                const standardRefNumbers = standardRef[1].split(':');
                if (!standardRefNumbers[1])
                    throw new Error(
                        `v11n import error: missing standardRefNumbers[1]: ${standardRefNumbers}`
                    );
                let standardRefVerse = standardRefNumbers[1];
                let standardRefVersePartIndicator: string | undefined = standardRefVerse.substr(-1);
                if (/[a-z]/.test(standardRefVersePartIndicator)) {
                    standardRefVerse = standardRefVerse.substring(0, standardRefVerse.length - 1);
                } else {
                    standardRefVersePartIndicator = undefined;
                }

                if (!sourceBookOsisId) {
                    // throw new Error(`sourceRef book ${sourceRef[0]} no valid book id`);
                    if (DEBUG)
                        console.log(
                            `sourceRef book "${sourceRef[0]}" is no valid book id (in ${row[1]} ${action} ${row[2]})`
                        );
                    ruleNotSupported = true;
                }
                if (!standardBookOsisId) {
                    // throw new Error(`standardRef book ${standardRef[0]} no valid book id`);
                    if (DEBUG)
                        console.log(
                            `standardRef book "${standardRef[0]}" is no valid book id (in ${row[1]} ${action} ${row[2]})`
                        );
                    ruleNotSupported = true;
                }
                if (sourceBookOsisId !== standardBookOsisId) {
                    if (DEBUG)
                        console.log(
                            `moving to a different book is currently not supported: ${row[1]} ${action} ${row[2]}`
                        );
                    ruleNotSupported = true;
                }
                if (isNaN(+sourceRefNumbers[0]!) || isNaN(+standardRefNumbers[0]!)) {
                    if (DEBUG)
                        console.log(`invalid chapter number in ${row[1]} ${action} ${row[2]}`);
                    ruleNotSupported = true;
                }

                const sourceTypeId = !row[0]
                    ? undefined
                    : getSourceTypeId(row[0].trim().replace(' +', '+').replace('Latin=', 'Latin'));
                if (!!row[0] && sourceTypeId === undefined)
                    throw new Error(`unknown sourceType ${row[0]}`);

                const note = replaceNoteVars(row[5]);
                if (!note) throw new Error(`can't import rule: note is missing`);

                if (ruleNotSupported) {
                    ignoredRules++;
                    if (ignoredRulesSourceTypes.indexOf(row[0]!) === -1)
                        ignoredRulesSourceTypes.push(row[0]!);
                    if (sourceBookOsisId && getBookGenericIdFromOsisId(sourceBookOsisId) <= 66) {
                        ignoredRulesNonAp++;
                        if (ignoredRulesNonApSourceTypes.indexOf(row[0]!) === -1)
                            ignoredRulesNonApSourceTypes.push(row[0]!);
                    }
                    return;
                }

                rules.push(
                    new V11nRuleEntity({
                        sourceRef: {
                            bookOsisId: sourceBookOsisId as string,
                            versionChapterNum: +sourceRefNumbers[0]!,
                            versionVerseNum: +sourceRefVerseInfo[0]!,
                            versionSubverseNum: sourceRef[2] ? +sourceRef[2] : undefined,
                        },
                        standardRef: {
                            bookOsisId: standardBookOsisId as string,
                            normalizedChapterNum: +standardRefNumbers[0]!,
                            normalizedVerseNum: +standardRefVerse,
                            normalizedSubverseNum: standardRef[2] ? +standardRef[2] : undefined,
                            partIndicator: standardRefVersePartIndicator,
                        },
                        action,
                        noteMarker: row[4] || '[+]',
                        note,
                        noteSecondary: replaceNoteVars(row[6]),
                        noteAncientVersions: row[7],
                        sourceTypeId,
                        tests: row[8]?.replace(/Title/g, '1.0'),
                    })
                );
            });

            rd.on('close', async () => {
                await this.bibleEngine.addV11nRules(rules);
                if (ignoredRules) {
                    console.log(
                        `ignored ${ignoredRules} unsupported or invalid rules from source types: ${ignoredRulesSourceTypes} (thereof ${ignoredRulesNonAp} rules for non ap books from source types: ${ignoredRulesNonApSourceTypes}) - set DEBUG=true to see details`
                    );
                }
                promiseResolve(true);
            });
        });

        return p;
    }

    toString() {
        return 'Versification Rules';
    }
}
