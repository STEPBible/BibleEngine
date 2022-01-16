import { BeDatabaseCreator } from './../src/BeDatabaseCreator.class';
import { StepLexiconImporter } from './../src/stepdata/step-lexicon/importer';

const run = async () => {
    const creator = new BeDatabaseCreator({
        type: 'better-sqlite3',
        database: 'lexicons.db'
    });
    creator.addImporter(StepLexiconImporter);
    await creator.createDatabase();
};

run();
