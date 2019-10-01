//  Created by Artem Bogoslavskiy on 7/5/18.

import { Animated, StatusBar } from 'react-native'
import { ifIphoneX, isAndroid } from './utils'

export default class SearchBarAnimation {
  topPartHeight = 55
  fullHeight = this.topPartHeight + 100

  maxClamp = this.fullHeight
  minClamp = this.topPartHeight

  initialScroll = 0
  maxActionAnimated = 88 // Location input height + padding (Bottom part)
  actionAnimated = new Animated.Value(0)
  scrollY = new Animated.Value(this.initialScroll)
  _clampedScrollValue = 0
  _scrollValue = 0
  initialState = null
  _statusBarStyle = null

  constructor(initialState) {
    this.initialState = initialState
    this._createClampedScroll()
    this.scrollY.addListener(this._updateScroll)
  }

  destroy() {
    this.scrollY.removeAllListeners()
  }

  _updateScroll = ({ value, manually }) => {
    this._clampedScrollValue = value
  }

  _createClampedScroll() {
    this.clampedScroll = Animated.diffClamp(
      this.scrollY.interpolate({
        // Only positive
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolateLeft: 'clamp',
      }),
      this.minClamp,
      this.maxClamp
    )
  }

  scrollToOffset(offset, animated) {
    if (offset != this.scrollY._value) {
      this.initialState.scrollToOffset({ offset, animated })
    }
  }

  animationProps = {
    initialScroll: this.initialScroll,
    scrollY: this.scrollY,
    fullHeight: this.fullHeight,
  }

  getTransformWrapper() {
    let byScroll = Animated.add(
      Animated.multiply(this.clampedScroll, -1),
      this.scrollY
        .interpolate({
          // To negative
          inputRange: [0, 1],
          outputRange: [0, -1],
        })
        .interpolate({
          // Add bottom height part
          inputRange: [-this.topPartHeight, 0],
          outputRange: [0, this.minClamp],
          extrapolate: 'clamp',
        })
    )

    return {
      transform: [
        {
          translateY: byScroll,
        },
      ],
    }
  }

  getTransformSearchBar() {
    return {
      transform: [
        {
          translateY: Animated.add(
            this.actionAnimated.interpolate({
              inputRange: [0, this.maxActionAnimated],
              outputRange: [0, -this.topPartHeight],
              extrapolate: 'clamp',
            }),
            this.scrollY.interpolate({
              inputRange: [0, this.topPartHeight],
              outputRange: [0, this.topPartHeight],
              extrapolate: 'clamp',
            })
          ),
        },
      ],
    }
  }
}
