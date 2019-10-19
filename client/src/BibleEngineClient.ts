import { ConnectionOptions } from 'typeorm';
import 'cross-fetch/polyfill';

import {
    BibleEngine,
    BibleVersionRemoteOnlyError,
    IBibleReferenceRangeQuery
} from '@bible-engine/core';
import { BibleApi } from './Bible.api';

export class BibleEngineClient {
    remoteApi?: BibleApi;
    localBibleEngine: BibleEngine;

    constructor({
        bibleEngineOptions,
        apiBaseUrl
    }: {
        bibleEngineOptions?: ConnectionOptions;
        apiBaseUrl?: string;
    }) {
        if (apiBaseUrl) this.remoteApi = new BibleApi(apiBaseUrl);
        if (bibleEngineOptions) this.localBibleEngine = new BibleEngine(bibleEngineOptions);
    }

    static chunk(arr: any, chunkSize = 1, cache: any[] = []) {
        const tmp = [...arr];
        if (chunkSize <= 0) return cache;
        while (tmp.length) cache.push(tmp.splice(0, chunkSize));
        return cache;
    }

    static async getBookIndexFile(versionUid: string, baseS3Url: string) {
        const fileIndexUrl = `${baseS3Url}/${versionUid}/index.json`;
        const response = await fetch(fileIndexUrl);
        const fileIndex = await response.json();
        return fileIndex;
    }

    async downloadVersion(versionUid: string, baseS3Url: string) {
        console.time('downloadVersion');
        const books = await BibleEngineClient.getBookIndexFile(versionUid, baseS3Url);
        const params = { versionUid };
        const { result } = await this.remoteApi!.getVersion(params);
        const localVersion = await this.localBibleEngine.addVersion(result);
        const BATCH_SIZE = 10;
        const chunks = BibleEngineClient.chunk(books, BATCH_SIZE);
        for (const chunk of chunks) {
            const responses = await Promise.all(
                chunk.map((book: any) => {
                    const bookContentsUrl = `${baseS3Url}/${versionUid}/${book.osisId}.json`;
                    return fetch(bookContentsUrl).then(response => response.json());
                })
            );
            for (const response of responses) {
                const content: any = response;
                await this.localBibleEngine.addBookWithContent(localVersion, content);
            }
        }
        console.timeEnd('downloadVersion');
    }

    getBooksForVersion(versionUid: string, forceRemote = false) {
        if (forceRemote || !this.localBibleEngine) {
            if (this.remoteApi)
                return this.remoteApi.getBooksForVersion({ versionUid }).then(resp => resp.result);
            throw new Error(`No remote config provided`);
        } else return this.localBibleEngine.getBooksForVersionUid(versionUid);
    }

    getDictionaryEntry(strong: string, dictionary: string, forceRemote = false) {
        if (forceRemote || !this.localBibleEngine) {
            if (this.remoteApi)
                return this.remoteApi
                    .getDefinition({ strongNum: strong, dictionaryId: dictionary })
                    .then(resp => resp.result);
            throw new Error(`No remote config provided`);
        } else
            return this.localBibleEngine
                .getDictionaryEntries(strong, dictionary)
                .then(entries => (entries.length ? entries[0] : undefined));
    }

    async getFullDataForReferenceRange(
        rangeQuery: IBibleReferenceRangeQuery,
        forceRemote = false,
        stripUnnecessaryData = false
    ) {
        if (this.localBibleEngine && !forceRemote) {
            try {
                return this.localBibleEngine.getFullDataForReferenceRange(
                    rangeQuery,
                    stripUnnecessaryData
                );
            } catch (e) {
                if (!(e instanceof BibleVersionRemoteOnlyError)) throw e;
            }
        }

        if (this.remoteApi)
            return this.remoteApi.getReferenceRange(rangeQuery).then(resp => resp.result);
        throw new Error(`can't get formatted text: invalid version`);
    }

    getVersions(forceRemote = false) {
        if (!this.localBibleEngine || forceRemote) {
            // TODO: persist updates if local database exists
            if (this.remoteApi) return this.remoteApi.getVersions().then(resp => resp.result);
            throw new Error(`No remote config provided`);
        } else return this.localBibleEngine.getVersions();
    }
}
