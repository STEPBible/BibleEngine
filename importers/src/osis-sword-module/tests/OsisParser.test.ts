import * as types from '../src/types';
import { getBibleEngineInputFromXML } from '../src/OsisParser';

test('BibleEngine database is loaded correctly', async () => {
  const psalmsXML: types.ChapterXML = require('./Psa23EsvXmlResult.json');
  const shortBookXML: types.ChapterXML[] = [
    {
      intro: '',
      verses: psalmsXML.verses
    }
  ];
  const bookJson = getBibleEngineInputFromXML(shortBookXML);
  const expectedBookJson = require('./psalm23EsvExpected.json');
  expect(bookJson).toEqual(expectedBookJson);
});
