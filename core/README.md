# @bible-engine/core

## Adding a bible

Please have a look at the example importer `importers/random-version/example.ts` to get a rough idea of the process. Importers for real bibles and/or formats can give you a good starting point, depending on your source format:

-   `NEUE`: HTML files (custom format)
-   `osis`: OSIS format _(coming soon)_
-   `NETS`: plain text _(coming soon)_

If you want to want to start clean, go from here:

```typescript
const sqlBible = new BibleEngine({
    type: 'sqlite',
    database: `${dirProjectRoot}/output/bible.db`
});

const version = await sqlBible.addVersion(
    new BibleVersion({
        version: 'XSB',
        title: 'X Standard Bible',
        language: 'en-US',
        chapterVerseSeparator: ':'
    })
);

const books = [{ num: 1, file: 'gen.xml' }];

for (const book of books) {
    /*
     * Of course the real magic needs to happen in the following line.
     * Your method needs to return data as defined in `models/BibleInput.ts`
     */
    const contents = myParserMethod(book.file);

    await sqlBible.addBookWithContent({
        book: {
            versionId: version.id,
            number: book.num,
            osisId: getOsisIdFromBookGenericId(book.num),
            abbreviation: book.abbr,
            title: book.title,
            type: 'ot'
        },
        contents
    });
}

sqlBible.finalizeVersion(version.id);
```

## using versification normalization

If you want your bible to be converted to standard versification (version versification is still available, however the interal references use standard versification, thus verses can be matched correctly across all bibles) you need to run the `v11n-rules` importer before importing the bible:

```
cd core
npx ts-node src/importers/v11n-rules/v11n-rules.ts
```
