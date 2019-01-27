import * as React from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  Text,
  TouchableHighlight,
  FlatList,
  SectionList
} from 'react-native';

import { BibleBook } from '@bible-engine/core';
import Colors from './Colors';

interface Props {
  books: BibleBook[];
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

  getBookName = (book: BibleBook) => {
    return book.osisId;
  };

  _renderBookName = ({
    section: { title }
  }: {
    section: { title: string };
  }) => (
    <TouchableHighlight
      key={`${title}:title`}
      underlayColor={'red'}
      onPress={() => {}}
      style={styles.bookName}
    >
      <Text style={styles.bookName__text}>{title}</Text>
    </TouchableHighlight>
  );

  _renderChapterNum = ({ item: chapterNum }: { item: number }) => (
    <TouchableHighlight
      onPress={() => {
        console.log(chapterNum);
      }}
      underlayColor={'white'}
      key={chapterNum}
      style={styles.chapters__chapterNum}
    >
      <Text style={styles.chapters__chapterNum__text}>{chapterNum}</Text>
    </TouchableHighlight>
  );

  _renderBookChapters = ({ item: book }: { item: BibleBook }) => {
    const numChapters = book.chaptersCount.length;
    const chapterNumComponents = [];
    const chapterNums = Array.apply(null, { length: numChapters })
      .map(Number.call, Number)
      .slice(1);
    const bookName = this.getBookName(book);
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
  };

  _renderSeparator = () => <View style={styles.separator} />;

  _updateSections = (activeSections: number[]) => {
    this.setState({ activeSections });
  };

  getItemLayout = (data: any, index: number) => ({
    index,
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index
  });

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

/*

<FlatList>
          <Accordion
            activeSections={this.state.activeSections}
            sections={this.props.books}
            renderHeader={this._renderBookName}
            renderContent={this._renderBookChapters}
            onChange={this._updateSections}
            underlayColor={'#EBEBEB'}
          />
        </FlatList>

*/

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
    backgroundColor: Colors.tyndaleBlue,
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
