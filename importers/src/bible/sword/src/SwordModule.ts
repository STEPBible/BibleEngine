import ModuleIndex from './ModuleIndex';
import ModuleConfig from './ModuleConfig';
import VerseScheme from './VerseScheme';
const verseKey = require('./VerseMetadata');
import BlobReader from './BlobReader';
import { ChapterPosition, ChapterXML, BookXML, VerseXML } from './types';
import { ImporterBookMetadata } from '../../../shared/Importer.interface';

/**
 * Set of files which encapsulates a Bible version.
 */
export default class SwordModule {
    rawPosOT: any;
    rawPosNT: any;
    binaryOT: Uint8Array;
    binaryNT: Uint8Array;
    config: ModuleConfig;
    constructor(index: ModuleIndex) {
        this.rawPosOT = index.rawPosOT;
        this.rawPosNT = index.rawPosNT;
        this.binaryOT = index.binaryOT;
        this.binaryNT = index.binaryNT;
        this.config = index.config;
    }

    static blobToBuffer(blob: Uint8Array) {
        const buffer = Buffer.alloc(blob.byteLength);
        const view = new Uint8Array(blob);
        for (let i = 0; i < buffer.length; i += 1) {
            buffer[i] = view[i];
        }
        return buffer;
    }

    getXMLforChapter(verseRange: string): ChapterXML {
        const verseList = verseKey.parseVerseList(verseRange, this.config.versification);
        let bookPosition: ChapterPosition[];
        let binaryBlob: Uint8Array;

        if (this.rawPosOT.hasOwnProperty(verseList[0].book)) {
            bookPosition = this.rawPosOT[verseList[0].book];
            binaryBlob = this.binaryOT;
        } else if (this.rawPosNT.hasOwnProperty(verseList[0].book)) {
            bookPosition = this.rawPosNT[verseList[0].book];
            binaryBlob = this.binaryNT;
        } else {
            throw new Error('Unable to retrieve book from module');
        }
        return BlobReader.getXMLforChapter(
            binaryBlob,
            bookPosition,
            verseList,
            this.config.encoding
        );
    }

    getXMLForBook(bookOsisName: string): ChapterXML[] {
        const bookNum = VerseScheme.getBookNum(bookOsisName, this.config.versification);
        const maxChapter = VerseScheme.getChapterMax(bookNum, this.config.versification);
        const chapters: any = [];
        for (let chapterNum = 1; chapterNum <= maxChapter; chapterNum += 1) {
            const chapter: ChapterXML = this.getXMLforChapter(`${bookOsisName} ${chapterNum}`);
            chapters.push(chapter);
        }
        return chapters;
    }

    getXMLForVersion(): BookXML[] {
        const { versification } = this.config;
        const bookOsisNames = VerseScheme.getAllBookOsisNames(versification);
        const bookFullNames = VerseScheme.getAllBookFullNames(versification);
        const versionXML: BookXML[] = bookOsisNames.map((bookName, i) => {
            const xmlResult = this.getXMLForBook(bookName);
            return {
                osisId: bookName,
                fullName: bookFullNames[i],
                bookNum: i + 1,
                chapters: xmlResult
            };
        });
        return versionXML;
    }

    getBookMetadata(): ImporterBookMetadata {
        const { versification } = this.config;
        const bookOsisNames = VerseScheme.getAllBookOsisNames(versification);
        const bookFullNames = VerseScheme.getAllBookFullNames(versification);
        const map: ImporterBookMetadata = new Map()
        bookOsisNames.forEach((osisId, index) => {
            map.set(osisId, {
                abbreviation: osisId,
                number: index,
                title: bookFullNames[index]
            })
        })
        return map
    }

    getSingleXMLDocumentForBook(verseRange: string): string {
        const verseList = verseKey.parseVerseList(verseRange, this.config.versification);
        const book = verseList[0].book;
        const verseScheme = this.config.versification;
        const bookNum = VerseScheme.getBookNum(book, verseScheme);
        const maxChapter = VerseScheme.getChapterMax(bookNum, verseScheme);
        let combinedChapterXML = '';
        for (let chapterNum = 1; chapterNum <= maxChapter; chapterNum += 1) {
            const chapter: ChapterXML = this.getXMLforChapter(`${book} ${chapterNum}`);
            const versesXML = chapter.verses.map(
                (verse: VerseXML) => `<verse osisID="${book}.${chapterNum}.${verse.verse}">${verse.text}</verse>`
            );
            const combinedVersesXML = versesXML.reduce(
                (combinedXML: string, verseXML: string) => combinedXML + verseXML,
                ''
            );
            const chapterXML = `<chapter osisID="${book}.${chapterNum}">${combinedVersesXML}</chapter>`;
            combinedChapterXML += chapterXML;
        }
        const bookXML = `<div type="book" osisID="${book}">${combinedChapterXML}</div>`;
        return bookXML;
    }

    getSingleXMLDocumentForVersion(): string {
        const { versification } = this.config;
        const bookOsisNames = VerseScheme.getAllBookOsisNames(versification).slice(0, 1);
        const combinedBookXml = bookOsisNames.map(
            osisId => this.getSingleXMLDocumentForBook(osisId)
        ).join('')
        return `
            <osisText osisIDWork="${this.config.moduleName}" xml:lang="${this.config.language}">
                ${combinedBookXml}
            </osisText>
        `
    }
}
