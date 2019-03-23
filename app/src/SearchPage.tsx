import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Keyboard,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SearchBar } from 'react-native-elements';
import * as elasticlunr from 'elasticlunr';
import { Margin, FontSize, FontFamily } from './Constants';

const DEVICE_HEIGHT = Dimensions.get('window').height;

interface State {
  inputText: string;
}

interface Props {
  keyboardShouldBeOpen: boolean;
}

interface VerseResult {
  reference: string;
  verseContent: string;
}

export default class SearchPage extends React.PureComponent<Props, State> {
  searchRef: any;
  lunrSearchEngine: any;
  searchIndex: any;
  keyboardShouldBeOpen: any;
  verseResults: VerseResult[];
  state = {
    inputText: ''
  };
  constructor(props: Props) {
    super(props);
    this.searchIndex = require('../assets/esvSearchIndex.json');
    this.lunrSearchEngine = elasticlunr.Index.load(this.searchIndex);
    this.verseResults = [];
  }

  updateSearch = (inputText: string) => {
    console.log(inputText);
    const results = this.lunrSearchEngine.search(inputText, {}).slice(0, 20);
    const refs = results.map(result => result.ref);
    this.verseResults = refs.map((ref: any) => ({
      reference: ref,
      verseContent: this.searchIndex.documentStore.docs[ref].body
    }));
    this.setState({ inputText });
  };

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.keyboardShouldBeOpen !== this.keyboardShouldBeOpen) {
      this.keyboardShouldBeOpen = nextProps.keyboardShouldBeOpen;
      if (this.keyboardShouldBeOpen && this.searchRef) {
        this.searchRef.focus();
      } else {
        Keyboard.dismiss();
      }
    }
  }

  render() {
    return (
      <View style={styles.background}>
        <SafeAreaView style={{ backgroundColor: 'transparent' }}>
          <View style={styles.search__container}>
            <SearchBar
              placeholder="Search..."
              onChangeText={this.updateSearch}
              value={this.state.inputText}
              platform={Platform.OS}
              containerStyle={styles.search__container__input}
              leftIconContainerStyle={styles.search__container__icon}
              ref={search => (this.searchRef = search)}
            />
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {this.verseResults.map(result => (
              <View style={styles.result}>
                <MaterialIcons
                  style={styles.result__icon}
                  name="search"
                  size={25}
                  color="#9b9b9b"
                />
                <View style={styles.result__content}>
                  <Text numberOfLines={2} style={styles.result__content__text}>
                    {result.verseContent}
                  </Text>
                  <Text style={styles.result__content__reference}>
                    {result.reference}
                  </Text>
                </View>
              </View>
            ))}
            <View style={styles.scrollViewBottomBuffer} />
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }
}

const elevation = 2;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: 'white'
  },
  search__container: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    ...Platform.select({
      ios: {
        shadowOpacity: 0.0015 * elevation + 0.18,
        shadowRadius: 0.54 * elevation,
        shadowOffset: {
          height: 0.6 * elevation,
          width: 0
        }
      },
      android: {}
    })
  },
  search__container__input: {
    backgroundColor: 'transparent'
  },
  search__container__icon: {
    ...Platform.select({
      android: {
        marginLeft: Margin.MEDIUM
      }
    })
  },
  scrollViewBottomBuffer: {
    height: DEVICE_HEIGHT / 1.5
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: 'yellow',
    marginRight: Margin.MEDIUM,
    marginTop: Margin.MEDIUM,
    marginLeft: Margin.MEDIUM
  },
  result__icon: {
    marginRight: Margin.MEDIUM
  },
  result__content: {
    flex: 1
    // backgroundColor: 'magenta'
  },
  result__content__text: {
    flex: 3,
    fontFamily: FontFamily.OPEN_SANS,
    fontSize: FontSize.SMALL
    // backgroundColor: 'cyan'
  },
  result__content__reference: {
    flex: 1,
    color: '#898989',
    fontFamily: FontFamily.OPEN_SANS,
    fontSize: FontSize.EXTRA_SMALL,
    marginTop: 3
    // backgroundColor: 'orange'
  }
});
