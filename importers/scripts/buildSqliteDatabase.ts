import { V11nImporter } from './../src/stepdata/v11n-rules/index';
import { StepLexiconImporter } from './../src/stepdata/step-lexicon/importer';
import { BeDatabaseCreator } from './../src/BeDatabaseCreator.class';

const run = async () => {
    const creator = new BeDatabaseCreator({
        type: 'sqlite',
        database: 'bibles.db'
    });
    creator.addImporter(V11nImporter);
    creator.addImporter(StepLexiconImporter);

    await creator.createDatabase();
};

run();
