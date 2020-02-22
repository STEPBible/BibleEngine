import React from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import { ifIphoneX, ifAndroid, ifIOS } from './utils'
import { IconButton, TouchableRipple } from 'react-native-paper'
import {
  BackHandler,
  StyleSheet,
  TextInput,
  View,
  Dimensions,
  Keyboard,
  FlatList,
  SafeAreaView,
  Image,
} from 'react-native'
import * as elasticlunr from 'elasticlunr'
import hoistNonReactStatics from 'hoist-non-react-statics'
import { observer } from 'mobx-react/native'

import { Margin, FontSize, FontFamily, Color } from './Constants'
import bibleStore from './BibleStore'
import JsonAsset from './JsonAsset'
import Text from './Text'

const DEVICE_WIDTH = Dimensions.get('window').width
const DEVICE_HEIGHT = Dimensions.get('window').height

@observer
class SearchScreen extends React.Component<{}, {}> {
  static navigationOptions = {
    header: null,
  }
  state = {
    searchInputText: '',
    verseSearchResults: [],
  }
  lunrSearchEngine: any
  searchIndex: any

  async componentDidMount() {
    bibleStore.loadSearchIndex()
    const asset: JsonAsset = await bibleStore.searchIndexAsset
    this.searchIndex = asset.json
    this.lunrSearchEngine = elasticlunr.Index.load(this.searchIndex)
    BackHandler.addEventListener('hardwareBackPress', this.endSearch)
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.endSearch)
  }

  updateSearch = (searchInputText: string) => {
    this.setState({ ...this.state, searchInputText }, () => {
      if (!this.lunrSearchEngine) return
      const results = this.lunrSearchEngine.search(searchInputText, {})
      const refs = results.map(result => result.ref)
      const verseSearchResults = refs.map((ref: any) => ({
        reference: ref,
        verseContent: this.searchIndex.documentStore.docs[ref].vc,
        verseNum: this.searchIndex.documentStore.docs[ref].v,
        versionChapterNum: this.searchIndex.documentStore.docs[ref].c,
        bookOsisId: this.searchIndex.documentStore.docs[ref].b,
      }))
      this.setState({ ...this.state, verseSearchResults })
    })
  }

  endSearch = () => {
    Keyboard.dismiss()
    this.props.navigation.goBack(null)
  }

  onSearchResultPress = item => {
    bibleStore.updateCurrentBibleReference({
      versionChapterNum: item.versionChapterNum,
      bookOsisId: item.bookOsisId,
    })
    this.endSearch()
  }

  renderSearchResult = ({ item }) => (
    <TouchableRipple
      onPress={() => {
        this.onSearchResultPress(item)
      }}
      underlayColor="#d4d4d4"
    >
      <View style={styles.result}>{this.renderSearchResultContent(item)}</View>
    </TouchableRipple>
  )

  renderSearchResultContent = item => (
    <React.Fragment>
      <MaterialIcons
        style={styles.result__icon}
        name="search"
        size={25}
        color="#9b9b9b"
      />
      <View style={styles.result__content}>
        <Text numberOfLines={2} style={styles.result__content__text}>
          {item.verseContent}
        </Text>
        <Text style={styles.result__content__reference}>{item.reference}</Text>
      </View>
    </React.Fragment>
  )

  onClearTextTap = () => {
    this.setState({
      ...this.state,
      searchInputText: '',
      verseSearchResults: [],
    })
  }

  renderClearIcon = () => {
    if (!this.state.searchInputText.length) {
      return null
    }
    return (
      <IconButton
        icon="clear"
        color="#888889"
        size={30}
        style={styles.search__input__clear}
        onPress={this.onClearTextTap}
      />
    )
  }

  renderEmptyState = () => (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Image
        style={{ width: 100, height: 100, marginTop: Margin.EXTRA_LARGE }}
        source={require('../assets/lightning.png')}
      />
      <Text
        style={{
          fontFamily: FontFamily.OPEN_SANS_BOLD,
          fontSize: FontSize.MEDIUM,
          marginTop: Margin.EXTRA_LARGE,
          textAlign: 'center',
        }}
      >
        Search Anything
      </Text>
      <Text
        style={{
          fontFamily: FontFamily.OPEN_SANS,
          fontSize: FontSize.MEDIUM,
          marginTop: Margin.EXTRA_LARGE,
          textAlign: 'center',
        }}
      >
        {`Offline, flexible search\npowered by AI`}
      </Text>
    </View>
  )

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.search}>
          <IconButton
            icon="arrow-back"
            color="#888889"
            size={30}
            style={styles.search__input__icon}
            onPress={this.endSearch}
          />
          <TextInput
            autoFocus
            style={styles.search__input__text}
            placeholder={'Search...'}
            placeholderTextColor={'#828282'}
            underlineColorAndroid={'#fff'}
            selectionColor={Color.TYNDALE_BLUE}
            autoCorrect={false}
            onChangeText={this.updateSearch}
            value={this.state.searchInputText}
          />
          {this.renderClearIcon()}
        </View>
        <View style={styles.results}>
          <FlatList
            data={this.state.verseSearchResults}
            showsVerticalScrollIndicator={false}
            renderItem={this.renderSearchResult}
            ListFooterComponent={<View style={styles.scrollViewBottomBuffer} />}
            ListEmptyComponent={this.renderEmptyState}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  search: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    maxHeight: 50,
    marginTop: 8,
    zIndex: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
  },
  search__input: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'orange',
    height: ifAndroid(54, 60),
    marginTop: ifIOS(ifIphoneX(20, -10), ifAndroid(-10, 12)),
  },
  search__input__icon: {
    marginLeft: Margin.MEDIUM,
    width: 30,
    height: 30,
  },
  search__input__clear: {
    marginRight: Margin.MEDIUM,
    width: 30,
    height: 30,
  },
  search__input__text: {
    flex: 1,
    fontSize: FontSize.SMALL,
    height: '100%',
    marginLeft: Margin.SMALL,
    zIndex: 3,
  },
  scrollViewBottomBuffer: {
    height: DEVICE_HEIGHT / 1.5,
  },
  results: {
    flex: 1,
    width: DEVICE_WIDTH,
    zIndex: 1,
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Margin.MEDIUM,
    marginBottom: Margin.MEDIUM / 2,
    marginTop: Margin.MEDIUM / 2,
    marginLeft: Margin.MEDIUM,
    borderRadius: 2,
  },
  result__icon: {
    marginRight: Margin.MEDIUM + Margin.EXTRA_SMALL,
  },
  result__content: {
    flex: 1,
  },
  result__content__text: {
    flex: 3,
    fontFamily: FontFamily.OPEN_SANS,
    fontSize: FontSize.SMALL,
  },
  result__content__reference: {
    flex: 1,
    color: '#898989',
    fontFamily: FontFamily.OPEN_SANS,
    fontSize: FontSize.EXTRA_SMALL,
    marginTop: 3,
  },
})

export default SearchScreen
