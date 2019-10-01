import * as React from 'react'
import {
  Dimensions,
  FlatList,
  StatusBar,
  UIManager,
  View,
  Text,
  StyleSheet,
  LayoutAnimation,
} from 'react-native'
import * as store from 'react-native-simple-store'
import { MaterialIcons } from '@expo/vector-icons'
import {
  IBibleBook,
  IBibleContent,
  IBibleReference,
  IBibleVersion,
} from '@bible-engine/core'
import Database from './Database'
import Fonts from './Fonts'
import ReadingView from './ReadingView'
import {
  AsyncStorageKey,
  Flags,
  getDebugStyles,
  FontFamily,
  FontSize,
  Color,
  THEME,
} from './Constants'
import { ifIphoneX } from './utils'
import LoadingScreen from './LoadingScreen'
import SearchBarProvider from './SearchBarProvider'
import SearchBar from './SearchBar'
import 'react-native-console-time-polyfill'
const bibleDatabaseModule = require('../assets/bibles.db')
import ExpandableDrawer from './ExpandableDrawer'
import DrawerLayout from 'react-native-gesture-handler/DrawerLayout'
import { useKeepAwake } from 'expo-keep-awake'
import {
  ActivityIndicator,
  List,
  Provider as PaperProvider,
  TouchableRipple,
} from 'react-native-paper'
import Network from './Network'

const DEVICE_WIDTH = Dimensions.get('window').width
const DRAWER_WIDTH = DEVICE_WIDTH * 0.85
const DRAWER_HEIGHT = 52

interface State {
  activeBookIndex?: number
  books: IBibleBook[]
  content: IBibleContent[]
  currentBookOsisId: string
  currentBookFullTitle: string
  currentChapterNum: number
  currentVersion: IBibleVersion
  currentVersionUid: string
  isLeftMenuOpen: boolean
  isReady: boolean
  loading: boolean
  loadingMessage: string
  nextChapter?: IBibleReference
  offlineIsReady: boolean
  versionDrawerOpen: boolean
  versions: any[]
}

interface Props {}

export default class App extends React.PureComponent<Props, State> {
  useKeepAwake()
  leftMenuRef: any
  bookListRef: any
  database?: Database
  interval: any

  state = {
    activeBookIndex: undefined,
    books: [],
    content: [],
    currentBookOsisId: 'Gen',
    currentBookFullTitle: 'Gen',
    currentChapterNum: 1,
    currentVersionUid: 'ESV',
    currentVersion: {
      uid: 'ESV',
      title: 'English Standard Version',
    },
    isLeftMenuOpen: false,
    isReady: false,
    loading: false,
    loadingMessage: 'Loading fonts...',
    offlineIsReady: true,
    versionDrawerOpen: false,
    versions: [],
  }

  constructor(props: Props) {
    super(props)
    this.loadResourcesAsync()
  }

  render() {
    if (!this.state.isReady) {
      return <LoadingScreen loadingText={this.state.loadingMessage} />
    }
    return (
      <PaperProvider theme={THEME}>
        <DrawerLayout
          drawerWidth={DRAWER_WIDTH}
          drawerPosition={DrawerLayout.positions.Left}
          drawerType="front"
          drawerBackgroundColor="white"
          ref={ref => (this.leftMenuRef = ref)}
          renderNavigationView={this.renderDrawer}
        >
          <React.Fragment>
            <StatusBar hidden={true} />
            <SearchBarProvider>
              {(animation: any) => (
                <React.Fragment>
                  <SearchBar
                    changeBookAndChapter={this.changeBookAndChapter}
                    database={this.database}
                    toggleMenu={this.toggleMenu}
                    animation={animation}
                  />
                  {this.state.loading ? (
                    <LoadingScreen loadingText="Loading..." />
                  ) : (
                    <ReadingView
                      chapterNum={this.state.currentChapterNum}
                      books={this.state.books}
                      bookName={this.state.currentBookFullTitle}
                      bookOsisId={this.state.currentBookOsisId}
                      changeBookAndChapter={this.changeBookAndChapter}
                      content={this.state.content}
                      nextChapter={this.state.nextChapter}
                      database={this.database!}
                    />
                  )}
                </React.Fragment>
              )}
            </SearchBarProvider>
          </React.Fragment>
        </DrawerLayout>
      </PaperProvider>
    )
  }

