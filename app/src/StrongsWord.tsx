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
import { Color, FontFamily, FontSize } from './Constants';

const DEVICE_WIDTH = Dimensions.get('window').width;

interface Props {
  phrase: string;
  strongs: string[];
  sqlBible: BibleEngine;
}

interface State {
  popoverIsVisible: boolean;
  definitions: DictionaryEntry[];
}

export default class TaggedWord extends React.Component<Props, State> {
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
        const definitions = await this.props.sqlBible.getDictionaryEntries(
          strong,
          '@BdbMedDef'
        );
        return definitions[0];
      })
    )).filter(definition => definition);
    this.setState({
      ...this.state,
      definitions
    });
  }

  onPress = () => {
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
            <Text style={styles.popover__content__header__lemma}>
              {item.lemma}
            </Text>
            <Text style={styles.popover__content__header__transliteration}>{`(${
              item.transliteration
            })`}</Text>
            <Text style={styles.popover__content__header__gloss}>{`'${
              item.gloss
            }'`}</Text>
          </View>

          <View style={styles.popover__content__definitions}>
            <ScrollView>{this.renderDefinitionContent(item)}</ScrollView>
          </View>
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
    return element.content.contents.map((element: DocumentElement) =>
      this.renderDocumentElement(element)
    );
  };

  renderDocumentElement = (element: DocumentElement) => {
    if (!element) {
      return null;
    }
    if (element.type === 'phrase') {
      return <Text style={styles.documentPhrase}>{element.content}</Text>;
    }
    if (element.type === 'group') {
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
          underlayColor="white"
          style={styles.strongWord}
        >
          <Text style={[styles.text, styles.strongWordText]}>
            {this.props.phrase}
          </Text>
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
    flex: 1,
    backgroundColor: 'white',
    overflow: 'hidden',
    marginBottom: 10
  },
  popover__content: {
    backgroundColor: 'white',
    flex: 8,
    margin: 20,
    width: DEVICE_WIDTH - 40
  },
  popover__content__definitions: {
    flex: 1,
    // backgroundColor: 'magenta',
    marginLeft: 30,
    marginRight: 30,
    marginBottom: 30
  },
  popover__content__header: {
    backgroundColor: 'white',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: 30,
    marginBottom: 0,
    minHeight: 60,
    maxHeight: 80
  },
  popover__content__header__lemma: {
    // backgroundColor: 'orange',
    fontFamily: FontFamily.CARDO_BOLD,
    fontSize: FontSize.LARGE,
    marginRight: 10
  },
  popover__content__header__transliteration: {
    // backgroundColor: 'green',
    fontFamily: FontFamily.CARDO_BOLD,
    fontSize: FontSize.LARGE,
    marginRight: 10
  },
  popover__content__header__gloss: {
    // backgroundColor: 'cyan',
    fontFamily: FontFamily.CARDO_BOLD,
    fontSize: FontSize.LARGE
  },
  strongWord: {
    marginRight: 7,
    marginBottom: 12
  },
  strongWordText: {
    color: Color.TYNDALE_BLUE,
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.MEDIUM
  },
  text: {
    fontSize: FontSize.MEDIUM,
    fontFamily: FontFamily.CARDO
  },
  documentPhrase: {
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.SMALL,
    marginBottom: 5
  }
});
