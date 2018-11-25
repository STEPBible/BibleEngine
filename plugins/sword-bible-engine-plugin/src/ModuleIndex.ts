import ModuleConfig from './ModuleConfig';
import VerseScheme from './VerseScheme';
const base64 = require('base64-js');

let start = 0;
let buf = null;
let isEnd = false;

/**
 * Index of all book, chapter and verse entry points in a Sword module.
 */
export default class ModuleIndex {
  rawPosOT: object;
  rawPosNT: object;
  binaryOT: Uint8Array;
  binaryNT: Uint8Array;
  config: ModuleConfig;
  constructor(files: object, config: ModuleConfig) {
    const oldTestament: any = {};
    const newTestament: any = {};

    Object.entries(files).forEach(([name, file]: any) => {
      if (name.includes('ot.bzs')) {
        oldTestament.bookPositions = file;
      } else if (name.includes('ot.bzv')) {
        oldTestament.chapterVersePositions = file;
      } else if (name.includes('ot.bzz')) {
        oldTestament.binary = file;
      } else if (name.includes('nt.bzs')) {
        newTestament.bookPositions = file;
      } else if (name.includes('nt.bzv')) {
        newTestament.chapterVersePositions = file;
      } else if (name.includes('nt.bzz')) {
        newTestament.binary = file;
      }
    });

    const versification = config.versification;

    const bookPosOT = this.getBookPositions(oldTestament.bookPositions);
    const rawPosOT = this.getChapterVersePositions(oldTestament.chapterVersePositions,
                                                   bookPosOT, 'ot', versification);

    const bookPosNT = this.getBookPositions(newTestament.bookPositions);
    const rawPosNT = this.getChapterVersePositions(newTestament.chapterVersePositions,
                                                   bookPosNT, 'nt', versification);

    this.rawPosOT = rawPosOT;
    this.rawPosNT = rawPosNT;
    this.binaryOT = oldTestament.binary;
    this.binaryNT = newTestament.binary;
    this.config = config;
  }

  static fromNodeBuffer(buffer: Buffer): ModuleIndex {
    const jSZip = require('jszip');
    const zip = new jSZip(buffer);
    const filenames = Object.keys(zip.files);
    const files: any = {};
    let moduleConfigFile: Uint8Array = new Uint8Array();
    filenames.forEach((name: string) => {
      files[name] = zip.files[name].asUint8Array();
      if (name.includes('.conf')) {
        moduleConfigFile = files[name];
      }
    });
    const configBuffer = this.blobToBuffer(moduleConfigFile);
    const configString = configBuffer.toString();
    const moduleConfig = new ModuleConfig(configString);
    return new ModuleIndex(files, moduleConfig);
  }

  serializeAsJson() {
    return {
      rawPosOT: this.rawPosOT,
      rawPosNT: this.rawPosNT,
      binaryOT: base64.fromByteArray(this.binaryOT),
      binaryNT: base64.fromByteArray(this.binaryNT),
      config: this.config,
    };
  }

  static fromSerializedJson(json: any) {
    return {
      rawPosOT: json.rawPosOT,
      rawPosNT: json.rawPosNT,
      binaryOT: base64.toByteArray(json.binaryOT),
      binaryNT: base64.toByteArray(json.binaryNT),
      config: json.config,
    };
  }

  static blobToBuffer(blob: Uint8Array) {
    const buffer = Buffer.alloc(blob.byteLength);
    const view = new Uint8Array(blob);
    for (let i = 0; i < buffer.length; i += 1) {
      buffer[i] = view[i];
    }
    return buffer;
  }

  // Get the positions of each book
  getBookPositions(inBuf: Uint8Array) {
    let startPos = 0,
      length: any = 0,
      unused = 0,
      res: any = null,
      end: any = false,
      bookPositions = [];
    start = 0;

    while (!end) {
      res = this.getIntFromStream(inBuf);
      startPos = res[0];
      end = res[1];
      if (!end) {
        res = this.getIntFromStream(inBuf);
        length = res[0];
        end = res[1];
        if (!end) {
          res = this.getIntFromStream(inBuf);
          unused = res[0];
          end = res[1];
          if (end) { break; }
          bookPositions.push({ startPos, length, unused });
        }
      }
    }
    return bookPositions;
  }

  // dump some bytes in the chapter and verse index file
  dumpBytes(inBuf: Uint8Array) {
    start = 0;

    for (let i = 0; i < 4; i += 1) {
      this.getShortIntFromStream(inBuf);
      this.getInt48FromStream(inBuf);
      this.getShortIntFromStream(inBuf);
    }
  }
  // ### This code is based on the zTextReader class from cross-connect (https://code.google.com/p/cross-connect), Copyright (C) 2011 Thomas Dilts ###

