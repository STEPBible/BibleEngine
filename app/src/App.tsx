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
  isLeftMenuOpen: boolean;
  isReady: boolean;
  isRightMenuOpen: boolean;
  content: IBibleOutputRich;
}

export default class App extends React.PureComponent<{}, State> {
  leftMenuRef: any;
  rightMenuRef: any;
  sqlBible: BibleEngine;

  state = {
    books: [],
    content: undefined,
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
        menu={<BookMenu books={this.state.books} />}
        isOpen={this.state.isLeftMenuOpen}
        menuPosition="left"
        gesturesAreEnabled={this.leftMenuGesturesAreEnabled}
        bounceBackOnOverdraw={false}
        openMenuOffset={DEVICE_WIDTH * 0.76}
        ref={ref => (this.leftMenuRef = ref)}
      >
        <SideMenu
          menu={<View style={{ flex: 1, backgroundColor: 'blue' }} />}
          isOpen={this.state.isRightMenuOpen}
          menuPosition="right"
          bounceBackOnOverdraw={false}
          gesturesAreEnabled={() => true}
          openMenuOffset={DEVICE_WIDTH * 0.76}
          ref={ref => (this.rightMenuRef = ref)}
        >
          <StatusBar hidden={true} />
          <ReadingView content={this.state.content} />
        </SideMenu>
      </SideMenu>
    );
  }

  loadResourcesAsync = async () => {
    console.disableYellowBox = true;
    await Fonts.load();
    await Database.load(bibleDatabaseModule);
    this.sqlBible = new BibleEngine({
      database: 'bibles.db',
      type: 'expo'
    });
    await this.sqlBible.setVersion('ESV');
    const books = await this.sqlBible.getBooksForVersion(1);
    const content = await this.sqlBible.getFullDataForReferenceRange(
      {
        bookOsisId: 'Gen',
        versionUid: 'ESV',
        versionChapterNum: 1
      },
      true
    );
    this.setState({
      ...this.state,
      books,
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
