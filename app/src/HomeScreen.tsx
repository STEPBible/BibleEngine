import React from 'react'
import { FlatList, Dimensions, View, StyleSheet } from 'react-native'
import { IBibleContent, IBiblePhrase } from '@bible-engine/core'
import { FAB } from 'react-native-paper'
import { observer } from 'mobx-react/native'
import store from 'react-native-simple-store'
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import {
  Margin,
  FontSize,
  Settings,
  getDebugStyles,
  FontFamily,
  AsyncStorageKey,
} from './Constants'
import NavigationHeader from './NavigationHeader'
import StrongsWord from './StrongsWord'
import CrossReference from './CrossReference'
import Footnote from './Footnote'
import Text from './Text'
import LoadingScreen from './LoadingScreen'
import bibleStore from './BibleStore'
import { observe } from 'mobx'
import QuickSettings from './QuickSettings'

@observer
class HomeScreen extends React.Component<{}, {}> {
  static navigationOptions = {
    headerShown: false,
  }
  flatListRef: any
  settingsRef = React.createRef()
  itemNum = 0

  state = {
    fontScale: 1,
    chapterSections: [],
    previousRange: {},
    loading: false,
    nextRange: {},
  }

  constructor(props) {
    super(props)
  }

  async componentDidMount() {
    store.get(AsyncStorageKey.HAS_LAUNCHED).then(hasLaunched => {
      if (!hasLaunched) {
        this.props.navigation.navigate('Onboarding')
        bibleStore.loadSearchIndex()
      }
    })
    await bibleStore.initialize()
    observe(bibleStore, 'loading', (value) => {
      this.setState({ ...this.state, loading: value.newValue })
      this.scrollToTop()
    })
    observe(bibleStore, 'nextRange', (value) => {
      console.log('value: ', )
      this.setState({ ...this.state, previousRange: value.newValue })
    })
    observe(bibleStore, 'previousRange', (value) => {
      this.setState({ ...this.state, previousRange: value.newValue })
    })
    observe(bibleStore, 'chapterSections', (value) => {
      this.setState({ ...this.state, chapterSections: value.newValue })
    })
    observe(bibleStore, 'fontScale', () => {
      // This component doesnt react to BibleStore.fontScale updates, for some reason
      // So we have to set the fontScale in the local component state
      this.setState({ ...this.state, fontScale: bibleStore.fontScale })
    })
    this.setState({
      ...this.state,
      fontScale: bibleStore.fontScale,
      chapterSections: bibleStore.chapterSections,
      loading: bibleStore.loading,
      nextRange: bibleStore.nextRange,
      previousRange: bibleStore.previousRange,
    })
  }

  renderItem = (content: any, index: number): any => {
    this.itemNum += 1
    if (content.item) {
      content = content.item
    }
    if (!('type' in content) || content.type === 'phrase') {
      return this.renderPhrase(content, index)
    }
    const children: IBibleContent[] = content.contents

    if (content.type === 'section') {
      return <View key={`section-${index}`}>{this.renderSection(content)}</View>
    }
    if (content.type === 'group') {
      if (content.groupType === 'paragraph' || content.groupType === 'indent') {
        return (
          <View key={`group-${index}`}>
            <View style={styles.paragraph}>
              {this.renderVerseNumber(content)}
              {children.map((child, index) => this.renderItem(child, index))}
            </View>
          </View>
        )
      }
    }
  }

  renderSection = (content: any): any => {
    const children: IBibleContent[] = content.contents
    return (
      <View style={styles.section}>
        {content.title ? (
          <Text style={bibleStore.scaledFontSize(styles.title)}>
            {content.title}
          </Text>
        ) : null}
        {children.map((child, index) => this.renderItem(child, index))}
      </View>
    )
  }

  renderVerseNumber = (content: any): any => {
    if (content.numbering) {
      return (
        <Text style={bibleStore.scaledFontSize(styles.verseNumber)}>
          {content.numbering.versionVerseIsStarting}
        </Text>
      )
    }
    return null
  }

  renderCrossReference = (content: any): any => {
    if (
      !Settings.CROSS_REFERENCES_ENABLED ||
      !content.crossReferences ||
      !content.crossReferences.length
    ) {
      return null
    }
    return (
      <CrossReference
        crossReferences={content.crossReferences}
        database={this.props.database}
      />
    )
  }

  renderFootnote = (content: IBiblePhrase): any => {
    if (
      !Settings.FOOTNOTES_ENABLED ||
      !content.notes ||
      !content.notes.length
    ) {
      return null
    }
    return <Footnote notes={content.notes} />
  }

