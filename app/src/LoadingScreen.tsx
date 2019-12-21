import React from 'react'
import { View, Dimensions } from 'react-native'
import SkeletonPlaceholder from 'react-native-skeleton-placeholder'

import { Margin, NAV_BAR_HEIGHT } from './Constants'

const WIDTH = Dimensions.get('window').width
const SMALL = WIDTH * 0.25
const LARGE = WIDTH * 0.85
const MEDIUM = WIDTH * 0.75

export default function LoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        marginLeft: Margin.LARGE,
        marginTop: NAV_BAR_HEIGHT + Margin.MEDIUM,
      }}
    >
      <SkeletonPlaceholder>
        <View
          style={{ maxWidth: SMALL, height: 20, marginTop: Margin.SMALL }}
        />
        <View
          style={{ maxWidth: LARGE, height: 20, marginTop: Margin.SMALL }}
        />
        <View
          style={{ maxWidth: MEDIUM, height: 20, marginTop: Margin.SMALL }}
        />
        <View
          style={{ maxWidth: MEDIUM, height: 20, marginTop: Margin.LARGE }}
        />
        <View
          style={{ maxWidth: LARGE, height: 20, marginTop: Margin.SMALL }}
        />
        <View
          style={{ maxWidth: MEDIUM, height: 20, marginTop: Margin.SMALL }}
        />
        <View
          style={{ maxWidth: SMALL, height: 20, marginTop: Margin.LARGE }}
        />
        <View
          style={{ maxWidth: LARGE, height: 20, marginTop: Margin.SMALL }}
        />
        <View
          style={{ maxWidth: MEDIUM, height: 20, marginTop: Margin.SMALL }}
        />
        <View
          style={{ maxWidth: MEDIUM, height: 20, marginTop: Margin.LARGE }}
        />
        <View
          style={{ maxWidth: LARGE, height: 20, marginTop: Margin.SMALL }}
        />
        <View
          style={{ maxWidth: MEDIUM, height: 20, marginTop: Margin.SMALL }}
        />
        <View
          style={{ maxWidth: SMALL, height: 20, marginTop: Margin.LARGE }}
        />
        <View
          style={{ maxWidth: LARGE, height: 20, marginTop: Margin.SMALL }}
        />
        <View
          style={{ maxWidth: MEDIUM, height: 20, marginTop: Margin.SMALL }}
        />
      </SkeletonPlaceholder>
    </View>
  )
}
