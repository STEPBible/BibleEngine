import { join } from 'path';

import { ModuleIndex, SwordModule, V11nImporter, BeDatabaseCreator, SwordImporter } from '../src';
import { readFileSync } from 'fs';

// TS complains if we use `const` here, since manual code changes are not part of its use case
let TEST_SUBJECT: 'parser' | 'bibleengine' = 'parser';

const run = async () => {
    const filename = join(__dirname, './data/ESV2016_th.zip');
    if (TEST_SUBJECT === 'bibleengine') {
        const creator = new BeDatabaseCreator({
            type: 'sqlite',
            database: join(__dirname, '../../output/biblesSwordTest.db'),
            dropSchema: true
        });

        creator.addImporter(V11nImporter);

        creator.addImporter(SwordImporter, {
            sourcePath: filename,
            versionMeta: { hasStrongs: false }
        });

        return creator.createDatabase();
    } else if (TEST_SUBJECT === 'parser') {
        const contents = readFileSync(filename);
        const fileIndex = ModuleIndex.fromNodeBuffer(contents);
        const swordModule = new SwordModule(fileIndex);
        const xmlResult = swordModule.getXMLforChapter('Psa 41');

        console.log(xmlResult);
    }
};

console.time('dbsave');

run()
    .then(() => {
        console.timeEnd('dbsave');

        process.exit();
    })
    .catch(e => console.error(e));
