import { SwordImporter } from './../src/osis-sword-module/src/importer';
import { StepLexiconImporter } from './../src/step-lexicon/importer';
import { BeDatabaseCreator } from './../src/BeDatabaseCreator.class';

const run = async () => {
    console.log(process.env.DATABASE_URL)
  const creator = new BeDatabaseCreator({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: true,
    dropSchema: true
  });

  creator.addImporter(SwordImporter, {
    sourcePath: 'src/osis-sword-module/data/ESV2016_th.zip'
  });
  creator.addImporter(SwordImporter, {
    sourcePath: 'src/osis-sword-module/data/ChiUns.zip',
    versionMeta: {
      title: 'Chinese Union Version',
      uid: 'CUVs',
      copyrightShort: 'Asia Bible Society 2013',
      language: 'zh',
      hasStrongs: true
    }
  });
  creator.addImporter(StepLexiconImporter)

  await creator.createDatabase();
};

run();
