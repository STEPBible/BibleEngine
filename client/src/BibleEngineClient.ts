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
    getMergedOfflineAndOnlineVersions(localVersions: any[], remoteVersions: any[]) {
        const versions = localVersions;
        for (const remoteVersion of remoteVersions) {
            if (!versions.find((version: any) => version.uid === remoteVersion.uid)) {
                versions.push(remoteVersion);
            }
        }
        return versions;
    }
}
