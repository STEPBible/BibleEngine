import { resolve } from 'path';
import { BookXML } from './types';
import SwordModule from './SwordModule';
import ModuleIndex from './ModuleIndex';
import { BibleEngine } from '../../../BibleEngine.class';
import { BibleVersion } from '../../../entities';
import { getBibleEngineInputFromXML } from './OsisParser';

const fs = require('fs');

const dirProjectRoot = resolve(__dirname + '/../../../..');

const sqlBible = new BibleEngine({
  type: 'sqlite',
  database: `${dirProjectRoot}/output/bible.db`
});

function getXmlFromModule(filename: string): BookXML[] {
  const contents = fs.readFileSync(filename);
  const fileIndex = ModuleIndex.fromNodeBuffer(contents);
  const swordModule = new SwordModule(fileIndex);
  const booksXML = swordModule.getXMLForVersion();
  return booksXML;
}

async function generateDatabase() {
  const esvVersion = await sqlBible.addVersion(
    new BibleVersion({
      uid: 'ESV',
      title: 'English Standard Bible',
      language: 'en-US',
      chapterVerseSeparator: ':'
    })
  );
  const path = require('path');
  const filename = path.join(__dirname, '../data/ESV2016_th.zip');
  const books = getXmlFromModule(filename);

  for (const book of books) {
    console.log(book.osisId);
    const bookJson = getBibleEngineInputFromXML(book.chapters);
    await sqlBible.addBookWithContent({
      book: {
        versionId: esvVersion.id,
        number: book.bookNum,
        osisId: book.osisId,
        abbreviation: book.osisId,
        title: book.fullName,
        type: book.bookNum < 40 ? 'ot' : 'nt'
      },
      contents: bookJson
    });
  }
  sqlBible.finalizeVersion(esvVersion.id);
}

generateDatabase();

export { getXmlFromModule, generateDatabase };
