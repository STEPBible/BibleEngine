import { JsonController, Post, Body, Get, Param } from 'routing-controllers';
import { Inject } from 'typedi';
import { BibleEngine, IBibleReferenceRangeQuery } from '@bible-engine/core';

@JsonController('/bible')
export class BibleController {
    @Inject('bibleEngine')
    private bibleEngine: BibleEngine;

    @Get('/definitions/:strongNum/:dictionaryId')
    getDefinition(
        @Param('strongNum') strongNum: string,
        @Param('dictionaryId') dictionaryId: string
    ) {
        return this.bibleEngine
            .getDictionaryEntries(strongNum, dictionaryId)
            .then(entries => (entries.length ? entries[0] : undefined));
    }

    @Get('/definitions/:strongNum')
    getDefinitions(@Param('strongNum') strongNum: string) {
        return this.bibleEngine.getDictionaryEntries(strongNum);
    }

    @Get('/versions/:versionUid')
    getVersion(@Param('versionUid') versionUid: string) {
        return this.bibleEngine.getVersion(versionUid);
    }

    @Get('/versions/:versionId/books')
    getBooks(@Param('versionId') versionId: number) {
        return this.bibleEngine.getBooksForVersion(versionId);
    }

    @Get('/versions')
    getVersions() {
        return this.bibleEngine.getVersions();
    }

    @Get('/ref/:versionUid/:osisId/:chapterNr')
    getChapter(
        @Param('versionUid') versionUid: string,
        @Param('osisId') osisId: string,
        @Param('chapterNr') chapterNr: number
    ) {
        return this.bibleEngine.getFullDataForReferenceRange(
            {
                versionUid,
                bookOsisId: osisId,
                versionChapterNum: chapterNr
            },
            true
        );
    }

    @Get('/ref/:versionUid/:osisId/:chapterNr/:verseNr')
    getVerse(
        @Param('versionUid') versionUid: string,
        @Param('osisId') osisId: string,
        @Param('chapterNr') chapterNr: number,
        @Param('verseNr') verseNr: number
    ) {
        return this.bibleEngine.getFullDataForReferenceRange(
            {
                versionUid,
                bookOsisId: osisId,
                versionChapterNum: chapterNr,
                versionVerseNum: verseNr
            },
            true
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
        return this.bibleEngine.getFullDataForReferenceRange(
            {
                versionUid,
                bookOsisId: osisId,
                versionChapterNum: chapterNr,
                versionVerseNum: verseNr,
                versionVerseEndNum: verseEndNr
            },
            true
        );
    }

    @Post('/ref')
    getReferenceRange(@Body() ref: IBibleReferenceRangeQuery) {
        return this.bibleEngine.getFullDataForReferenceRange(ref, true);
    }
}
