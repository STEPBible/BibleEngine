import React from 'react'
import { View, Image, Dimensions } from 'react-native'
import { TouchableRipple, ActivityIndicator } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import store from 'react-native-simple-store'

import {
  FontFamily,
  Color,
  FontSize,
  Margin,
  AsyncStorageKey,
} from './Constants'
import Text from './Text'

const DEVICE_WIDTH = Dimensions.get('window').width

export default class OfflineSuccessScreen extends React.Component {
  static navigationOptions = {
    header: null,
  }
  state = {
    loading: false,
  }
  onPress = () => {
    this.setState({ loading: true })
    store.save(AsyncStorageKey.HAS_LAUNCHED, true)
    this.props.navigation.popToTop()
  }
  buttonElement = () => {
    if (this.state.loading) {
      return <ActivityIndicator animating={true} color="white" />
    }
    return (
      <Text
        style={{
          color: 'white',
          fontFamily: FontFamily.OPEN_SANS_BOLD,
          fontSize: FontSize.SMALL,
        }}
      >
        GET STARTED
      </Text>
    )
  }
  render() {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            // backgroundColor: 'yellow',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              // backgroundColor: 'magenta',
            }}
          >
            <Image
              style={{ width: 100, height: 100 }}
              source={require('../assets/success.png')}
            />
            <Text
              style={{
                fontFamily: FontFamily.OPEN_SANS_BOLD,
                fontSize: FontSize.LARGE,
                marginTop: 58,
              }}
            >
              Offline mode enabled!
            </Text>
          </View>
          <View
            style={{
              flex: 0.2,
              justifyContent: 'center',
              // backgroundColor: 'orange',
              width: DEVICE_WIDTH,
            }}
          >
            <TouchableRipple
              onPress={this.onPress}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: Color.TYNDALE_BLUE,
                minHeight: 42,
                maxHeight: 42,
                borderRadius: 4,
                marginLeft: Margin.MEDIUM,
                marginRight: Margin.MEDIUM,
              }}
            >
              {this.buttonElement()}
            </TouchableRipple>
          </View>
        </View>
      </SafeAreaView>
    )
  }
}
