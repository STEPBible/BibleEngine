import { join } from 'path';

import { ModuleIndex, SwordModule } from '../src';
import { readFileSync } from 'fs';

const run = async () => {
    // const creator = new BeDatabaseCreator({
    //     type: 'sqlite',
    //     database: join(__dirname, '../../output/biblesSwordTest.db'),
    //     dropSchema: true
    // });

    // creator.addImporter(V11nImporter);
    const filename = join(__dirname, './data/ESV2016_th.zip');

    const contents = readFileSync(filename);
    const fileIndex = ModuleIndex.fromNodeBuffer(contents);
    const swordModule = new SwordModule(fileIndex);
    const xmlResult = swordModule.getXMLforChapter('Psa 41');

    console.log(xmlResult);

    // creator.addImporter(SwordImporter, {
    //     sourcePath: filename,
    //     versionMeta: { hasStrongs: false }
    // });

    // return creator.createDatabase();
};

console.time('dbsave');

run()
    .then(() => {
        console.timeEnd('dbsave');

        process.exit();
    })
    .catch(e => console.error(e));
