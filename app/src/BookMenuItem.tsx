import * as React from 'react';
import {
  StyleSheet,
  Dimensions,
  Text,
  TouchableHighlight,
  SectionList
} from 'react-native';

import { BibleBook } from '@bible-engine/core';
import { Color } from './Constants';

interface Props {
  book: BibleBook;
  changeBookAndChapter: Function;
}

interface State {}

const ITEM_HEIGHT = 75;
const BOOK_NAME_ITEM_WIDTH = 230;

export default class BookMenuItem extends React.PureComponent<Props, State> {
  sectionListRef: any;

  getBookName = (book: BibleBook) => {
    return book.title;
  };

  _renderBookName = ({
    section: { title }
  }: {
    section: { title: string };
  }) => (
    <TouchableHighlight
      key={`${title}:title`}
      underlayColor={'white'}
      onPress={() => {
        this.sectionListRef.scrollToLocation({
          animated: true,
          sectionIndex: 0,
          itemIndex: 1
        });
      }}
      style={styles.bookName}
    >
      <Text style={styles.bookName__text}>{title}</Text>
    </TouchableHighlight>
  );

  _renderChapterNum = ({ item: chapterNum }: { item: number }) => (
    <TouchableHighlight
      onPress={() => {
        this.props.changeBookAndChapter(this.props.book.osisId, chapterNum);
      }}
      underlayColor={'white'}
      key={chapterNum}
      style={styles.chapters__chapterNum}
    >
      <Text style={styles.chapters__chapterNum__text}>{chapterNum}</Text>
    </TouchableHighlight>
  );

  getItemLayout = (data: any, index: number) => ({
    index,
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index
  });

  render() {
    const numChapters = this.props.book.chaptersCount.length;
    const chapterNums = Array.apply(null, { length: numChapters })
      .map(Number.call, Number)
      .slice(1);
    const bookName = this.getBookName(this.props.book);
    return (
      <SectionList
        key={bookName}
        sections={[{ title: bookName, data: chapterNums }]}
        horizontal={true}
        initialNumToRender={3}
        showsHorizontalScrollIndicator={false}
        ref={ref => {
          this.sectionListRef = ref;
        }}
        renderItem={this._renderChapterNum}
        getItemLayout={this.getItemLayout}
        renderSectionHeader={this._renderBookName}
        keyExtractor={(item, index) => index.toString()}
        onScrollToIndexFailed={() => console.log('scrollToIndex failed, rip')}
      />
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
    fontFamily: 'cardo',
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
