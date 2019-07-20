import { BibleEngine } from '@bible-engine/core';
import { ChapterResult } from './types';

import * as Expo from 'expo';
import * as store from 'react-native-simple-store';
import { AsyncStorage } from 'react-native';
import { AsyncStorageKey } from './Constants';
import Network from './Network';

const SQLITE_DIRECTORY = `${Expo.FileSystem.documentDirectory}SQLite`;
const PATH_TO_DOWNLOAD_TO = `${SQLITE_DIRECTORY}/bibles.db`;

export default class Database {
  private localBibleEngine?: BibleEngine;
  private remoteBibleEngine?: BibleEngine;
  public forceRemote?: boolean;
  public localDbIsReady?: boolean;
  public databaseModule: any;

  constructor(databaseModule: any) {
    this.databaseModule = databaseModule;
    this.remoteBibleEngine = new BibleEngine(
      {
        name: 'remoteConnection',
        database: 'temp.db',
        type: 'expo',
        synchronize: false
      },
      { url: 'http://ca2ff0a2.ngrok.io/rest/v1/bible' }
    );
  }

  public async setLocalDatabase() {
    this.localDbIsReady = false;
    try {
      const { exists } = await Expo.FileSystem.getInfoAsync(SQLITE_DIRECTORY);
      if (!exists) {
        await Expo.FileSystem.makeDirectoryAsync(SQLITE_DIRECTORY);
      }
      await AsyncStorage.multiRemove(Object.keys(AsyncStorageKey));
      await Expo.FileSystem.deleteAsync(PATH_TO_DOWNLOAD_TO, {
        idempotent: true
      });
      const asset = Expo.Asset.fromModule(this.databaseModule);
      const uriToDownload = asset.uri;
      await Expo.FileSystem.downloadAsync(uriToDownload, PATH_TO_DOWNLOAD_TO);
      const incomingHash = asset.hash;
      store.save('existingHash', incomingHash);
      await this.setLocalBibleEngine();
      await Expo.SQLite.openDatabase('bibles.db');
    } catch (e) {
      console.log('error in _setLocalDatabase: ', e);
      this.forceRemote = true;
    }
    this.localDbIsReady = true;
  }

  public async setLocalBibleEngine() {
    console.log('setLocalBibleEngine');
    this.forceRemote = false;
    this.localBibleEngine = new BibleEngine({
      database: 'bibles.db',
      type: 'expo',
      synchronize: false
    });
  }

  public async databaseIsAvailable() {
    try {
      const asset = Expo.Asset.fromModule(this.databaseModule);
      const incomingHash = asset.hash;
      const existingHash = await store.get('existingHash');
      let exists = false;
      const info = await Expo.FileSystem.getInfoAsync(PATH_TO_DOWNLOAD_TO);
      exists = info.exists;
      const available = exists && incomingHash === existingHash;
      if (!available) {
        this.forceRemote = true;
      }
      this.localDbIsReady = available;
      return available;
    } catch (e) {
      console.log('databaseAvailable check failed');
      console.error(e);
      this.forceRemote = true;
      this.localDbIsReady = false;
      return false;
    }
  }

  public async getChapter(bookOsisId: string, versionChapterNum: number) {
    let chapterOutput;
    try {
      const bibleEngine = this.forceRemote
        ? this.remoteBibleEngine
        : this.localBibleEngine;
      chapterOutput = await bibleEngine!.getFullDataForReferenceRange(
        {
          bookOsisId,
          versionChapterNum,
          versionUid: 'ESV'
        },
        true,
        this.forceRemote
      );
      let nextChapter;
      try {
        nextChapter = chapterOutput.contextRanges.normalizedChapter.nextRange;
      } catch (e) {}
      const result: ChapterResult = {
        nextChapter,
        contents: chapterOutput.content.contents
      };
      if (
        result.contents &&
        result.contents.length &&
        result.contents[0] &&
        typeof result.contents[0].content === 'string'
      ) {
        const fakeSectionToWrapPhrases = {
          title: '',
          type: 'section',
          contents: chapterOutput.content.contents
        };
        return {
          nextChapter,
          contents: [fakeSectionToWrapPhrases]
        };
      }
      return result;
    } catch (error) {
      if (!this.forceRemote) {
        this.forceRemote = true;
        return this.getChapter(bookOsisId, versionChapterNum);
      }
    }
    return null;
  }

  async getBooks() {
    const bibleEngine = this.forceRemote
      ? this.remoteBibleEngine
      : this.localBibleEngine;
    let bookList: any;
    try {
      bookList = await bibleEngine!.getBooksForVersion(1, this.forceRemote);
    } catch (e) {
      const shouldFallBackToNetwork = await this.shouldFallBackToNetwork();
      if (shouldFallBackToNetwork) {
        console.log('Failed to query local db. Falling back to network...');
        this.forceRemote = true;
        return this.getBooks();
      }
    }
    bookList = bookList.map((book: any) => ({
      numChapters: book.chaptersCount.length,
      osisId: book.osisId,
      title: book.title
    }));
    return bookList;
  }

  private async shouldFallBackToNetwork() {
    const internetIsAvailable = await Network.internetIsAvailable;
    return !this.forceRemote && internetIsAvailable;
  }

  public async getDictionaryEntries(strongs: string[]) {
    const bibleEngine = this.forceRemote
      ? this.remoteBibleEngine
      : this.localBibleEngine;
    try {
      const definitions = (await Promise.all(
        strongs.map(async (strong: string) => {
          if (strong[0] === 'H') {
            const definitions = await bibleEngine!.getDictionaryEntries(
              strong,
              '@BdbMedDef',
              this.forceRemote
            );
            return definitions[0];
          }
          if (strong[0] === 'G') {
            const definitions = await bibleEngine!.getDictionaryEntries(
              strong,
              '@MounceMedDef',
              this.forceRemote
            );
            return definitions[0];
          }
          return [];
        })
      )).filter(definition => definition);
      return definitions;
    } catch (e) {
      const shouldFallBackToNetwork = await this.shouldFallBackToNetwork();
      if (this.shouldFallBackToNetwork) {
        this.forceRemote = true;
        return this.getDictionaryEntries(strongs);
      }
    }
  }

  public async executeSql(database: any, sql: any, params = []) {
    return new Promise((resolve, reject) =>
      database.transaction(tx => {
        tx.executeSql(
          sql,
          params,
          (_, { rows: { _array } }) => resolve(_array),
          (_, error) => reject(error)
        );
      })
    );
  }
}
