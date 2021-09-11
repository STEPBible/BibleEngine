import normalizeText from './normalizeText'
import { Analytics } from 'expo-analytics'
import { DefaultTheme } from 'react-native-paper'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import * as FileSystem from 'expo-file-system'

export const Flags = {
  DEBUG: false,
  USE_CACHE: true,
  REMOTE_ENABLED: true,
}

export const Settings = {
  CROSS_REFERENCES_ENABLED: true,
  FOOTNOTES_ENABLED: true,
}

export enum Margin {
  EXTRA_SMALL = normalizeText(5),
  SMALL = normalizeText(10),
  MEDIUM = normalizeText(15),
  LARGE = normalizeText(20),
  EXTRA_LARGE = normalizeText(30),
}

export enum FontSize {
  EXTRA_SMALL = normalizeText(13),
  SMALL = normalizeText(15),
  MEDIUM = normalizeText(18),
  LARGE = normalizeText(20),
  EXTRA_LARGE = normalizeText(30),
}

export enum Color {
  TYNDALE_BLUE = '#38748C',
  WHITE = 'white',
}

export enum FontFamily {
  OPEN_SANS_BOLD = 'open-sans-bold',
  OPEN_SANS_SEMIBOLD = 'open-sans-semibold',
  OPEN_SANS = 'open-sans',
  OPEN_SANS_LIGHT = 'open-sans-light',
  CARDO_BOLD = 'cardo-bold',
  CARDO_ITALIC = 'cardo-italic',
  CARDO = 'cardo',
}

export enum AsyncStorageKey {
  HAS_LAUNCHED = 'hasLaunched',
}

export const THEME = {
  ...DefaultTheme,
  fonts: {
    regular: FontFamily.OPEN_SANS,
    medium: FontFamily.OPEN_SANS_SEMIBOLD,
    light: FontFamily.OPEN_SANS_LIGHT,
    thin: FontFamily.OPEN_SANS_LIGHT,
  },
}

export function getDebugStyles() {
  if (Flags.DEBUG) {
    return {
      borderColor: randomColor(),
      borderWidth: 1,
    }
  }
  return {}
}

export const NAV_BAR_HEIGHT = 49
export const IOS_STATUS_BAR_HEIGHT = 20
export const STATUS_BAR_HEIGHT =
  Platform.OS === 'ios' ? IOS_STATUS_BAR_HEIGHT : Constants.statusBarHeight

export const SQLITE_DIRECTORY = `${FileSystem.documentDirectory}SQLite`
export const DATABASE_PATH = `${SQLITE_DIRECTORY}/bibles.db`

const testingColors = ['magenta', 'cyan', 'red', 'orange', 'green']

export function randomColor() {
  const index = Math.floor(Math.random() * 4)
  return testingColors[index]
}
