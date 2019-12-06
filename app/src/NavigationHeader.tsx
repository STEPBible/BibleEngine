import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { withNavigation } from 'react-navigation'
import { BOOK_DATA } from '@bible-engine/core'

import Text from './Text'
import { withGlobalContext } from './GlobalContext'
import { STATUS_BAR_HEIGHT, NAV_BAR_HEIGHT, FontSize } from './Constants'
import { TouchableRipple, IconButton } from 'react-native-paper'

interface Props {
  navigation: any
}

class NavigationHeader extends React.Component<Props, {}> {
  getBookName() {
    if (
      !this.props.global.bookOsisId ||
      !BOOK_DATA[this.props.global.bookOsisId]
    )
      return ''
    return BOOK_DATA[this.props.global.bookOsisId].names.en[0]
  }
  render() {
    return (
      <View style={styles.header}>
        <View style={styles.header__chips}>
          <TouchableRipple
            onPress={() => this.props.navigation.navigate('Books')}
            style={styles.header__chips__book}
          >
            <Text
              style={styles.header__chips__book__text}
            >{`${this.getBookName()} ${
              this.props.global.versionChapterNum
            }`}</Text>
          </TouchableRipple>
          <TouchableRipple
            onPress={() => this.props.navigation.navigate('Versions')}
            style={styles.header__chips__version}
          >
            <Text style={styles.header__chips__version__text}>
              {this.props.global.versionUid}
            </Text>
          </TouchableRipple>
        </View>
        <IconButton
          style={styles.header__search}
          onPress={() => this.props.navigation.navigate('Search')}
          icon="search"
          size={25}
          color="#9b9b9b"
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  header: {
    flex: 1,
    backgroundColor: 'white',
    flexDirection: 'row',
    height: NAV_BAR_HEIGHT,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomColor: '#999999',
    borderBottomWidth: 0.5,
  },
  header__chips: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  header__chips__book: {
    backgroundColor: '#EAEAEA',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 0,
    borderRadius: 4,
    minWidth: 70,
    minHeight: 32,
  },
  header__chips__book__text: {
    fontSize: FontSize.EXTRA_SMALL,
    margin: 8,
  },
  header__chips__version: {
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    marginLeft: 10,
    minWidth: 50,
    minHeight: 32,
  },
  header__chips__version__text: {
    fontSize: FontSize.EXTRA_SMALL,
    margin: 8,
  },
  header__search: {
    position: 'absolute',
    right: 4,
  },
})

export default withGlobalContext(withNavigation(NavigationHeader))
