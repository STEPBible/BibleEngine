import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { BibleVersionEntity } from '@bible-engine/core'
import { observer } from 'mobx-react/native'

import bibleStore from './BibleStore'
import { FontFamily } from './Constants'
import { TouchableRipple } from 'react-native-paper'

@observer
class VersionScreen extends React.Component<any, any> {
  static navigationOptions = {
    headerTitle: 'Versions',
  }
  state = {
    versions: [],
  }

  renderDownloadIcon = (version: BibleVersionEntity) => {
    return null
  }
  render() {
    return (
      <ScrollView contentContainerStyle={styles.list}>
        {bibleStore.bibleVersions.map((version: BibleVersionEntity) => (
          <TouchableRipple
            onPress={() => {
              this.props.navigation.navigate('Home')
              bibleStore.changeCurrentBibleVersion(version.uid)
            }}
            underlayColor="#e8eaed"
            key={version.uid}
            style={styles.list__item}
          >
            <React.Fragment>
              <Text style={styles.list__item__header}>{version.uid}</Text>
              <Text style={styles.list__item__description}>
                {version.title}
              </Text>
            </React.Fragment>
          </TouchableRipple>
        ))}
      </ScrollView>
    )
  }
}

const styles = StyleSheet.create({
  list: {
    paddingTop: 8,
  },
  list__item: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 8,
    padding: 8,
  },
  list__item__header: {
    fontFamily: FontFamily.OPEN_SANS_SEMIBOLD,
    fontSize: 16,
    paddingBottom: 8,
  },
  list__item__description: {
    color: '#9B9B9B',
    fontFamily: FontFamily.OPEN_SANS,
    fontSize: 14,
    paddingBottom: 8,
  },
})

export default VersionScreen
