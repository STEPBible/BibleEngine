//  Created by Artem Bogoslavskiy on 7/5/18.

import React, { Component } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { ifIphoneX, ifAndroid } from './utils';
import {
  View,
  StyleSheet,
  TextInput,
  Animated,
  Dimensions
} from 'react-native';
import { SearchBar } from 'react-native-elements';

import { Margin, FontSize, FontFamily } from './Constants';

const DEVICE_HEIGHT = Dimensions.get('window').height;
const DEVICE_WIDTH = Dimensions.get('window').width;

export default class SearchBarAnimated extends Component {
  render() {
    const { animation } = this.props;

    const transformWrapper = animation.getTransformWrapper();
    const transformSearchBar = animation.getTransformSearchBar();

    return (
      <Animated.View style={[styles.wrapper, transformWrapper]}>
        <Animated.View style={[styles.searchInput, transformSearchBar]}>
          <SearchBar
            placeholder="Search..."
            onChangeText={this.updateSearch}
            value={'hai'}
            platform={'android'}
            placeholderTextColor="#949495"
            containerStyle={styles.search__container__input}
            leftIconContainerStyle={styles.search__container__left_icon}
            rightIconContainerStyle={styles.search__container__right_icon}
            ref={search => (this.searchRef = search)}
          />
        </Animated.View>
      </Animated.View>
    );
  }
}

const elevation = 3;
const BORDER_RADIUS = 8;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    zIndex: 99,
    backgroundColor: 'red',
    height: 0
  },
  searchInput: {
    display: 'flex',
    backgroundColor: 'gray',
    borderRadius: BORDER_RADIUS,
    height: 45,
    marginTop: ifIphoneX(20, -10),
    marginLeft: 10,
    marginRight: 10
  },
  search__container__input: {
    borderRadius: BORDER_RADIUS,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    elevation,
    shadowOpacity: 0.0015 * elevation + 0.18,
    shadowRadius: 0.8 * elevation,
    shadowOffset: {
      height: 0.6 * elevation,
      width: 0
    }
  },
  search__container__left_icon: {
    marginLeft: Margin.MEDIUM
  },
  search__container__right_icon: {
    marginRight: Margin.MEDIUM
  },
  searchIcon: {
    position: 'absolute',
    left: 13,
    top: 12
  },
  inputText: {
    display: 'flex',
    ...ifAndroid(
      {
        marginTop: 9
      },
      {
        marginTop: 13
      }
    ),
    marginLeft: 43,
    fontSize: 15,
    color: 'yellow'
  }
});
