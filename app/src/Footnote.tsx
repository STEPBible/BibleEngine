import React, { Fragment } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableHighlight,
  ScrollView,
} from 'react-native'
import { BibleEngine, IBibleNote } from '@bible-engine/core'
import { observer } from 'mobx-react/native'

import {
  Color,
  FontFamily,
  FontSize,
  Margin,
  randomColor,
  DEBUG,
  getDebugStyles,
} from './Constants'
import { Footnote as FootNoteMethods } from './models/Footnote'
import Text from './Text'
import Popover from './Popover'
import bibleStore from './BibleStore'

const DEVICE_WIDTH = Dimensions.get('window').width
const DEVICE_HEIGHT = Dimensions.get('window').height

interface Props {
  notes: IBibleNote[]
}

interface State {
  popoverIsVisible: boolean
}

@observer
export default class Footnote extends React.Component<Props, State> {
  touchable: any
  state = {
    popoverIsVisible: false,
  }

  onPress = () => {
    this.setState({ popoverIsVisible: true })
  }

  closePopover = () => {
    this.setState({ popoverIsVisible: false })
  }

  getNoteText = (note: IBibleNote) => {
    return `${note.key}) ${ FootNoteMethods.getPlainText(note)}`
  }

  renderFootnote = ({ item }) => (
    <Text style={bibleStore.scaledFontSize(styles.popover__content__verse)}>
      {this.getNoteText(item)}
    </Text>
  )

  renderPopoverContent = () => {
    return (
      <View>
        <View style={styles.popover__content}>
          <FlatList
            data={this.props.notes}
            showsVerticalScrollIndicator={false}
            renderItem={this.renderFootnote}
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
          <Text style={bibleStore.scaledFontSize(styles.text)}>
            {this.props.notes[0].key}
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
    )
  }
}

const styles = StyleSheet.create({
  touchable: {
    marginLeft: -4,
  },
  text: {
    marginTop: -4,
    paddingRight: 7,
    textAlignVertical: 'top',
    fontSize: FontSize.SMALL,
    color: Color.TYNDALE_BLUE,
    fontFamily: FontFamily.CARDO_ITALIC,
    ...getDebugStyles,
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
