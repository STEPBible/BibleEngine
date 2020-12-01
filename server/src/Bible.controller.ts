import { JsonController, Post, Body, Get, Param, HttpError } from 'routing-controllers';
import { Inject } from 'typedi';
import { BibleEngine, IBibleBook, IBibleReferenceRangeQuery, IBibleVersion, stripUnnecessaryDataFromBibleBook, stripUnnecessaryDataFromBibleVersion } from '@bible-engine/core';

class BibleEngineHttpError extends HttpError {
    constructor(bibleEngineError: Error & {httpCode?: number}) {
        super(bibleEngineError.httpCode || 400, bibleEngineError.message);
        this.name = bibleEngineError.name;
    }
}

@JsonController('/bible')
export class BibleController {
    @Inject('bibleEngine')
    private bibleEngine: BibleEngine;

    private getReference(ref: IBibleReferenceRangeQuery) {
        return this.bibleEngine.getFullDataForReferenceRange(ref, true).catch(error => {
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

    @Get('/ref/:versionUid/:osisId/:chapterNr')
    getChapter(
        @Param('versionUid') versionUid: string,
        @Param('osisId') osisId: string,
        @Param('chapterNr') chapterNr: number
    ) {
        return this.getReference(
            {
                versionUid,
                bookOsisId: osisId,
                versionChapterNum: chapterNr,
            }
        );
    }

    @Get('/ref/:versionUid/:osisId/:chapterNr/:verseNr')
    getVerse(
        @Param('versionUid') versionUid: string,
        @Param('osisId') osisId: string,
        @Param('chapterNr') chapterNr: number,
        @Param('verseNr') verseNr: number
    ) {
        return this.getReference(
            {
                versionUid,
                bookOsisId: osisId,
                versionChapterNum: chapterNr,
                versionVerseNum: verseNr,
                skipPartialWrappingSectionsInDocument: true,
            }
        );
    }

    @Get('/ref/:versionUid/:osisId/:chapterNr/:verseNr-:verseEndNr')
    getVerses(
        @Param('versionUid') versionUid: string,
        @Param('osisId') osisId: string,
        @Param('chapterNr') chapterNr: number,
        @Param('verseNr') verseNr: number,
        @Param('verseEndNr') verseEndNr: number
    ) {
        return this.getReference(
            {
                versionUid,
                bookOsisId: osisId,
                versionChapterNum: chapterNr,
                versionVerseNum: verseNr,
                versionVerseEndNum: verseEndNr,
                skipPartialWrappingSectionsInDocument: true,
            }
        );
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
