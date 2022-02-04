import {
  BibleBookEntity, BibleEngine, BOOK_DATA, IBibleCrossReference, IBibleReferenceRangeQuery, IBibleVersion
} from '@bible-engine/core'
import {
  GOOGLE_ANALYTICS_TRACKING_ID, SENTRY_DSN
} from '@env'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Analytics, PageHit } from 'expo-analytics'
import * as FileSystem from 'expo-file-system'
import { action, observable } from 'mobx'
import { AsyncTrunk, ignore, version } from 'mobx-sync'
import { LayoutAnimation, Appearance } from 'react-native'
import 'react-native-console-time-polyfill'
import * as Sentry from 'sentry-expo'
import { ConnectionOptions } from 'typeorm'
import { BibleModule, BIBLE_MODULES, LexiconModule, LEXICON_MODULE, SQLITE_DIRECTORY, Theme } from './Constants'
import Fonts from './Fonts'
import JsonAsset from './JsonAsset'

const analytics = new Analytics(GOOGLE_ANALYTICS_TRACKING_ID)
let bibleEngine: BibleEngine;
let lexiconEngine: BibleEngine;
let cache: AsyncTrunk

class BibleStore {
  DEFAULT_BOOK = 'Gen'
  DEFAULT_CHAPTER = 1
  DEFAULT_VERSION = 'ESV'
  DEFAULT_THEME = Theme.AUTO

  @version(1) @observable isFirstLoad = true
  @version(1) @observable chapterContent = []
  @version(1) @observable versionChapterNum = this.DEFAULT_CHAPTER
  @version(1) @observable bibleVersions: IBibleVersion[] = []
  @version(1) @observable books: BibleBookEntity[] = []
  @version(1) @observable bookOsisId = this.DEFAULT_BOOK
  @version(1) @observable versionUid = this.DEFAULT_VERSION
  @version(1) @observable version = {}
  @version(1) @observable nextRange?= {}
  @version(1) @observable previousRange?= {}
  @version(1) @observable fontScale = 1
  @version(1) @observable theme = this.DEFAULT_THEME
  
  @ignore @observable searchIndexAsset
  
  @ignore @observable isDarkTheme = true
  @ignore @observable loading = true
  @ignore @observable isConnected = null
  @ignore @observable fontsAreReady = false
  @ignore @observable chapterSections = []
  @ignore @observable showStrongs = true
  @ignore @observable showSettings = false
  @ignore @observable cacheIsRestored = false
  @ignore settingsRef

  constructor() {
    this.setUpErrorLogging()
    cache = new AsyncTrunk(this, { storage: AsyncStorage })
  }

  async initialize() {
    await Fonts.load()
    this.fontsAreReady = true
    await cache.init()
    this.cacheIsRestored = true
    this.chapterSections = this.chapterContent.slice(0, 1)
    const module = this.getCurrentModule(this.versionUid)
    await this.changeCurrentBibleVersion(module)
    await this.setBooks(this.versionUid)
  }

  async loadSearchIndex() {
    if (this.searchIndexAsset) return
    this.searchIndexAsset = JsonAsset.init(
      require('../assets/esvSearchIndex.db'),
      'esvSearchIndex.db'
    )
  }

  @action async setBooks(versionUid: string) {
    const books = await bibleEngine.getBooksForVersionUid(
      versionUid,
    )
    this.books = books
  }

  changeCurrentBibleVersion = async (module: BibleModule) => {
    try {
      this.versionUid = module.uid
      const newReference = {
        versionUid: this.versionUid,
        bookOsisId: this.bookOsisId,
        versionChapterNum: this.versionChapterNum,
      }
      await this.setLocalDatabase()
      await this.updateCurrentBibleReference(newReference)
      await this.setBooks(this.versionUid)
    } catch (error) {
      console.log('changeCurrentBibleVersion failed', error)
      throw error
    }
  }

  getDictionaryEntry = async (strongsNum: string, dictionary: string) => {
    const entries = await lexiconEngine.getDictionaryEntries(strongsNum, dictionary)
    return entries?.[0]
  }

  async setLocalDatabase() {
    console.time('setLocalDatabase')
    const module = this.getCurrentModule(this.versionUid)
    try {
      await this.createSqliteDirectory()
      await Promise.all([
        await this.setupBibleModule(module),
        await this.setupBibleModule(LEXICON_MODULE)
      ])
      const BIBLE_ENGINE_OPTIONS: ConnectionOptions = {
        database: module.filename,
        type: 'expo',
        driver: require('expo-sqlite'),
        synchronize: false,
        migrationsRun: false,
      }
      const LEXICON_ENGINE_OPTIONS: ConnectionOptions = {
        ...BIBLE_ENGINE_OPTIONS,
        database: LEXICON_MODULE.filename,
        name: 'lexicon-engine' 
      }
      bibleEngine = new BibleEngine(BIBLE_ENGINE_OPTIONS, {checkForExistingConnection: true})
      lexiconEngine = new BibleEngine(LEXICON_ENGINE_OPTIONS, {checkForExistingConnection: true})
    } catch (e) {
      console.log('setLocalDatabase had exception', e)
      Sentry.Native.captureException(e)
    } finally {
      console.timeEnd('setLocalDatabase')
    }
  }

