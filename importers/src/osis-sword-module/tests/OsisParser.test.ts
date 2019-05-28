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

  test('section header is included in psalms', () => {
    const bookJson = getBibleEngineInputFromXML([
      { intro: '', verses: psalmsXML.verses }
    ]);
    const sectionHeader = 'The LORD Is My Shepherd';
    expect(true).toBe(true)
    expect(JSON.stringify(bookJson)).toEqual(
      expect.stringContaining(sectionHeader)
    )
  })

  test('psalm title is included', () => {
    const bookJson = getBibleEngineInputFromXML([
      { intro: '', verses: psalmsXML.verses }
    ]);
    let titleGroupExists = false;
    const queue = [bookJson[0]];
    while (queue.length) {
      const top: any = queue.pop();
      if (top['groupType'] === 'title') {
        titleGroupExists = true;
        return;
      }
      if ('contents' in top) {
        queue.push(...top['contents'])
      }
    }
    const partOfPsalmTitle = 'David'
    expect(titleGroupExists).toBe(true)
    expect(JSON.stringify(bookJson)).toEqual(
      expect.stringContaining(partOfPsalmTitle)
    );
  })
});
