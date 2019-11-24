import React from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import { ifIphoneX, ifAndroid, ifIOS } from './utils'
import { IconButton, TouchableRipple } from 'react-native-paper'
import {
  BackHandler,
  StyleSheet,
  TextInput,
  View,
  Text,
  Dimensions,
  Keyboard,
  FlatList,
} from 'react-native'
import * as elasticlunr from 'elasticlunr'
import hoistNonReactStatics from 'hoist-non-react-statics'
import { observer } from 'mobx-react/native'

import { Margin, FontSize, FontFamily, Color } from './Constants'
import { withGlobalContext } from './GlobalContext'
import bibleStore from './BibleStore'

const DEVICE_WIDTH = Dimensions.get('window').width
const DEVICE_HEIGHT = Dimensions.get('window').height

const searchIndex = require('../assets/esvSearchIndex.json')

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

  componentDidMount() {
    this.lunrSearchEngine = elasticlunr.Index.load(searchIndex)
    BackHandler.addEventListener('hardwareBackPress', this.endSearch)
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.endSearch)
  }

  updateSearch = (searchInputText: string) => {
    const results = this.lunrSearchEngine.search(searchInputText, {})
    const refs = results.map(result => result.ref)
    const verseSearchResults = refs.map((ref: any) => ({
      reference: ref,
      verseContent: searchIndex.documentStore.docs[ref].vc,
      verseNum: searchIndex.documentStore.docs[ref].v,
      versionChapterNum: searchIndex.documentStore.docs[ref].c,
      bookOsisId: searchIndex.documentStore.docs[ref].b,
    }))
    this.setState({ ...this.state, searchInputText, verseSearchResults })
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

  render() {
    return (
      <React.Fragment>
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
            keyExtractor={(item, index) => index.toString()}
          />
        </View>
      </React.Fragment>
    )
  }
}

const styles = StyleSheet.create({
  search: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    left: 0,
    height: 50,
    position: 'absolute',
    right: 0,
    top: 8,
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: ifAndroid(67, ifIphoneX(100, 67)),
    width: DEVICE_WIDTH,
    height: DEVICE_HEIGHT,
    backgroundColor: 'white',
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

export default hoistNonReactStatics(
  withGlobalContext(SearchScreen),
  SearchScreen
)
