import React from 'react'
import { BibleEngineClient } from '@bible-engine/client'
import {
  IBibleReferenceRangeQuery,
  BibleEngine,
  BibleVersionEntity,
  IBibleCrossReference,
} from '@bible-engine/core'
import * as FileSystem from 'expo-file-system'
import { SQLite } from 'expo-sqlite'
import NetInfo from '@react-native-community/netinfo'
import {
  REMOTE_BIBLE_ENGINE_URL,
  DATABASE_DOWNLOAD_URL,
  SENTRY_DSN,
  GOOGLE_ANALYTICS_TRACKING_ID,
} from 'react-native-dotenv'
import 'react-native-console-time-polyfill'

import Fonts from './Fonts'
import * as store from 'react-native-simple-store'
import { AsyncStorageKey, SQLITE_DIRECTORY, DATABASE_PATH } from './Constants'
import { ConnectionOptions } from 'typeorm'
import { StatusBar } from 'react-native'
import SentryExpo from 'sentry-expo'
import { Analytics, PageHit } from 'expo-analytics'
import bibleStore from './BibleStore'

const GlobalContext = React.createContext({})

export class GlobalContextProvider extends React.Component<{}, {}> {
  state = {
    chapterContent: [],
    versionChapterNum: '',
    bibleVersions: [],
    books: [],
    bookOsisId: '',
    versionUid: '',
    version: {},
    fontsAreReady: false,
    loading: true,
    forceRemote: true,
    isConnected: null,
    versionUidOfDownload: null,
    downloadProgress: 0,
    nextRange: {},
    previousRange: {},
  }
  constructor(props: any) {
    super(props)
    StatusBar.setHidden(true)
  }

  async componentDidMount() {
    console.time('bibleStore')
    await bibleStore.initialize()
    console.timeEnd('bibleStore')
  }

  render() {
    return (
      <GlobalContext.Provider
        value={{
          ...this.state,
        }}
      >
        {this.props.children}
      </GlobalContext.Provider>
    )
  }
}

export const withGlobalContext = (ChildComponent: any) => (props: any) => (
  <GlobalContext.Consumer>
    {context => <ChildComponent {...props} global={context} />}
  </GlobalContext.Consumer>
)
