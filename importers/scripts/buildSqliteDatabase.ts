import { SwordImporter } from './../src/osis-sword-module/src/importer';
import { StepLexiconImporter } from './../src/step-lexicon/importer';
import { BeDatabaseCreator } from './../src/BeDatabaseCreator.class';

const run = async () => {
  const creator = new BeDatabaseCreator({
    type: 'sqlite',
    database: 'bibles.db',
    dropSchema: true
  });

  creator.addImporter(SwordImporter, {
    sourcePath: 'src/osis-sword-module/data/ESV2016_th.zip'
  });
  creator.addImporter(StepLexiconImporter)

  await creator.createDatabase();
};

run();