  renderOfflineLoadingBanner = () => (
    <View style={styles.header__status}>
      <ActivityIndicator color={Color.TYNDALE_BLUE} />
      <Text style={styles.header__status__text}>Saving for offline use...</Text>
    </View>
  )

  renderOfflineSuccessBanner = () => (
    <View style={styles.header__status}>
      <View style={styles.header__status__icon}>
        <MaterialIcons color="#676767" name="offline-pin" size={25} />
      </View>
      <Text style={styles.header__status__text}>Offline</Text>
    </View>
  )

  toggleVersionDrawer = () => {
    console.log('toggleVersionDrawer')
    const animation = LayoutAnimation.create(150, 'easeInEaseOut', 'opacity')
    LayoutAnimation.configureNext(animation)
    this.setState({
      ...this.state,
      versionDrawerOpen: !this.state.versionDrawerOpen,
    })
  }

  renderHeader = () => (
    <React.Fragment>
      <TouchableRipple onPress={this.toggleVersionDrawer} style={styles.header}>
        <React.Fragment>
          <View>
            <Text style={styles.header__title}>
              {this.state.currentVersionUid}
            </Text>
            {this.state.offlineIsReady
              ? this.renderOfflineSuccessBanner()
              : this.renderOfflineLoadingBanner()}
          </View>
          <View style={styles.header__icon}>
            <MaterialIcons
              color="#676767"
              name={
                this.state.versionDrawerOpen ? 'expand-less' : 'expand-more'
              }
              size={25}
            />
          </View>
        </React.Fragment>
      </TouchableRipple>
      {this.renderVersionList()}
    </React.Fragment>
  )

  changeVersion = (versionUid: string) => {
    const currentVersion = this.state.versions.filter(
      version => version.uid === versionUid
    )[0]
    this.setState(
      {
        ...this.state,
        currentVersion,
        currentVersionUid: versionUid,
        isLeftMenuOpen: false,
        versionDrawerOpen: false,
      },
      () => {
        this.changeBookAndChapter('Gen', 1)
      }
    )
    store.save(AsyncStorageKey.CACHED_VERSION_UID, versionUid)
    this.closeDrawer()
  }

  renderVersionList = () => {
    if (this.state.versionDrawerOpen) {
      return (
        <View style={styles.versions}>
          {this.state.versions
            .filter(version => version.uid !== this.state.currentVersionUid)
            .map((version: IBibleVersion) => (
              <List.Item
                key={version.uid}
                onPress={() => this.changeVersion(version.uid)}
                title={version.uid}
                style={{ paddingLeft: 23 }}
                description={version.title}
              />
            ))}
        </View>
      )
    }
    return null
  }

  renderDrawer = () => (
    <FlatList
      data={this.state.books}
      initialNumToRender={100}
      keyExtractor={(item, index) => index.toString()}
      getItemLayout={this.getItemLayout}
      ref={ref => (this.bookListRef = ref)}
      renderItem={({ item, index }) => (
        <ExpandableDrawer
          closeDrawer={this.closeDrawer}
          item={item}
          open={index === this.state.activeBookIndex}
          scrollToBook={this.scrollToBook}
          changeBookAndChapter={this.changeBookAndChapter}
          index={index}
        />
      )}
      ListHeaderComponent={this.renderHeader}
      ListFooterComponent={<View style={styles.footer} />}
      showsVerticalScrollIndicator={false}
    />
  )

  getItemLayout = (data, index) => ({
    length: DRAWER_HEIGHT,
    offset: DRAWER_HEIGHT * index,
    index,
  })

  scrollToBook = (index: number) => {
    if (index === this.state.activeBookIndex) {
      this.setState({
        ...this.state,
        activeBookIndex: undefined,
      })
      return
    }
    this.setState({
      ...this.state,
      activeBookIndex: index,
    })
    this.bookListRef.scrollToIndex({ index })
  }

