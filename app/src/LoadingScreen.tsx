import React from 'react'
import { StyleSheet, View, Platform } from 'react-native'
import SkeletonPlaceholder from 'react-native-skeleton-placeholder'

import { FontSize, Margin } from './Constants'

export default function LoadingScreen() {
  return (
    <View style={{ flex: 1, marginLeft: Margin.LARGE }}>
      <SkeletonPlaceholder>
        <View style={{ width: 120, height: 20, marginTop: Margin.SMALL }} />
        <View style={{ width: 300, height: 20, marginTop: Margin.SMALL }} />
        <View style={{ width: 260, height: 20, marginTop: Margin.SMALL }} />
        <View style={{ width: 250, height: 20, marginTop: Margin.LARGE }} />
        <View style={{ width: 300, height: 20, marginTop: Margin.SMALL }} />
        <View style={{ width: 260, height: 20, marginTop: Margin.SMALL }} />
        <View style={{ width: 120, height: 20, marginTop: Margin.LARGE }} />
        <View style={{ width: 300, height: 20, marginTop: Margin.SMALL }} />
        <View style={{ width: 260, height: 20, marginTop: Margin.SMALL }} />
        <View style={{ width: 250, height: 20, marginTop: Margin.LARGE }} />
        <View style={{ width: 300, height: 20, marginTop: Margin.SMALL }} />
        <View style={{ width: 260, height: 20, marginTop: Margin.SMALL }} />
        <View style={{ width: 120, height: 20, marginTop: Margin.LARGE }} />
        <View style={{ width: 300, height: 20, marginTop: Margin.SMALL }} />
        <View style={{ width: 260, height: 20, marginTop: Margin.SMALL }} />
      </SkeletonPlaceholder>
    </View>
  )
}
