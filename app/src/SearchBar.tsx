//  Created by Artem Bogoslavskiy on 7/5/18.

import React, { Component } from 'react';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { ifIphoneX, ifAndroid } from './utils';
import {
  StyleSheet,
  TextInput,
  Animated,
  TouchableOpacity,
  View,
  Text,
  Dimensions,
  ScrollView,
  Keyboard,
  TouchableHighlight
} from 'react-native';
import * as elasticlunr from 'elasticlunr';
import {
  Margin,
  FontSize,
  FontFamily,
  Color,
  getDebugStyles
} from './Constants';
const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;
import 'react-native-console-time-polyfill';

interface VerseResult {
  reference: string;
  verseContent: string;
}

interface Props {
  toggleMenu: Function;
  animation: any;
  sqlBible: any;
}
interface State {
  inputText: string;
  isFocused: boolean;
}

export default class SearchPage extends React.PureComponent<Props, State> {
  state = {
    inputText: '',
    isFocused: false
  };
  searchRef: any;
  lunrSearchEngine: any;
  searchIndex: any;
  keyboardShouldBeOpen: any;
  verseResults: VerseResult[];

  constructor(props: Props) {
    super(props);
    this.searchIndex = require('../assets/esvSearchIndex.json');
    this.lunrSearchEngine = elasticlunr.Index.load(this.searchIndex);
    this.verseResults = [];
  }

  updateSearch = (inputText: string) => {
    const results = this.lunrSearchEngine.search(inputText, {}).slice(0, 20);
    const refs = results.map(result => result.ref);
    this.verseResults = refs.map((ref: any) => ({
      reference: ref,
      verseContent: this.searchIndex.documentStore.docs[ref].body
    }));
    this.setState({ inputText });
  };

  endSearch = () => {
    Keyboard.dismiss();
    this.setState({
      ...this.state,
      inputText: '',
      isFocused: false
    });
  };

  renderIcon = () => {
    if (this.state.isFocused) {
      return (
        <TouchableOpacity
          style={styles.search__input__icon}
          onPress={this.endSearch}
        >
          <MaterialCommunityIcons name="arrow-left" size={30} color="#888889" />
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        style={styles.search__input__icon}
        onPress={this.props.toggleMenu}
      >
        <MaterialIcons name="menu" size={30} color="#888889" />
      </TouchableOpacity>
    );
  };

  renderSearchPage = () => {
    if (!this.state.isFocused) {
      return null;
    }
    return (
      <View
        underlayColor="#d4d4d4"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          paddingTop: 100,
          width: DEVICE_WIDTH,
          height: DEVICE_HEIGHT,
          backgroundColor: 'white',
          zIndex: 1
        }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {this.verseResults.map(result => (
            <TouchableHighlight
              onPress={() => {}}
              underlayColor="#d4d4d4"
              style={styles.result}
            >
              <React.Fragment>
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
              </React.Fragment>
            </TouchableHighlight>
          ))}
          <View style={styles.scrollViewBottomBuffer} />
        </ScrollView>
      </View>
    );
  };

  inputStyles = () => {
    const { animation } = this.props;
    const transformSearchBar = animation.getTransformSearchBar();
    if (this.state.isFocused) {
      return [transformSearchBar, styles['search__input--focused']];
    } else {
      return [transformSearchBar, styles.search__input];
    }
  };

  render() {
    const { animation } = this.props;
    const transformWrapper = animation.getTransformWrapper();
    return (
      <React.Fragment>
        <Animated.View style={[styles.search, transformWrapper]}>
          <Animated.View style={this.inputStyles()}>
            {this.renderIcon()}
            <TextInput
              style={styles.search__input__text}
              placeholder={'Search...'}
              placeholderTextColor={'#828282'}
              underlineColorAndroid={'#fff'}
              selectionColor={Color.TYNDALE_BLUE}
              autoCorrect={false}
              onFocus={() => {
                this.setState({
                  ...this.state,
                  isFocused: true
                });
              }}
              onChangeText={this.updateSearch}
              value={this.state.inputText}
              ref={inputSearch => {
                this.inputSearch = inputSearch;
              }}
            />
          </Animated.View>
        </Animated.View>
        {this.renderSearchPage()}
      </React.Fragment>
    );
  }
}

const elevation = 3;
const BORDER_RADIUS = 8;

const styles = StyleSheet.create({
  search: {
    height: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 20,
    zIndex: 2,
    ...getDebugStyles()
  },
  search__input: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    height: ifAndroid(54, 60),
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: ifIphoneX(20, ifAndroid(-10, 12)),
    marginLeft: 10,
    marginRight: 10,
    elevation,
    shadowOpacity: 0.0015 * elevation + 0.18,
    shadowRadius: 0.8 * elevation,
    shadowOffset: {
      height: 0.6 * elevation,
      width: 0
    },
    ...getDebugStyles()
  },
  'search__input--focused': {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    height: ifAndroid(54, 60),
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
    marginTop: ifIphoneX(20, ifAndroid(-10, 12)),
    ...getDebugStyles()
  },
  search__input__icon: {
    marginLeft: Margin.MEDIUM,
    width: 30,
    height: 30,
    ...getDebugStyles()
  },
  search__input__text: {
    flex: 1,
    fontSize: FontSize.SMALL,
    height: '100%',
    marginLeft: Margin.MEDIUM,
    zIndex: 3,
    ...getDebugStyles()
  },
  scrollViewBottomBuffer: {
    height: DEVICE_HEIGHT / 1.5,
    ...getDebugStyles()
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Margin.MEDIUM,
    marginTop: Margin.MEDIUM,
    marginLeft: Margin.MEDIUM,
    borderRadius: 2,
    ...getDebugStyles()
  },
  result__icon: {
    marginRight: Margin.MEDIUM + Margin.EXTRA_SMALL,
    ...getDebugStyles()
  },
  result__content: {
    flex: 1,
    ...getDebugStyles()
  },
  result__content__text: {
    flex: 3,
    fontFamily: FontFamily.OPEN_SANS,
    fontSize: FontSize.SMALL,
    ...getDebugStyles()
  },
  result__content__reference: {
    flex: 1,
    color: '#898989',
    fontFamily: FontFamily.OPEN_SANS,
    fontSize: FontSize.EXTRA_SMALL,
    marginTop: 3,
    ...getDebugStyles()
  }
});
