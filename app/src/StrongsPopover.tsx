import React from 'react'
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableHighlight,
  ScrollView,
} from 'react-native'
import * as Sentry from 'sentry-expo'
import {
  IDictionaryEntry,
  DocumentElement,
  DictionaryEntryEntity,
} from '@bible-engine/core'
import {
  Color,
  FontFamily,
  FontSize,
  Margin,
  getDebugStyles,
} from './Constants'
import Text from './Text'
import StrongsNumber from './models/StrongsNumber'
import bibleStore from './BibleStore'
import { observer } from 'mobx-react/native'
import { ActivityIndicator } from 'react-native-paper'
import StrongsDefinition from './models/StrongsDefinition'

const DEVICE_HEIGHT = Dimensions.get('window').height

interface Props {
  strongs: string[]
}

interface State {
  definitions: (IDictionaryEntry | null)[]
  loading: boolean
  loadingMessage: string
}

@observer
export default class StrongsPopover extends React.Component<Props, State> {
  state = {
    definitions: [],
    loading: true,
    loadingMessage: 'Rummaging around...',
  }

  async componentDidMount() {
    if (this.props.strongs) {
      await this.initialize()
    }
  }

  initialize = async () => {
    const definitions = await this.getDictionaryEntries(this.props.strongs)
    this.setState({...this.state, definitions, loading: false })
    setTimeout(() => {
      this.setState({
        ...this.state,
        loadingMessage: 'Sorry, this is taking longer than usual...',
      })
    }, 4000)
  }

  async getDictionaryEntries(strongs: string[]): Promise<(IDictionaryEntry | null)[]> {
    if (!strongs.length) return []
    let normalizedStrongs = strongs.map(strong => new StrongsNumber(strong))
    const isHebrewStrongs = normalizedStrongs[0].id[0] === 'H'
    const dictionaries = isHebrewStrongs
      ? ['@BdbMedDef']
      : ['@MounceShortDef', '@MounceMedDef']
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
      return definitions
    } catch (e) {
      console.log('Couldnt fetch strongs num: ', strongs.join(', '))
      Sentry.captureException(e)
      return []
    }
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

  renderPopoverContent = () => {
    if (this.state.loading) {
      return (
        <View style={styles.popover__loading}>
          <View style={{ height: 30, width: 30 }}>
            <ActivityIndicator animating={true} color={Color.TYNDALE_BLUE} />
          </View>
          <Text
            style={bibleStore.scaledFontSize(styles.popover__loading__text)}
          >
            {this.state.loadingMessage}
          </Text>
        </View>
      )
    }
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
  }

  renderDefinitionContent = (element: DictionaryEntryEntity) => {
    if (
      !element.content ||
      !element.content.contents ||
      !element.content.contents.length
    ) {
      return null
    }
    return (
      <View style={styles.popover__content__definitions__entry}>
        {element.content.contents.map(
          (element: DocumentElement, index: number) =>
            this.renderDocumentElement(element, index)
        )}
      </View>
    )
  }

  renderDocumentElement = (element: DocumentElement, index: number) => {
    if (!element) {
      return null
    }
    if (element.type === 'phrase' && element.content.length) {
      return (
        <Text
          key={`doc-phrase-${index}`}
          style={bibleStore.scaledFontSize(styles.documentPhrase)}
        >
          {element.content}
        </Text>
      )
    }
    if (element.type === 'group') {
      if (element.groupType === 'bold') {
        const phrases: string[] = element.contents.map(({ content }) => content)
        return phrases.map((phrase, phraseIndex) => (
          <Text
            key={`bold-${phrase}-${phraseIndex}-${index}`}
            style={bibleStore.scaledFontSize(styles.boldDocumentPhrase)}
          >
            {phrase}
          </Text>
        ))
      }
      return element.contents.map((element: DocumentElement, index: number) =>
        this.renderDocumentElement(element, index)
      )
    }
    return null
  }

  render() {
    return this.renderPopoverContent()
  }
}

const styles = StyleSheet.create({
  popover__arrow: {},
  popover__backdrop: {
    backgroundColor: 'rgba(0,0,0,0.1)',
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
  strongWord: {},
  strongWordText: {
    color: Color.TYNDALE_BLUE,
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.MEDIUM,
    marginBottom: Margin.EXTRA_SMALL,
    marginRight: 7,
  },
  phraseText: {
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.MEDIUM,
    marginBottom: Margin.EXTRA_SMALL,
    marginRight: 7,
  },
  documentPhrase: {
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.SMALL,
    marginBottom: 5,
    marginRight: 5,
  },
  boldDocumentPhrase: {
    fontFamily: FontFamily.CARDO_BOLD,
    fontSize: FontSize.SMALL,
    marginBottom: 5,
  },
})