  getCurrentModule(currentUid: string) {
    const module = BIBLE_MODULES.find(module => module.uid === currentUid)
    if (module) return module
    throw new Error(`no module found matching uid: ${currentUid}`)
  }

  async setupBibleModule(module: BibleModule | LexiconModule) {
    const files = await FileSystem.readDirectoryAsync(`${FileSystem.documentDirectory}SQLite/`)
    files.forEach(async file => {
      if(file.startsWith(module.filenamebase) && !file.startsWith(module.filename)) {
          await FileSystem.deleteAsync(`${FileSystem.documentDirectory}SQLite/${file}`, { idempotent: true })
      }
    })

    const destination = `${FileSystem.documentDirectory}SQLite/${module.filename}`
    const fileObj = await FileSystem.getInfoAsync(destination)
    if (!fileObj.exists || fileObj.size <= 12288) {
      // if fileObj.size <= 12288, it's a default sqlitedb created by typeorm
      await FileSystem.downloadAsync(
        module.asset.uri, 
        destination
      )
    }
  }

  async closeDatabaseConnection(bibleEngine: BibleEngine) {
    const db = await bibleEngine.pDB
    await db.connection.close()
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
    this.loading = true
    this.showStrongs = false
    const rangeQuery = {
      versionChapterNum: range.normalizedChapterNum,
      ...range,
      versionUid: this.versionUid,
    }
    this.versionChapterNum =
      rangeQuery.versionChapterNum || this.DEFAULT_CHAPTER
    this.versionUid = rangeQuery.versionUid
    this.bookOsisId = rangeQuery.bookOsisId
    this.chapterContent = []
    this.chapterSections = []

    const chapter = await bibleEngine.getFullDataForReferenceRange(
      rangeQuery,
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
    this.chapterSections = chapterContent.slice(0, 1)
    this.loading = false
    setTimeout(() => {
      this.showStrongs = true
    }, 100)
    console.timeEnd('updateCurrentBibleReference')
    this.captureAnalyticsEvent()
  }

  get notAllSectionsAreLoaded() {
    return this.chapterSections.length < this.chapterContent.length
  }

  loadAnotherSection = () => {
    if (this.notAllSectionsAreLoaded) {
      this.chapterSections.push(
        this.chapterContent[this.chapterSections.length]
      )
    }
  }

  getVerseContents = async (refs: IBibleCrossReference[]) => {
    try {
      const referenceRanges = refs.map(ref => ref.range)
      const verses = await Promise.all(
        referenceRanges.map(range =>
          bibleEngine!.getPhrases(range)
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

  goToPreviousChapter = () => {
    this.updateCurrentBibleReference(this.previousRange)
  }

  goToNextChapter = () => {
    this.updateCurrentBibleReference(this.nextRange)
  }

  toggleSettings = () => {
    if (!this.settingsRef || !this.settingsRef.current) return
    this.settingsRef.current.open()
  }

  @action setTheme = (theme) => {
    this.theme = theme;
    this.setIsDarkTheme()
  }

  @action setIsDarkTheme() {
    if (this.theme === Theme.AUTO) {
      // get system color scheme if auto
      this.isDarkTheme = Appearance.getColorScheme() === "dark";
    } else {
      this.isDarkTheme = this.theme === Theme.DARK
    }
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
    }
  }

  get currentBookAndChapter() {
    if (
      !this.bookOsisId ||
      !BOOK_DATA[this.bookOsisId] ||
      !this.cacheIsRestored
    )
    return ''
    const title = this.books.find(
      book => book.osisId === this.bookOsisId
    )?.title || ''
    return `${title} ${this.versionChapterNum}`
  }

  get versionUidToDisplay() {
    if (this.cacheIsRestored === false) return
    return this.versionUid
  }

  setSettingsRef(settingsRef) {
    this.settingsRef = settingsRef
  }

  async setUpErrorLogging() {
    Sentry.init({
      dsn: SENTRY_DSN,
      enableInExpoDevelopment: false,
      debug: false,
    })
  }

  captureAnalyticsEvent() {
    const reference = `${this.bookOsisId} ${this.versionChapterNum} ${this.versionUid}`
    analytics.hit(new PageHit(reference))
  }
}

export default new BibleStore()
