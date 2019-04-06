import * as Expo from 'expo';
import * as React from 'react';
import {
  Dimensions,
  StatusBar,
  View,
  Keyboard,
  AsyncStorage
} from 'react-native';
import * as store from 'react-native-simple-store';

import { BibleBook, BibleEngine, IBibleOutputRich } from '@bible-engine/core';
import Database from './Database';
import Fonts from './Fonts';
import ReadingView from './ReadingView';
import SideMenu from './SideMenu';
import BookMenu from './BookMenu';
import SearchPage from './SearchPage';
import { AsyncStorageKey } from './Constants';

const bibleDatabaseModule = require('../assets/bibles.db');

const DEVICE_WIDTH = Dimensions.get('window').width;

interface State {
  books: BibleBook[];
  content: IBibleOutputRich[];
  currentBookOsisId: string;
  currentBookFullTitle: string;
  currentChapterNum: number;
  currentVersionUid: string;
  isLeftMenuOpen: boolean;
  isReady: boolean;
  isRightMenuOpen: boolean;
}

export default class App extends React.PureComponent<{}, State> {
  leftMenuRef: any;
  rightMenuRef: any;
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
    isRightMenuOpen: false
  };

  render() {
    if (!this.state.isReady) {
      return (
        <Expo.AppLoading
          startAsync={this.loadResourcesAsync}
          onFinish={() => this.setState({ isReady: true })}
          onError={console.warn}
        />
      );
    }

    return (
      <SideMenu
        menu={
          <BookMenu
            books={this.state.books}
            changeBookAndChapter={this.changeBookAndChapter}
          />
        }
        isOpen={this.state.isLeftMenuOpen}
        menuPosition="left"
        gesturesAreEnabled={this.leftMenuGesturesAreEnabled}
        bounceBackOnOverdraw={false}
        openMenuOffset={DEVICE_WIDTH * 0.76}
        edgeHitWidth={DEVICE_WIDTH}
        ref={ref => (this.leftMenuRef = ref)}
      >
        <SideMenu
          menu={
            <SearchPage keyboardShouldBeOpen={this.state.isRightMenuOpen} />
          }
          isOpen={this.state.isRightMenuOpen}
          menuPosition="right"
          bounceBackOnOverdraw={false}
          gesturesAreEnabled={this.rightMenuGesturesAreEnabled}
          openMenuOffset={DEVICE_WIDTH * 0.9}
          edgeHitWidth={DEVICE_WIDTH}
          ref={ref => (this.rightMenuRef = ref)}
          onChange={this.onSearchMenuChange}
        >
          <Expo.KeepAwake />
          <StatusBar hidden={true} />
          <ReadingView
            chapterNum={this.state.currentChapterNum}
            bookName={this.state.currentBookFullTitle}
            content={this.state.content}
            sqlBible={this.sqlBible}
          />
        </SideMenu>
      </SideMenu>
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

  loadResourcesAsync = async () => {
    console.disableYellowBox = true;
    await Fonts.load();
    await Database.load(bibleDatabaseModule);
    this.sqlBible = new BibleEngine({
      database: 'bibles.db',
      type: 'expo',
      synchronize: false
    });
    const books = await this.sqlBible.getBooksForVersion(1);

    let [chapterOutput, chapterNum, osisBookName] = await store.get([
      AsyncStorageKey.CACHED_CHAPTER_OUTPUT,
      AsyncStorageKey.CACHED_CHAPTER_NUM,
      AsyncStorageKey.CACHED_OSIS_BOOK_NAME
    ]);
    if (!osisBookName) {
      osisBookName = 'Gen';
      store.save(AsyncStorageKey.CACHED_OSIS_BOOK_NAME, osisBookName);
    }
    if (!chapterNum) {
      chapterNum = 1;
      store.save(AsyncStorageKey.CACHED_CHAPTER_NUM, chapterNum);
    }
    if (!chapterOutput) {
      chapterOutput = await this.sqlBible.getFullDataForReferenceRange(
        {
          bookOsisId: osisBookName,
          versionUid: 'ESV',
          versionChapterNum: chapterNum
        },
        true
      );
      store.save(AsyncStorageKey.CACHED_CHAPTER_OUTPUT, chapterOutput);
    }
    const currentBookFullTitle = books.filter(
      book => book.osisId === osisBookName
    )[0].title;
    this.setState({
      ...this.state,
      books,
      currentBookFullTitle,
      content: chapterOutput.content.contents
    });
  };

  leftMenuGesturesAreEnabled = () => {
    if (!this.rightMenuRef) {
      return true;
    }
    return !this.rightMenuRef.isOpen;
  };

  rightMenuGesturesAreEnabled = () => {
    if (!this.leftMenuRef) {
      return true;
    }
    return !this.leftMenuRef.isOpen;
  };
}
