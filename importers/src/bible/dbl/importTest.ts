import { resolve } from 'path';
import { DblImporter } from '.';
import { BeDatabaseCreator, V11nImporter } from '../..';

const run = async () => {
    const creator = new BeDatabaseCreator({
        type: 'sqlite',
        database: resolve(__dirname) + `/bible.db`,
        dropSchema: true,
    });

    creator.addImporter(V11nImporter);

    const translations = [
        'arb-NAV-24722a3b9010fa47-rev4-2019-04-23-release',
        'hin-HCV-7b0652d936a271b6-rev1-2019-06-28-release',
        'cmn-CCB-d125bceacf2fa912-rev6-2021-02-12-release',
        'pes-PCB-e95f4ff7407fc936-rev8-2021-02-11-release',
        'cmn-CCBT-517f2ffe6433ad18-rev5-2018-05-26-release',
        'por-NVIP-867d75564182779d-rev9-2018-01-18-release',
        'eng-NIV11-78a9f6124f344018-rev7-2021-08-27-release',
        'rus-NRT-0f38fd5da9d586dc-rev8-2022-02-08-release',
        'eng-NIV11UK-3e2eb613d45e131e-rev10-2021-08-19-release',
        'spa-NVI-5900e04ba5a99884-rev17-2019-07-01-release',
        'fra-BDS-6f26e199139ea7f1-rev6-2021-08-19-release',
        'swh-NEN-def16ae158c3e79f-rev6-2018-10-10-release',
    ];

    for (const translationFolder of translations) {
        creator.addImporter(DblImporter, {
            sourcePath: resolve(__dirname) + '/../../../../../data/Biblica/' + translationFolder,
            logLevel: 'info',
        });
    }
    return creator.createDatabase();
};

run()
    .then(() => process.exit())
    .catch((e) => console.error(e));
