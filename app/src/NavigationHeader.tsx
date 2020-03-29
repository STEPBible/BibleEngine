import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { withNavigation } from 'react-navigation'
import { BOOK_DATA } from '@bible-engine/core'
import { TouchableRipple, IconButton } from 'react-native-paper'
import { observer } from 'mobx-react/native'
import { MaterialIcons } from '@expo/vector-icons'

import Text from './Text'
import { NAV_BAR_HEIGHT, FontSize, FontFamily } from './Constants'
import bibleStore from './BibleStore'

interface Props {
  navigation: any
}

@observer
class NavigationHeader extends React.Component<Props, {}> {
  getBookName() {
    if (!bibleStore.bookOsisId || !BOOK_DATA[bibleStore.bookOsisId]) return ''
    return BOOK_DATA[bibleStore.bookOsisId].names.en[0]
  }
  render() {
    return (
      <View style={styles.header}>
        {!bibleStore.loading && (
          <IconButton
            disabled={bibleStore.showSettings}
            style={styles.header__settings}
            onPress={bibleStore.toggleSettings}
            icon="dots-vertical"
            size={25}
            color="#9b9b9b"
          />
        )}
        <View style={styles.header__chips}>
          <TouchableRipple
            onPress={() => this.props.navigation.navigate('Books')}
            style={styles.header__chips__book}
          >
            <React.Fragment>
              <Text style={styles.header__chips__book__text}>
                {bibleStore.currentBookAndChapter}
              </Text>
              {bibleStore.versionUidToDisplay ? (
                <MaterialIcons name="expand-more" size={25} color="#9b9b9b" />
              ) : null}
            </React.Fragment>
          </TouchableRipple>
          <TouchableRipple
            onPress={() => this.props.navigation.navigate('Versions')}
            style={styles.header__chips__version}
          >
            <React.Fragment>
              <Text style={styles.header__chips__version__text}>
                {bibleStore.versionUidToDisplay}
              </Text>
              {bibleStore.versionUidToDisplay ? (
                <MaterialIcons name="expand-more" size={25} color="#9b9b9b" />
              ) : null}
            </React.Fragment>
          </TouchableRipple>
        </View>
        <IconButton
          style={styles.header__search}
          onPress={() => this.props.navigation.navigate('Search')}
          icon="magnify"
          size={25}
          color="#9b9b9b"
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  header: {
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
    marginLeft: 45,
    marginRight: 45,
  },
  header__chips__book: {
    flexDirection: 'row',
    backgroundColor: '#EAEAEA',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 0,
    borderRadius: 4,
    minWidth: 70,
    minHeight: 36,
    paddingLeft: 8,
    paddingRight: 4,
  },
  header__chips__book__text: {
    fontSize: FontSize.EXTRA_SMALL,
    fontFamily: FontFamily.OPEN_SANS_SEMIBOLD,
    paddingRight: 2,
  },
  header__chips__version: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    marginLeft: 8,
    minWidth: 50,
    minHeight: 36,
    paddingLeft: 8,
    paddingRight: 4,
  },
  header__chips__version__text: {
    fontSize: FontSize.EXTRA_SMALL,
    fontFamily: FontFamily.OPEN_SANS_SEMIBOLD,
    paddingRight: 2,
  },
  header__settings: {
    position: 'absolute',
    left: 4,
  },
  header__search: {
    position: 'absolute',
    right: 4,
  },
})

export default withNavigation(NavigationHeader)
