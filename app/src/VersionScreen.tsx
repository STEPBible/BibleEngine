import React from 'react'
import { StyleSheet } from 'react-native'
import { List } from 'react-native-paper'
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
    if (version.dataLocation === 'db') {
      return <List.Icon color={Color.TYNDALE_BLUE} icon="offline-pin" />
    }
    return null
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
