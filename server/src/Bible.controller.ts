import {
    BibleEngine,
    IBibleBook,
    IBibleReferenceRangeQuery,
    IBibleVersion,
    SearchQueryMode,
    SearchSortMode,
    stripUnnecessaryDataFromBibleBook,
    stripUnnecessaryDataFromBibleVersion,
} from '@bible-engine/core';
import { Body, Get, HttpError, JsonController, Param, Post, QueryParam } from 'routing-controllers';
import { Inject, Service } from 'typedi';

class BibleEngineHttpError extends HttpError {
    constructor(bibleEngineError: Error & { httpCode?: number }) {
        super(bibleEngineError.httpCode || 400, bibleEngineError.message);
        this.name = bibleEngineError.name;
    }
}

@Service()
@JsonController('/bible')
export class BibleController {
    @Inject('bibleEngine')
    private bibleEngine: BibleEngine;

    private getReference(ref: IBibleReferenceRangeQuery) {
        return this.bibleEngine.getFullDataForReferenceRange(ref, true).catch((error) => {
            throw new BibleEngineHttpError(error);
        });
    }

    @Get('/versions')
    getVersions() {
        return this.bibleEngine.getVersions();
    }

    @Get('/versions/:versionUid')
    getVersion(@Param('versionUid') versionUid: string) {
        return this.bibleEngine.getVersion(versionUid);
    }

    @Get('/versions/:versionUid/books')
    async getBooksForVersion(@Param('versionUid') versionUid: string) {
        return this.bibleEngine.getBooksForVersionUid(versionUid);
    }

    @Get('/sections/:versionUid/:osisId')
    getBookSections(@Param('versionUid') versionUid: string, @Param('osisId') osisId: string) {
        return this.bibleEngine.getBookSectionsForVersionUid(versionUid, osisId);
    }

    @Get('/ref/:versionUid/:osisId/:chapterNr')
    getChapter(
        @Param('versionUid') versionUid: string,
        @Param('osisId') osisId: string,
        @Param('chapterNr') chapterNr: number
    ) {
        return this.getReference({
            versionUid,
            bookOsisId: osisId,
            versionChapterNum: chapterNr,
        });
    }

    @Get('/ref/:versionUid/:osisId/:chapterNr/:verseNr')
    getVerses(
        @Param('versionUid') versionUid: string,
        @Param('osisId') osisId: string,
        @Param('chapterNr') chapterNr: number,
        @Param('verseNr') verseNr: number,
        @QueryParam('chapterEnd') chapterEndNr?: number,
        @QueryParam('verseEnd') verseEndNr?: number
    ) {
        return this.getReference({
            versionUid,
            bookOsisId: osisId,
            versionChapterNum: chapterNr,
            versionVerseNum: verseNr,
            versionChapterEndNum: chapterEndNr,
            versionVerseEndNum: verseEndNr,
            skipPartialWrappingSectionsInDocument: true,
        });
    }

    @Post('/ref')
    getReferenceRange(@Body() ref: IBibleReferenceRangeQuery) {
        return this.getReference(ref);
    }

    @Get('/definitions/:strongNum')
    getDefinitions(@Param('strongNum') strongNum: string) {
        return this.bibleEngine.getDictionaryEntries(strongNum);
    }

    @Get('/definitions/:strongNum/:dictionaryId')
    getDefinition(
        @Param('strongNum') strongNum: string,
        @Param('dictionaryId') dictionaryId: string
    ) {
        return this.bibleEngine
            .getDictionaryEntries(strongNum, dictionaryId)
            .then((entries) => (entries.length ? entries[0] : undefined));
    }

    @Get('/search/:versionUid/:query')
    async search(
        @Param('versionUid') versionUid: string,
        @Param('query') query: string,
        @QueryParam('queryMode') queryMode?: SearchQueryMode,
        @QueryParam('sortMode') sortMode?: SearchSortMode,
        @QueryParam('page') page?: number,
        @QueryParam('count') count?: number,
        @QueryParam('rangeStart') rangeStart?: number,
        @QueryParam('rangeEnd') rangeEnd?: number
    ) {
        const pagination = page || count ? { page: page || 1, count } : undefined;
        const bookRange = rangeStart ? { start: rangeStart, end: rangeEnd } : undefined;

        const version = await this.bibleEngine.getVersion(versionUid);
        if (!version) throw new HttpError(404, 'version not found');
        const alternativeVersions = await this.bibleEngine.getVersions(
            version.language.slice(0, 2)
        );

        return this.bibleEngine.search({
            versionUid,
            query,
            queryMode,
            sortMode,
            pagination,
            bookRange,
            alternativeVersionUids: alternativeVersions
                .map((v) => v.uid)
                .filter((uid) => uid !== versionUid),
        });
    }

    @Post('/versions/:lang')
    async syncVersions(
        @Param('lang') lang: string,
        @Body()
        clientVersions?: {
            [index: string]: {
                lastUpdate: string | Date;
                dataLocation: Required<IBibleVersion>['dataLocation'];
            };
        }
    ) {
        // fetch all versions for the given language
        const langVersions = await this.bibleEngine.getVersions(lang);

        // filter versions to all versions missing on the client or remote-only
        // versions that have been updated
        const remoteUpdates: {
            uid: string;
            meta?: IBibleVersion;
            books?: IBibleBook[];
            change: 'deleted' | 'updated' | 'new';
        }[] = [];

        for (const version of langVersions) {
            if (
                !clientVersions?.[version.uid] ||
                (clientVersions[version.uid].dataLocation === 'remote' &&
                    new Date(clientVersions[version.uid].lastUpdate) < version.lastUpdate)
            ) {
                const versionBooks = await this.bibleEngine.getBooksForVersion(version.id);
                remoteUpdates.push({
                    uid: version.uid,
                    meta: stripUnnecessaryDataFromBibleVersion(version),
                    change: !clientVersions?.[version.uid] ? 'new' : 'updated',
                    books: versionBooks.map((book) => stripUnnecessaryDataFromBibleBook(book)),
                });
            }
        }

        // check if a version has been deleted on the server
        for (const clientVersionUid of Object.keys(clientVersions || {})) {
            if (
                clientVersions?.[clientVersionUid].dataLocation === 'remote' &&
                !langVersions.find((version) => version.uid === clientVersionUid)
            )
                remoteUpdates.push({ uid: clientVersionUid, change: 'deleted' });
        }
        return remoteUpdates;
    }
}
