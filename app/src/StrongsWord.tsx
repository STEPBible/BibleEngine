import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  Dimensions,
  TouchableHighlight,
  ScrollView
} from 'react-native';
import Popover from './Popover';
import {
  BibleEngine,
  DictionaryEntry,
  DocumentElement
} from '@bible-engine/core';
import { Color, FontFamily, FontSize, Margin } from './Constants';

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

interface Props {
  phrase: string;
  strongs: string[];
  sqlBible: BibleEngine;
}

interface State {
  popoverIsVisible: boolean;
  definitions: DictionaryEntry[];
}

export default class StrongsWord extends React.Component<Props, State> {
  touchable: any;
  sqlBible: BibleEngine;
  state = {
    popoverIsVisible: false,
    definitions: []
  };

  async componentDidMount() {
    await this.setDictionaryEntries(this.props.strongs);
  }

  async componentWillReceiveProps(nextProps: Props) {
    await this.setDictionaryEntries(nextProps.strongs);
  }

  async setDictionaryEntries(strongs: string[]) {
    const definitions = (await Promise.all(
      strongs.map(async (strong: string) => {
        if (strong[0] === 'H') {
          const definitions = await this.props.sqlBible.getDictionaryEntries(
            strong,
            '@BdbMedDef'
          );
          return definitions[0];
        }
        if (strong[0] === 'G') {
          const definitions = await this.props.sqlBible.getDictionaryEntries(
            strong,
            '@MounceMedDef'
          );
          return definitions[0];
        }
      })
    )).filter(definition => definition);
    this.setState({
      ...this.state,
      definitions
    });
  }

  onPress = () => {
    console.log(JSON.stringify(this.state.definitions, null, 2));
    this.setState({ popoverIsVisible: true });
  };

  closePopover = () => {
    this.setState({ popoverIsVisible: false });
  };

  _renderItem = item => {
    if (!item) {
      return null;
    }
    return (
      <View>
        <View style={styles.popover__content}>
          <View style={styles.popover__content__header}>
            <Text style={styles.popover__content__header__gloss}>{`'${
              item.gloss
            }' (`}</Text>
            <Text style={styles.popover__content__header__transliteration}>{`${
              item.transliteration
            } - `}</Text>
            <Text style={styles.popover__content__header__lemma}>
              {`${item.lemma}`}
            </Text>
            <Text style={styles.popover__content__header__lemma}>{')'}</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.popover__content__definitions}>
              {this.renderDefinitionContent(item)}
            </View>
          </ScrollView>
        </View>
        <View style={{ flex: 2, height: 20 }} />
      </View>
    );
  };

  renderPopoverContent = () => {
    if (!this.state.definitions.length) {
      return (
        <View style={styles.popover__content}>
          <Text>Sorry, no content</Text>
        </View>
      );
    }
    return this._renderItem(this.state.definitions[0]);
  };

  renderDefinitionContent = (element: DictionaryEntry) => {
    if (
      !element.content ||
      !element.content.contents ||
      !element.content.contents.length
    ) {
      return null;
    }
    return (
      <View style={styles.popover__content__definitions__entry}>
        {element.content.contents.map((element: DocumentElement) =>
          this.renderDocumentElement(element)
        )}
      </View>
    );
  };

  renderDocumentElement = (element: DocumentElement) => {
    if (!element) {
      return null;
    }
    if (element.type === 'phrase' && element.content.length) {
      return <Text style={styles.documentPhrase}>{element.content}</Text>;
    }
    if (element.type === 'group') {
      if (element.groupType === 'bold') {
        const phrases: string[] = element.contents.map(
          ({ content }) => content
        );
        return phrases.map(phrase => (
          <Text style={styles.boldDocumentPhrase}>{phrase}</Text>
        ));
      }
      return element.contents.map((element: DocumentElement) =>
        this.renderDocumentElement(element)
      );
    }
  };

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
          popoverStyle={styles.popover__background_container}
          onClose={() => this.closePopover()}
        >
          {this.renderPopoverContent()}
        </Popover>
      </React.Fragment>
    );
  }
}
const styles = StyleSheet.create({
  popover__arrow: {},
  popover__backdrop: {
    backgroundColor: 'rgba(0,0,0,0.1)'
  },
  popover__background_container: {
    // backgroundColor: 'yellow',
    overflow: 'hidden',
    width: DEVICE_WIDTH - 20
  },
  popover__content: {
    // backgroundColor: 'cyan',
    flex: 1,
    maxHeight: DEVICE_HEIGHT * 0.4,
    borderBottomColor: 'gray',
    borderBottomWidth: 0.5,
    margin: Margin.LARGE,
    marginBottom: 0
  },
  popover__content__definitions: {
    flex: 1,
    marginTop: Margin.SMALL
    // backgroundColor: 'magenta'
  },
  popover__content__header: {
    // backgroundColor: 'yellow',
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 45,
    maxHeight: 80,
    borderBottomColor: 'gray',
    borderBottomWidth: 0.5
  },
  popover__content__header__lemma: {
    //backgroundColor: 'orange',
    fontFamily: FontFamily.CARDO_BOLD,
    fontSize: FontSize.MEDIUM,
    maxHeight: FontSize.EXTRA_LARGE
  },
  popover__content__header__transliteration: {
    // backgroundColor: 'green',
    fontFamily: FontFamily.CARDO_ITALIC,
    fontSize: FontSize.MEDIUM,
    maxHeight: FontSize.EXTRA_LARGE
  },
  popover__content__header__gloss: {
    // backgroundColor: 'cyan',
    fontFamily: FontFamily.CARDO_BOLD,
    fontSize: FontSize.MEDIUM,
    maxHeight: FontSize.EXTRA_LARGE
  },
  popover__content__definitions__entry: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  strongWord: {
    marginRight: 7
  },
  strongWordText: {
    color: Color.TYNDALE_BLUE,
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.MEDIUM,
    marginBottom: Margin.EXTRA_SMALL
  },
  text: {
    fontSize: FontSize.MEDIUM,
    fontFamily: FontFamily.CARDO
  },
  documentPhrase: {
    // backgroundColor: 'cyan',
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.SMALL,
    marginBottom: 5
    // margin: 5
  },
  boldDocumentPhrase: {
    // backgroundColor: 'yellow',
    fontFamily: FontFamily.CARDO_BOLD,
    fontSize: FontSize.SMALL,
    marginBottom: 5
    // margin: 5
  }
});
