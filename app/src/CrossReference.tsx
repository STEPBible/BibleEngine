import React, { Fragment } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableHighlight,
  ScrollView,
} from 'react-native'
import {
  BibleEngine,
  DictionaryEntry,
  DocumentElement,
  IBibleCrossReference,
  IBibleReferenceRange,
} from '@bible-engine/core'

import {
  Color,
  FontFamily,
  FontSize,
  Margin,
  getDebugStyles,
} from './Constants'
import Popover from './Popover'
import Database from './Database'
import Text from './Text'
import bibleStore from './BibleStore'
import { observer } from 'mobx-react/native'

const DEVICE_WIDTH = Dimensions.get('window').width
const DEVICE_HEIGHT = Dimensions.get('window').height

interface Props {
  crossReferences: IBibleCrossReference[]
  database: Database
}

interface State {
  visible: boolean
  verseContents: any[]
}

@observer
class CrossReference extends React.Component<Props, State> {
  touchable: any
  state = {
    visible: false,
    verseContents: [],
  }

  onPress = async () => {
    const verseContents = await bibleStore.getVerseContents(
      this.props.crossReferences
    )
    this.setState({ ...this.state, visible: true, verseContents })
    this.forceUpdate()
  }

  closePopover = () => {
    this.setState({ visible: false })
  }

  renderCrossReference = ({ item, index }) => (
    <Fragment>
      <Text
        style={bibleStore.scaledFontSize(styles.popover__content__reference)}
      >
        {item.label}
      </Text>
      <Text style={bibleStore.scaledFontSize(styles.popover__content__verse)}>
        {this.state.verseContents.length > 0
          ? this.state.verseContents[index]
          : null}
      </Text>
    </Fragment>
  )

  renderPopoverContent = () => {
    return (
      <View>
        <View style={bibleStore.scaledFontSize(styles.popover__content)}>
          <Text
            style={bibleStore.scaledFontSize(styles.popover__content__header)}
          >
            Related Verses
          </Text>
          <FlatList
            data={this.props.crossReferences}
            showsVerticalScrollIndicator={false}
            renderItem={this.renderCrossReference}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>
        <View style={{ flex: 2, height: 20 }} />
      </View>
    )
  }

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
          <Text style={bibleStore.scaledFontSize(styles.touchable__text)}>
            {this.props.crossReferences[0].key}
          </Text>
        </TouchableHighlight>
        <Popover
          isVisible={this.state.visible}
          fromView={this.touchable}
          popoverStyle={Object.assign({},styles.popover__background_container, {
            backgroundColor: bibleStore.isDarkTheme ? '#333333' : 'white',
            color: bibleStore.isDarkTheme ? 'white' : 'black',
          })}
          onRequestClose={() => this.closePopover()}
        >
          {this.renderPopoverContent()}
        </Popover>
      </React.Fragment>
    )
  }
}

const styles = StyleSheet.create({
  touchable: {
    marginLeft: -6,
    ...getDebugStyles(),
  },
  touchable__text: {
    paddingLeft: 8,
    marginTop: -5,
    paddingRight: 2,
    textAlignVertical: 'top',
    fontSize: FontSize.SMALL,
    color: Color.TYNDALE_BLUE,
    fontFamily: FontFamily.CARDO_ITALIC,
  },
  popover__arrow: {},
  popover__backdrop: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  popover__background_container: {
    overflow: 'hidden',
    width: DEVICE_WIDTH - 20,
  },
  popover__content: {
    flex: 1,
    maxHeight: DEVICE_HEIGHT * 0.4,
    borderBottomColor: 'gray',
    borderBottomWidth: 0.5,
    margin: Margin.LARGE,
    marginBottom: 0,
  },
  popover__content__header: {
    fontFamily: FontFamily.OPEN_SANS_LIGHT,
    fontSize: FontSize.MEDIUM,
    marginBottom: Margin.SMALL,
  },
  popover__content__reference: {
    fontFamily: FontFamily.CARDO_BOLD,
    fontSize: FontSize.SMALL,
  },
  popover__content__verse: {
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.SMALL,
    marginBottom: Margin.EXTRA_SMALL,
  },
})

export default CrossReference