  openDrawer = () => {
    if (this.leftMenuRef) {
      this.leftMenuRef.openDrawer()
    }
  }

  closeDrawer = () => {
    if (this.leftMenuRef) {
      this.leftMenuRef.closeDrawer()
    }
  }

  changeBookAndChapter = async (
    bookOsisId: string,
    versionChapterNum: number
  ) => {
    console.time('changeBookAndChapter')
    // this.setState not updating state here, so force a manual update
    this.state.loading = true
    this.forceUpdate()
    const { contents, nextChapter } = await this.getChapter(
      bookOsisId,
      versionChapterNum
    )
    const currentBookFullTitle = this.state.books.filter(
      book => book.osisId === bookOsisId
    )[0].title
    store.save(AsyncStorageKey.CACHED_CHAPTER_OUTPUT, contents)
    store.save(AsyncStorageKey.CACHED_OSIS_BOOK_NAME, bookOsisId)
    store.save(AsyncStorageKey.CACHED_CHAPTER_NUM, versionChapterNum)
    store.save(AsyncStorageKey.CACHED_NEXT_CHAPTER, nextChapter || null)
    this.setState({
      ...this.state,
      currentBookFullTitle,
      content: contents,
      currentBookOsisId: bookOsisId,
      currentChapterNum: versionChapterNum,
      isLeftMenuOpen: false,
      loading: false,
      nextChapter: nextChapter,
    })
    console.timeEnd('changeBookAndChapter')
  }

  toggleMenu = () => {
    this.leftMenuRef.openDrawer()
    this.setState({
      ...this.state,
      isLeftMenuOpen: !this.state.isLeftMenuOpen,
    })
  }

  updateLoadingMessage = (newMessage: string, error?: any) => {
    console.log(newMessage)
    if (error) {
      this.setState({
        ...this.state,
        loadingMessage: newMessage + this.safelyStringify(error),
      })
      return
    }
    this.setState({
      ...this.state,
      loadingMessage: newMessage,
    })
  }

