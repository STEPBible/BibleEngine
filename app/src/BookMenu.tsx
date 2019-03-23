import * as React from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  FlatList,
  Image,
  TouchableHighlight,
  Linking
} from 'react-native';
import BookMenuItem from './BookMenuItem';
import { BibleBook } from '@bible-engine/core';
import Colors from './Colors';
import { Color, FontFamily } from './Constants';
const messengerIcon = require('../assets/messenger.png');

interface Props {
  books: BibleBook[];
  changeBookAndChapter: Function;
}

interface State {
  activeSections: number[];
}

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

  _onMessengerPress = () => {
    Linking.openURL('https://m.me/stepbibles');
  };

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.bookSpine}>
          <TouchableHighlight
            underlayColor="white"
            style={styles.messengerIconWrapper}
            onPress={this._onMessengerPress}
          >
            <Image
              resizeMode={'contain'}
              styles={styles.messengerIcon}
              source={messengerIcon}
            />
          </TouchableHighlight>
        </View>
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
  bookSpine: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: Color.TYNDALE_BLUE,
    height: Dimensions.get('window').height,
    width: 57
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
  },
  messengerIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    width: 50,
    borderRadius: 8,
    marginBottom: 10
  },
  messengerIcon: {
    height: 5,
    width: 5,
    borderRadius: 1,
    backgroundColor: 'magenta'
  }
});
