import React from 'react'
import { BibleEngineClient } from '@bible-engine/client'
import {
  IBibleReferenceRangeQuery,
  BibleEngine,
  BibleVersionEntity,
  IBibleBookEntity,
} from '@bible-engine/core'
import * as FileSystem from 'expo-file-system'
import { Asset } from 'expo-asset'
import { SQLite } from 'expo-sqlite'
import NetInfo from '@react-native-community/netinfo'
import {
  REMOTE_BIBLE_ENGINE_URL,
  BIBLE_ENGINE_EXPORTS_S3_URL,
} from 'react-native-dotenv'

import Fonts from './Fonts'
import * as store from 'react-native-simple-store'
import { AsyncStorageKey, SQLITE_DIRECTORY, DATABASE_PATH } from './Constants'
import { ConnectionOptions } from 'typeorm'
const bibleDatabaseModule = require('../assets/bibles.db')

const BIBLE_ENGINE_OPTIONS: ConnectionOptions = {
  database: 'bibles.db',
  type: 'expo',
  synchronize: false,
}

const GlobalContext = React.createContext({})

export class GlobalContextProvider extends React.Component<{}, {}> {
  bibleEngineClient: BibleEngineClient
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
    isConnected: true,
    versionUidOfDownload: null,
    downloadCompletionPercentage: 0,
  }
  constructor(props: any) {
    super(props)
    NetInfo.addEventListener(this.onNetworkChange)
    this.bibleEngineClient = new BibleEngineClient({
      apiBaseUrl: REMOTE_BIBLE_ENGINE_URL,
    })
    this.loadFonts()
  }

  async componentDidMount() {
    await this.getSavedState()
  }

  onNetworkChange = ({ isConnected }) => {
    this.setState({ ...this.state, isConnected })
  }

  async loadFonts() {
    await Fonts.load()
    this.setState({ ...this.state, fontsAreReady: true })
  }

  async getSavedState() {
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

    await this.setLocalDatabase()
    await this.setBooksAndVersions(versionUid)

    await this.updateCurrentBibleReference({
      bookOsisId,
      versionChapterNum,
      versionUid,
    })
  }

  async setBooksAndVersions(versionUid: string) {
    const bibleVersions = await this.bibleEngineClient.getBothOfflineAndOnlineVersions()
    this.setState({ ...this.state, bibleVersions })
    const version = bibleVersions.find(version => version.uid === versionUid)!
    const forceRemote = version.dataLocation !== 'db'
    this.setState({ ...this.state, forceRemote })
    const books = await this.bibleEngineClient.getBooksForVersion(
      versionUid,
      forceRemote
    )
    this.setState({ ...this.state, books })
  }

  async setLocalDatabase() {
    try {
      let bibleEngine = new BibleEngine(BIBLE_ENGINE_OPTIONS)
      if (!(await this.testQueryWorks(bibleEngine))) {
        await this.closeDatabaseConnection(bibleEngine)
        await this.createSqliteDirectory()
        const asset = Asset.fromModule(bibleDatabaseModule)
        const PATH_TO_DOWNLOAD_TO = `${FileSystem.documentDirectory}SQLite/bibles.db`
        await FileSystem.downloadAsync(asset.uri, PATH_TO_DOWNLOAD_TO)
        bibleEngine = new BibleEngine(BIBLE_ENGINE_OPTIONS)
      }
      this.bibleEngineClient.localBibleEngine = bibleEngine
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
      console.log('localDatabaseIsValid catch', e)
      return false
    }
  }

  async createSqliteDirectory() {
    const { exists } = await FileSystem.getInfoAsync(SQLITE_DIRECTORY)
    if (!exists) {
      console.log('sqlite directory doesnt exist, creating...')
      await FileSystem.makeDirectoryAsync(SQLITE_DIRECTORY, {})
    }
  }

  updateCurrentBibleReference = async (range: IBibleReferenceRangeQuery) => {
    this.setState({ ...this.state, ...range, loading: true })
    const chapter = await this.bibleEngineClient.getFullDataForReferenceRange(
      range,
      this.state.forceRemote,
      true
    )
    const chapterContent = chapter.content.contents
    this.setState(
      {
        ...this.state,
        ...range,
        chapterContent,
      },
      () => {
        this.setState({ ...this.state, loading: false })
      }
    )
  }

  changeCurrentBibleVersion = async (version: BibleVersionEntity) => {
    const { bookOsisId, versionChapterNum } = this.state
    const newReference = {
      bookOsisId,
      versionChapterNum,
      versionUid: version.uid,
    }
    const forceRemote = version.dataLocation !== 'db'
    this.setState({ ...this.state, forceRemote })
    this.updateCurrentBibleReference(newReference)
    this.setBooks(version.uid)
  }

  downloadVersion = async (versionUid: string) => {
    this.setState({ ...this.state, versionUidOfDownload: versionUid })
    const fileHostUrl = BIBLE_ENGINE_EXPORTS_S3_URL
    const bibleEngine = this.bibleEngineClient.localBibleEngine
    if (await bibleEngine.versionIsDownloaded(versionUid, fileHostUrl)) {
      return
    }
    const books = await bibleEngine.getBookIndexFile(versionUid, fileHostUrl)
    const onlineVersion = await bibleEngine.getRemoteVersionMetadata(
      versionUid,
      fileHostUrl
    )
    const version = await bibleEngine.updateVersion({
      ...onlineVersion,
      dataLocation: 'remote',
    })
    const BATCH_SIZE = 10
    const batches = this.chunk(books, BATCH_SIZE)
    let index = 0
    for (const batch of batches) {
      const responses = await bibleEngine.getBooksForDownload(
        books,
        fileHostUrl,
        version!.uid
      )
      const entityManager = await bibleEngine.pDB
      for (const response of responses) {
        const content: any = response
        const downloadCompletionPercentage = index / books.length
        index += 1
        this.setState({ ...this.state, downloadCompletionPercentage })
        await bibleEngine.addBookWithContent(version!, content, {
          entityManager,
        })
      }
    }
    await bibleEngine.updateVersion({ ...version!, dataLocation: 'db' })
    this.setState({ ...this.state, versionUidOfDownload: null })
  }

  async downloadBooks(
    books: IBibleBookEntity[],
    fileUrl: string,
    version: BibleVersionEntity
  ) {}

  chunk(arr: any, chunkSize = 1, cache: any[] = []) {
    const tmp = [...arr]
    if (chunkSize <= 0) return cache
    while (tmp.length) cache.push(tmp.splice(0, chunkSize))
    return cache
  }

  render() {
    return (
      <GlobalContext.Provider
        value={{
          ...this.state,
          bibleEngine: this.bibleEngineClient,
          updateCurrentBibleReference: this.updateCurrentBibleReference,
          changeCurrentBibleVersion: this.changeCurrentBibleVersion,
          downloadVersion: this.downloadVersion,
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
