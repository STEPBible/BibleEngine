const kjvJson = require('../data/kjv.json');
const germanJson = require('../data/german.json');
const catholicJson = require('../data/catholic.json');
const catholic2Json = require('../data/catholic2.json');
const kjvaJson = require('../data/kjva.json');
const leningradJson = require('../data/leningrad.json');
const lutherJson = require('../data/luther.json');
const lxxJson = require('../data/lxx.json');
const mtJson = require('../data/mt.json');
const nrsvJson = require('../data/nrsv.json');
const nrsvaJson = require('../data/nrsva.json');
const orthodoxJson = require('../data/orthodox.json');
const synodalJson = require('../data/synodal.json');
const synodalprotJson = require('../data/synodalprot.json');
const vulgJson = require('../data/vulg.json');

const versificationMgr: any = {};

versificationMgr.kjv = kjvJson;
versificationMgr.german = germanJson;
versificationMgr.catholic = catholicJson;
versificationMgr.catholic2 = catholic2Json;
versificationMgr.kjva = kjvaJson;
versificationMgr.leningrad = leningradJson;
versificationMgr.luther = lutherJson;
versificationMgr.lxx = lxxJson;
versificationMgr.mt = mtJson;
versificationMgr.nrsv = nrsvJson;
versificationMgr.nrsva = nrsvaJson;
versificationMgr.orthodox = orthodoxJson;
versificationMgr.synodal = synodalJson;
versificationMgr.synodalprot = synodalprotJson;
versificationMgr.vulg = vulgJson;

function getBooksInOT(v11n: string) {
  if (v11n !== undefined && versificationMgr[v11n]) {
    return versificationMgr[v11n].ot.length;
  }
  return versificationMgr.kjv.ot.length;
}

function getBooksInNT(v11n: string) {
  if (v11n !== undefined && versificationMgr[v11n]) {
    return versificationMgr[v11n].nt.length;
  }
  return versificationMgr.kjv.nt.length;
}

function getChapterMax(inBookNum: number, v11n: string): number {
  inBookNum = inBookNum < 0 ? 0 : inBookNum;
  const booksOT = getBooksInOT(v11n);
  const testament = inBookNum < booksOT ? 'ot' : 'nt';
  inBookNum = inBookNum < booksOT ? inBookNum : inBookNum - booksOT;
  if (v11n !== undefined && versificationMgr[v11n]) {
    return versificationMgr[v11n][testament][inBookNum].maxChapter;
  }
  return versificationMgr.kjv[testament][inBookNum].maxChapter;
}

function getVersesInChapter(
  inBookNum: number,
  inChapter: number,
  v11n: string
) {
  if (v11n !== undefined && versificationMgr[v11n]) {
    return versificationMgr[v11n].versesInChapter[inBookNum][inChapter - 1];
  }
  return versificationMgr.kjv.versesInChapter[inBookNum][inChapter - 1];
}

function getBook(inBookNum: number, v11n: string) {
  inBookNum = inBookNum < 0 ? 0 : inBookNum;
  const booksOT = getBooksInOT(v11n);
  const testament = inBookNum < booksOT ? 'ot' : 'nt';
  inBookNum = inBookNum < booksOT ? inBookNum : inBookNum - booksOT;
  if (v11n !== undefined && versificationMgr[v11n]) {
    return versificationMgr[v11n][testament][inBookNum];
  }
  return versificationMgr.kjv[testament][inBookNum];
}

function getAllBookOsisNames(v11n: string): string[] {
  const otNames = versificationMgr[v11n].ot.map((book: any) => book.abbrev);
  const ntNames = versificationMgr[v11n].nt.map((book: any) => book.abbrev);
  return [...otNames, ...ntNames];
}

function getAllBookFullNames(v11n: string): string[] {
  const otNames = versificationMgr[v11n].ot.map((book: any) => book.name);
  const ntNames = versificationMgr[v11n].nt.map((book: any) => book.name);
  return [...otNames, ...ntNames];
}

function getBookNum(inOsis: string, v11n: string) {
  const otNames = versificationMgr[v11n].ot.map((book: any) => book.abbrev);
  const ntNames = versificationMgr[v11n].nt.map((book: any) => book.abbrev);
  const names = [...otNames, ...ntNames];
  const bookNum = names.indexOf(inOsis);
  return bookNum;
}

export default {
  getAllBookFullNames,
  getAllBookOsisNames,
  getBooksInOT,
  getBooksInNT,
  getChapterMax,
  getVersesInChapter,
  getBook,
  getBookNum
};
