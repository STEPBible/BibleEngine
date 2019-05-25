import * as Expo from 'expo';
import * as React from 'react';
import {
  Dimensions,
  FlatList,
  StatusBar,
  Keyboard,
  UIManager,
  View,
  Text,
  StyleSheet
} from 'react-native';
import * as store from 'react-native-simple-store';
import { IBibleBook, BibleEngine, IBibleContent } from '@bible-engine/core';
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
import { ifIphoneX, isAndroid } from './utils';
import LoadingScreen from './LoadingScreen';
import SearchBarProvider from './SearchBarProvider';
import SearchBar from './SearchBar';
import 'react-native-console-time-polyfill';
const bibleDatabaseModule = require('../assets/bibles.db');
import ExpandableDrawer from './ExpandableDrawer';
import DrawerLayout from 'react-native-gesture-handler/DrawerLayout';

const DEVICE_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = DEVICE_WIDTH * 0.85;
const DRAWER_HEIGHT = 48;

interface State {
  books: IBibleBook[];
  content: IBibleContent[];
  currentBookOsisId: string;
  currentBookFullTitle: string;
  currentChapterNum: number;
  currentVersionUid: string;
  isLeftMenuOpen: boolean;
  isReady: boolean;
  isRightMenuOpen: boolean;
  loadingMessage: string;
}

interface Props {}

export default class App extends React.PureComponent<Props, State> {
  leftMenuRef: any;
  bookListRef: any;
  sqlBible: BibleEngine;

  state = {
    books: [],
    content: [],
    currentBookOsisId: 'Gen',
    currentBookFullTitle: 'Gen',
    currentChapterNum: 1,
    currentVersionUid: 'ESV',
    isLeftMenuOpen: false,
    isReady: false,
    isRightMenuOpen: false,
    loadingMessage: ''
  };

  constructor(props: Props) {
    super(props);
    this.loadResourcesAsync();
  }

  componentDidMount() {
    setTimeout(() => {
      this.openDrawer();
    }, 200);
  }

  getItemLayout = (data, index) => ({
    length: DRAWER_HEIGHT,
    offset: DRAWER_HEIGHT * index,
    index
  });

  scrollToBook = index => {
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
                <ReadingView
                  chapterNum={this.state.currentChapterNum}
                  bookName={this.state.currentBookFullTitle}
                  content={this.state.content}
                  sqlBible={this.sqlBible}
                />
              </React.Fragment>
            )}
          </SearchBarProvider>
        </React.Fragment>
      </DrawerLayout>
    );
  }

  changeBookAndChapter = async (
    bookOsisId: string,
    versionChapterNum: number
  ) => {
    const content = await this.sqlBible.getFullDataForReferenceRange(
      {
        bookOsisId,
        versionUid: 'ESV',
        versionChapterNum
      },
      true
    );
    const currentBookFullTitle = this.state.books.filter(
      book => book.osisId === bookOsisId
    )[0].title;
    store.save(AsyncStorageKey.CACHED_CHAPTER_OUTPUT, content);
    store.save(AsyncStorageKey.CACHED_OSIS_BOOK_NAME, bookOsisId);
    store.save(AsyncStorageKey.CACHED_CHAPTER_NUM, versionChapterNum);
    this.setState({
      ...this.state,
      currentBookFullTitle,
      content: content.content.contents,
      currentBookOsisId: bookOsisId,
      currentChapterNum: versionChapterNum,
      isLeftMenuOpen: false
    });
  };

  onSearchMenuChange = (menuIsNowOpen: boolean) => {
    if (!menuIsNowOpen) {
      Keyboard.dismiss();
      this.setState({
        ...this.state,
        isRightMenuOpen: false
      });
    } else {
      this.setState({
        ...this.state,
        isRightMenuOpen: true
      });
    }
  };

  updateLoadingMessage = (newMessage: string) => {
    console.log(newMessage);
    this.setState({
      ...this.state,
      loadingMessage: newMessage
    });
  };

  toggleMenu = () => {
    this.leftMenuRef.openDrawer();
    this.setState({
      ...this.state,
      isLeftMenuOpen: !this.state.isLeftMenuOpen
    });
  };

  loadResourcesAsync = async () => {
    UIManager.setLayoutAnimationEnabledExperimental &&
      UIManager.setLayoutAnimationEnabledExperimental(true);
    console.disableYellowBox = true;
    this.updateLoadingMessage('Loading fonts...');
    await Fonts.load();
    this.updateLoadingMessage('Loading database...');
    await Database.load(bibleDatabaseModule);
    this.sqlBible = new BibleEngine({
      database: 'bibles.db',
      type: 'expo',
      synchronize: false
    });
    this.updateLoadingMessage('Finding your place...');
    let bookList = null;
    let chapterOutput = null;
    let chapterNum = '';
    let osisBookName = '';

    if (Flags.USE_CACHE) {
      [bookList, chapterOutput, chapterNum, osisBookName] = await store.get([
        AsyncStorageKey.CACHED_BOOK_LIST,
        AsyncStorageKey.CACHED_CHAPTER_OUTPUT,
        AsyncStorageKey.CACHED_CHAPTER_NUM,
        AsyncStorageKey.CACHED_OSIS_BOOK_NAME
      ]);
    }
    if (!bookList) {
      this.updateLoadingMessage('Loading books...');
      bookList = await this.sqlBible.getBooksForVersion(1);
      bookList = bookList.map((book: BibleBook) => ({
        numChapters: book.chaptersCount.length,
        osisId: book.osisId,
        title: book.title
      }));
      store.save(AsyncStorageKey.CACHED_BOOK_LIST, bookList);
    }
    if (!osisBookName) {
      osisBookName = 'Gen';
      store.save(AsyncStorageKey.CACHED_OSIS_BOOK_NAME, osisBookName);
    }
    if (!chapterNum) {
      chapterNum = '1';
      store.save(AsyncStorageKey.CACHED_CHAPTER_NUM, chapterNum);
    }
    if (!chapterOutput) {
      this.updateLoadingMessage('Loading chapter...');
      chapterOutput = await this.sqlBible.getFullDataForReferenceRange(
        {
          bookOsisId: osisBookName,
          versionUid: 'ESV',
          versionChapterNum: Number(chapterNum)
        },
        true
      );
      store.save(AsyncStorageKey.CACHED_CHAPTER_OUTPUT, chapterOutput);
    }
    const currentBookFullTitle = bookList.filter(
      book => book.osisId === osisBookName
    )[0].title;
    this.setState({
      ...this.state,
      currentBookFullTitle,
      books: bookList,
      content: chapterOutput.content.contents,
      loadingMessage: 'done!',
      isLeftMenuOpen: false,
      currentChapterNum: chapterNum,
      isReady: true
    });
  };

  leftMenuGesturesAreEnabled = () => {
    if (!this.rightMenuRef) {
      return true;
    }
    return !this.rightMenuRef.isOpen;
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
    height: 120,
    marginBottom: 15,
    marginTop: ifIphoneX(30, 0),
    width: DRAWER_WIDTH
  },
  header__title: {
    fontFamily: FontFamily.OPEN_SANS_SEMIBOLD,
    fontSize: FontSize.LARGE,
    marginLeft: 16
  },
  header__subtitle: {
    color: '#676767',
    fontFamily: FontFamily.OPEN_SANS,
    fontSize: FontSize.EXTRA_SMALL,
    marginLeft: 16
  }
});
