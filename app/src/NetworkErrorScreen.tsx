import React from 'react'
import { View, Image, StyleSheet } from 'react-native'

import Text from './Text'

export default class NetworkErrorScreen extends React.Component {
  static navigationOptions = {
    header: null,
  }
  render() {
    return (
      <View style={styles.page}>
        <Image
          style={styles.page__icon}
          source={require('../assets/no-wifi.png')}
        />
        <View>
          <Text style={styles.page__header}>We're Sorry</Text>
          <Text style={styles.page__body}>
            Can't connect to the Internet, and no offline versions were found
          </Text>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    margin: 28,
    marginBottom: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  page__icon: {
    width: 100,
    height: 100,
    marginBottom: 50,
  },
  page__header: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 25,
  },
  page__body: {
    textAlign: 'center',
    fontSize: 20,
  },
})
