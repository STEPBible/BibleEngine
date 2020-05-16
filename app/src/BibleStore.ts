import { BibleEngineClient } from '@bible-engine/client'
import {
  IBibleReferenceRange,
  BibleEngine,
  IBibleCrossReference,
  BibleBookEntity,
  BOOK_DATA,
  IBibleOutputRich,
} from '@bible-engine/core'
import * as FileSystem from 'expo-file-system'
import * as SQLite from 'expo-sqlite'
import NetInfo from '@react-native-community/netinfo'
import {
  REMOTE_BIBLE_ENGINE_URL,
  DATABASE_DOWNLOAD_URL,
  SENTRY_DSN,
  GOOGLE_ANALYTICS_TRACKING_ID,
} from 'react-native-dotenv'
import 'react-native-console-time-polyfill'
import { ConnectionOptions } from 'typeorm'
import { AsyncStorage, Platform, UIManager } from 'react-native'
import * as Sentry from 'sentry-expo'
import { Analytics, PageHit } from 'expo-analytics'
import { AsyncTrunk, ignore, version } from 'mobx-sync'
import { observable, action } from 'mobx'

import Fonts from './Fonts'
import { SQLITE_DIRECTORY, DATABASE_PATH } from './Constants'
import JsonAsset from './JsonAsset'
import { DataProvider } from 'recyclerlistview'

const analytics = new Analytics(GOOGLE_ANALYTICS_TRACKING_ID)
const bibleEngineClient = new BibleEngineClient({
  apiBaseUrl: REMOTE_BIBLE_ENGINE_URL,
})
let cache: AsyncTrunk

class BibleStore {
  DEFAULT_BOOK = 'Gen'
  DEFAULT_CHAPTER = 1
  DEFAULT_VERSION = 'ESV'

  @version(1) @observable isFirstLoad = true
  @version(3) @observable chapterContent = []
  @version(1) @observable versionChapterNum = this.DEFAULT_CHAPTER
  @version(1) @observable bibleVersions = []
  @version(1) @observable books: BibleBookEntity[] = []
  @version(1) @observable bookOsisId = this.DEFAULT_BOOK
  @version(1) @observable versionUid = this.DEFAULT_VERSION
  @version(1) @observable version = {}
  @version(1) @observable nextRange?: IBibleReferenceRange | undefined
  @version(1) @observable previousRange?: IBibleReferenceRange | undefined
  @version(1) @observable fontScale = 1

  @ignore @observable searchIndexAsset

  @ignore @observable loading = true
  @ignore @observable isConnected = null
  @ignore @observable forceRemote = true
  @ignore @observable fontsAreReady = false
  @ignore @observable chapterSections = []
  @ignore @observable showStrongs = true
  @ignore @observable showSettings = false
  @ignore @observable cacheIsRestored = false
  @ignore settingsRef
  @ignore @observable dataProvider = new DataProvider(
    (r1, r2) => r1.id !== r2.id
  )

  BIBLE_ENGINE_OPTIONS: ConnectionOptions = {
    database: 'bibles.db',
    type: 'expo',
    driver: require('expo-sqlite'),
    synchronize: false,
  }

  constructor() {
    NetInfo.addEventListener(this.onNetworkChange)
    this.setUpErrorLogging()
    this.enableLayoutAnimations()
    cache = new AsyncTrunk(this, { storage: AsyncStorage })
  }

