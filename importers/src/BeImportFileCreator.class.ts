import {
    aesGcmEncrypt,
    BibleEngine,
    IBibleBook,
    IBibleVersion,
    IV11nRule,
    parseV11nRuleFromDatabase,
} from '@bible-engine/core';
import { DB } from '@bible-engine/db-schema/generated/db';
import archiver from 'archiver';
import { webcrypto as crypto } from 'crypto';
import { createWriteStream, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { ensureDirSync } from 'fs-extra';
import { Kysely } from 'kysely';
import { sync as rmDirRecSync } from 'rimraf';

export interface BeFileCreatorOptions {
    skipCompression?: boolean;
    includeVersions?: string[];
    encryptVersions?: string[];
    encryptionKey?: string;
}

export class BeImportFileCreator {
    private bibleEngine: BibleEngine;

    constructor(db: Kysely<DB>, private destinationPath: string) {
        this.bibleEngine = new BibleEngine(db);
    }

    async createAllVersions(options?: BeFileCreatorOptions) {
        const createdVersions: { file: string; version: IBibleVersion }[] = [];

        for (const versionEntity of await this.bibleEngine.getVersions()) {
            if (options?.includeVersions && !options.includeVersions.includes(versionEntity.uid))
                continue;

            createdVersions.push({
                version: {
                    uid: versionEntity.uid,
                    abbreviation: versionEntity.abbreviation,
                    title: versionEntity.title,
                    copyrightShort: versionEntity.copyrightShort,
                    language: versionEntity.language,
                    chapterVerseSeparator: versionEntity.chapterVerseSeparator,
                    hasStrongs: versionEntity.hasStrongs,
                    type: versionEntity.type,
                    lastUpdate: versionEntity.lastUpdate,
                    copyrightLong: versionEntity.copyrightLong,
                    description: versionEntity.description,
                    crossRefBeforePhrase: versionEntity.crossRefBeforePhrase,
                    isPlaintext: versionEntity.isPlaintext,
                },
                file: await this.createVersionFile(versionEntity.uid, options),
            });
        }

        writeFileSync(`${this.destinationPath}/versions.json`, JSON.stringify(createdVersions));
        await this.createV11nFile();

        return createdVersions;
    }

    async createV11nFile() {
        const v11nRules = await this.bibleEngine.db
            .selectFrom('v11n_rule')
            .selectAll()
            .execute()
            .then((_v11nRules) =>
                _v11nRules.map((_v11nRule) => {
                    const v11nRule = parseV11nRuleFromDatabase(_v11nRule);
                    const v11nRuleStripped: IV11nRule = {
                        sourceRefId: v11nRule.sourceRefId,
                        standardRefId: v11nRule.standardRefId,
                        actionId: v11nRule.actionId,
                        note: v11nRule.note,
                        noteMarker: v11nRule.noteMarker,
                    };
                    if (v11nRule.sourceTypeId)
                        v11nRuleStripped.sourceTypeId = v11nRule.sourceTypeId;
                    if (v11nRule.noteAncientVersions)
                        v11nRuleStripped.noteAncientVersions = v11nRule.noteAncientVersions;
                    if (v11nRule.noteSecondary)
                        v11nRuleStripped.noteSecondary = v11nRule.noteSecondary;
                    if (v11nRule.tests) v11nRuleStripped.tests = v11nRule.tests;
                    return v11nRuleStripped;
                })
            );
        const filename = `${this.destinationPath}/v11n-rules.json`;

        writeFileSync(filename, JSON.stringify(v11nRules));

        return filename;
    }

    async createVersionFile(versionUid: string, options?: BeFileCreatorOptions) {
        const versionData = await this.bibleEngine.getVersionFullData(versionUid);
        const targetDir = this.destinationPath + '/' + versionData.version.uid;
        const targetFile = `${versionData.version.uid}.bef`;
        const targetPath = `${this.destinationPath}/${targetFile}`;

        const p = new Promise<string>((pResolve, pReject) => {
            // create version directory
            ensureDirSync(targetDir);

            writeFileSync(`${targetDir}/version.json`, JSON.stringify(versionData.version));

            const versionIndex: IBibleBook[] = [];
            for (const bookData of versionData.bookData) {
                const filename = `${bookData.book.osisId}.json`;

                // write to json file
                writeFileSync(`${targetDir}/${filename}`, JSON.stringify(bookData));

                // add to index
                versionIndex.push({
                    osisId: bookData.book.osisId,
                    abbreviation: bookData.book.abbreviation,
                    number: bookData.book.number,
                    title: bookData.book.title,
                    type: bookData.book.type,
                    longTitle: bookData.book.longTitle,
                    chaptersCount: bookData.book.chaptersCount,
                });
            }

            // write index file
            writeFileSync(`${targetDir}/index.json`, JSON.stringify(versionIndex));

            if (options && options.skipCompression) {
                pResolve(targetDir);
                return;
            }

            // pack everything
            const zipArchive = archiver('zip');
            zipArchive.on('warning', function (err: any) {
                if (err.code === 'ENOENT') {
                    console.error(err);
                } else {
                    pReject(err);
                }
            });

            zipArchive.on('error', (err) => pReject(err));

            const output = createWriteStream(targetPath);
            output.on('close', async function () {
                const bytes = zipArchive.pointer();
                rmDirRecSync(targetDir);
                if (options?.encryptVersions?.includes(versionUid) && options?.encryptionKey) {
                    try {
                        const fileBuf = readFileSync(targetPath);
                        const arrayBuf = new ArrayBuffer(fileBuf.byteLength);
                        new Uint8Array(arrayBuf).set(fileBuf);
                        const encData = await aesGcmEncrypt(
                            (crypto as unknown) as Crypto,
                            arrayBuf,
                            options.encryptionKey
                        );
                        writeFileSync(
                            `${targetPath}.enc`,
                            encData instanceof Uint8Array ? encData : new Uint8Array(encData)
                        );
                        unlinkSync(targetPath);
                        console.log(
                            `${targetPath}.enc was successfully created with ${encData.byteLength} total bytes`
                        );
                        pResolve(`${targetFile}.enc`);
                    } catch (e) {
                        pReject(e);
                    }
                } else {
                    console.log(`${targetPath} was successfully created with ${bytes} total bytes`);
                    pResolve(targetFile);
                }
            });

            zipArchive.pipe(output);
            zipArchive.glob('*.json', { cwd: targetDir });
            zipArchive.finalize();
        });

        return p;
    }
}
