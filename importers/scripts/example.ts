import {
    BeDatabaseCreator,
    // V11nImporter, NeueImporter,
    SwordImporter
} from '../src';
import { join } from 'path';
// import { readFileSync } from 'fs';
// import { IBibleVersion, BibleEngine } from '@bible-engine/core';

const run = async () => {
    const creator = new BeDatabaseCreator({
        type: 'sqlite',
        database: join(__dirname, './bibles.db'),
        dropSchema: true
    });

    // creator.addImporter(V11nImporter);
    const filename = join(__dirname, './ESV2016_th.zip');
    creator.addImporter(SwordImporter, {
        sourcePath: filename,
        versionMeta: { hasStrongs: false }
    });
    // creator.addImporter(NeueImporter);

    return creator.createDatabase();

    // const bibleEngine = new BibleEngine({
    //     type: 'sqlite',
    //     database: 'bibles.db',
    //     dropSchema: true
    //     // logging: 'all'
    // });

    // const sourceDir = resolve(__dirname) + '/NEUE';

    // const versionData: IBibleVersion = JSON.parse(
    //     readFileSync(`${sourceDir}/version.json`, 'utf8')
    // );

    // const versionIndex: { filename: string }[] = JSON.parse(
    //     readFileSync(`${sourceDir}/index.json`, 'utf8')
    // );

    // const versionEntity = await bibleEngine.addVersion(versionData);

    // console.time('dbsave');

    // await bibleEngine.pDB!.then(entityManager =>
    //     entityManager.transaction('READ UNCOMMITTED', async transactionEntityManager => {
    //         for (const bookFile of versionIndex) {
    //             const bookData = JSON.parse(
    //                 readFileSync(`${sourceDir}/${bookFile.filename}`, 'utf8')
    //             );
    //             // console.log(`starting import of ${bookData.book.title}`);
    //             await bibleEngine.addBookWithContent(
    //                 versionEntity.id,
    //                 {
    //                     book: bookData.book,
    //                     contents: bookData.content
    //                 },
    //                 transactionEntityManager
    //             );
    //         }
    //         return true;
    //     })
    // );

    // console.timeEnd('dbsave');

    // return bibleEngine.finalizeVersion(versionEntity.id);
};

console.time('dbsave');

run()
    .then(() => {
        console.timeEnd('dbsave');

        process.exit();
    })
    .catch(e => console.error(e));
