import React, { Fragment } from 'react';
import {
  Text,
  View,
  FlatList,
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
  IBibleCrossReference,
  IBibleReferenceRange
} from '@bible-engine/core';
import {
  Color,
  FontFamily,
  FontSize,
  Margin,
  getDebugStyles
} from './Constants';
import Database from './Database';

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

interface Props {
  crossReferences: IBibleCrossReference[];
  database: Database;
}

interface State {
  popoverIsVisible: boolean;
  verseContents: any[];
}

export default class CrossReference extends React.PureComponent<Props, State> {
  touchable: any;
  mounted: boolean;
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

  componentDidMount() {
    this.mounted = true;
    setTimeout(() => {
      this.getVerseContents(this.props.crossReferences);
    }, 100);
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  async getVerseContents(refs: IBibleCrossReference[]) {
    const verseContents = await this.props.database.getVerseContents(refs);
    if (this.mounted) {
      this.setState({
        ...this.state,
        verseContents,
        popoverIsVisible: false
      });
    }
  }

  renderCrossReference = ({ item, index }) => (
    <Fragment>
      <Text style={styles.popover__content__reference}>{item.label}</Text>
      <Text style={styles.popover__content__verse}>
        {this.state.verseContents.length > index
          ? JSON.stringify(this.state.verseContents[index])
          : ''}
      </Text>
    </Fragment>
  );

  renderPopoverContent = () => {
    return (
      <View>
        <View style={styles.popover__content}>
          <Text style={styles.popover__content__header}>Related Verses</Text>
          <FlatList
            data={this.props.crossReferences}
            showsVerticalScrollIndicator={false}
            renderItem={this.renderCrossReference}
            keyExtractor={(item, index) => index.toString()}
          />
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
          onRequestClose={() => this.closePopover()}
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