  // Get the position of each chapter and verse
  getChapterVersePositions(inBuf: Uint8Array, inBookPositions: { length: number, startPos: number, unused: number }[], inTestament: string, inV11n: string) {
    this.dumpBytes(inBuf);
    const booksStart = (inTestament === 'ot') ? 0 : VerseScheme.getBooksInOT(inV11n);
    const booksEnd = (inTestament === 'ot') ? VerseScheme.getBooksInOT(inV11n) : VerseScheme.getBooksInOT(inV11n) + VerseScheme.getBooksInNT(inV11n);
    let chapterStartPos = 0,
      lastNonZeroStartPos: any = 0,
      length: any = 0,
      chapterLength: any = 0,
      bookStartPos: any = 0,
      booknum: any = 0,
      verseMax: any = 0,
      bookData: any = null,
      startPos: any = 0,
      chapt: any = {},
      foundEmptyChapter = 0,
      chapters: any = {};

    for (let b = booksStart; b < booksEnd; b++) {
      bookData = VerseScheme.getBook(b, inV11n);
      chapters[bookData.abbrev] = [];
      foundEmptyChapter = 0;
      // console.log(bookData, chapters);
      for (let c = 0; c < bookData.maxChapter; c++) {
        chapterStartPos = 0;
        lastNonZeroStartPos = 0;
        chapt = {};
        chapt.verses = [];
        length = 0;
        verseMax = VerseScheme.getVersesInChapter(b, c + 1, inV11n);
        for (let v = 0; v < verseMax; v++) {
          booknum = this.getShortIntFromStream(inBuf)[0];
          startPos = this.getInt48FromStream(inBuf)[0];

          if (startPos !== 0) { lastNonZeroStartPos = startPos; }

          length = this.getShortIntFromStream(inBuf)[0];
          // console.log('startPos, length', startPos, length);
          if (v === 0) {
            chapterStartPos = startPos;
            bookStartPos = 0;
            if (booknum < inBookPositions.length) {
            // console.log('inBookPositions.startPos', inBookPositions[booknum].startPos, booknum, inBookPositions.length);
              bookStartPos = inBookPositions[booknum].startPos;
            }
            chapt.startPos = chapterStartPos;
            chapt.booknum = b;
            // chapt['bookRelativeChapterNum'] = c;
            chapt.bookStartPos = bookStartPos;
          }
          if (booknum === 0 && startPos === 0 && length === 0) {
            if (chapt !== {}) {
              chapt.verses.push({ startPos: 0, length: 0 });
            }
          } else if (chapt !== {}) {
            chapt.verses.push({ startPos: startPos - chapterStartPos, length });
          }
        } // end verse
        if (chapt !== {}) {
        // console.log('LENGTH:', lastNonZeroStartPos, chapterStartPos, length, c, chapt, chapters);
          chapterLength = lastNonZeroStartPos - chapterStartPos + length;
          chapt.length = chapterLength;
          chapters[bookData.abbrev].push(chapt);
          if (isNaN(chapterLength) || chapterLength === 0) {
            foundEmptyChapter++;
          }
        }
        // dump a post for the chapter break
        this.getShortIntFromStream(inBuf);
        this.getInt48FromStream(inBuf);
        this.getShortIntFromStream(inBuf);
      } // end chapters
      // console.log('Empty Chapters:', foundEmptyChapter);
      if (foundEmptyChapter === bookData.maxChapter) {
        delete chapters[bookData.abbrev];
      }
      // dump a post for the book break
      this.getShortIntFromStream(inBuf);
      this.getInt48FromStream(inBuf);
      this.getShortIntFromStream(inBuf);
    } // end books
    return chapters;
  }

  getRawPositions(inFile: any, inTestament: any, inV11n: any) {
    start = 0;
    // Dump the first 12 bytes
    this.getInt48FromStream(inFile);
    this.getInt48FromStream(inFile);

    const booksStart = (inTestament === 'ot') ? 0 : VerseScheme.getBooksInOT(inV11n);
    const booksEnd = (inTestament === 'ot') ? VerseScheme.getBooksInOT(inV11n) : VerseScheme.getBooksInOT(inV11n) + VerseScheme.getBooksInNT(inV11n);
    let length: any = 0,
      verseMax = 0,
      bookData: any = null,
      startPos: any = 0,
      data: any = {},
      osis = '';

    for (let b = booksStart; b < booksEnd; b++) {
      bookData = VerseScheme.getBook(b, inV11n);
      // Skip Book Record (6 bytes)
      this.getIntFromStream(inFile);
      this.getShortIntFromStream(inFile);
      for (let c = 0; c < bookData.maxChapter; c++) {
        verseMax = VerseScheme.getVersesInChapter(b, c + 1, inV11n);

        // Skip Chapter Record
        this.getIntFromStream(inFile);
        this.getShortIntFromStream(inFile);

        for (let v = 0; v < verseMax; v++) {
          startPos = this.getIntFromStream(inFile)[0];
          length = this.getShortIntFromStream(inFile)[0];
          if (length !== 0) {
          // console.log('VERSE', startPos, length);
            osis = `${bookData.abbrev}.${parseInt(String(c + 1), 10)}.${parseInt(String(v + 1), 10)}`;
            data[osis] = { startPos, length };
          }
        } // end verse
      } // end chapters
    } // end books
    return data;
  }

  getIntFromStream(inBuf: Uint8Array) {
    buf = inBuf.subarray(start, start + 4);
    isEnd = false;
    start += 4;
    if (buf.length !== 4) { isEnd = true; }
    return [buf[3] * 0x100000 + buf[2] * 0x10000 + buf[1] * 0x100 + buf[0], isEnd];
  }

  getShortIntFromStream(inBuf: Uint8Array) {
    buf = inBuf.subarray(start, start + 2);
    isEnd = false;
    start += 2;
    if (buf.length !== 2) { isEnd = true; }
    return [buf[1] * 0x100 + buf[0], isEnd];
  }

  getInt48FromStream(inBuf: Uint8Array) {
    buf = inBuf.subarray(start, start + 6);
    isEnd = false;
    start += 6;
    if (buf.length !== 6) { isEnd = true; }
    return [buf[1] * 0x100000000000 + buf[0] * 0x100000000 + buf[5] * 0x1000000 + buf[4] * 0x10000 + buf[3] * 0x100 + buf[2], isEnd];
  }
}
