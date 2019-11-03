import React from 'react'
import { View, Image } from 'react-native'
import { ProgressBar } from 'react-native-paper'

import { FontFamily, Color } from './Constants'
import Text from './Text'

export default class OfflineLoadingScreen extends React.Component {
  state = {
    downloadProgress: 0,
  }
  interval: any
  componentDidMount() {
    this.interval = setInterval(() => {
      this.setState({ downloadProgress: this.state.downloadProgress + 1 })
    }, 200)
  }
  componentWillUnmount() {
    clearInterval(this.interval)
  }
  render() {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Image
          style={{ width: 100, height: 100 }}
          source={require('../assets/boxes.png')}
        />
        <Text
          style={{
            fontFamily: FontFamily.OPEN_SANS_BOLD,
            fontSize: 20,
            marginTop: 58,
          }}
        >
          Unpacking Some Boxes...
        </Text>
        <Text
          style={{
            fontFamily: FontFamily.OPEN_SANS,
            fontSize: 20,
            marginTop: 20,
          }}
        >
          This can take a while, hang tight!
        </Text>
        <ProgressBar
          color={Color.TYNDALE_BLUE}
          style={{ width: 200, height: 20, marginTop: 50 }}
          progress={this.state.downloadProgress / 100}
        />
        <Text
          style={{
            fontFamily: FontFamily.OPEN_SANS_BOLD,
            fontSize: 20,
            marginTop: 26,
          }}
        >
          {`${this.state.downloadProgress}%`}
        </Text>
      </View>
    )
  }
}
