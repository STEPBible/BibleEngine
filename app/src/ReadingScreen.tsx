import React from 'react'
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
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
import { RecyclerListView, LayoutProvider } from 'recyclerlistview'
import StrongsPopover from './StrongsPopover'
import { ActivityIndicator } from 'react-native-paper'
import StrongsWord from './StrongsWord'
import BibleSection from './BibleSection'

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
      refreshing: false,
      loadingMoreOnBottom: true,
      strongsNumbers: [],
      visibleChapterNum: null,
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

  onWordPress = strongsNumbers => {
    this.setState({ ...this.state, strongsNumbers, popoverIsVisible: true })
  }

  onRequestClose = () => {
    this.setState({ ...this.state, popoverIsVisible: false })
  }

  keyExtractor = (item: any, index: number): string => {
    return item?.id
  }

  onRefresh = async () => {
    if (bibleStore.previousRange === undefined) {
      this.setState({ ...this.state, refreshing: false })
      return
    }
    this.setState({ ...this.state, refreshing: true })
    const visibleChapterNum = bibleStore.previousRange.versionChapterNum
    await bibleStore.updateCurrentBibleReference(bibleStore.previousRange)
    this.setState({
      ...this.state,
      refreshing: false,
      visibleChapterNum,
    })
  }

  onEndReached = async () => {
    if (bibleStore.nextRange === undefined) {
      this.setState({ ...this.state, loadingMoreOnBottom: false })
      return
    }
    this.setState({ ...this.state, loadingMoreOnBottom: true })
    await bibleStore.appendNextChapterToBottom(bibleStore.nextRange)
    this.setState({ ...this.state, loadingMoreOnBottom: false })
  }

  onVisibleIndicesChanged = async (all: number[]) => {
    const visibleChapterNum = bibleStore.dataProvider.getDataForIndex(all[0])
      ?.versionChapterNum
    console.log('onVisibleIndicesChanged: ', visibleChapterNum)
    if (this.state.visibleChapterNum !== visibleChapterNum) {
      this.setState({ ...this.state, visibleChapterNum })
    }
  }

  renderFooter = () =>
    this.state.loadingMoreOnBottom ? (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          height: 100,
        }}
      >
        <ActivityIndicator animating={true} color={Color.TYNDALE_BLUE} />
      </View>
    ) : null

  render() {
    return (
      <View style={styles.page}>
        <NavigationHeader chapterNum={this.state.visibleChapterNum} />
        <Popover
          isVisible={this.state.popoverIsVisible}
          fromView={null}
          onRequestClose={this.onRequestClose}
          popoverStyle={styles.page__popover}
        >
          <StrongsPopover strongs={this.state.strongsNumbers} />
        </Popover>
        {bibleStore.dataProvider.getSize() ? (
          <RecyclerListView
            scrollViewProps={{
              ref: ref => {
                this.listRef = ref
              },
              refreshControl: (
                <RefreshControl
                  refreshing={this.state.refreshing}
                  onRefresh={this.onRefresh}
                />
              ),
              showsVerticalScrollIndicator: false,
            }}
            forceNonDeterministicRendering
            style={{ flex: 1 }}
            contentContainerStyle={styles.page__container}
            onVisibleIndicesChanged={this.onVisibleIndicesChanged}
            onEndReached={this.onEndReached}
            onEndReachedThreshold={1000}
            layoutProvider={this.state.layoutProvider}
            dataProvider={bibleStore.dataProvider}
            renderFooter={this.renderFooter}
            rowRenderer={(type, data) => (
              <BibleSection
                section={data.section}
                onWordPress={this.onWordPress}
              />
            )}
          />
        ) : null}
        <QuickSettings />
      </View>
    )
  }
}

const LINE_HEIGHT = 27
const DEVICE_WIDTH = Dimensions.get('window').width

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  page__container: {
    paddingTop: Margin.MEDIUM,
  },
  page__popover: {
    overflow: 'hidden',
    width: DEVICE_WIDTH - 20,
  },
  page__footer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
})
