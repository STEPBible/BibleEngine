# @bible-engine/core

## Writing data

If you want to create a BibleEngine database, your starting point should be the [importers](../importers) package which includes helper classes and importers for bible formats like `OSIS` and `sword`.

However you can also use core methods directly for writing if you prefer that:

```typescript
import { BibleEngine } from '@bible-engine/core';

const bibleEngine = new BibleEngine({
    type: 'sqlite',
    database: `${dirProjectRoot}/output/bible.db`,
});

const version = await bibleEngine.addVersion(
    new BibleVersion({
        version: 'XSB',
        title: 'X Standard Bible',
        language: 'en-US',
        chapterVerseSeparator: ':',
    })
);

const books = [{ num: 1, file: 'gen.xml' }];

for (const book of books) {
    /*
     * Of course the real magic needs to happen in the following line.
     * Your method needs to return data as defined in `models/BibleInput.ts`
     */
    const contents = myParserMethod(book.file);

    await bibleEngine.addBookWithContent(version.id, {
        book: {
            number: book.num,
            osisId: getOsisIdFromBookGenericId(book.num),
            abbreviation: book.abbr,
            title: book.title,
            type: 'ot',
        },
        contents,
    });
}

bibleEngine.finalizeVersion(version.id);
```

## Reading from `BibleEngine`

If you want to read from a BibleEngine database or server, your starting point should be the [client](../client) package which takes care of using a local database with an automatic server-fallback (if data is missing or if you want to use the same code for web- and native app).

Example for reading data from a local BibleEngine database using core-methods (e.g. if server-access is not needed):

```typescript
import { BibleEngine } from '@bible-engine/core';

const bibleEngine = new BibleEngine({
    type: 'sqlite',
    database: `${dirProjectRoot}/output/bible.db`,
});

const bibleData = await bibleEngine.getFullDataForReferenceRange({
    versionUid: 'ESV',
    bookOsisId: 'Gen',
    versionChapterNum: 1,
});
```
