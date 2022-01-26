import React from 'react'
import { StyleSheet, View } from 'react-native'
import { TouchableRipple, Text } from 'react-native-paper'
import { ScrollView } from 'react-native-gesture-handler'
import { BibleVersionEntity } from '@bible-engine/core'
import { observer } from 'mobx-react/native'

import bibleStore from './BibleStore'
import { BIBLE_MODULES, FontFamily } from './Constants'

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
        {BIBLE_MODULES.map((module) => (
          <TouchableRipple
            onPress={() => {
              this.props.navigation.navigate('Home')
              bibleStore.changeCurrentBibleVersion(module)
            }}
            underlayColor="#e8eaed"
            key={module.uid}
            style={styles.list__item}
          >
            <React.Fragment>
              <Text style={styles.list__item__header}>{module.uid}</Text>
              <Text style={styles.list__item__description}>
                {module.title}
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
    fontFamily: FontFamily.OPEN_SANS,
    fontSize: 14,
    paddingBottom: 8,
  },
})

export default VersionScreen
