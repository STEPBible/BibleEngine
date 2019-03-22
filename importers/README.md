# Working with resources and databases in BibleEngine

## Create a database for preloading to a client or server use

```typescript
import {
    BeDatabaseCreator,
    V11nImporter,
    NeueImporter,
    SwordImporter
} from '@bible-engine/importers';

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
creator.addImporter(SwordImporter, '../data/ESV2016_th.zip');
creator.addImporter(NeueImporter);

creator.createDatabase();
```

## Export a bible to the pre-/ downloadable BibleEngineFile format (.bef)

```typescript
import { BeImportFileCreator } from '@bible-engine/importers';

const creator = new BeImportFileCreator({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'bibleengine',
    password: 'bibleengine',
    database: 'bibleengine'
});

await creator.createAllVersions('./preload/bibles');
```

## Import a BibleEngine file

The following example is using functionality of [Capacitor](https://capacitor.ionicframework.com) and [Ionic](https://ionicframework.com), but should be easy to adapt to other contexts (filesystem access and unzip needed).

```typescript
const bibleEngine = new BibleEngine({
    /* CONFIG */
});
const importFile = '../import/ESV.bef';
const targetDir = '../data/ESV';

const unzipResult = await this.zip.unzip(
    importFile,
    targetDir,
    (progress: { loaded: number; total: number }) =>
        console.log('Unzipping, ' + Math.round((progress.loaded / progress.total) * 100) + '%')
);

if (unzipResult === 0) {
    const versionData = await Filesystem.readFile({
        path: `${targetDir}/version.json`,
        encoding: FilesystemEncoding.UTF8
    }).then(file => JSON.parse(file.data));

    const versionIndex: IBibleBook[] = await Filesystem.readFile({
        path: `${targetDir}/index.json`,
        encoding: FilesystemEncoding.UTF8
    }).then(file => JSON.parse(file.data));

    const versionEntity = await bibleEngine.addVersion(versionData);
    for (const book of versionIndex) {
        /*
         * If you don't want to import all the data right away (due to client resources)
         * you can only save the book metadata and set `dataLocation` to `file` and run
         * `addBookWithContent` later when needed (see next code block)
         */
        await bibleEngine.addBook({
            ...book,
            dataLocation: 'file',
            versionId: versionEntity.id
        });

        /*
         * Alternatively import all the data at once
         */
        const bookData: BookWithContentForInput = await Filesystem.readFile({
            path: `${targetDir}/${book.osisId}.json`,
            encoding: FilesystemEncoding.UTF8
        }).then(file => JSON.parse(file.data));

        await bibleEngine.addBookWithContent(versionEntity.id, bookData);
    }
    return true;
} else {
    console.error(`importing "${importFile}" failed`);
    return false;
}
```
