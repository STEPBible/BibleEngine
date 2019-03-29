import * as Expo from 'expo';

const openSansBold = require('../assets/fonts/OpenSans-Bold.ttf');
const openSansSemibold = require('../assets/fonts/OpenSans-Semibold.ttf');
const openSans = require('../assets/fonts/OpenSans-Regular.ttf');
const openSansLight = require('../assets/fonts/OpenSans-Light.ttf');
const cardo = require('../assets/fonts/Cardo-Regular.ttf');
const cardoBold = require('../assets/fonts/Cardo-Bold.ttf');
const cardoItalic = require('../assets/fonts/Cardo-Italic.ttf');
const materialIcons = require('@expo/vector-icons/fonts/MaterialIcons.ttf');
const Ionicons = require('@expo/vector-icons/fonts/Ionicons.ttf');

export default class Fonts {
  static async load() {
    return Expo.Font.loadAsync({
      'open-sans-bold': openSansBold,
      'open-sans-semibold': openSansSemibold,
      'open-sans': openSans,
      'open-sans-light': openSansLight,
      'cardo-bold': cardoBold,
      'cardo-italic': cardoItalic,
      'Material Icons': materialIcons,
      MaterialIcons: materialIcons,
      cardo,
      Ionicons
    });
  }
}
