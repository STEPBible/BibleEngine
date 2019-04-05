import React, { Fragment } from 'react';
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
  DocumentElement,
  IBibleCrossReference
} from '@bible-engine/core';
import {
  Color,
  FontFamily,
  FontSize,
  Margin,
  getDebugStyles
} from './Constants';

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

interface Props {
  crossReferences: IBibleCrossReference[];
  sqlBible: BibleEngine;
}

interface State {
  popoverIsVisible: boolean;
  verseContents: any[];
}

export default class CrossReference extends React.Component<Props, State> {
  touchable: any;
  state = {
    popoverIsVisible: false,
    verseContents: []
  };

  onPress = () => {
    this.setState({ popoverIsVisible: true });
  };

  closePopover = () => {
    this.setState({ popoverIsVisible: false });
  };

  constructor(props: Props) {
    super(props);
    this.getVerseContents(props.crossReferences);
  }

  async getVerseContents(refs: IBibleCrossReference[]) {
    const referenceRanges = refs.map(ref => ref.range);
    const verses = await Promise.all(
      referenceRanges.map(range => this.props.sqlBible.getPhrases(range))
    );
    const verseContents = verses.map(phrases =>
      phrases.map(phrase => phrase.content).join(' ')
    );
    this.setState({
      ...this.state,
      verseContents
    });
  }

  renderPopoverContent = () => {
    return (
      <View>
        <View style={styles.popover__content}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.popover__content__header}>Related Verses</Text>
            {this.props.crossReferences.map((crossRef, index) => (
              <Fragment>
                <Text style={styles.popover__content__reference}>
                  {crossRef.label}
                </Text>
                <Text style={styles.popover__content__verse}>
                  {this.state.verseContents.length > index
                    ? JSON.stringify(this.state.verseContents[index])
                    : ''}
                </Text>
              </Fragment>
            ))}
          </ScrollView>
        </View>
        <View style={{ flex: 2, height: 20 }} />
      </View>
    );
  };

  render() {
    return (
      <React.Fragment>
        <TouchableHighlight
          ref={ref => (this.touchable = ref)}
          onPress={this.onPress}
          activeOpacity={0.5}
          underlayColor="#C5D8EA"
          style={styles.touchable}
        >
          <Text style={styles.touchable__text}>
            {this.props.crossReferences[0].key}
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
  touchable: {
    marginLeft: -6,
    ...getDebugStyles()
  },
  touchable__text: {
    paddingLeft: 8,
    marginTop: -5,
    paddingRight: 2,
    textAlignVertical: 'top',
    fontSize: FontSize.SMALL,
    color: Color.TYNDALE_BLUE,
    fontFamily: FontFamily.CARDO_ITALIC
  },
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
  popover__content__header: {
    // backgroundColor: 'yellow',
    fontFamily: FontFamily.OPEN_SANS_LIGHT,
    fontSize: FontSize.MEDIUM,
    marginBottom: Margin.SMALL
  },
  popover__content__reference: {
    fontFamily: FontFamily.CARDO_BOLD,
    fontSize: FontSize.SMALL
  },
  popover__content__verse: {
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.SMALL,
    marginBottom: Margin.EXTRA_SMALL
  }
});
