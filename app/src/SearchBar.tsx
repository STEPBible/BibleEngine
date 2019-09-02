//  Created by Artem Bogoslavskiy on 7/5/18.

import React, { Component } from 'react';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { ifIphoneX, ifAndroid, ifIOS } from './utils';
import { IconButton, TouchableRipple } from 'react-native-paper';
import {
  BackHandler,
  StyleSheet,
  TextInput,
  Animated,
  TouchableOpacity,
  View,
  Text,
  Dimensions,
  ScrollView,
  Keyboard,
  TouchableHighlight,
  FlatList,
  TouchableNativeFeedback,
  StatusBar,
  LayoutAnimation
} from 'react-native';
import * as elasticlunr from 'elasticlunr';
import {
  Margin,
  FontSize,
  FontFamily,
  Color,
  getDebugStyles
} from './Constants';
import Database from './Database';
const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

interface VerseResult {
  reference: string;
  verseContent: string;
}

interface Props {
  toggleMenu: Function;
  animation: any;
  database: Database;
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
    this.verseResults = [];
  }

  componentDidMount() {
    setTimeout(() => {
      this.searchIndex = require('../assets/esvSearchIndex.json');
      this.lunrSearchEngine = elasticlunr.Index.load(this.searchIndex);
    }, 100);
    BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
  }

  handleBackPress = () => {
    if (this.state.isFocused) {
      this.endSearch();
      return true;
    }
    return false;
  };

  updateSearch = (inputText: string) => {
    const results = this.lunrSearchEngine.search(inputText, {});
    const refs = results.map(result => result.ref);
    this.verseResults = refs.map((ref: any) => ({
      reference: ref,
      verseContent: this.searchIndex.documentStore.docs[ref].vc,
      verseNum: this.searchIndex.documentStore.docs[ref].v,
      chapterNum: this.searchIndex.documentStore.docs[ref].c,
      bookName: this.searchIndex.documentStore.docs[ref].b
    }));
    this.setState({ inputText });
  };

  endSearch = () => {
    Keyboard.dismiss();
    const animation = LayoutAnimation.create(150, 'easeInEaseOut', 'opacity');
    LayoutAnimation.configureNext(animation);
    this.setState({
      ...this.state,
      inputText: '',
      isFocused: false
    });
  };

  renderIcon = () => {
    if (this.state.isFocused) {
      return (
        <IconButton
          icon="arrow-back"
          color="#888889"
          size={30}
          style={styles.search__input__icon}
          onPress={this.endSearch}
        />
      );
    }
    return (
      <IconButton
        icon="menu"
        color="#888889"
        size={30}
        style={styles.search__input__icon}
        onPress={this.props.toggleMenu}
      />
    );
  };

  renderSearchPage = () => {
    if (!this.state.isFocused) {
      return null;
    }
    return (
      <View underlayColor="#d4d4d4" style={styles.results}>
        <FlatList
          data={this.verseResults}
          showsVerticalScrollIndicator={false}
          renderItem={this.renderSearchResult}
          ListFooterComponent={<View style={styles.scrollViewBottomBuffer} />}
          keyExtractor={(item, index) => index.toString()}
        />
      </View>
    );
  };

  renderSearchResult = ({ item }) => (
    <TouchableRipple onPress={() => {}} underlayColor="#d4d4d4">
      <View style={styles.result}>{this.renderSearchResultContent(item)}</View>
    </TouchableRipple>
  );

  renderSearchResultContent = item => (
    <React.Fragment>
      <MaterialIcons
        style={styles.result__icon}
        name="search"
        size={25}
        color="#9b9b9b"
      />
      <View style={styles.result__content}>
        <Text numberOfLines={2} style={styles.result__content__text}>
          {item.verseContent}
        </Text>
        <Text style={styles.result__content__reference}>{item.reference}</Text>
      </View>
    </React.Fragment>
  );

  inputStyles = () => {
    const { animation } = this.props;
    const transformSearchBar = animation.getTransformSearchBar();
    if (this.state.isFocused) {
      return [transformSearchBar, styles['search__input--focused']];
    } else {
      return [transformSearchBar, styles.search__input];
    }
  };

  onFocus = () => {
    const animation = LayoutAnimation.create(150, 'easeInEaseOut', 'opacity');
    LayoutAnimation.configureNext(animation);
    this.setState({
      ...this.state,
      isFocused: true
    });
  };

  onClearTextTap = () => {
    this.setState({
      ...this.state,
      inputText: ''
    });
    this.verseResults = [];
  };

  renderClearIcon = () => {
    if (!this.state.isFocused || !this.state.inputText.length) {
      return null;
    }
    return (
      <IconButton
        icon="clear"
        color="#888889"
        size={30}
        style={styles.search__input__clear}
        onPress={this.onClearTextTap}
      />
    );
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
              onFocus={this.onFocus}
              onChangeText={this.updateSearch}
              value={this.state.inputText}
              ref={inputSearch => {
                this.inputSearch = inputSearch;
              }}
            />
            {this.renderClearIcon()}
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
    left: 0,
    height: 100,
    position: 'absolute',
    right: 0,
    top: ifAndroid(StatusBar.currentHeight, 20),
    zIndex: 2,
    ...getDebugStyles()
  },
  search__input: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    height: ifAndroid(56, 60),
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: ifIOS(ifIphoneX(20, -10), ifAndroid(-10, 12)),
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
    marginTop: ifIOS(ifIphoneX(20, -10), ifAndroid(-10, 12)),
    ...getDebugStyles()
  },
  search__input__icon: {
    marginLeft: Margin.MEDIUM,
    width: 30,
    height: 30,
    ...getDebugStyles()
  },
  search__input__clear: {
    marginRight: Margin.MEDIUM,
    width: 30,
    height: 30,
    ...getDebugStyles()
  },
  search__input__text: {
    flex: 1,
    fontSize: FontSize.SMALL,
    height: '100%',
    marginLeft: Margin.SMALL,
    zIndex: 3,
    ...getDebugStyles()
  },
  scrollViewBottomBuffer: {
    height: DEVICE_HEIGHT / 1.5,
    ...getDebugStyles()
  },
  results: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: ifAndroid(67, ifIphoneX(100, 67)),
    width: DEVICE_WIDTH,
    height: DEVICE_HEIGHT,
    backgroundColor: 'white',
    zIndex: 1
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Margin.MEDIUM,
    marginBottom: Margin.MEDIUM / 2,
    marginTop: Margin.MEDIUM / 2,
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
