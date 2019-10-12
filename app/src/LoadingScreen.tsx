import React from 'react'
import { StyleSheet, Text, View, Platform } from 'react-native'
import { BarIndicator } from 'react-native-indicators'

import { Color, FontSize } from './Constants'
import Text from './Text'

interface Props {
  loadingText: string
}

export default class LoadingScreen extends React.PureComponent<Props, {}> {
  render() {
    return (
      <View style={styles.page}>
        <View style={styles.page__icon}>
          <BarIndicator
            animationDuration={600}
            size={85}
            color={Color.TYNDALE_BLUE}
          />
        </View>
        <Text style={styles.page__text}>{this.props.loadingText}</Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  page__icon: {
    height: 90,
    width: 90,
    marginBottom: 50,
  },
  page__text: {
    color: 'gray',
    fontSize: FontSize.LARGE,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'Roboto' },
    }),
    textAlign: 'center',
  },
})
