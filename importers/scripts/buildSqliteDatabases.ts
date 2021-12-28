import { ConnectionOptions } from 'typeorm';
import { BeDatabaseCreator, OsisImporter, V11nImporter } from '../src';
import { enBookMetadata } from '../src/metadata';

const LOCAL_CACHE_PATH = 'data/step-library';

const CONNECTION_OPTIONS: ConnectionOptions = {
    type: 'better-sqlite3',
    database: 'bibles.db',
};

const main = async () => {
    const creator = new BeDatabaseCreator(CONNECTION_OPTIONS);
    creator.addImporter(OsisImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/ESV2016_OSIS+Strongs.xml`,
        bookMeta: enBookMetadata,
        versionMeta: {
            uid: 'ESV',
            title: 'English Standard Version',
            isPlaintext: false,
            hasStrongs: true,
        },
    });
    creator.addImporter(V11nImporter);
    await creator.createDatabase();
};

main().catch((error) => console.log(error));
