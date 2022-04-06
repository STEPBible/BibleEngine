import { createReadStream } from 'fs';
import { join } from 'path';
import { decodeStream, encodeStream } from 'iconv-lite';

import { BeDatabaseCreator } from './../src/BeDatabaseCreator.class';
import { streamToString } from '../src/shared/helpers.functions';
import { CsvImporter } from '../src/bible/csv';

import { V11nImporter } from '../src/stepdata/v11n-rules';

import { bookMeta, versionMeta } from '../../../emmono/api/data/GBV/meta';

const run = async (
    imports: { v11n?: boolean } = {
        v11n: true,
    }
) => {
    const creator = new BeDatabaseCreator({
        type: 'sqlite',
        database: join(__dirname, '../../output/biblesCsvTest.db'),
        dropSchema: true,
    });

    if (imports.v11n) creator.addImporter(V11nImporter);

    creator.addImporter(CsvImporter, {
        sourcePath: join(__dirname, '../../../emmono/api/data/GBV/BibleVerse_normalized.csv'),
        versionMeta,
        bookMeta,
    });

    await creator.createDatabase();
};

run({ v11n: true });
