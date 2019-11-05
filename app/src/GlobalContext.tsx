import React from 'react'
import { BibleEngineClient } from '@bible-engine/client'
import {
  IBibleReferenceRangeQuery,
  BibleEngine,
  BibleVersionEntity,
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

import Fonts from './Fonts'
import * as store from 'react-native-simple-store'
import { AsyncStorageKey, SQLITE_DIRECTORY, DATABASE_PATH } from './Constants'
import { ConnectionOptions } from 'typeorm'
import { StatusBar } from 'react-native'
import SentryExpo from 'sentry-expo'
import { Analytics, PageHit } from 'expo-analytics'

const BIBLE_ENGINE_OPTIONS: ConnectionOptions = {
  database: 'bibles.db',
  type: 'expo',
  synchronize: false,
}

const GlobalContext = React.createContext({})

export class GlobalContextProvider extends React.Component<{}, {}> {
  bibleEngineClient: BibleEngineClient
  analytics: Analytics
  state = {
    chapterContent: [],
    versionChapterNum: 1,
    bibleVersions: [],
    books: [],
    bookOsisId: '',
    versionUid: '',
    fontsAreReady: false,
    loading: true,
    forceRemote: true,
    isConnected: null,
    versionUidOfDownload: null,
    downloadProgress: 0,
    nextRange: {},
    previousRange: {},
  }
  constructor(props: any) {
    super(props)
    NetInfo.addEventListener(this.onNetworkChange)
    this.bibleEngineClient = new BibleEngineClient({
      apiBaseUrl: REMOTE_BIBLE_ENGINE_URL,
    })
    StatusBar.setHidden(true)
    this.analytics = new Analytics(GOOGLE_ANALYTICS_TRACKING_ID)
  }

  async componentDidMount() {
    this.setUpErrorLogging()
    this.loadFonts()
    this.setSavedState()
  }

  onNetworkChange = ({ isConnected }) => {
    this.setState({ ...this.state, isConnected })
  }

  async loadFonts() {
    await Fonts.load()
    this.setState({ ...this.state, fontsAreReady: true })
  }

  async setUpErrorLogging() {
    SentryExpo.config(SENTRY_DSN).install()
  }

  async setSavedState() {
    const [cachedChapterNum, cachedBookName, cachedVersion] = await store.get([
      AsyncStorageKey.CACHED_CHAPTER_NUM,
      AsyncStorageKey.CACHED_OSIS_BOOK_NAME,
      AsyncStorageKey.CACHED_VERSION_UID,
    ])
    const DEFAULT_BOOK = 'Gen'
    const DEFAULT_CHAPTER = 1
    const DEFAULT_VERSION = 'ESV'
    const bookOsisId = cachedBookName || DEFAULT_BOOK
    const versionChapterNum = cachedChapterNum || DEFAULT_CHAPTER
    const versionUid = cachedVersion || DEFAULT_VERSION

    this.setState({ ...this.state, versionChapterNum, bookOsisId, versionUid })

    if (this.state.isConnected === false) {
      await this.loadOfflineContent(versionChapterNum, bookOsisId, versionUid)
      this.setState({ ...this.state, loading: false })
    } else {
      this.lazyLoadContent(versionChapterNum, bookOsisId, versionUid)
    }
  }

  async loadOfflineContent(versionChapterNum, bookOsisId, versionUid) {
    await this.setLocalDatabase()
    if (this.bibleEngineClient.localBibleEngine === undefined) {
      return
    }
    await this.setVersions(versionUid)
  }

  async lazyLoadContent(versionChapterNum, bookOsisId, versionUid) {
    this.setLocalDatabase()
    this.setVersions(versionUid)
    this.setBooks(versionUid)
  }

  async setVersions(currentVersionUid: string) {
    let bibleVersions
    if (this.state.isConnected) {
      bibleVersions = await this.bibleEngineClient.getBothOfflineAndOnlineVersions()
    } else {
      bibleVersions = await this.bibleEngineClient.localBibleEngine.getVersions()
    }
    this.setState({ ...this.state, bibleVersions })
    if (bibleVersions.length === 0) {
      return
    }
    const version = bibleVersions.filter(
      version => version.uid === currentVersionUid
    )[0]
    await this.changeCurrentBibleVersion(version)
    return bibleVersions
  }

  async setBooks(versionUid: string) {
    const books = await this.bibleEngineClient.getBooksForVersion(
      versionUid,
      this.state.forceRemote
    )
    this.setState({ ...this.state, books })
  }

  async setLocalDatabase() {
    try {
      let bibleEngine = new BibleEngine(BIBLE_ENGINE_OPTIONS)
      if (!(await this.testQueryWorks(bibleEngine))) {
        if (!this.state.isConnected) {
          return
        }
        await this.closeDatabaseConnection(bibleEngine)
        await this.createSqliteDirectory()
        await FileSystem.downloadAsync(DATABASE_DOWNLOAD_URL, DATABASE_PATH)
        this.setState({ ...this.state, installingOffline: false })
        bibleEngine = new BibleEngine(BIBLE_ENGINE_OPTIONS)
      }
      this.bibleEngineClient.localBibleEngine = bibleEngine
      this.setVersions(this.state.versionUid)
    } catch (e) {
      console.log('Couldnt set local database: ', e)
    }
  }

  async closeDatabaseConnection(bibleEngine: BibleEngine) {
    const db = await bibleEngine.pDB
    await db.connection.close()
    const expoDb: any = await SQLite.openDatabase('bibles.db')
    expoDb._db.close()
  }

  async testQueryWorks(bibleEngine: BibleEngine): Promise<boolean> {
    try {
      const result = await bibleEngine.getDictionaryEntries(
        'H0001',
        '@BdbMedDef'
      )
      return !!result.length
    } catch (e) {
      console.log('Test query failed: ', e)
      return false
    }
  }

  async createSqliteDirectory() {
    const { exists } = await FileSystem.getInfoAsync(SQLITE_DIRECTORY)
    if (!exists) {
      console.log('sqlite directory doesnt exist, creating...')
      await FileSystem.makeDirectoryAsync(SQLITE_DIRECTORY)
    }
  }

  updateCurrentBibleReference = async (range: IBibleReferenceRangeQuery) => {
    const rangeQuery = {
      versionChapterNum: range.normalizedChapterNum,
      versionUid: this.state.versionUid,
      ...range,
    }
    this.setState({
      ...this.state,
      ...rangeQuery,
      loading: true,
      chapterContent: [],
    })
    const chapter = await this.bibleEngineClient.getFullDataForReferenceRange(
      rangeQuery,
      this.state.forceRemote,
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
    this.setState({
      ...this.state,
      ...range,
      nextRange,
      previousRange,
      chapterContent,
      loading: false,
    })
    this.cacheCurrentChapterPosition(range)
    this.captureAnalyticsEvent()
  }

  captureAnalyticsEvent() {
    const reference = `${this.state.bookOsisId} ${this.state.versionChapterNum} ${this.state.versionUid}`
    this.analytics.hit(new PageHit(reference))
  }

  cacheCurrentChapterPosition(range: any) {
    const chapterNum = range.versionChapterNum || range.normalizedChapterNum
    store.save(AsyncStorageKey.CACHED_OSIS_BOOK_NAME, range.bookOsisId)
    store.save(AsyncStorageKey.CACHED_CHAPTER_NUM, chapterNum)
    store.save(AsyncStorageKey.CACHED_VERSION_UID, range.versionUid)
  }

  changeCurrentBibleVersion = async (version: BibleVersionEntity) => {
    const { bookOsisId, versionChapterNum } = this.state
    const newReference = {
      bookOsisId,
      versionChapterNum,
      versionUid: version.uid,
    }
    const forceRemote = version.dataLocation !== 'db'
    this.setState({ ...this.state, forceRemote }, () => {
      this.updateCurrentBibleReference(newReference)
    })
  }

  render() {
    return (
      <GlobalContext.Provider
        value={{
          ...this.state,
          bibleEngine: this.bibleEngineClient,
          updateCurrentBibleReference: this.updateCurrentBibleReference,
          changeCurrentBibleVersion: this.changeCurrentBibleVersion,
        }}
      >
        {this.props.children}
      </GlobalContext.Provider>
    )
  }
}

export const withGlobalContext = (ChildComponent: any) => (props: any) => (
  <GlobalContext.Consumer>
    {context => <ChildComponent {...props} global={context} />}
  </GlobalContext.Consumer>
)