  renderPhrase = (content: any, index): any => {
    if (content.strongs) {
      return (
        <View style={styles.phrase} key={`strong-${this.itemNum}`}>
          {this.renderFootnote(content)}
          {this.renderVerseNumber(content)}
          {this.renderCrossReference(content)}
          <StrongsWord
            key={`${content.content}-${content.strongs}`}
            phrase={content.content}
            strongs={content.strongs}
          />
        </View>
      )
    }
    return (
      <View style={styles.phrase} key={`phrase-${this.itemNum}`}>
        {this.renderFootnote(content)}
        {this.renderVerseNumber(content)}
        {this.renderCrossReference(content)}
        {content.content.split(' ').map((phrase, index) => (
          <View key={`phrase-${this.itemNum}-${index}`}>
            <Text style={bibleStore.scaledFontSize(styles.phraseText)}>
              {phrase}
            </Text>
          </View>
        ))}
      </View>
    )
  }

  renderFlatlistItem = ({ item, index }) => {
    return this.renderItem(item, index)
  }

  scrollToTop = () => {
    if (this.flatListRef) {
      this.flatListRef.scrollToOffset({ animated: false, offset: 0 })
    }
  }

  render() {
    return (
      <SafeAreaInsetsContext.Consumer>
        {insets => (
          <React.Fragment>
            <View style={{ height: insets?.top || 0 }} />
            <NavigationHeader />
            <FlatList
              data={this.state.chapterSections}
              ref={ref => (this.flatListRef = ref)}
              renderItem={this.renderItem}
              bounces={false}
              keyExtractor={(item, index) => `flatlist-item-${index}`}
              contentContainerStyle={styles.container}
              onEndReached={bibleStore.loadAnotherSection}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={this.state.loading && LoadingScreen}
              ListFooterComponent={
                bibleStore.notAllSectionsAreLoaded && <LoadingScreen />
              }
            />
            <FAB
              visible={
                bibleStore.fontsAreReady &&
                !this.state.loading &&
                !bibleStore.showSettings &&
                !!this.state.previousRange
              }
              color="#2F3030"
              small
              style={this.prevChapterButtonStyle(insets?.bottom || 0)}
              icon="chevron-left"
              onPress={bibleStore.goToPreviousChapter}
            />
            <FAB
              visible={
                bibleStore.fontsAreReady &&
                !this.state.loading &&
                !bibleStore.showSettings &&
                !!this.state.nextRange
              }
              color="#2F3030"
              small
              style={this.nextChapterButtonStyle(insets?.bottom || 0)}
              icon="chevron-right"
              onPress={bibleStore.goToNextChapter}
            />
            <QuickSettings />
          </React.Fragment>
        )}
      </SafeAreaInsetsContext.Consumer>
    )
  }

  prevChapterButtonStyle = (bottomInset: number) => ({
    ...styles.chapterButton,
    bottom: DEFAULT_NAV_BUTTONS_INSET + bottomInset,
    left: DEFAULT_NAV_BUTTONS_INSET,
  })

  nextChapterButtonStyle = (bottomInset: number) => ({
    ...styles.chapterButton,
    bottom: DEFAULT_NAV_BUTTONS_INSET + bottomInset,
    right: DEFAULT_NAV_BUTTONS_INSET,
  })
}

const DEFAULT_NAV_BUTTONS_INSET = 16

const styles = StyleSheet.create({
  container: {
    marginLeft: Margin.LARGE,
    marginRight: Margin.LARGE,
    marginTop: Margin.LARGE,
    paddingBottom: 96,
  },
  container__footer: {
    alignItems: 'center',
    color: '#848584',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    textAlign: 'center',
  },
  chapterButton: {
    backgroundColor: '#F9F9F9',
    position: 'absolute',
  },
  phrase: { flexDirection: 'row', ...getDebugStyles() },
  phraseText: {
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.MEDIUM,
    marginBottom: Margin.EXTRA_SMALL,
    marginRight: 7,
  },
  paragraph: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  section: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Margin.SMALL,
    ...getDebugStyles(),
  },
  title: {
    fontFamily: FontFamily.OPEN_SANS_SEMIBOLD,
    fontSize: FontSize.MEDIUM * 0.8,
    marginBottom: Margin.SMALL,
    width: Dimensions.get('window').width - Margin.LARGE * 2,
    ...getDebugStyles(),
  },
  verseNumber: {
    color: 'black',
    fontSize: FontSize.EXTRA_SMALL,
    fontFamily: FontFamily.OPEN_SANS_SEMIBOLD,
    marginRight: 3,
    marginTop: -2,
    ...getDebugStyles(),
  },
  footer: {
    flex: 1,
    margin: Margin.LARGE,
    marginBottom: Margin.LARGE * 2,
  },
})

export default HomeScreen
