import { BibleEngineClient } from '@bible-engine/client'
import {
  IBibleReferenceRangeQuery,
  BibleEngine,
  IBibleCrossReference,
  BibleBookEntity,
} from '@bible-engine/core'
import * as FileSystem from 'expo-file-system'
import { SQLite } from 'expo-sqlite'
import NetInfo from '@react-native-community/netinfo'
import {
  REMOTE_BIBLE_ENGINE_URL,
  DATABASE_DOWNLOAD_URL,
  SENTRY_DSN,
  GOOGLE_ANALYTICS_TRACKING_ID,
} from 'react-native-dotenv'
import 'react-native-console-time-polyfill'
import { ConnectionOptions } from 'typeorm'
import { AsyncStorage } from 'react-native'
import SentryExpo from 'sentry-expo'
import { Analytics, PageHit } from 'expo-analytics'
import { AsyncTrunk, ignore, version } from 'mobx-sync'
import { observable, action } from 'mobx'

import Fonts from './Fonts'
import { SQLITE_DIRECTORY, DATABASE_PATH } from './Constants'

const analytics = new Analytics(GOOGLE_ANALYTICS_TRACKING_ID)
const bibleEngineClient = new BibleEngineClient({
  apiBaseUrl: REMOTE_BIBLE_ENGINE_URL,
})
let cache: AsyncTrunk

@version(1)
class BibleStore {
  DEFAULT_BOOK = 'Gen'
  DEFAULT_CHAPTER = 1
  DEFAULT_VERSION = 'ESV'

  @observable chapterContent = []
  @observable versionChapterNum = this.DEFAULT_CHAPTER
  @observable bibleVersions = []
  @observable books: BibleBookEntity[] = []
  @observable bookOsisId = this.DEFAULT_BOOK
  @observable versionUid = this.DEFAULT_VERSION
  @observable version = {}
  @observable nextRange? = {}
  @observable previousRange? = {}

  @ignore @observable loading = true
  @ignore @observable isConnected = null
  @ignore @observable forceRemote = true
  @ignore @observable fontsAreReady = false

  BIBLE_ENGINE_OPTIONS: ConnectionOptions = {
    database: 'bibles.db',
    type: 'expo',
    synchronize: false,
  }

  constructor() {
    NetInfo.addEventListener(this.onNetworkChange)
    cache = new AsyncTrunk(this, { storage: AsyncStorage })
  }

  async initialize() {
    await Promise.all([Fonts.load(), cache.init()])
    this.fontsAreReady = true
    if (
      this.books.length > 0 &&
      this.chapterContent.length > 0 &&
      this.bibleVersions.length > 0
    ) {
      console.log('early return')
      this.loading = false
      await this.setLocalDatabase()
      return
    }
    if (this.isConnected === false) {
      this.loadOfflineContent()
    } else {
      this.lazyLoadContent()
    }
  }

  async loadOfflineContent() {
    await this.setLocalDatabase()
    if (bibleEngineClient.localBibleEngine === undefined) {
      return
    }
    if (this.chapterContent.length === 0) {
      this.changeCurrentBibleVersion(this.versionUid)
    }
    this.setBooks(this.versionUid)
  }

  async lazyLoadContent() {
    this.setBooks(this.versionUid)
    this.setVersions().then(async () => {
      if (this.chapterContent.length === 0) {
        await this.changeCurrentBibleVersion(this.versionUid)
      }
    })
    this.setLocalDatabase()
  }

  @action async setBooks(versionUid: string) {
    const books = await bibleEngineClient.getBooksForVersion(
      versionUid,
      this.forceRemote
    )
    this.books = books
  }

  async setVersions() {
    let bibleVersions
    if (this.isConnected) {
      bibleVersions = await bibleEngineClient.getBothOfflineAndOnlineVersions()
    } else {
      bibleVersions = await bibleEngineClient.localBibleEngine.getVersions()
    }
    this.bibleVersions = bibleVersions
    return bibleVersions
  }

  changeCurrentBibleVersion = async (versionUid: string) => {
    if (this.bibleVersions.length === 0) {
      return
    }
    this.versionUid = versionUid
    const version = this.bibleVersions.filter(
      version => version.uid === versionUid
    )[0]
    const newReference = {
      version,
      versionUid,
      bookOsisId: this.bookOsisId,
      versionChapterNum: this.versionChapterNum,
    }
    this.forceRemote = version.dataLocation !== 'db'
    this.updateCurrentBibleReference(newReference)
  }

