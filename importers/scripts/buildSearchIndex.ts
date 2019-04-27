import { BibleEngine } from '@bible-engine/core'
import { BeDatabaseCreator, SwordImporter } from '@bible-engine/importers';

const elasticlunr = require('elasticlunr');
const fs = require('fs');

const run = async () => {

  const creator = new BeDatabaseCreator({
    type: 'sqlite',
    database: 'bibles.db',
    dropSchema: true
  });

  creator.addImporter(SwordImporter, 'src/osis-sword-module/data/ESV2016_th.zip');

  await creator.createDatabase();

  const sqlBible = new BibleEngine({
    name: 'anotherConnection',
    database: 'bibles.db',
    type: 'sqlite',
    synchronize: false
  });

  const searchIndex = elasticlunr(function(this: any) {
    this.setRef('t');
    this.addField('b');
  });

  const books = await sqlBible.getVersionPlaintextNormalized('ESV');
  for (let [bookName, bookContent] of books) {
    console.log(bookName)
    for (let [chapterNum, chapterContent] of bookContent) {
      for (let [verseNum, verseContent] of chapterContent) {
        searchIndex.addDoc({
          b: bookName,
          c: chapterNum,
          v: verseNum,
          t: `${bookName} ${chapterNum}:${verseNum}`,
          vc: verseContent
        });
      }
    }
  }
  fs.writeFileSync('searchIndex.json', JSON.stringify(searchIndex));
}

run()



