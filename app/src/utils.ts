//  Created by Artem Bogoslavskiy on 7/5/18.

import { Dimensions, Platform } from 'react-native'

export function isIphoneX() {
  const dimen = Dimensions.get('window')
  return (
    Platform.OS === 'ios' &&
    !Platform.isPad &&
    !Platform.isTVOS &&
    (dimen.height === 812 ||
      dimen.width === 812 ||
      dimen.height === 896 || dimen.width === 896)
  )
}

export function ifIphoneX(iphoneXStyle, regularStyle) {
  if (isIphoneX()) {
    return iphoneXStyle
  }
  return regularStyle
}

export function isAndroid() {
  return Platform.OS === 'android'
}

export function isIOS() {
  return Platform.OS === 'ios'
}

export function ifIOS(iosStyle, regularStyle) {
  if (isIOS()) {
    return iosStyle
  }
  return regularStyle
}

export function ifAndroid(androidStyle, regularStyle) {
  if (isAndroid()) {
    return androidStyle
  }
  return regularStyle
}

const isFunction = input => typeof input === 'function'
export function renderIf(predicate) {
  return function(elemOrThunk) {
    return predicate
      ? isFunction(elemOrThunk)
        ? elemOrThunk()
        : elemOrThunk
      : null
  }
}
