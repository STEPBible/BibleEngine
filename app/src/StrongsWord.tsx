import React from 'react'
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableHighlight,
  ScrollView,
} from 'react-native'
import Popover from './Popover'
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
import { BarIndicator } from 'react-native-indicators'
import Database from './Database'
import { withGlobalContext } from './GlobalContext'
import Text from './Text'
import StrongsNumber from './models/StrongsNumber'

const DEVICE_WIDTH = Dimensions.get('window').width
const DEVICE_HEIGHT = Dimensions.get('window').height

interface Props {
  phrase: string
  strongs: string[]
  database: Database
}

interface State {
  popoverIsVisible: boolean
  definitions: IDictionaryEntry[]
  loading: boolean
}

class StrongsWord extends React.PureComponent<Props, State> {
  touchable: any
  mounted: boolean = false

  state = {
    popoverIsVisible: false,
    definitions: [],
    loading: true,
    loadingMessage: 'Rummaging around...',
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
    const dictionary = isHebrewStrongs ? '@BdbMedDef' : '@MounceMedDef'
    try {
      const definitions = await Promise.all(
        normalizedStrongs.map(strong =>
          this.props.global.bibleEngine.getDictionaryEntry(
            strong.id,
            dictionary
          )
        )
      )
      console.log(definitions)
      if (this.mounted) {
        this.setState({
          ...this.state,
          loading: false,
          definitions,
        })
      }
    } catch (e) {
      console.log('Couldnt fetch strongs num: ', strongs.join(', '))
      console.error(e)
      throw e
    }
  }

  onPress = () => {
    this.setState({ ...this.state, popoverIsVisible: true })
    this.setDictionaryEntries(this.props.strongs)
    setTimeout(() => {
      this.setState({
        ...this.state,
        loadingMessage: 'Sorry, this is taking longer than usual...',
      })
    }, 4000)
  }

  closePopover = () => {
    console.log('closePopover')
    this.setState({ ...this.state, popoverIsVisible: false })
  }

  renderStrongsHeader = item => (
    <View style={styles.popover__content__header}>
      <Text
        selectable
        style={styles.popover__content__header__gloss}
      >{`'${item.gloss || ''}' (`}</Text>
      <Text selectable style={styles.popover__content__header__transliteration}>
        {item.transliteration ? `${item.transliteration} - ` : ''}
      </Text>
      <Text selectable style={styles.popover__content__header__lemma}>
        {`${item.lemma || ''}`}
      </Text>
      <Text style={styles.popover__content__header__lemma}>{')'}</Text>
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
            <View style={styles.popover__content__definitions}>
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
            <BarIndicator
              animationDuration={600}
              size={30}
              color={Color.TYNDALE_BLUE}
            />
          </View>
          <Text style={styles.popover__loading__text}>
            {this.state.loadingMessage}
          </Text>
        </View>
      )
    }
    if (!this.state.definitions.length) {
      return (
        <View style={styles.popover__loading}>
          <Text style={styles.popover__loading__text}>
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
        <Text key={`doc-phrase-${index}`} style={styles.documentPhrase}>
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
            style={styles.boldDocumentPhrase}
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
    return (
      <React.Fragment>
        <TouchableHighlight
          ref={ref => (this.touchable = ref)}
          onPress={this.onPress}
          activeOpacity={0.5}
          underlayColor="#C5D8EA"
          style={styles.strongWord}
        >
          <Text style={styles.strongWordText}>{this.props.phrase}</Text>
        </TouchableHighlight>
        <Popover
          isVisible={this.state.popoverIsVisible}
          fromView={this.touchable}
          onRequestClose={() => this.closePopover()}
          popoverStyle={styles.popover__background_container}
        >
          {this.renderPopoverContent()}
        </Popover>
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
    minHeight: 130,
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
    // backgroundColor: 'yellow',
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 45,
    maxHeight: 80,
    borderBottomColor: 'gray',
    borderBottomWidth: 0.5,
  },
  popover__content__header__lemma: {
    //backgroundColor: 'orange',
    fontFamily: FontFamily.CARDO_BOLD,
    fontSize: FontSize.MEDIUM,
    maxHeight: FontSize.EXTRA_LARGE,
  },
  popover__content__header__transliteration: {
    // backgroundColor: 'green',
    fontFamily: FontFamily.CARDO_ITALIC,
    fontSize: FontSize.MEDIUM,
    maxHeight: FontSize.EXTRA_LARGE,
  },
  popover__content__header__gloss: {
    // backgroundColor: 'cyan',
    fontFamily: FontFamily.CARDO_BOLD,
    fontSize: FontSize.MEDIUM,
    maxHeight: FontSize.EXTRA_LARGE,
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
    color: Color.TYNDALE_BLUE,
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
    // backgroundColor: 'yellow',
    fontFamily: FontFamily.CARDO_BOLD,
    fontSize: FontSize.SMALL,
    marginBottom: 5,
    // margin: 5
  },
})

export default withGlobalContext(StrongsWord)
