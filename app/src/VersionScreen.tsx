import React from 'react'
import { StyleSheet, View } from 'react-native'
import { List, Button, ProgressBar } from 'react-native-paper'
import { ScrollView } from 'react-native-gesture-handler'
import hoistNonReactStatics from 'hoist-non-react-statics'
import { BibleVersionEntity } from '@bible-engine/core'

import { withGlobalContext } from './GlobalContext'
import { Color } from './Constants'

class VersionScreen extends React.Component<any, any> {
  static navigationOptions = {
    headerTitle: 'Versions',
  }
  state = {
    versions: [],
  }

  renderDownloadIcon = (version: BibleVersionEntity) => {
    if (version.uid === this.props.global.versionUidOfDownload) {
      return (
        <View style={styles.progressBar}>
          <ProgressBar
            progress={this.props.global.downloadCompletionPercentage}
            color={Color.TYNDALE_BLUE}
          />
        </View>
      )
    }
    if (version.dataLocation === 'remote') {
      return (
        <Button
          disabled={!!this.props.global.versionUidOfDownload}
          style={styles.downloadButton}
          color={Color.TYNDALE_BLUE}
          onPress={() => this.props.global.downloadVersion(version.uid)}
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
            onPress={() => {
              this.props.global.changeCurrentBibleVersion(version)
              this.props.navigation.navigate('Home')
            }}
            right={() => this.renderDownloadIcon(version)}
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
  progressBar: {
    maxWidth: 50,
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
})

export default hoistNonReactStatics(
  withGlobalContext(VersionScreen),
  VersionScreen
)
