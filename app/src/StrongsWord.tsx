import React from 'react'
import { Text, StyleSheet } from 'react-native'
import { FontFamily, FontSize, Color } from './Constants'
import { observer } from 'mobx-react/native'
import bibleStore from './BibleStore'

@observer
export default class StrongsWord extends React.Component<any, any> {
  state = {
    pressed: false,
  }

  onResponderRelease = () => {
    this.props.onWordPress(this.props.item.strongs)
    setTimeout(() => {
      this.setState({ pressed: false })
    }, 200)
  }

  onPress = () => {
    this.setState({ pressed: true })
  }

  onResponderMove = () => {
    this.setState({ pressed: false })
  }

  onResponderTerminate = () => {
    this.setState({ pressed: false })
  }

  padWidthIfWordIsTooSmallToTap = word => {
    const MIN_TAPPABLE_WIDTH = 5
    const difference = MIN_TAPPABLE_WIDTH - word.length
    if (difference > 0) {
      const numSpaces = Math.ceil(difference / 2)
      const THIN_SPACE = ' '
      return `${THIN_SPACE.repeat(numSpaces)}${word} ${THIN_SPACE.repeat(
        numSpaces
      )}`
    }
    return `${word} `
  }

  render() {
    return (
      <Text
        onPress={this.onPress}
        onLongPress={this.onLongPress}
        onResponderMove={this.onResponderMove}
        onResponderTerminate={this.onResponderTerminate}
        onResponderRelease={this.onResponderRelease}
        style={bibleStore.scaledFontSize(
          this.state.pressed
            ? styles['page__strongs--selected']
            : styles.page__strongs
        )}
        selectionColor={'#C5D8EA'}
        key={`strongs-${this.props.index}`}
      >
        {this.padWidthIfWordIsTooSmallToTap(this.props.item.content)}
      </Text>
    )
  }
}

const LINE_HEIGHT = 27

const BASE_STYLE = {
  fontFamily: FontFamily.CARDO,
  fontSize: FontSize.SMALL,
  color: Color.TYNDALE_BLUE,
  lineHeight: LINE_HEIGHT,
  textAlign: 'center',
  minWidth: 200,
}

const styles = StyleSheet.create({
  page__strongs: {
    ...BASE_STYLE,
  },
  'page__strongs--selected': {
    backgroundColor: '#CBDDEC',
    ...BASE_STYLE,
  },
})
