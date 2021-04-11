import { BeDatabaseCreator, OsisImporter, StepLexiconImporter } from '../src';
import { SwordImporter } from './../src/bible/sword/src/importer';
import { ConnectionOptions } from 'typeorm';
import { zhBookMetadata, zhsBookMetadata, esBookMetdata, enBookMetadata } from './../src/metadata';

const LOCAL_CACHE_PATH = 'data/step-library';

const CONNECTION_OPTIONS: ConnectionOptions = {
    type: 'better-sqlite3',
    database: 'bibles.db',
};

const main = async () => {
    if (process.env.SKIP_CACHE) {
        await downloadAllStepModules();
    }
    const creator = new BeDatabaseCreator(CONNECTION_OPTIONS);
    creator.addImporter(SwordImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/KJV.zip`,
        versionMeta: {
            uid: 'KJV',
            title: 'King James Version (1769)',
            isPlaintext: false,
            hasStrongs: true,
        },
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
    });
    creator.addImporter(OsisImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/sblg_th.xml`,
        bookMeta: enBookMetadata,
        versionMeta: {
            uid: 'SBLGNT',
            title: 'The Greek New Testament: SBLGNT upgraded by Tyndale House',
            isPlaintext: false,
            hasStrongs: true,
        },
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
    creator.addImporter(OsisImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/NASB_TH_osis.xml`,
        bookMeta: enBookMetadata,
        versionMeta: {
            uid: 'NASB',
            title: 'New American Standard Bible',
            isPlaintext: false,
            hasStrongs: true,
        },
    });

    creator.addImporter(SwordImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/OSHB.zip`,
        versionMeta: {
            uid: 'OHB',
            title: 'Open Scriptures Hebrew Bible',
            isPlaintext: false,
            hasStrongs: true,
        },
    });
    creator.addImporter(SwordImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/ChiUn.zip`,
        bookMeta: zhBookMetadata,
        versionMeta: {
            uid: '和合本 (繁)',
            title: '和合本 (繁體字)',
            isPlaintext: false,
            hasStrongs: true,
        },
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

    creator.addImporter(StepLexiconImporter);
    await creator.createDatabase();
};

main().catch((error) => console.log(error));
