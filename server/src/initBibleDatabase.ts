import {
    BeDatabaseCreator,
    V11nImporter,
    NeueImporter,
    SwordImporter
} from '@bible-engine/importers';
import { join } from 'path';

const run = async () => {
    const creator = new BeDatabaseCreator({
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'bibleengine',
        password: 'bibleengine',
        database: 'bibleengine',
        dropSchema: true
    });

    creator.addImporter(V11nImporter);

    const filename = join(__dirname, '../data/ESV2016_th.zip');
    creator.addImporter(SwordImporter, filename);

    creator.addImporter(NeueImporter);

    return creator.createDatabase();
};

run()
    .then(() => process.exit())
    .catch(e => console.error(e));
