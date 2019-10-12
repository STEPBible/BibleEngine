import * as Font from 'expo-font';

const openSansBold = require('../assets/fonts/OpenSans-Bold.ttf');
const openSansSemibold = require('../assets/fonts/OpenSans-Semibold.ttf');
const openSans = require('../assets/fonts/OpenSans-Regular.ttf');
const openSansLight = require('../assets/fonts/OpenSans-Light.ttf');
const cardo = require('../assets/fonts/Cardo-Regular.ttf');
const cardoBold = require('../assets/fonts/Cardo-Bold.ttf');
const cardoItalic = require('../assets/fonts/Cardo-Italic.ttf');

export default class Fonts {
  static async load() {
    return Font.loadAsync({
      'open-sans-bold': openSansBold,
      'open-sans-semibold': openSansSemibold,
      'open-sans': openSans,
      'open-sans-light': openSansLight,
      'cardo-bold': cardoBold,
      'cardo-italic': cardoItalic,
      cardo
    });
  }
}
