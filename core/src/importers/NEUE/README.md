# NeÜ Importer for BibleEngine

## Source files

This importer works with the NeÜ source files from https://neue.derbibelvertrauen.de, which need to be downloaded and put within the directory `html` with their original filenames (as referenced in `meta/books.ts`).

Use of the NeÜ requires permission of its author [Karl-Heinz Vanheiden](https://www.derbibelvertrauen.de/neue-bibel-heute/ausgaben-der-neue/74-digitale-ausgaben.html).

The importer may/will of course break if the structure of the source files change (working as of January 2019). There is a backup of the files, but since the author updates the translation continuously, he may not allow old version to be used. In any case, files will only be shared via his permission.

## Manual preparations before running the importer

There are a few fixes listed in `source-fixes.txt` that need to be applied before the HTML files can be imported without error.

## Running the parser / importer

After the source files are in place and the fixes applied, run the file `neue.import.ts` (possibly via `npx ts-node ...`).

The data will be added to the database `@bible-engine/core/output/bible.db`. If you need the normalized versification, make sure to run the `v11n-rules` importer before.
