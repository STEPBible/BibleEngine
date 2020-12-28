import { createWriteStream, mkdirSync } from 'fs'
import { get } from 'http'
import { S3 } from '@aws-sdk/client-s3'
import { BeDatabaseCreator, BeImportFileCreator } from '../src';
import { SwordImporter } from './../src/bible/sword/src/importer';
import { ConnectionOptions } from 'typeorm';

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
        sourcePath: `${LOCAL_CACHE_PATH}/osmhb.zip`
    });
    creator.addImporter(SwordImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/sblg-the.zip`
    });
    creator.addImporter(SwordImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/ChiUn.zip`
    });
    creator.addImporter(SwordImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/ChiUns.zip`
    });
    creator.addImporter(SwordImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/esv_th.zip`
    });
    creator.addImporter(SwordImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/hlt2018eb.zip`
    });
    creator.addImporter(SwordImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/KJV.zip`
    });
    creator.addImporter(SwordImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/nasb_th.zip`
    });
    creator.addImporter(SwordImporter, {
        sourcePath: `${LOCAL_CACHE_PATH}/spaRV1909eb.zip`
    });
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