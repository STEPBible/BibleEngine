import VerseScheme from './VerseScheme';
const bcvParser = require('bible-passage-reference-parser/js/en_bcv_parser').bcv_parser;

const bcv = new bcvParser();

function parseVkey(inVKey: string, inV11n: string) {
  const key: any = {};
  key.osisRef = bcv.parse(inVKey).osis();
  if (key.osisRef === '') {
    // bcv.parse().osis() returns "" for passages it cannot resolve
    key.osisRef = 'Matt.1'; // bcv.parse(inVKey + " 1").osis();
  }
  const split = key.osisRef.split('-')[0].split('.');

  key.book = split[0];
  key.chapter = (isNaN(parseInt(split[1], 10))) ? 1 : parseInt(split[1], 10);
  key.verse = parseInt(split[2], 10);
  key.bookNum = VerseScheme.getBookNum(key.book, inV11n);
  // console.log(key, key.osisRef, split);
  return key;
}

function parseVerseList(inVKey: string, inV11n: string) {
  const verseList: any = [];
  const key = parseVkey(inVKey, inV11n);

  // Check if we have a passage range like John.3.10-John.3.16 or Gen.3-Gen.4
  if (key.osisRef.search('-') !== -1) {
    const singlePassages = key.osisRef.split('-'),
      // start = singlePassages[0].split('.'),
      end = singlePassages[1].split('.');

    if (!isNaN(key.verse) && end.length === 3) {
      for (let z = key.verse; z < parseInt(end[2], 10) + 1; z++) {
        verseList.push({
          osis: `${key.book}.${key.chapter}.${z}`, book: key.book, bookNum: key.bookNum, chapter: key.chapter, verse: z,
        });
      }
    }
    // check if we have a passage like Mt 3 or Ps 123
  } else if (isNaN(key.verse)) {
    const bookNum = VerseScheme.getBookNum(key.book, inV11n);
    const verseMax = VerseScheme.getVersesInChapter(bookNum, key.chapter, inV11n);
    for (let i = 0; i < verseMax; i += 1) {
      verseList.push({
        osis: `${key.book}.${key.chapter}.${i + 1}`, book: key.book, bookNum, chapter: key.chapter, verse: i + 1,
      });
    }
  } else {
    verseList.push(key);
  }

  return verseList;
}

function next(inVKey: string, inV11n: string) {
  const key: any = parseVkey(inVKey, inV11n),
    maxChapter = VerseScheme.getChapterMax(key.bookNum, inV11n);

  if (key.chapter < maxChapter) {
    key.chapter++;
  } else {
    key.bookNum = (key.bookNum < 65) ? ++key.bookNum : 65;
    key.chapter = (key.bookNum < 65) ? 1 : maxChapter;
    key.book = VerseScheme.getBook(key.bookNum, inV11n).abbrev;
  }
  key.osisRef = `${key.book}.${key.chapter}`;

  return key;
}

function previous(inVKey: string, inV11n: string) {
  const key = parseVkey(inVKey, inV11n),
    maxChapter = VerseScheme.getChapterMax(key.bookNum - 1, inV11n);

  if (key.chapter > 1) {
    --key.chapter;
  } else {
    key.chapter = (key.bookNum === 0) ? 1 : maxChapter;
    key.bookNum = (key.bookNum > 0) ? --key.bookNum : 0;
    key.book = VerseScheme.getBook(key.bookNum, inV11n).abbrev;
  }
  key.osisRef = `${key.book}.${key.chapter}`;

  return key;
}

module.exports = {
  parseVkey,
  parseVerseList,
  next,
  previous,
};
