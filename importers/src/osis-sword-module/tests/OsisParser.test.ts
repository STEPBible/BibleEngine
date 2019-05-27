import * as types from '../src/types';
import { getBibleEngineInputFromXML } from '../src/OsisParser';

describe('OsisParser', () => {
  const psalmsXML: types.ChapterXML = require('./Psa23EsvXmlResult.json');

  test('footnote associated with phrase that comes before, not after', async () => {
    const psalm23verse2 = [psalmsXML.verses[1]];
    const bookJson = getBibleEngineInputFromXML([
      { intro: '', verses: psalm23verse2 }
    ]);
    const footnoteText = 'waters of rest';
    expect(JSON.stringify(bookJson)).toEqual(
      expect.stringContaining(footnoteText)
    );
  });
});
