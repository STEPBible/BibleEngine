// import { V11nImporter } from './../src/stepdata/v11n-rules/index';
// import { SwordImporter } from './../src/bible/sword/src/importer';
// import { StepLexiconImporter } from './../src/stepdata/step-lexicon/importer';
// import { createReadStream, readFileSync } from 'fs';
import { join } from 'path';
// import { decodeStream, encodeStream } from 'iconv-lite';

import { BeDatabaseCreator } from './../src/BeDatabaseCreator.class';
// import { streamToString } from '../src/shared/helpers.functions';
import { OsisImporter } from '../src/bible/osis';

import { versionMeta, bookMeta } from '../../../emmono/api/data/ESV/meta';
// import { convertNeg79OsisXML } from '../../../emmono/api/data/NEG79/convert';

const run = async () => {
    const creator = new BeDatabaseCreator({
        type: 'sqlite',
        database: join(__dirname, '../../output/biblesOsisTest.db'),
        dropSchema: true
    });

    //   creator.addImporter(V11nImporter);
    //   creator.addImporter(SwordImporter, {
    //     sourcePath: 'src/osis-sword-module/data/ESV2016_th.zip'
    //   });
    //   creator.addImporter(StepLexiconImporter);

    // ESV OSIS import
    const sourcePath = join(
        __dirname,
        '../../../emmono/api/data/ESV/ESV2016_vOSIS+Strongs5_fixed.xml'
    );

    // // NEG79 OSIS import
    // const xml = await streamToString(
    //     createReadStream(
    //         join(__dirname, '../../../emmono/api/data/NEG79/osis.NEG_79_formatted.xml')
    //     )
    //         .pipe(decodeStream('windows1252'))
    //         .pipe(encodeStream('utf8'))
    // );

    creator.addImporter(OsisImporter, {
        // sourceData: convertNeg79OsisXML(xml),
        sourcePath,
        versionMeta,
        bookMeta
    });

    await creator.createDatabase();
};

run();
