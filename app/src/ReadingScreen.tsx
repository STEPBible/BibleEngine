import React from 'react'
import { Text, Dimensions, View, ScrollView, StyleSheet } from 'react-native'
import store from 'react-native-simple-store'
import { observer } from 'mobx-react/native'

import {
  AsyncStorageKey, FontSize, Margin, FontFamily,
} from './Constants'
import psalm from './tests/models/Ps117.json'
import Popover from './Popover'
import { Color } from './Constants'
import bibleStore from './BibleStore'
import 'react-native-console-time-polyfill'
import NavigationHeader from './NavigationHeader'
import QuickSettings from './QuickSettings'

const DEVICE_WIDTH = Dimensions.get('window').width

@observer
export default class ReadingScreen extends React.Component<any, any> {
  static navigationOptions = {
    headerShown: false
  }
  state = {
    popoverIsVisible: false,
  }
  targetVerseNum = 240
  targetVerseRef?: View | null
  listRef?: ScrollView | null

  async componentDidMount() {
    await this.setupFirstTimeUserIfNeeded()
    await bibleStore.initialize()
  }

  async setupFirstTimeUserIfNeeded() {
    const hasLaunched = await store.get(AsyncStorageKey.HAS_LAUNCHED)
    if (!hasLaunched) {
      this.props.navigation.navigate('Onboarding')
      bibleStore.loadSearchIndex()
    }
  }

  bibleSection = (item, index) => (
    <React.Fragment key={`section-${index}`}>
      {this.sectionTitle(item.title, index)}
      {this.sectionContents(item, index)}
    </React.Fragment>
  )

  sectionTitle = (title, index) => (
    <Text
      style={styles.page__section__title}
      key={`title-${index}`}
    >
      {title}
    </Text>
  )

  sectionContents = (item, index) => (
    <Text style={styles.page__section} selectable key={`section-${index}`}>
      {this.mappedContents(item, index)}
    </Text>
  )

  renderItem = (item, index) => {
    if (!('type' in item)) {
      return this.phrase(item, index)
    }
    if (item.type === 'group') {
      if (item.groupType === 'paragraph') {
        return this.paragraph(item, index)
      }
      if (item.groupType === 'indent') {
        return this.indentedGroup(item, index)
      }
    }
    return this.mappedContents(item, index)
  }

  phrase = (item, index) => {
    if ('strongs' in item) {
      return this.strongsPhrase(item, index)
    }
    return <Text key={`phrase-${index}`}>{`${item.content} `}</Text>
  }

  strongsPhrase = (item, index) => (
    <Text
      selectionColor={'#C5D8EA'}
      style={styles.page__strongs}
      onPress={() => this.onWordPress(index)}
      key={`strongs-${index}`}
    >
      {`${item.content} `}
    </Text>
  )

  paragraph = (item, index) => (
    <React.Fragment key={`paragraph-${index}`}>
      {this.lineBreak(index)}
      {this.mappedContents(item, index)}
    </React.Fragment>
  )

  indentedGroup = (item, index) => (
    <Text key={`indent-${index}`}>
      {this.lineBreak(index)}
      <Text>{'\t\t\t'}</Text>
      {this.verseNumber(item, index)}
      {this.mappedContents(item, index)}
    </Text>
  )

  mappedContents = (item, index, multiplier = 100) =>
    item.contents.map((content, innerIndex) =>
      this.renderItem(content, index + innerIndex * multiplier)
    )

  verseNumber = (item, index) => {
    if (!('numbering' in item)) return
    const verseNum = item?.numbering?.normalizedVerseIsStarting
    if (verseNum === this.targetVerseNum) {
      return (
        <React.Fragment>
          <View
            ref={ref => this.targetVerseRef = ref}
            style={styles.page__verseNumberMarkerForSearch}
          />
          {this.verseNumberText(verseNum)}
        </React.Fragment>
      )
    }
    return this.verseNumberText(verseNum)
  }

  verseNumberText = (verseNum) => (
    <Text style={bibleStore.scaledFontSize(styles.page__verseNum)}>
      {verseNum}
    </Text>
  )

  lineBreak = index => (
    <Text key={`line-break-${index}`} style={styles.page__break}>
      {'\n\n'}
    </Text>
  )

  onWordPress = index => {
    this.setState({ ...this.state, popoverIsVisible: true })
  }

  onRequestClose = () => {
    this.setState({ ...this.state, popoverIsVisible: false })
  }

  scrollToTargetVerseRef = () => {
    this.targetVerseRef?.measureInWindow((x, y) => {
      console.log('scrollToOffset: ', y)
      const deviceHeight = Dimensions.get('window').height
      const showInTopThirdOfScreen = Math.max(0, y - deviceHeight / 3)
      this.listRef?.scrollTo({ y: showInTopThirdOfScreen, animated: true })
    })
  }

  render() {
    const contents = psalm.content.contents
    const data: any = []
    let i = 0;
    for (; i < 1; ++i) {
      data.push(...contents)
    }
    console.log('attempting render...')
    if (bibleStore.fontsAreReady === false) {
      return null
    }
    return (
      <React.Fragment>
        <NavigationHeader />
        <ScrollView
          ref={(ref) => this.listRef = ref}
          onLayout={this.scrollToTargetVerseRef}
          bounces={false}
          contentContainerStyle={styles.page}
          showsVerticalScrollIndicator={false}
        >
          {
            data.map((section, index) => this.bibleSection(section, index))
          }
        </ScrollView>
        <Popover
          isVisible={this.state.popoverIsVisible}
          fromView={null}
          onRequestClose={this.onRequestClose}
        >
          <Text style={{ backgroundColor: 'white', height: 100, width: 100 }}>
            hiiii
          </Text>
        </Popover>
        <QuickSettings />
      </React.Fragment>
    )
  }
}

const styles = StyleSheet.create({
  page: {
    marginLeft: Margin.LARGE,
    marginRight: Margin.LARGE,
  },
  page__section: {
    backgroundColor: 'yellow',
    marginBottom: Margin.SMALL,
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.SMALL,
  },
  page__section__title: {
    backgroundColor: 'cyan',
    fontFamily: FontFamily.OPEN_SANS_SEMIBOLD,
    marginBottom: Margin.SMALL,
  },
  page__break: {
    fontSize: 0,
    width: DEVICE_WIDTH
  },
  page__strongs: {
    color: Color.TYNDALE_BLUE
  },
  page__verseNumberMarkerForSearch: {
    height: 10,
    width: 0
  },
  page__verseNum: {
    // backgroundColor: 'red',
    borderBottomColor: 'red',
    borderBottomWidth: 10,
    width: 5,
    paddingRight: 10,
    color: 'black',
    fontFamily: FontFamily.OPEN_SANS_SEMIBOLD,
    fontSize: FontSize.EXTRA_SMALL,
    textAlignVertical: 'top',
  }
})