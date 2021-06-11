import { ConnectionOptions } from 'typeorm';

import {
    BibleEngine,
    BibleEngineOptions,
    BibleVersionRemoteOnlyError,
    IBibleReferenceRangeQuery,
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
        bibleEngineConnectionOptions?: ConnectionOptions;
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

        if (this.remoteApi)
            return this.remoteApi.getReferenceRange(rangeQuery).then((resp) => resp.result);
        throw new Error(`can't get formatted text: invalid version`);
    }

    getVersions(forceRemote = false) {
        if (!this.localBibleEngine || forceRemote) {
            // TODO: persist updates if local database exists
            if (this.remoteApi) return this.remoteApi.getVersions().then((resp) => resp.result);
            throw new Error(`No remote config provided`);
        } else return this.localBibleEngine.getVersions();
    }
}
