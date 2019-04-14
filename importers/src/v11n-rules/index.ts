import { resolve } from 'path';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { V11nRuleEntity, getOsisIdFromBookString, getSourceTypeId } from '@bible-engine/core';
import { BibleEngineImporter } from '../Importer.interface';

const replaceNoteVars = (note: string) => {
    if (!note) return undefined;
    return note.replace(/%(.*)% (.*)/, (_, text: string, ref: string) => {
        for (const phraseEntry of V11nRuleEntity.notePhrases.entries()) {
            if (phraseEntry[1].replace(' REF', '') === text) return `%${phraseEntry[0]}% <${ref}>`;
        }
        throw new Error(`unknown v11n note phrase ${note}`);
    });
};

export class V11nImporter extends BibleEngineImporter {
    async import() {
        const p = new Promise(promiseResolve => {
            const rd = createInterface({
                input: createReadStream(resolve(__dirname) + '/data/v11n-rules.tsv')
            });

            let lineNr = 0;
            const rules: V11nRuleEntity[] = [];
            rd.on('line', line => {
                lineNr++;
                const row = line.split('\t');
                if (lineNr === 1 || row.length <= 1 || !row[1]) return;

                const sourceRef = row[1].split('.');
                const sourceBookOsisId = getOsisIdFromBookString(sourceRef[0]);
                if (!sourceBookOsisId)
                    throw new Error(`sourceRef book ${sourceRef[0]} no valid book id`);
                const sourceRefNumbers = sourceRef[1].split(':');
                const sourceRefVerseInfo = sourceRefNumbers[1].split('.');

                const standardRef = row[2].split('.');
                const standardRefNumbers = standardRef[1].split(':');
                let standardRefVerse = standardRefNumbers[1];
                let standardRefVersePartIndicator: string | undefined = standardRefVerse.substr(-1);
                if (/[a-z]/.test(standardRefVersePartIndicator)) {
                    standardRefVerse = standardRefVerse.substring(0, standardRefVerse.length - 1);
                } else {
                    standardRefVersePartIndicator = undefined;
                }

                const sourceTypeId = !row[0] ? undefined : getSourceTypeId(row[0]);
                if (!!row[0] && sourceTypeId === undefined)
                    throw new Error(`unknown sourceType ${row[0]}`);

                const action = row[3];
                if (
                    action !== 'Keep verse' &&
                    action !== 'Merged with' &&
                    action !== 'Renumber verse' &&
                    action !== 'Empty verse'
                )
                    throw new Error(`invalid action ${action}`);

                const note = replaceNoteVars(row[5]);
                if (!note) throw new Error(`can't import rule: note is missing`);

                rules.push(
                    new V11nRuleEntity({
                        sourceRef: {
                            bookOsisId: sourceBookOsisId,
                            versionChapterNum: +sourceRefNumbers[0],
                            versionVerseNum: +sourceRefVerseInfo[0],
                            versionSubverseNum: +sourceRefVerseInfo[1]
                        },
                        standardRef: {
                            bookOsisId: sourceBookOsisId,
                            normalizedChapterNum: +standardRefNumbers[0],
                            normalizedVerseNum: +standardRefVerse,
                            normalizedSubverseNum: +standardRef[2],
                            partIndicator: standardRefVersePartIndicator
                        },
                        action,
                        noteMarker: row[4],
                        note,
                        noteSecondary: replaceNoteVars(row[6]),
                        noteAncientVersions: row[7],
                        sourceTypeId,
                        tests: row[8]
                    })
                );
            });

            rd.on('close', async () => {
                await this.bibleEngine.addV11nRules(rules);
                promiseResolve(true);
            });
        });

        return p;
    }

    toString() {
        return 'Versification Rules';
    }
}
