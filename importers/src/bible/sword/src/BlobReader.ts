const pako = require('pako');

import * as types from './types';

/**
 * Converts blobs to XML.
 */
export default class BlobReader {
    static getXMLforChapter(
        testamentBlob: Uint8Array,
        positions: types.ChapterPosition[],
        verses: types.VerseMetadata[],
        encoding: string
    ): types.ChapterXML {
        if (!verses[0]) throw new Error(`empty verses array passed to 'getXMLforChapter'`);
        const { chapter } = verses[0];
        if (!positions[chapter - 1]) {
            throw new Error(`can't find chapter ${chapter} in this module`);
        }
        // Assumption is that all verses must have same chapter
        const { bookStartPos } = positions[chapter - 1]!;
        const { startPos } = positions[chapter - 1]!;
        const { length } = positions[chapter - 1]!;
        const chapterStartPos = bookStartPos + startPos;
        const chapterEndPos = chapterStartPos + length;
        const blob = testamentBlob.slice(bookStartPos, chapterEndPos);

        const finalBlob = this.decompressBlob(blob);
        // console.log(Buffer.from(finalBlob).toString());

        const introText: string = this.getChapterIntro(
            finalBlob,
            startPos,
            positions,
            chapter,
            encoding
        );
        const renderedVerses: types.VerseXML[] = [];

        // Extract XML from each verse
        verses.forEach((verse: types.VerseMetadata) => {
            const verseXML: string = this.getXMLforVerse(
                verse,
                startPos,
                positions,
                finalBlob,
                encoding
            );
            renderedVerses.push({ text: verseXML, verse: verse.verse });
        });

        const chapterXML: types.ChapterXML = {
            intro: introText,
            verses: renderedVerses,
        };

        return chapterXML;
    }

    static getXMLforVerse(
        verse: types.VerseMetadata,
        startPos: number,
        positions: types.ChapterPosition[],
        blob: Uint8Array,
        encoding: string
    ) {
        if (!positions[verse.chapter - 1] || !positions[verse.chapter - 1]!.verses[verse.verse - 1])
            throw new Error(
                `missing chapter positions for chapter ${verse.chapter - 1} and verse ${
                    verse.verse - 1
                }`
            );
        const verseStart =
            startPos + positions[verse.chapter - 1]!.verses[verse.verse - 1]!.startPos;
        const verseEnd = verseStart + positions[verse.chapter - 1]!.verses[verse.verse - 1]!.length;
        return this.blobToString(blob.slice(verseStart, verseEnd), encoding);
    }

    static getChapterIntro(
        blob: any,
        startPos: number,
        positions: types.ChapterPosition[],
        chapter: number,
        encoding: string
    ) {
        let verseStart = 0;
        const verseEnd = startPos;
        if (chapter !== 1) {
            if (!positions[chapter - 2])
                throw new Error(`missing chapter positions for chapter ${chapter - 2}`);
            verseStart = positions[chapter - 2]!.startPos + positions[chapter - 2]!.length;
        }
        const introBlob = blob.slice(verseStart, verseEnd);
        const introText = this.blobToString(introBlob, encoding);
        return introText;
    }

    static blobToString(blob: Uint8Array, encoding: string) {
        return Buffer.from(blob).toString(encoding);
    }

    static decompressBlob(blob: Uint8Array) {
        const inflator = new pako.Inflate();
        const array = new Uint8Array(blob);
        inflator.push(array, true);
        if (inflator.err) {
            throw new Error(`Failed to decompress blob, inflator error: ${inflator.err}`);
        }
        if (!inflator.result) {
            throw new Error(`pako failed to decompress blob, invalid result`);
        }
        const decompressedBlob = inflator.result;
        return decompressedBlob;
    }
}
