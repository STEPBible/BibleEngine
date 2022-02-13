import {
  DictionaryEntryEntity, DocumentElement, IDictionaryEntry
} from '@bible-engine/core'
import { observer } from 'mobx-react/native'
import React, { createRef } from 'react'
import {
  Dimensions, ScrollView, StyleSheet, TouchableHighlight, View,
  Platform,
} from 'react-native'
import Popover from 'react-native-popover-view';
import RenderHtml from 'react-native-render-html';

import bibleStore from './BibleStore'
import {
  Color,
  FontFamily,
  FontSize, getDebugStyles, Margin
} from './Constants'
import StrongsDefinition from './models/StrongsDefinition'
import StrongsNumber from './models/StrongsNumber'
import Text from './Text'

const DEVICE_WIDTH = Dimensions.get('window').width
const DEVICE_HEIGHT = Dimensions.get('window').height

interface Props {
  phrase: string
  strongs: string[]
  database: Database
}

interface State {
  popoverIsVisible: boolean
  definitions: (IDictionaryEntry | null)[]
  loading: boolean
}

@observer
class StrongsWord extends React.Component<Props, State> {
  touchable: any
  mounted: boolean = false

  state = {
    popoverIsVisible: false,
    definitions: [],
    loading: false,
    loadingMessage: 'Rummaging around...',
  }

  constructor(props) {
    super(props);
    this.touchable = createRef();
  }

  async componentDidMount() {
    this.mounted = true
  }

  componentWillUnmount() {
    this.mounted = false
  }

  async setDictionaryEntries(strongs: string[]) {
    if (!strongs.length) {
      return
    }
    let normalizedStrongs = strongs.map(strong => new StrongsNumber(strong))
    const isHebrewStrongs = normalizedStrongs[0].id[0] === 'H'
    const module = bibleStore.getCurrentModule(bibleStore.versionUid)
    const dictionaries = isHebrewStrongs
      ? module.hebrewLexicons
      : module.greekLexicons
    try {
      const requests = await Promise.all(
        normalizedStrongs.map(strong =>
          Promise.all(
            dictionaries.map(dictionary =>
              bibleStore.getDictionaryEntry(strong.id, dictionary)
            )
          )
        )
      )
      const definitions = requests.map(request =>
        StrongsDefinition.merge(request)
      )

      if (this.mounted) {
        this.setState({
          ...this.state,
          loading: false,
          definitions,
        })
      }
    } catch (e) {
      console.log('Couldnt fetch strongs num: ', strongs.join(', '), e)
      console.error(e)
      throw e
    }
  }

  onPress = () => {
    this.setState({ ...this.state, popoverIsVisible: true })
    this.setDictionaryEntries(this.props.strongs)
  }

  closePopover = () => {
    this.setState({ ...this.state, popoverIsVisible: false })
  }

  renderStrongsHeader = item => (
    <View style={styles.popover__content__header}>
      <Text
        selectable
        style={bibleStore.scaledFontSize(
          styles.popover__content__header__gloss
        )}
      >{`'${item.gloss || ''}' (`}</Text>
      <Text
        selectable
        style={bibleStore.scaledFontSize(
          styles.popover__content__header__transliteration
        )}
      >
        {item.transliteration ? `${item.transliteration} - ` : ''}
      </Text>
      <Text
        selectable
        style={bibleStore.scaledFontSize(
          styles.popover__content__header__lemma
        )}
      >
        {`${item.lemma || ''}`}
      </Text>
      <Text
        style={bibleStore.scaledFontSize(
          styles.popover__content__header__lemma
        )}
      >
        {')'}
      </Text>
    </View>
  )

  renderExtraStrongsWords = () => (
    <View>
      {this.state.definitions
        .slice(1)
        .filter(definition => definition)
        .map((definition: DictionaryEntryEntity) => (
          <View key={`definition-${definition.strong}`}>
            {this.renderStrongsHeader(definition)}
            <View
              style={bibleStore.scaledFontSize(
                styles.popover__content__definitions
              )}
            >
              {this.renderDefinitionContent(definition)}
            </View>
          </View>
        ))}
    </View>
  )

