import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { withNavigation } from 'react-navigation'
import { BOOK_DATA } from '@bible-engine/core'

import Text from './Text'
import { withGlobalContext } from './GlobalContext'

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
          <TouchableOpacity
            onPress={() => this.props.navigation.navigate('Books')}
            style={styles.header__chips__book}
          >
            <Text
              style={styles.header__chips__book__text}
            >{`${this.getBookName()} ${
              this.props.global.versionChapterNum
            }`}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => this.props.navigation.navigate('Versions')}
            style={styles.header__chips__version}
          >
            <Text style={styles.header__chips__version__text}>
              {this.props.global.versionUid}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header__chips: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  header__chips__book: {
    backgroundColor: '#EAEAEA',
    alignItems: 'center',
    margin: 0,
    borderRadius: 4,
    minWidth: 70,
    minHeight: 34,
  },
  header__chips__book__text: {
    margin: 8,
  },
  header__chips__version: {
    backgroundColor: '#EAEAEA',
    alignItems: 'center',
    marginLeft: 10,
    borderRadius: 4,
    minWidth: 50,
    minHeight: 34,
  },
  header__chips__version__text: {
    margin: 8,
  },
})

export default withGlobalContext(withNavigation(NavigationHeader))
