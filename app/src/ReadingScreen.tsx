import React from 'react'
import {
  Text,
  Dimensions,
  View,
  ScrollView,
  StyleSheet,
} from 'react-native'
import store from 'react-native-simple-store'
import { observer } from 'mobx-react/native'

import { AsyncStorageKey, FontSize, Margin, FontFamily } from './Constants'
import Popover from './Popover'
import { Color } from './Constants'
import bibleStore from './BibleStore'
import 'react-native-console-time-polyfill'
import NavigationHeader from './NavigationHeader'
import QuickSettings from './QuickSettings'
import {
  RecyclerListView,
  LayoutProvider,
} from 'recyclerlistview'

@observer
export default class ReadingScreen extends React.Component<any, any> {
  static navigationOptions = {
    headerShown: false,
  }
  targetVerseNum = 7
  targetVerseRef?: View | null
  listRef?: ScrollView | null

  constructor(props) {
    super(props)
    this.state = {
      popoverIsVisible: false,
      layoutProvider: new LayoutProvider(
        () => 'layoutType',
        (type, dim, index) => {}
      ),
    }
  }

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
      {this.mappedContents(item, index)}
    </React.Fragment>
  )

  sectionTitle = (title, index) => (
    <Text style={styles.page__section__title} key={`title-${index}`}>
      {title}
    </Text>
  )

  renderItem = (item, index) => {
    if (!('type' in item)) {
      return (
        <React.Fragment key={`item-${index}`}>
          {this.verseNumber(item, index)}
          {this.phrase(item, index)}
        </React.Fragment>
      )
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
      {this.verseNumber(item, index)}
      {this.mappedContents(item, index)}
    </React.Fragment>
  )

  indentedGroup = (item, index) => (
    <React.Fragment key={`indent-${index}`}>
      {this.lineBreak(index)}
      <Text>{'\t\t\t'}</Text>
      {this.verseNumber(item, index)}
      {this.mappedContents(item, index)}
    </React.Fragment>
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
        <React.Fragment key={`verse-search-${index}`}>
          <View
            ref={ref => (this.targetVerseRef = ref)}
            style={styles.page__verseNumberMarkerForSearch}
            key={`verse-marker-${index}`}
          />
          {this.verseNumberText(verseNum, index)}
        </React.Fragment>
      )
    }
    return this.verseNumberText(verseNum, index)
  }

  verseNumberText = (verseNum, index) => (
    <Text style={styles.page__verseNum} key={`verse-num-${verseNum}-${index}`}>
      {`${verseNum} `}
    </Text>
  )

  lineBreak = index => (
    <Text key={`line-break-${index}`} style={styles.page__break}>
      {'\n'}
    </Text>
  )

  onWordPress = index => {
    this.setState({ ...this.state, popoverIsVisible: true })
  }

  onRequestClose = () => {
    this.setState({ ...this.state, popoverIsVisible: false })
  }

  scrollToTargetVerseRef = () => {
    requestAnimationFrame(() => {
      this.targetVerseRef?.measureInWindow((x, y) => {
        const deviceHeight = Dimensions.get('window').height
        const showInTopThirdOfScreen = Math.max(0, y - deviceHeight / 3)
        console.log('listRef.scrollTo: ', y, showInTopThirdOfScreen, !!this.listRef)
        this.listRef?.scrollTo(0, 200, true)
      })
    })
  }

  keyExtractor = (item: any, index: number): string => {
    return item?.id
  }

  render() {
    return (
      <View style={styles.page}>
        <NavigationHeader />
        <Popover
          isVisible={this.state.popoverIsVisible}
          fromView={null}
          onRequestClose={this.onRequestClose}
        >
          <Text style={{ backgroundColor: 'white', height: 100, width: 100 }}>
            hiiii
          </Text>
        </Popover>
        {bibleStore.chapterContent.length ? (
          <RecyclerListView
            scrollViewProps={{
              ref: ref => { this.listRef = ref },
              showsVerticalScrollIndicator: false
            }}
            forceNonDeterministicRendering
            style={{ flex: 1 }}
            contentContainerStyle={styles.page__container}
            layoutProvider={this.state.layoutProvider}
            dataProvider={bibleStore.dataProvider}
            rowRenderer={(type, data) => (
              <Text style={styles.page__section} selectable>
                {this.bibleSection(data.section, 0)}
              </Text>
            )}
          />
        ) : null }
        <QuickSettings />
      </View>
    )
  }
}

const LINE_HEIGHT = 27

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  page__container: {
    paddingTop: Margin.SMALL
  },
  page__section: {
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.SMALL,
    lineHeight: LINE_HEIGHT,
  },
  page__section__title: {
    fontFamily: FontFamily.OPEN_SANS_SEMIBOLD,
    fontSize: FontSize.EXTRA_SMALL,
    lineHeight: LINE_HEIGHT,
  },
  page__break: {
    fontFamily: FontFamily.CARDO,
    lineHeight: LINE_HEIGHT,
  },
  page__strongs: {
    fontFamily: FontFamily.CARDO,
    color: Color.TYNDALE_BLUE,
    lineHeight: LINE_HEIGHT,
  },
  page__verseNumberMarkerForSearch: {
    height: 10,
    width: 0,
  },
  page__verseNum: {
    fontFamily: FontFamily.CARDO,
    fontWeight: 'bold',
    lineHeight: LINE_HEIGHT,
  },
})