  safelyStringify = (json: any): string => {
    const getCircularReplacer = () => {
      const seen = new WeakSet()
      return (key: any, value: any) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return
          }
          seen.add(value)
        }
        return value
      }
    }
    return JSON.stringify(json, getCircularReplacer())
  }

  pollForLocalDatabaseProgress = () => {
    this.interval = setInterval(() => {
      if (this.database!.localDbIsReady) {
        this.setState({
          ...this.state,
          offlineIsReady: true,
        })
        clearInterval(this.interval)
      }
    }, 5000)
  }

  loadResourcesAsync = async () => {
    UIManager.setLayoutAnimationEnabledExperimental &&
      UIManager.setLayoutAnimationEnabledExperimental(true)
    console.disableYellowBox = true

    await Fonts.load()
    this.database = new Database(bibleDatabaseModule)
    const dbIsAvailable = await this.database.databaseIsAvailable()
    if (!dbIsAvailable) {
      const internetIsAvailable = await Network.internetIsAvailable()
      if (!internetIsAvailable) {
        this.updateLoadingMessage(
          'Updating database... \n\n(can take up to 30 seconds) \n\n Speed improvements coming soon! 🚀'
        )
        await this.database.setLocalDatabase()
      } else {
        this.database.forceRemote = true
        this.database.setLocalDatabase()
        this.pollForLocalDatabaseProgress()
      }
    } else {
      await this.database.setLocalBibleEngine()
    }

    let bookList = null
    let chapterOutput = null
    let chapterNum = 0
    let osisBookName = ''
    let nextChapter = null
    let versionUid = ''

    if (Flags.USE_CACHE) {
      try {
        this.updateLoadingMessage('Finding your place...')
        ;[
          bookList,
          chapterOutput,
          chapterNum,
          osisBookName,
          nextChapter,
          versionUid,
        ] = await store.get([
          AsyncStorageKey.CACHED_BOOK_LIST,
          AsyncStorageKey.CACHED_CHAPTER_OUTPUT,
          AsyncStorageKey.CACHED_CHAPTER_NUM,
          AsyncStorageKey.CACHED_OSIS_BOOK_NAME,
          AsyncStorageKey.CACHED_NEXT_CHAPTER,
          AsyncStorageKey.CACHED_VERSION_UID,
        ])
      } catch (error) {
        this.updateLoadingMessage('Error finding your place: ', error)
        throw error
      }
    }
    if (!bookList) {
      bookList = await this.getBooks()
    }
    if (!osisBookName) {
      osisBookName = 'Gen'
      store.save(AsyncStorageKey.CACHED_OSIS_BOOK_NAME, osisBookName)
    }
    if (!chapterNum) {
      chapterNum = 1
      store.save(AsyncStorageKey.CACHED_CHAPTER_NUM, chapterNum)
    }
    if (!versionUid) {
      versionUid = 'ESV'
      store.save(AsyncStorageKey.CACHED_VERSION_UID, versionUid)
    }
    if (!chapterOutput || !nextChapter) {
      const result = await this.getChapter(osisBookName, chapterNum)
      nextChapter = result.nextChapter
      chapterOutput = result.contents
    }
    const currentBookFullTitle = bookList.filter(
      book => book.osisId === osisBookName
    )[0].title

    const versions = await this.database!.getVersions()
    const currentVersion = versions.filter(
      version => version.uid === versionUid
    )[0]
    this.updateLoadingMessage('Tidying up...')
    const animation = LayoutAnimation.create(150, 'easeInEaseOut', 'opacity')
    LayoutAnimation.configureNext(animation)
    this.setState({
      ...this.state,
      currentBookFullTitle,
      nextChapter,
      versions,
      currentVersion,
      currentBookOsisId: osisBookName,
      currentVersionUid: versionUid,
      books: bookList,
      content: chapterOutput,
      loadingMessage: 'done!',
      isLeftMenuOpen: false,
      currentChapterNum: chapterNum,
      isReady: true,
      offlineIsReady: !!this.database.localDbIsReady,
    })
  }

  getChapter = async (bookOsisId: string, versionChapterNum: number) => {
    this.updateLoadingMessage('Loading chapter...')
    try {
      const result = await this.database!.getChapter(
        this.state.currentVersionUid,
        bookOsisId,
        versionChapterNum
      )
      store.save(AsyncStorageKey.CACHED_CHAPTER_OUTPUT, result.contents)
      store.save(
        AsyncStorageKey.CACHED_NEXT_CHAPTER,
        result.nextChapter || null
      )
      return result
    } catch (error) {
      this.updateLoadingMessage('Error loading chapter: ', error)
      throw error
    }
  }

  getBooks = async () => {
    this.updateLoadingMessage('Loading books...')
    try {
      let bookList: any = await this.database!.getBooks()
      store.save(AsyncStorageKey.CACHED_BOOK_LIST, bookList)
      return bookList
    } catch (error) {
      this.updateLoadingMessage('Error loading books: ', error)
      throw error
    }
  }
}

const styles = StyleSheet.create({
  footer: {
    height: 100,
  },
  header: {
    ...getDebugStyles(),
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomColor: '#E6E6E6',
    borderBottomWidth: 1,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: ifIphoneX(40, 28),
    paddingLeft: 30,
    paddingRight: 30,
    width: DRAWER_WIDTH,
  },
  header__title: {
    ...getDebugStyles(),
    fontFamily: FontFamily.OPEN_SANS_SEMIBOLD,
    fontSize: FontSize.LARGE,
  },
  header__subtitle: {
    ...getDebugStyles(),
    color: '#676767',
    fontFamily: FontFamily.OPEN_SANS,
    fontSize: FontSize.EXTRA_SMALL,
  },
  header__icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header__status: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 14,
  },
  header__status__icon: {
    width: 25,
    height: 25,
  },
  header__status__text: {
    marginLeft: 7,
    color: '#676767',
    fontFamily: FontFamily.OPEN_SANS,
    fontSize: FontSize.EXTRA_SMALL,
  },
  versions: {
    backgroundColor: '#ECEEF0',
    marginBottom: 15,
  },
})
