import React, { Fragment } from 'react';
import { Text, View, StyleSheet, Dimensions } from 'react-native';
import FlatList from './FlatList';
import { ifAndroid, ifIOS, ifIphoneX } from './utils';
import Sentry from 'sentry-expo';
Sentry.enableInExpoDevelopment = false;
Sentry.config(
  'https://a0758a0dd01040728b6b7b0a3747d7f8@sentry.io/1427804'
).install();

import {
  IBibleContent,
  BibleEngine,
  IBiblePhrase,
  IBibleReference,
  IBibleBook
} from '@bible-engine/core';
import StrongsWord from './StrongsWord';
import {
  Margin,
  FontSize,
  FontFamily,
  getDebugStyles,
  Flags,
  Settings,
  googleAnalytics
} from './Constants';
import CrossReference from './CrossReference';
import Footnote from './Footnote';
import { PageHit } from 'expo-analytics';
import { Button } from 'react-native-paper';
import Database from './Database';
import ReadingSection from './ReadingSection';

interface Props {
  chapterNum: number;
  bookName: string;
  changeBookAndChapter: Function;
  content: IBibleContent[];
  books: IBibleBook[];
  bookOsisId: string;
  nextChapter?: IBibleReference;
  database: Database;
}

interface State {
  bookOsisId: string;
  chapterNum: number;
  content: (IBibleContent | string)[];
  loading: boolean;
  nextChapter?: IBibleReference;
}

export default class ReadingView extends React.PureComponent<Props, State> {
  itemNum = 0;
  constructor(props: Props) {
    super(props);
    this.state = {
      ...this.props
    };
  }

  renderFlatlistItem = ({ item, index }) => {
    if ('overallTitle' in item) {
      return <Text style={styles.chapterHeader}>{item.overallTitle}</Text>;
    }
    return (
      <ReadingSection
        contents={item}
        database={this.props.database}
        index={index}
      />
    );
    return this.renderItem(item, index);
  };

  bookAndChapterTitle = () => ({
    overallTitle: `${this.props.bookName} ${this.props.chapterNum}`
  });

  componentDidMount() {
    if (!__DEV__) {
      googleAnalytics
        .hit(new PageHit(this.bookAndChapterTitle().overallTitle))
        .catch(() => {});
    }
  }

  render() {
    return (
      <View style={styles.background}>
        <FlatList
          data={[this.bookAndChapterTitle(), ...this.props.content]}
          showsVerticalScrollIndicator={false}
          renderItem={this.renderFlatlistItem}
          ListFooterComponent={this.renderListFooter}
          keyExtractor={(item: any, index: number) => `flatlist-item-${index}`}
        />
      </View>
    );
  }

  renderListFooter = () => {
    if (this.state.nextChapter) {
      const { bookOsisId, normalizedChapterNum } = this.state.nextChapter;
      const bookFullTitle = this.props.books.filter(
        book => book.osisId === bookOsisId
      )[0].title;
      return (
        <Button
          onPress={() =>
            this.props.changeBookAndChapter(bookOsisId, normalizedChapterNum)
          }
          mode="outlined"
          color="black"
          style={styles.footer}
        >
          {`${bookFullTitle} ${this.state.nextChapter.normalizedChapterNum}`}
        </Button>
      );
    }
    return null;
  };
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: 'white',
    flex: 1
  },
  chapterHeader: {
    fontSize: FontSize.EXTRA_LARGE,
    fontFamily: FontFamily.OPEN_SANS_LIGHT,
    marginTop: ifAndroid(-55, ifIphoneX(-30, -55)),
    marginBottom: Margin.LARGE,
    textAlign: 'center',
    ...getDebugStyles()
  },
  phrase: { ...getDebugStyles() },
  phraseText: {
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.MEDIUM,
    marginBottom: Margin.EXTRA_SMALL,
    marginRight: 7
  },
  paragraph: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  section: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: Margin.LARGE,
    marginRight: Margin.LARGE,
    ...getDebugStyles()
  },
  title: {
    fontFamily: FontFamily.OPEN_SANS_SEMIBOLD,
    fontSize: FontSize.MEDIUM * 0.8,
    marginBottom: Margin.SMALL,
    marginTop: Margin.SMALL,
    width: Dimensions.get('window').width - Margin.LARGE * 2,
    ...getDebugStyles()
  },
  verseNumber: {
    color: 'black',
    fontSize: FontSize.EXTRA_SMALL,
    fontFamily: FontFamily.OPEN_SANS_SEMIBOLD,
    marginRight: 3,
    marginTop: -2,
    ...getDebugStyles()
  },
  footer: {
    flex: 1,
    margin: Margin.LARGE,
    marginBottom: Margin.LARGE * 2
  }
});
