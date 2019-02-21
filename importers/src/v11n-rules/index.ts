import { resolve } from 'path';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { V11nRuleEntity, getOsisIdFromBookString, getSourceTypeId } from '@bible-engine/core';
import { BibleEngineImporter } from '../Importer.interface';

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
                if (lineNr === 1 || row.length <= 1 || row[0] === 'Absent') return;

                const sourceRef = row[0].split('.');
                const sourceBookOsisId = getOsisIdFromBookString(sourceRef[0]);
                if (!sourceBookOsisId)
                    throw new Error(`sourceRef book ${sourceRef[0]} no valid book id`);
                const sourceRefNumbers = sourceRef[1].split(':');
                const sourceRefVerseInfo = sourceRefNumbers[1].split('.');

                const standardRef = row[1].split('.');
                const standardRefNumbers = standardRef[1].split(':');
                let standardRefVerse = standardRefNumbers[1];
                let standardRefVersePartIndicator: string | undefined = standardRefVerse.substr(-1);
                if (/[a-z]/.test(standardRefVersePartIndicator)) {
                    standardRefVerse = standardRefVerse.substring(0, standardRefVerse.length - 1);
                } else {
                    standardRefVersePartIndicator = undefined;
                }

                const sourceTypeId = getSourceTypeId(row[5]);
                if (sourceTypeId === undefined) throw new Error(`unknown sourceType ${row[5]}`);

                const action = row[2];
                if (
                    action !== 'Keep verse' &&
                    action !== 'Merged above' &&
                    action !== 'Renumber verse' &&
                    action !== 'Empty verse'
                )
                    throw new Error(`invalid action ${action}`);

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
                        noteMarker: row[3],
                        note: row[4],
                        sourceTypeId,
                        tests: row[6]
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
