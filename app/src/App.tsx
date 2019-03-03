import * as Expo from 'expo';
import * as React from 'react';
import { Dimensions, StatusBar, View } from 'react-native';

import { BibleBook, BibleEngine, IBibleOutputRich } from '@bible-engine/core';
import Database from './Database';
import Fonts from './Fonts';
import ReadingView from './ReadingView';
import SideMenu from './SideMenu';
import BookMenu from './BookMenu';

const bibleDatabaseModule = require('../assets/bible.db');

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
          menu={<View style={{ flex: 1, backgroundColor: 'blue' }} />}
          isOpen={this.state.isRightMenuOpen}
          menuPosition="right"
          bounceBackOnOverdraw={false}
          gesturesAreEnabled={() => false}
          openMenuOffset={DEVICE_WIDTH * 0.76}
          ref={ref => (this.rightMenuRef = ref)}
        >
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
    this.setState({
      ...this.state,
      currentBookFullTitle,
      content: content.content.contents,
      currentBookOsisId: bookOsisId,
      currentChapterNum: versionChapterNum,
      isLeftMenuOpen: false
    });
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
    await this.sqlBible.setVersion('ESV');
    const books = await this.sqlBible.getBooksForVersion(1);
    const currentBookFullTitle = books.filter(
      book => book.osisId === this.state.currentBookOsisId
    )[0].title;
    const content = await this.sqlBible.getFullDataForReferenceRange(
      {
        bookOsisId: this.state.currentBookOsisId,
        versionUid: 'ESV',
        versionChapterNum: this.state.currentChapterNum
      },
      true
    );
    this.setState({
      ...this.state,
      books,
      currentBookFullTitle,
      content: content.content.contents
    });
  };

  leftMenuGesturesAreEnabled = () => {
    if (!this.rightMenuRef) {
      return true;
    }
    return !this.rightMenuRef.isOpen;
  };
}
