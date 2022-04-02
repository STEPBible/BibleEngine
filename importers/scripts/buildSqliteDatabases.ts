import { OsisImporter } from './../src/bible/osis/index';
import { BeDatabaseCreator, V11nImporter } from '../src';
import { SwordImporter } from './../src/bible/sword/src/importer';
import { esBookMetdata, enBookMetadata, zhsBookMetadata } from './../src/metadata/index';

const LOCAL_CACHE_PATH = 'data/step-library';

const main = async () => {
    await Promise.all([createReinaValeraDatabase(), createEsvDatabase(), createCuvDatabase()]);
};

const createEsvDatabase = async () => {
    const creator = new BeDatabaseCreator({
        name: 'esv-connection',
        type: 'better-sqlite3',
        database: 'esv.db',
    });
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

const createCuvDatabase = async () => {
    const creator = new BeDatabaseCreator({
        name: 'cuv-connection',
        type: 'better-sqlite3',
        database: 'cuvs.db',
    });
    creator.addImporter(SwordImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/ChiUns.zip`,
        bookMeta: zhsBookMetadata,
        versionMeta: {
            uid: '和合本 (简)',
            title: '和合本 (简体字)',
            isPlaintext: false,
            hasStrongs: true,
        },
    });
    creator.addImporter(V11nImporter);
    await creator.createDatabase();
};

const createReinaValeraDatabase = async () => {
    const creator = new BeDatabaseCreator({
        name: 'cuv-connection',
        type: 'better-sqlite3',
        database: 'spaRV1909.db',
    });
    creator.addImporter(SwordImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/spaRV1909eb.zip`,
        bookMeta: esBookMetdata,
        versionMeta: {
            uid: 'RV1909',
            title: 'Reina-Valera 1909',
            isPlaintext: false,
            hasStrongs: true,
        },
        autoGenMissingParagraphs: true,
    });
    creator.addImporter(V11nImporter);
    await creator.createDatabase();
};

main().catch((error) => console.log(error));
