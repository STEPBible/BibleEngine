import * as Expo from 'expo';
import * as React from 'react';
import {
  Dimensions,
  FlatList,
  StatusBar,
  UIManager,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import * as store from 'react-native-simple-store';
import Database from './Database';
import Fonts from './Fonts';
import ReadingView from './ReadingView';
import {
  AsyncStorageKey,
  Flags,
  getDebugStyles,
  FontFamily,
  FontSize
} from './Constants';
import { ifIphoneX } from './utils';
import LoadingScreen from './LoadingScreen';
import SearchBarProvider from './SearchBarProvider';
import SearchBar from './SearchBar';
import 'react-native-console-time-polyfill';
const bibleDatabaseModule = require('../assets/bibles.db');
import ExpandableDrawer from './ExpandableDrawer';
import DrawerLayout from 'react-native-gesture-handler/DrawerLayout';

const DEVICE_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = DEVICE_WIDTH * 0.85;
const DRAWER_HEIGHT = 52;

interface State {
  activeBookIndex?: number;
  books: IBibleBook[];
  content: IBibleContent[];
  currentBookOsisId: string;
  currentBookFullTitle: string;
  currentChapterNum: number;
  currentVersionUid: string;
  isLeftMenuOpen: boolean;
  isReady: boolean;
  loading: boolean;
  loadingMessage: string;
  nextChapter?: IBibleReference;
}

interface Props {}

export default class App extends React.PureComponent<Props, State> {
  leftMenuRef: any;
  bookListRef: any;
  sqlBible: BibleEngine;

  state = {
    activeBookIndex: undefined,
    books: [],
    content: [],
    currentBookOsisId: 'Gen',
    currentBookFullTitle: 'Gen',
    currentChapterNum: 1,
    currentVersionUid: 'ESV',
    isLeftMenuOpen: false,
    isReady: false,
    loading: false,
    loadingMessage: 'Loading fonts...'
  };

  constructor(props: Props) {
    super(props);
    this.loadResourcesAsync();
  }

  render() {
    if (!this.state.isReady) {
      return <LoadingScreen loadingText={this.state.loadingMessage} />;
    }
    return (
      <DrawerLayout
        drawerWidth={DRAWER_WIDTH}
        drawerPosition={DrawerLayout.positions.Left}
        drawerType="front"
        drawerBackgroundColor="white"
        ref={ref => (this.leftMenuRef = ref)}
        renderNavigationView={this.renderDrawer}
      >
        <React.Fragment>
          <Expo.KeepAwake />
          <StatusBar hidden={true} />
          <SearchBarProvider>
            {(animation: any) => (
              <React.Fragment>
                {Flags.SEARCH_ENABLED && (
                  <SearchBar
                    sqlBible={this.sqlBible}
                    toggleMenu={this.toggleMenu}
                    animation={animation}
                  />
                )}
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
                    sqlBible={this.sqlBible}
                  />
                )}
              </React.Fragment>
            )}
          </SearchBarProvider>
        </React.Fragment>
      </DrawerLayout>
    );
  }

  renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.header__title}>ESV</Text>
        <Text style={styles.header__subtitle}>English Standard Version</Text>
      </View>
    </View>
  );

  renderDrawer = () => (
    <FlatList
      data={this.state.books}
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
  );

  getItemLayout = (data, index) => ({
    length: DRAWER_HEIGHT,
    offset: DRAWER_HEIGHT * index,
    index
  });

  scrollToBook = (index: number) => {
    if (index === this.state.activeBookIndex) {
      this.setState({
        ...this.state,
        activeBookIndex: undefined
      });
      return;
    }
    this.setState({
      ...this.state,
      activeBookIndex: index
    });
    this.bookListRef.scrollToIndex({ index });
  };

  openDrawer = () => {
    if (this.leftMenuRef) {
      this.leftMenuRef.openDrawer();
    }
  };

  closeDrawer = () => {
    if (this.leftMenuRef) {
      this.leftMenuRef.closeDrawer();
    }
  };

  changeBookAndChapter = async (
    bookOsisId: string,
    versionChapterNum: number
  ) => {
    console.time('changeBookAndChapter');
    this.setState({
      ...this.state,
      loading: true
    });
    const { contents, nextChapter } = await Database.getChapter(
      this.sqlBible,
      bookOsisId,
      versionChapterNum
    );
    const currentBookFullTitle = this.state.books.filter(
      book => book.osisId === bookOsisId
    )[0].title;
    store.save(AsyncStorageKey.CACHED_CHAPTER_OUTPUT, contents);
    store.save(AsyncStorageKey.CACHED_OSIS_BOOK_NAME, bookOsisId);
    store.save(AsyncStorageKey.CACHED_CHAPTER_NUM, versionChapterNum);
    store.save(AsyncStorageKey.CACHED_NEXT_CHAPTER, nextChapter || null);
    this.setState({
      ...this.state,
      currentBookFullTitle,
      content: contents,
      currentBookOsisId: bookOsisId,
      currentChapterNum: versionChapterNum,
      isLeftMenuOpen: false,
      loading: false,
      nextChapter: nextChapter
    });
    console.timeEnd('changeBookAndChapter');
  };

  toggleMenu = () => {
    this.leftMenuRef.openDrawer();
    this.setState({
      ...this.state,
      isLeftMenuOpen: !this.state.isLeftMenuOpen
    });
  };

  updateLoadingMessage = (newMessage: string, error?: any) => {
    console.log(newMessage);
    if (error) {
      this.setState({
        ...this.state,
        loadingMessage: newMessage + this.safelyStringify(error)
      });
      return;
    }
    this.setState({
      ...this.state,
      loadingMessage: newMessage
    });
  };

  safelyStringify = (json: any): string => {
    const getCircularReplacer = () => {
      const seen = new WeakSet();
      return (key: any, value: any) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return;
          }
          seen.add(value);
        }
        return value;
      };
    };
    return JSON.stringify(json, getCircularReplacer());
  };

  loadResourcesAsync = async () => {
    UIManager.setLayoutAnimationEnabledExperimental &&
      UIManager.setLayoutAnimationEnabledExperimental(true);
    console.disableYellowBox = true;

    try {
      await Fonts.load();
    } catch (error) {
      this.updateLoadingMessage('Error loading fonts: ', error);
      Sentry.captureException(error);
    }

    const sqliteDirectory = `${Expo.FileSystem.documentDirectory}SQLite`;
    const pathToDownloadTo = `${sqliteDirectory}/bibles.db`;
    try {
      this.updateLoadingMessage('Creating sqlite directory...');
      const { exists } = await Expo.FileSystem.getInfoAsync(sqliteDirectory);
      if (!exists) {
        await Expo.FileSystem.makeDirectoryAsync(sqliteDirectory);
      }
    } catch (error) {
      this.updateLoadingMessage('Error creating sqlite directory: ', error);
      Sentry.captureException(error);
    }

    let incomingHash;
    let uriToDownload;
    try {
      this.updateLoadingMessage('Getting hash from module...');
      const asset = Expo.Asset.fromModule(bibleDatabaseModule);
      incomingHash = asset.hash;
      uriToDownload = asset.uri;
    } catch (error) {
      this.updateLoadingMessage('Error getting hash from module: ', error);
      Sentry.captureException(error);
    }

    let fileExists;
    try {
      this.updateLoadingMessage('Checking the database...');
      const { exists } = await Expo.FileSystem.getInfoAsync(pathToDownloadTo);
      fileExists = exists;
    } catch (error) {
      this.updateLoadingMessage('Error checking the database: ', error);
      Sentry.captureException(error);
    }

    const existingHash = await store.get('existingHash');
    if (!fileExists || incomingHash !== existingHash) {
      try {
        this.updateLoadingMessage(
          'Updating database... \n\n(can take up to 30 seconds) \n\n Speed improvements coming soon! 🚀'
        );
        await AsyncStorage.multiRemove(Object.keys(AsyncStorageKey));
        await Expo.FileSystem.deleteAsync(pathToDownloadTo, {
          idempotent: true
        });
        await Expo.FileSystem.downloadAsync(uriToDownload, pathToDownloadTo);
      } catch (error) {
        this.updateLoadingMessage('Error updating database: ', error);
        Sentry.captureException(error);
      }
      store.save('existingHash', incomingHash);
    }

    try {
      this.updateLoadingMessage('opening database...');
      await Expo.SQLite.openDatabase('bibles.db');
    } catch (error) {
      this.updateLoadingMessage('Error opening database: ', error);
      Sentry.captureException(error);
    }

    try {
      this.updateLoadingMessage('Loading BibleEngine...');
      this.sqlBible = new BibleEngine({
        database: 'bibles.db',
        type: 'expo',
        synchronize: false
      });
    } catch (error) {
      this.updateLoadingMessage('Error loading BibleEngine: ', error);
      Sentry.captureException(error);
    }

    let bookList = null;
    let chapterOutput = null;
    let chapterNum = 0;
    let osisBookName = '';
    let nextChapter = null;

    if (Flags.USE_CACHE) {
      try {
        this.updateLoadingMessage('Finding your place...');
        [
          bookList,
          chapterOutput,
          chapterNum,
          osisBookName,
          nextChapter
        ] = await store.get([
          AsyncStorageKey.CACHED_BOOK_LIST,
          AsyncStorageKey.CACHED_CHAPTER_OUTPUT,
          AsyncStorageKey.CACHED_CHAPTER_NUM,
          AsyncStorageKey.CACHED_OSIS_BOOK_NAME,
          AsyncStorageKey.CACHED_NEXT_CHAPTER
        ]);
      } catch (error) {
        this.updateLoadingMessage('Error finding your place: ', error);
        Sentry.captureException(error);
      }
    }

    if (!bookList) {
      bookList = await this.loadBooks();
    }
    if (!osisBookName) {
      osisBookName = 'Gen';
      store.save(AsyncStorageKey.CACHED_OSIS_BOOK_NAME, osisBookName);
    }
    if (!chapterNum) {
      chapterNum = 1;
      store.save(AsyncStorageKey.CACHED_CHAPTER_NUM, chapterNum);
    }
    if (!chapterOutput || !nextChapter) {
      const result = await this.getChapter(osisBookName, chapterNum);
      nextChapter = result.nextChapter;
      chapterOutput = result.contents;
    }
    const currentBookFullTitle = bookList.filter(
      book => book.osisId === osisBookName
    )[0].title;
    this.updateLoadingMessage('Tidying up...');
    const animation = LayoutAnimation.create(150, 'easeInEaseOut', 'opacity');
    LayoutAnimation.configureNext(animation);
    this.setState({
      ...this.state,
      currentBookFullTitle,
      nextChapter,
      currentBookOsisId: osisBookName,
      books: bookList,
      content: chapterOutput,
      loadingMessage: 'done!',
      isLeftMenuOpen: false,
      currentChapterNum: chapterNum,
      isReady: true
    });
  };

  getChapter = async (bookOsisId: string, versionChapterNum: number) => {
    this.updateLoadingMessage('Loading chapter...');
    try {
      const result = await Database.getChapter(
        this.sqlBible,
        bookOsisId,
        versionChapterNum
      );
      store.save(AsyncStorageKey.CACHED_CHAPTER_OUTPUT, result.contents);
      store.save(
        AsyncStorageKey.CACHED_NEXT_CHAPTER,
        result.nextChapter || null
      );
      return result;
    } catch (error) {
      this.updateLoadingMessage('Error loading chapter: ', error);
      Sentry.captureException(error);
      throw error;
    }
  };

  loadBooks = async () => {
    this.updateLoadingMessage('Loading books...');
    try {
      let bookList = await this.sqlBible.getBooksForVersion(1);
      bookList = bookList.map((book: IBibleBook) => ({
        numChapters: book.chaptersCount.length,
        osisId: book.osisId,
        title: book.title
      }));
      store.save(AsyncStorageKey.CACHED_BOOK_LIST, bookList);
      return bookList;
    } catch (error) {
      this.updateLoadingMessage('Error loading books: ', error);
      Sentry.captureException(error);
      return [];
    }
  };
}

const styles = StyleSheet.create({
  footer: {
    height: 100
  },
  header: {
    ...getDebugStyles(),
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomColor: '#E6E6E6',
    borderBottomWidth: 1,
    flex: 1,
    flexDirection: 'row',
    height: 100,
    marginBottom: 15,
    marginTop: ifIphoneX(30, 0),
    width: DRAWER_WIDTH
  },
  header__title: {
    fontFamily: FontFamily.OPEN_SANS_SEMIBOLD,
    fontSize: FontSize.LARGE,
    marginLeft: 30
  },
  header__subtitle: {
    color: '#676767',
    fontFamily: FontFamily.OPEN_SANS,
    fontSize: FontSize.EXTRA_SMALL,
    marginLeft: 30
  }
});
