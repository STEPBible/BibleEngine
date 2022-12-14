import { DataSourceOptions } from 'typeorm';

import {
    BibleEngine,
    BibleEngineOptions,
    BibleVersionRemoteOnlyError,
    IBibleReferenceRangeQuery,
    IBibleSearchOptions,
} from '@bible-engine/core';
import { BibleApi } from './Bible.api';

export class BibleEngineClient {
    remoteApi?: BibleApi;
    localBibleEngine?: BibleEngine;

    constructor({
        bibleEngineConnectionOptions,
        bibleEngineOptions,
        apiBaseUrl,
    }: {
        bibleEngineConnectionOptions?: DataSourceOptions;
        bibleEngineOptions?: BibleEngineOptions;
        apiBaseUrl?: string;
    }) {
        if (apiBaseUrl) this.remoteApi = new BibleApi(apiBaseUrl);
        if (bibleEngineConnectionOptions)
            this.localBibleEngine = new BibleEngine(
                bibleEngineConnectionOptions,
                bibleEngineOptions
            );
    }

    getBooksForVersion(versionUid: string, forceRemote = false) {
        if (forceRemote || !this.localBibleEngine) {
            if (this.remoteApi)
                return this.remoteApi
                    .getBooksForVersion({ versionUid })
                    .then((resp) => resp.result);
            throw new Error(`No remote config provided`);
        } else return this.localBibleEngine.getBooksForVersionUid(versionUid);
    }

    getDictionaryEntry(strong: string, dictionary: string, forceRemote = false) {
        if (forceRemote || !this.localBibleEngine) {
            if (this.remoteApi)
                return this.remoteApi
                    .getDefinition({ strongNum: strong, dictionaryId: dictionary })
                    .then((resp) => resp.result);
            throw new Error(`No remote config provided`);
        } else
            return this.localBibleEngine
                .getDictionaryEntries(strong, dictionary)
                .then((entries) => (entries.length ? entries[0] : undefined));
    }

    async getFullDataForReferenceRange(
        rangeQuery: IBibleReferenceRangeQuery,
        forceRemote = false,
        stripUnnecessaryData = false
    ) {
        // RADAR: coming back to this again (while fixing a bug) this way of
        // handling remote versions looks like an anti-pattern. The reason for
        // this is probably to safe one query to the version-table. However one
        // could argue that readability and maintainability is more important
        // than this small optimization. However this method is called very
        // often. Another way to solve this would be to refactor the return type
        // of `getFullDataForReferenceRange` to include the "remote-only"
        // information however this would break all code that is currently using
        // this method.
        if (this.localBibleEngine && !forceRemote) {
            try {
                // we need the await, otherwise errors are not caught by `try ..
                // catch`
                return await this.localBibleEngine.getFullDataForReferenceRange(
                    rangeQuery,
                    stripUnnecessaryData
                );
            } catch (e) {
                if (!(e instanceof BibleVersionRemoteOnlyError)) throw e;
            }
        }

        if (this.remoteApi) {
            // we use cachable endpoints for the request:
            // single chapter
            if (
                rangeQuery.versionChapterNum &&
                (!rangeQuery.versionChapterEndNum ||
                    rangeQuery.versionChapterEndNum === rangeQuery.versionChapterNum) &&
                !rangeQuery.versionVerseNum &&
                !rangeQuery.versionVerseEndNum
            )
                return this.remoteApi
                    .getChapter({
                        versionUid: rangeQuery.versionUid,
                        osisId: rangeQuery.bookOsisId,
                        chapterNr: rangeQuery.versionChapterNum,
                    })
                    .then((resp) => resp.result);
            // one or multiple verses
            else if (rangeQuery.versionChapterNum && rangeQuery.versionVerseNum)
                return this.remoteApi
                    .getVerses({
                        versionUid: rangeQuery.versionUid,
                        osisId: rangeQuery.bookOsisId,
                        chapterNr: rangeQuery.versionChapterNum,
                        verseNr: rangeQuery.versionVerseNum,
                        chapterEnd: rangeQuery.versionChapterEndNum,
                        verseEnd: rangeQuery.versionVerseEndNum,
                    })
                    .then((resp) => resp.result);
            else return this.remoteApi.getReferenceRange(rangeQuery).then((resp) => resp.result);
        }
        throw new Error(`can't get formatted text: invalid version`);
    }

    getSectionsForBook(versionUid: string, osisId: string, forceRemote = false) {
        if (forceRemote || !this.localBibleEngine) {
            if (this.remoteApi)
                return this.remoteApi
                    .getBookSections({ versionUid, osisId })
                    .then((resp) => resp.result);
            throw new Error(`No remote config provided`);
        } else return this.localBibleEngine.getBookSectionsForVersionUid(versionUid, osisId);
    }

    getVersions(forceRemote = false) {
        if (!this.localBibleEngine || forceRemote) {
            // TODO: persist updates if local database exists
            if (this.remoteApi) return this.remoteApi.getVersions().then((resp) => resp.result);
            throw new Error(`No remote config provided`);
        } else return this.localBibleEngine.getVersions();
    }

    search(searchOptions: IBibleSearchOptions, forceRemote = false) {
        if (!this.localBibleEngine || forceRemote) {
            if (this.remoteApi)
                return this.remoteApi
                    .search({
                        ...searchOptions,
                        page: searchOptions.pagination ? searchOptions.pagination.page : undefined,
                        count: searchOptions.pagination
                            ? searchOptions.pagination.count
                            : undefined,
                        rangeStart: searchOptions.bookRange
                            ? searchOptions.bookRange.start
                            : undefined,
                        rangeEnd: searchOptions.bookRange ? searchOptions.bookRange.end : undefined,
                    })
                    .then((resp) => resp.result);
            throw new Error(`No remote config provided`);
        }
        return this.localBibleEngine.search(searchOptions);
    }
}