  getDictionaryEntry = async (strongsNum: string, dictionary: string) => {
    return bibleEngineClient.getDictionaryEntry(strongsNum, dictionary)
  }

  async setLocalDatabase() {
    console.time('setLocalDatabase')
    try {
      let bibleEngine = new BibleEngine(this.BIBLE_ENGINE_OPTIONS)
      if (!(await this.testQueryWorks(bibleEngine))) {
        if (!this.isConnected) {
          return
        }
        await this.closeDatabaseConnection(bibleEngine)
        await this.createSqliteDirectory()
        await FileSystem.downloadAsync(DATABASE_DOWNLOAD_URL, DATABASE_PATH)
        bibleEngine = new BibleEngine(this.BIBLE_ENGINE_OPTIONS)
      }
      bibleEngineClient.localBibleEngine = bibleEngine
      await this.setVersions()
    } catch (e) {
      console.log('Couldnt set local database: ', e)
    }
    console.timeEnd('setLocalDatabase')
  }

  async closeDatabaseConnection(bibleEngine: BibleEngine) {
    const db = await bibleEngine.pDB
    await db.connection.close()
    const expoDb: any = await SQLite.openDatabase('bibles.db')
    expoDb._db.close()
  }

  async createSqliteDirectory() {
    const { exists } = await FileSystem.getInfoAsync(SQLITE_DIRECTORY)
    if (!exists) {
      console.log('sqlite directory doesnt exist, creating...')
      await FileSystem.makeDirectoryAsync(SQLITE_DIRECTORY)
    }
  }

  updateCurrentBibleReference = async (range: IBibleReferenceRangeQuery) => {
    console.time('updateCurrentBibleReference')
    const rangeQuery = {
      versionChapterNum: range.normalizedChapterNum,
      versionUid: this.versionUid,
      ...range,
    }
    this.loading = true
    this.versionChapterNum =
      rangeQuery.versionChapterNum || this.DEFAULT_CHAPTER
    this.versionUid = rangeQuery.versionUid
    this.bookOsisId = rangeQuery.bookOsisId
    this.chapterContent = []

    const chapter = await bibleEngineClient.getFullDataForReferenceRange(
      rangeQuery,
      this.forceRemote,
      true
    )
    let chapterContent: any = chapter.content.contents
    const { nextRange, previousRange } = chapter.contextRanges.normalizedChapter
    if (
      chapterContent &&
      chapterContent.length &&
      chapterContent[0] &&
      typeof chapterContent[0].content === 'string'
    ) {
      // Hack for CUV rendering
      chapterContent = [
        {
          title: '',
          type: 'section',
          contents: chapterContent,
        },
      ]
    }
    this.nextRange = nextRange
    this.previousRange = previousRange
    this.chapterContent = chapterContent
    this.loading = false
    this.captureAnalyticsEvent()
    console.timeEnd('updateCurrentBibleReference')
  }

  getVerseContents = async (refs: IBibleCrossReference[]) => {
    try {
      const referenceRanges = refs.map(ref => ref.range)
      const verses = await Promise.all(
        referenceRanges.map(range =>
          bibleEngineClient.localBibleEngine!.getPhrases(range)
        )
      )
      const verseContents = verses.map(phrases =>
        phrases.map(phrase => phrase.content).join(' ')
      )
      return verseContents
    } catch (e) {
      const emptyVerses = refs.map(ref => ref.range).map(range => '')
      return emptyVerses
    }
  }

  async testQueryWorks(bibleEngine: BibleEngine): Promise<boolean> {
    try {
      console.time('testQueryWorks')
      const result = await bibleEngine.getDictionaryEntries(
        'H0001',
        '@BdbMedDef'
      )
      console.timeEnd('testQueryWorks')
      return !!result.length
    } catch (e) {
      console.log('Test query failed: ', e)
      return false
    }
  }

  onNetworkChange = ({ isConnected }) => {
    this.isConnected = isConnected
    if (!isConnected) {
      this.forceRemote = false
    }
  }

  async setUpErrorLogging() {
    SentryExpo.config(SENTRY_DSN).install()
  }

  captureAnalyticsEvent() {
    const reference = `${this.bookOsisId} ${this.versionChapterNum} ${this.versionUid}`
    analytics.hit(new PageHit(reference))
  }
}

export default new BibleStore()
