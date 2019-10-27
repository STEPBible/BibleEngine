import React from 'react'
import { StyleSheet } from 'react-native'
import { List, Button } from 'react-native-paper'
import { ScrollView } from 'react-native-gesture-handler'
import hoistNonReactStatics from 'hoist-non-react-statics'
import { BibleVersionEntity } from '@bible-engine/core'

import { withGlobalContext } from './GlobalContext'
import { Color } from './Constants'

class VersionScreen extends React.Component {
  static navigationOptions = {
    headerTitle: 'Versions',
  }
  state = {
    versions: [],
  }

  renderDownloadIcon = (dataLocation: string) => {
    if (dataLocation === 'remote') {
      return (
        <Button
          style={styles.downloadButton}
          color={Color.TYNDALE_BLUE}
          onPress={() => {}}
        >
          DOWNLOAD
        </Button>
      )
    }
    return <List.Icon color={Color.TYNDALE_BLUE} icon="offline-pin" />
  }
  render() {
    return (
      <ScrollView>
        {this.props.global.bibleVersions.map((version: BibleVersionEntity) => (
          <List.Item
            key={version.uid}
            title={version.uid}
            description={version.title}
            right={() => this.renderDownloadIcon(version.dataLocation)}
          />
        ))}
      </ScrollView>
    )
  }
}

const styles = StyleSheet.create({
  downloadButton: {
    marginTop: 8,
  },
})

export default hoistNonReactStatics(
  withGlobalContext(VersionScreen),
  VersionScreen
)
