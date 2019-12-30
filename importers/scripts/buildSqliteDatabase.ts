import { V11nImporter } from './../src/stepdata/v11n-rules/index';
import { SwordImporter } from './../src/bible/sword/src/importer';
import { StepLexiconImporter } from './../src/stepdata/step-lexicon/importer';
import { BeDatabaseCreator } from './../src/BeDatabaseCreator.class';

const run = async () => {
    const creator = new BeDatabaseCreator({
        type: 'sqlite',
        database: 'bibles.db'
    });
    creator.addImporter(V11nImporter);
    creator.addImporter(SwordImporter, {
        sourcePath: 'src/bible/sword/data/ESV2016_th.zip'
    });
    creator.addImporter(StepLexiconImporter);

    await creator.createDatabase();
};

run();
