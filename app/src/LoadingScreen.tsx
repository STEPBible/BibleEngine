import React from 'react'
import { View, Dimensions } from 'react-native'
import SkeletonPlaceholder from 'react-native-skeleton-placeholder'

import { Margin } from './Constants'

const WIDTH = Dimensions.get('window').width
const SMALL = WIDTH * 0.25
const LARGE = WIDTH * 0.85
const MEDIUM = WIDTH * 0.75

export default function LoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <SkeletonPlaceholder backgroundColor="#888888">
        <View
          style={{  borderRadius: 4, maxWidth: SMALL, height: 20, marginBottom: Margin.SMALL }}
        />
        <View
          style={{  borderRadius: 4, maxWidth: LARGE, height: 20, marginBottom: Margin.SMALL }}
        />
        <View
          style={{  borderRadius: 4, maxWidth: MEDIUM, height: 20, marginBottom: Margin.SMALL }}
        />
        <View
          style={{  borderRadius: 4, maxWidth: MEDIUM, height: 20, marginBottom: Margin.LARGE }}
        />
        <View
          style={{  borderRadius: 4, maxWidth: LARGE, height: 20, marginBottom: Margin.SMALL }}
        />
        <View
          style={{  borderRadius: 4, maxWidth: MEDIUM, height: 20, marginBottom: Margin.SMALL }}
        />
        <View
          style={{  borderRadius: 4, maxWidth: SMALL, height: 20, marginBottom: Margin.LARGE }}
        />
        <View
          style={{  borderRadius: 4, maxWidth: LARGE, height: 20, marginBottom: Margin.SMALL }}
        />
        <View
          style={{  borderRadius: 4, maxWidth: MEDIUM, height: 20, marginBottom: Margin.SMALL }}
        />
        <View
          style={{  borderRadius: 4, maxWidth: MEDIUM, height: 20, marginBottom: Margin.LARGE }}
        />
        <View
          style={{  borderRadius: 4, maxWidth: LARGE, height: 20, marginBottom: Margin.SMALL }}
        />
        <View
          style={{  borderRadius: 4, maxWidth: MEDIUM, height: 20, marginBottom: Margin.SMALL }}
        />
        <View
          style={{  borderRadius: 4, maxWidth: SMALL, height: 20, marginBottom: Margin.LARGE }}
        />
        <View
          style={{  borderRadius: 4, maxWidth: LARGE, height: 20, marginBottom: Margin.SMALL }}
        />
        <View
          style={{  borderRadius: 4, maxWidth: MEDIUM, height: 20, marginBottom: Margin.SMALL }}
        />
      </SkeletonPlaceholder>
    </View>
  )
}
