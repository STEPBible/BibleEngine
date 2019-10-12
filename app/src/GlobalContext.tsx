import React from 'react'
import { BibleEngineClient } from '@bible-engine/client'
import { IBibleContent } from '@bible-engine/core'
import Fonts from './Fonts'

const GlobalContext = React.createContext({})

interface State {
  chapterContent: IBibleContent[]
  fontsAreReady: boolean
}

export class GlobalContextProvider extends React.Component<{}, State> {
  bibleEngineClient: BibleEngineClient
  state = {
    chapterContent: [],
    fontsAreReady: false
  }
  constructor(props: any) {
    super(props)
    this.bibleEngineClient = new BibleEngineClient({
      bibleEngineOptions: {
        database: 'bibles.db',
        type: 'expo',
        synchronize: false
      },
      apiBaseUrl: 'https://stepbible.herokuapp.com/rest/v1/bible'
    })
    this.loadFonts()
  }

  async loadFonts() {
    await Fonts.load()
    this.setState({ ...this.state, fontsAreReady: true })
  }

  async componentDidMount() {
    const chapter = await this.bibleEngineClient.getFullDataForReferenceRange({
      bookOsisId: 'John',
      versionChapterNum: 1,
      versionUid: 'ESV'
    })
    const chapterContent = chapter.content.contents
    this.setState({ ...this.state, chapterContent })
  }

  render() {
    return (
      <GlobalContext.Provider
        value={{
          chapterContent: this.state.chapterContent,
          bibleEngine: this.bibleEngineClient
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
