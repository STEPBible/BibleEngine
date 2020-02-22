import React from 'react'
import { View, Image } from 'react-native'
import { ProgressBar } from 'react-native-paper'

import { FontFamily, Color, FontSize, Margin } from './Constants'
import Text from './Text'

export default class OfflineLoadingScreen extends React.Component {
  static navigationOptions = {
    header: null,
  }
  interval: any
  state = {
    downloadProgress: 0,
  }
  componentDidMount() {
    this.interval = setInterval(() => {
      if (this.state.downloadProgress === 100) {
        this.props.navigation.navigate('OfflineSuccess')
      }
      this.setState({ downloadProgress: this.state.downloadProgress + 1 })
    }, 15)
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
            fontSize: FontSize.LARGE,
            marginTop: 58,
          }}
        >
          Unpacking Some Boxes...
        </Text>
        <Text
          style={{
            fontFamily: FontFamily.OPEN_SANS,
            fontSize: FontSize.LARGE,
            marginTop: Margin.LARGE,
            marginLeft: Margin.LARGE,
            marginRight: Margin.LARGE,
            textAlign: 'center',
          }}
        >
          Preparing for offline usage, hang tight!
        </Text>
        <ProgressBar
          color={Color.TYNDALE_BLUE}
          style={{ width: 200, height: 20, marginTop: 50 }}
          progress={this.state.downloadProgress / 100}
        />
        <Text
          style={{
            fontFamily: FontFamily.OPEN_SANS_BOLD,
            fontSize: FontSize.LARGE,
            marginTop: 26,
          }}
        >
          {`${this.state.downloadProgress}%`}
        </Text>
      </View>
    )
  }
}
