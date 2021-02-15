import { createWriteStream, mkdirSync } from 'fs'
import { get } from 'http'
import { S3 } from '@aws-sdk/client-s3'
import { BeDatabaseCreator, StepLexiconImporter } from '../src';
import { SwordImporter } from './../src/bible/sword/src/importer';
import { ConnectionOptions } from 'typeorm';
import { zhBookMetadata, zhsBookMetadata, esBookMetdata } from './../src/metadata'

const BUCKETS = [
    'tyndale-house-public',
    'tyndale-house-private'
]
const REGION = 'eu-west-1'
const LOCAL_CACHE_PATH = 'data/step-library'

const CONNECTION_OPTIONS: ConnectionOptions = {
    type: 'better-sqlite3',
    database: 'bibles.db'
}

const main = async () => {
    if (process.env.SKIP_CACHE) {
        await downloadAllStepModules()
    }
    const creator = new BeDatabaseCreator(CONNECTION_OPTIONS);
    creator.addImporter(SwordImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/OSHB.zip`,
        versionMeta: {
            uid: 'OHB',
            title: 'Open Scriptures Hebrew Bible',
            isPlaintext: true,
            hasStrongs: true,
        }
    });
    creator.addImporter(SwordImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/sblg-the.zip`,
        versionMeta: {
            uid: 'SBLGNT',
            title: 'The Greek New Testament: SBLGNT upgraded by Tyndale House',
            isPlaintext: true,
            hasStrongs: true,
        }
    });
    creator.addImporter(SwordImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/ChiUn.zip`,
        bookMeta: zhBookMetadata,
        versionMeta: {
            uid: '和合本 (繁)',
            title: '和合本 (繁體字)',
            isPlaintext: true,
            hasStrongs: true,
        }
    });
    creator.addImporter(SwordImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/ChiUns.zip`,
        bookMeta: zhsBookMetadata,
        versionMeta: {
            uid: '和合本 (简)',
            title: '和合本 (简体字)',
            isPlaintext: true,
            hasStrongs: true,
        }
    });
    creator.addImporter(SwordImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/esv_th.zip`,
        versionMeta: {
            uid: 'ESV',
            title: 'English Standard Version',
            isPlaintext: false,
            hasStrongs: true,
        }
    });
    creator.addImporter(SwordImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/hlt2018eb.zip`,
        versionMeta: {
            uid: 'MCSB',
            title: 'Baibal Olcim',
            isPlaintext: true,
            hasStrongs: true,
        }
    });
    creator.addImporter(SwordImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/KJV.zip`,
        versionMeta: {
            uid: 'KJV',
            title: 'King James Version (1769)',
            isPlaintext: true,
            hasStrongs: true,
        }
    });
    creator.addImporter(SwordImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/nasb_th.zip`,
        versionMeta: {
            uid: 'NASB',
            title: 'New American Standard Bible',
            isPlaintext: false,
            hasStrongs: true,
        }
    });
    creator.addImporter(SwordImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/spaRV1909eb.zip`,
        bookMeta: esBookMetdata,
        versionMeta: {
            uid: 'RV1909',
            title: 'Reina-Valera 1909',
            isPlaintext: true,
            hasStrongs: true,
        }
    });
    creator.addImporter(StepLexiconImporter);
    await creator.createDatabase()
}

const downloadAllStepModules = async () => {
    mkdirSync(LOCAL_CACHE_PATH, { recursive: true })
    for (const bucket of BUCKETS) {
        const urls = await getSwordModuleDownloadUrls(bucket)
        console.log(urls)
        urls.forEach(url => downloadSwordFile(url))
    }
}

const downloadSwordFile = (url: string) => {
    const pieces = url.split('/')
    const filename = pieces[pieces.length - 1]
    const path = `${LOCAL_CACHE_PATH}/${filename}`
    const file = createWriteStream(path);
    return get(url, (response) => {
        response.pipe(file);
    })
}

const getSwordModuleDownloadUrls = async (bucketName: string) => {
    const s3 = new S3({ region: REGION });
    const S3_BASE_URL = `http://${bucketName}.s3-${REGION}.amazonaws.com`
    const { Contents } = await s3.listObjects({ Bucket: bucketName })
    if (!Contents) {
        throw new Error('Bucket has no contents')
    }
    return Contents
        .map(object => object.Key)
        .filter(key => (
            key?.includes('.zip')
        ))
        .map(key => `${S3_BASE_URL}/${key}`)
}

main().catch(error => console.log(error))