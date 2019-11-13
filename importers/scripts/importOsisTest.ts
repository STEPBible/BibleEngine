import { createReadStream, readFileSync } from 'fs';
import { join } from 'path';
import { decodeStream, encodeStream } from 'iconv-lite';

import { BeDatabaseCreator } from './../src/BeDatabaseCreator.class';
import { streamToString } from '../src/shared/helpers.functions';
import { OsisImporter } from '../src/bible/osis';

import {
    versionMeta as versionMetaESV,
    bookMeta as bookMetaESV
} from '../../../emmono/api/data/ESV/meta';
import { convertNeg79OsisXML } from '../../../emmono/api/data/NEG79/convert';
import {
    versionMeta as versionMetaNeg79,
    bookMeta as bookMetaNeg79
} from '../../../emmono/api/data/NEG79/meta';
import { V11nImporter } from '../src/stepdata/v11n-rules';

const run = async (
    imports: { v11n?: boolean; esv?: boolean; neg79?: boolean } = {
        v11n: true,
        esv: true,
        neg79: true
    }
) => {
    const creator = new BeDatabaseCreator({
        type: 'sqlite',
        database: join(__dirname, '../../output/biblesOsisTest.db'),
        dropSchema: true
    });

    if (imports.v11n) creator.addImporter(V11nImporter);

    if (imports.esv) {
        // ESV OSIS import
        const sourcePath = join(
            __dirname,
            '../../../emmono/api/data/ESV/ESV2016_vOSIS+Strongs5_fixed.xml'
        );

        creator.addImporter(OsisImporter, {
            sourcePath,
            versionMeta: versionMetaESV,
            bookMeta: bookMetaESV
        });
    }

    if (imports.neg79) {
        // NEG79 OSIS import
        const xml = await streamToString(
            createReadStream(
                join(__dirname, '../../../emmono/api/data/NEG79/osis.NEG_79_formatted.xml')
            )
                .pipe(decodeStream('windows1252'))
                .pipe(encodeStream('utf8'))
        );

        creator.addImporter(OsisImporter, {
            sourceData: convertNeg79OsisXML(xml),
            versionMeta: versionMetaNeg79,
            bookMeta: bookMetaNeg79
        });
    }

    await creator.createDatabase();
};

run({ esv: true });
