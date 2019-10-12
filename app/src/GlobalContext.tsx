import React from 'react'
import { BibleEngineClient } from '@bible-engine/client'
import { IBibleReferenceRangeQuery } from '@bible-engine/core'

import Fonts from './Fonts'
import * as store from 'react-native-simple-store'
import { AsyncStorageKey } from './Constants'

const GlobalContext = React.createContext({})

interface State {
  chapterContent: any
  versionChapterNum: number
  bookOsisId: string
  versionUid: string
  fontsAreReady: boolean
  loading: boolean
}

export class GlobalContextProvider extends React.Component<{}, State> {
  bibleEngineClient: BibleEngineClient
  state = {
    chapterContent: [],
    versionChapterNum: '',
    bookOsisId: '',
    versionUid: '',
    fontsAreReady: false,
    loading: true,
  }
  constructor(props: any) {
    super(props)
    this.bibleEngineClient = new BibleEngineClient({
      bibleEngineOptions: {
        database: 'bibles.db',
        type: 'expo',
        synchronize: false,
      },
      apiBaseUrl: 'https://stepbible.herokuapp.com/rest/v1/bible',
    })
    this.loadFonts()
  }

  async componentDidMount() {
    await this.getSavedState()
  }

  async loadFonts() {
    await Fonts.load()
    this.setState({ ...this.state, fontsAreReady: true })
  }

  async getSavedState() {
    const [cachedChapterNum, cachedBookName, cachedVersion] = await store.get([
      AsyncStorageKey.CACHED_CHAPTER_NUM,
      AsyncStorageKey.CACHED_OSIS_BOOK_NAME,
      AsyncStorageKey.CACHED_VERSION_UID,
    ])
    const DEFAULT_BOOK = 'Gen'
    const DEFAULT_CHAPTER = 1
    const DEFAULT_VERSION = 'ESV'
    const bookOsisId = cachedBookName || DEFAULT_BOOK
    const versionChapterNum = cachedChapterNum || DEFAULT_CHAPTER
    const versionUid = cachedVersion || DEFAULT_VERSION

    console.log(bookOsisId, versionChapterNum, versionUid)
    await this.updateCurrentBibleReference({
      bookOsisId,
      versionChapterNum,
      versionUid,
    })
  }

  updateCurrentBibleReference = async (range: IBibleReferenceRangeQuery) => {
    const chapter = await this.bibleEngineClient.getFullDataForReferenceRange(
      range,
      false,
      true
    )
    const chapterContent = chapter.content.contents
    this.setState(
      {
        ...this.state,
        ...range,
        chapterContent,
      },
      () => {
        this.setState({ ...this.state, loading: false })
      }
    )
  }

  render() {
    return (
      <GlobalContext.Provider
        value={{
          ...this.state,
          bibleEngine: this.bibleEngineClient,
          updateCurrentBibleReference: this.updateCurrentBibleReference,
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