  renderPopoverContent = React.memo(() => {
    if (!this.state.definitions.length || !this.state.definitions[0]) {
      return (
        <View style={styles.popover__loading}>
          <Text
            style={bibleStore.scaledFontSize(styles.popover__loading__text)}
          >
            {`Sorry, no definition for Strongs reference: ${this.props.strongs.join(
              ', '
            )}`}
          </Text>
        </View>
      )
    }

    return (
      <View>
        <View style={styles.popover__content}>
          {this.renderStrongsHeader(this.state.definitions[0])}
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.popover__content__definitions}>
              {this.renderDefinitionContent(this.state.definitions[0])}
            </View>
            {this.renderExtraStrongsWords()}
          </ScrollView>
        </View>
        <View style={{ flex: 2, height: 20 }} />
      </View>
    )
  })

  renderDefinitionContent = (element: DictionaryEntryEntity) => {
    return (
      <React.Fragment>
        <View style={styles.popover__content__definitions__entry}>
          <RenderHtml
            contentWidth={Dimensions.get('window').width}
            source={{ html: element.content || '' }}
            baseStyle={{
              color: bibleStore.isDarkTheme ? 'white' : 'black',
              fontSize: bibleStore.fontScale * FontSize.SMALL
            }}
          />
        </View>
        <Text style={styles.strongsReference}>
          {`Strongs: ${element.strong}`}
        </Text>
      </React.Fragment>
    )
  }

  render() {
    if (bibleStore.showStrongs === false) {
      return (
        <View>
          <Text style={bibleStore.scaledFontSize(styles.strongWordText)}>
            {this.props.phrase}
          </Text>
        </View>
      )
    }
    return (
      <React.Fragment>
        <TouchableHighlight
          ref={this.touchable}
          onPress={this.onPress}
          activeOpacity={0.5}
          underlayColor="#C5D8EA"
          style={styles.strongWord}
        >
          <Text style={bibleStore.scaledFontSize(styles.strongWordText)}>
            {this.props.phrase}
          </Text>
        </TouchableHighlight>
        {this.state.popoverIsVisible === false ? null : (
          <Popover
            isVisible={true}
            from={this.touchable}
            onRequestClose={() => this.closePopover()}
            popoverStyle={Object.assign(
              {},
              styles.popover__background_container,
              {
                backgroundColor: bibleStore.isDarkTheme ? '#333333' : 'white',
              }
            )}
          >
            <this.renderPopoverContent></this.renderPopoverContent>
          </Popover>
        )}
      </React.Fragment>
    )
  }
}

const styles = StyleSheet.create({
  popover__arrow: {},
  popover__backdrop: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  popover__background_container: {
    // backgroundColor: 'yellow',
    overflow: 'hidden',
    width: DEVICE_WIDTH - 20,
  },
  popover__loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: DEVICE_HEIGHT * 0.4,
    maxHeight: DEVICE_HEIGHT * 0.4,
  },
  popover__loading__text: {
    color: 'gray',
    marginTop: 10,
    textAlign: 'center',
    fontFamily: FontFamily.OPEN_SANS,
    fontSize: FontSize.SMALL,
  },
  popover__content: {
    // backgroundColor: 'cyan',
    flex: 1,
    minHeight: DEVICE_HEIGHT * 0.4,
    maxHeight: DEVICE_HEIGHT * 0.4,
    borderBottomColor: 'gray',
    borderBottomWidth: 0.5,
    margin: Margin.LARGE,
    marginBottom: 0,
  },
  popover__content__definitions: {
    ...getDebugStyles(),
    flex: 1,
    marginTop: Margin.SMALL,
    marginBottom: Margin.MEDIUM,
    // backgroundColor: 'magenta'
  },
  popover__content__header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 45,
    maxHeight: 80,
    borderBottomColor: 'gray',
    borderBottomWidth: 0.5,
  },
  popover__content__header__lemma: {
    fontFamily: FontFamily.CARDO_BOLD,
    fontSize: FontSize.MEDIUM,
  },
  popover__content__header__transliteration: {
    fontFamily: FontFamily.CARDO_ITALIC,
    fontSize: FontSize.MEDIUM,
  },
  popover__content__header__gloss: {
    fontFamily: FontFamily.CARDO_BOLD,
    fontSize: FontSize.MEDIUM,
  },
  popover__content__definitions__entry: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  strongWord: {
    ...getDebugStyles(),
  },
  strongWordText: {
    borderBottomWidth: 1,
    borderBottomColor: "gray",
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.MEDIUM,
    marginBottom: Margin.EXTRA_SMALL,
    marginLeft: 3,
    marginRight: 3,
    textDecorationColor:  Platform.OS === 'ios' ? 'gray' : undefined,
    textDecorationLine: Platform.OS === 'ios' ? 'underline' : undefined,
  },
  phraseText: {
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.MEDIUM,
    marginBottom: Margin.EXTRA_SMALL,
    marginLeft: 3,
    marginRight: 3,
  },
  documentPhrase: {
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.SMALL,
    marginBottom: 5,
    marginRight: 5,
  },
  boldDocumentPhrase: {
    // backgroundColor: 'yellow',
    fontFamily: FontFamily.CARDO_BOLD,
    fontSize: FontSize.SMALL,
    marginBottom: 5,
    // margin: 5
  },
  strongsReference: {
    fontFamily: FontFamily.CARDO_ITALIC,
    fontSize: FontSize.EXTRA_SMALL,
    // color: 'gray'
  }
})

export default StrongsWord
