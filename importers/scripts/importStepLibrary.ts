import { createWriteStream, readdirSync, unlinkSync } from 'fs'
import { get } from 'http'
import { S3 } from '@aws-sdk/client-s3'
import { BeDatabaseCreator } from '../src';
import { V11nImporter } from './../src/stepdata/v11n-rules/index';
import { SwordImporter } from './../src/bible/sword/src/importer';

const PUBLIC_BUCKET_NAME = 'tyndale-house-public'
const REGION = 'eu-west-1'
const LOCAL_CACHE_PATH = 'data/step-library'
const TEMP_DATABASE_PATH = 'temp.db'

const main = async () => {
    if (process.env.SKIP_CACHE) {
        const urls = await getSwordModuleDownloadUrls(PUBLIC_BUCKET_NAME)
        urls.forEach(url => downloadSwordFile(url))
    }
    const filenames = readdirSync(LOCAL_CACHE_PATH)
    const creator = new BeDatabaseCreator({
        type: 'sqlite',
        database: TEMP_DATABASE_PATH
    });
    creator.addImporter(V11nImporter);
    for (const name of filenames) {
        creator.addImporter(SwordImporter, {
            sourcePath: `${LOCAL_CACHE_PATH}/${name}`
        });
    }
    try {
        await creator.createDatabase()
    } catch (error) {
        unlinkSync(TEMP_DATABASE_PATH)
        throw error
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
    const { Contents } = await s3.listObjects({ Bucket: PUBLIC_BUCKET_NAME })
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