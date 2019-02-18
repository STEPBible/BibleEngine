import * as React from 'react';
import { StyleSheet, View, Dimensions, FlatList } from 'react-native';
import BookMenuItem from './BookMenuItem';
import { BibleBook } from '@bible-engine/core';
import Colors from './Colors';
import { Color, FontFamily } from './Constants';

interface Props {
  books: BibleBook[];
  changeBookAndChapter: Function;
}

interface State {
  activeSections: number[];
}

const ITEM_HEIGHT = 75;
const BOOK_NAME_ITEM_WIDTH = 230;

export default class BookMenu extends React.PureComponent<Props, State> {
  state: Readonly<State> = {
    activeSections: []
  };
  sectionListRef: any;

  _renderBookChapters = ({ item: book }: { item: BibleBook }) => {
    return (
      <BookMenuItem
        book={book}
        changeBookAndChapter={this.props.changeBookAndChapter}
      />
    );
  };

  _renderSeparator = () => <View style={styles.separator} />;

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.bookSpine} />
        <FlatList
          data={this.props.books}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={this._renderSeparator}
          renderItem={this._renderBookChapters}
          keyExtractor={(item, index) => index.toString()}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  bookName: {
    flex: 1,
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    marginLeft: 27,
    width: BOOK_NAME_ITEM_WIDTH
  },
  bookName__text: {
    fontFamily: 'cardo',
    fontSize: 20
  },
  bookSpine: {
    backgroundColor: Color.TYNDALE_BLUE,
    height: Dimensions.get('window').height,
    width: 57
  },
  chapters: {
    alignItems: 'center',
    backgroundColor: '#EBEBEB',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start'
  },
  chapters__chapterNum: {
    alignItems: 'center',
    backgroundColor: '#EBEBEB',
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    width: ITEM_HEIGHT
  },
  chapters__chapterNum__text: {
    color: '#686868',
    fontFamily: FontFamily.CARDO,
    fontSize: 21
  },
  container: {
    flex: 1,
    flexDirection: 'row'
  },
  separator: {
    backgroundColor: '#EBEBEB',
    height: 1,
    marginLeft: 27,
    width: 300
  }
});