  async initialize() {
    await Fonts.load()
    this.fontsAreReady = true
    await cache.init()
    this.cacheIsRestored = true
    this.dataProvider = this.dataProvider.cloneWithRows(this.chapterContent)
    this.chapterSections = this.chapterContent.slice(0, 1)
    if (
      this.books.length > 0 &&
      this.chapterContent.length > 0 &&
      this.bibleVersions.length > 0
    ) {
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

  async loadSearchIndex() {
    if (this.searchIndexAsset) return
    this.searchIndexAsset = JsonAsset.init(
      require('../assets/esvSearchIndex.db'),
      'esvSearchIndex.db'
    )
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
      this.setLocalDatabase()
    })
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
      bibleVersions = await this.getBothOfflineAndOnlineVersions()
    } else {
      bibleVersions = await bibleEngineClient.localBibleEngine.getVersions()
    }
    this.bibleVersions = bibleVersions
    return bibleVersions
  }

  async getBothOfflineAndOnlineVersions() {
    let localVersions: any[] = []
    if (bibleEngineClient.localBibleEngine) {
      try {
        localVersions = await bibleEngineClient.localBibleEngine.getVersions()
      } catch (e) {
        localVersions = []
      }
    }
    let remoteVersions: any[] = []
    if (bibleEngineClient.remoteApi) {
      const { result } = await bibleEngineClient.remoteApi.getVersions()
      remoteVersions = result.map(version => ({
        ...version,
        dataLocation: 'remote',
      }))
    }
    return this.getMergedOfflineAndOnlineVersions(localVersions, remoteVersions)
  }

  getMergedOfflineAndOnlineVersions(
    localVersions: any[],
    remoteVersions: any[]
  ) {
    const versions = localVersions
    for (const remoteVersion of remoteVersions) {
      if (!versions.find((version: any) => version.uid === remoteVersion.uid)) {
        versions.push(remoteVersion)
      }
    }
    return versions
  }

  changeCurrentBibleVersion = async (versionUid: string) => {
    console.log('changeCurrentBibleVersion')
    if (this.bibleVersions.length === 0) {
      return
    }
    this.versionUid = versionUid
    this.version = this.bibleVersions.filter(
      version => version.uid === versionUid
    )[0]
    const newReference = {
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
      if (!(await this.testQueryWorks())) {
        if (!this.isConnected) {
          return
        }
        await this.createSqliteDirectory()
        await FileSystem.downloadAsync(DATABASE_DOWNLOAD_URL, DATABASE_PATH)
      }
      const bibleEngine = new BibleEngine(this.BIBLE_ENGINE_OPTIONS)
      bibleEngineClient.localBibleEngine = bibleEngine
      await this.setVersions()
    } catch (e) {
      console.error('Couldnt set local database: ', e)
      Sentry.captureException(e)
      await FileSystem.deleteAsync(DATABASE_PATH, { idempotent: true })
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

  getChapter = async (range: IBibleReferenceRangeQuery) => {
    this.loading = true
    const rangeQuery = {
      versionChapterNum: range.normalizedChapterNum,
      versionUid: this.versionUid,
      ...range,
      bookOsisId: range.bookOsisId.trim(),
    }
    this.versionChapterNum =
      rangeQuery.versionChapterNum || this.DEFAULT_CHAPTER
    this.versionUid = rangeQuery.versionUid
    this.bookOsisId = rangeQuery.bookOsisId
    this.chapterContent = []
    this.chapterSections = []

    const forceRemote = version.dataLocation !== 'db' && this.isConnected

    const chapter: IBibleOutputRich = await bibleEngineClient.getFullDataForReferenceRange(
      rangeQuery,
      forceRemote,
      true
    )
    let chapterContent: any = chapter.content.contents.map(
      (content, index) => ({
        section: content,
        id: `${rangeQuery.bookOsisId}-${this.versionChapterNum}-${index}`,
        ...rangeQuery,
      })
    )
    if (
      chapterContent &&
      chapterContent.length &&
      chapterContent[0] &&
      typeof chapterContent[0].section.content === 'string'
    ) {
      // Hack for CUV rendering
      chapterContent = [
        {
          section: {
            title: '',
            type: 'section',
            contents: chapterContent,
          },
          id: `${rangeQuery.bookOsisId}-${this.versionChapterNum}-${0}`,
        },
      ]
    }
    const { nextRange, previousRange } = chapter.contextRanges.normalizedChapter
    this.loading = false
    return {
      chapterContent,
      nextRange,
      previousRange,
    }
  }

  updateCurrentBibleReference = async (range: IBibleReferenceRangeQuery) => {
    this.showStrongs = false
    const { chapterContent, nextRange, previousRange } = await this.getChapter(
      range
    )
    this.nextRange = nextRange
    this.previousRange = previousRange
    console.time('render')
    this.dataProvider = this.dataProvider.cloneWithRows(chapterContent)
    this.chapterContent = chapterContent
    console.timeEnd('render')
    this.captureAnalyticsEvent()
  }

  appendNextChapterToBottom = async (range: IBibleReferenceRangeQuery) => {
    const { chapterContent, nextRange } = await this.getChapter(range)
    this.dataProvider = this.dataProvider.cloneWithRows([
      ...this.dataProvider.getAllData(),
      ...chapterContent,
    ])
    this.nextRange = nextRange
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

  async testQueryWorks(): Promise<boolean> {
    let bibleEngine
    try {
      bibleEngine = new BibleEngine({
        ...this.BIBLE_ENGINE_OPTIONS,
        migrationsRun: false,
      })
      await bibleEngine.runMigrations()
      const result = await bibleEngine.getDictionaryEntries(
        'H0001',
        '@BdbMedDef'
      )
      await this.closeDatabaseConnection(bibleEngine)
      return !!result.length
    } catch (e) {
      console.log('Test query failed: ', e)
      await this.closeDatabaseConnection(bibleEngine)
      return false
    }
  }

  toggleSettings = () => {
    if (!this.settingsRef || !this.settingsRef.current) return
    this.settingsRef.current.open()
  }

  @action increaseFontSize = () => {
    const LARGEST_FONT_SCALE = 2.2
    if (this.fontScale > LARGEST_FONT_SCALE) return
    this.fontScale += 0.1
  }

  @action decreaseFontSize = () => {
    const SMALLEST_FONT_SCALE = 0.5
    if (this.fontScale < SMALLEST_FONT_SCALE) return
    this.fontScale -= 0.1
  }

  scaledFontSize = (style: any) => {
    return {
      ...style,
      fontSize: style.fontSize ? style.fontSize * this.fontScale : undefined,
      lineHeight: style.lineHeight ? style.lineHeight * this.fontScale : undefined,
    }
  }

  get currentBookAndChapter() {
    if (
      !this.bookOsisId ||
      !BOOK_DATA[this.bookOsisId] ||
      !this.cacheIsRestored
    )
      return ''
    const fullBookName = BOOK_DATA[this.bookOsisId].names.en[0]
    return `${fullBookName} ${this.versionChapterNum}`
  }

  get versionUidToDisplay() {
    if (this.cacheIsRestored === false) return
    return this.versionUid
  }

  setSettingsRef(settingsRef) {
    this.settingsRef = settingsRef
  }

  onNetworkChange = ({ isConnected }) => {
    this.isConnected = isConnected
    if (!isConnected) {
      this.forceRemote = false
    }
  }

  async setUpErrorLogging() {
    Sentry.init({
      dsn: SENTRY_DSN,
      enableInExpoDevelopment: false,
      debug: true,
    })
  }

  captureAnalyticsEvent() {
    const reference = `${this.bookOsisId} ${this.versionChapterNum} ${this.versionUid}`
    analytics.hit(new PageHit(reference))
  }

  enableLayoutAnimations() {
    if (Platform.OS === 'android') {
      if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true)
      }
    }
  }
}

export default new BibleStore()
