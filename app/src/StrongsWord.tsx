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

  onStartShouldSetResponder = () => {
    setTimeout(() => {
      this.setState({ pressed: false })
    }, 100)
    this.setState({ pressed: true })
  }

  onResponderRelease = () => {
    this.props.onWordPress(this.props.item.strongs)
    this.setState({ pressed: false })
  }

  render() {
    return (
      <Text
        selectable={false}
        onPress={this.onPress}
        onStartShouldSetResponder={this.onStartShouldSetResponder}
        onResponderRelease={this.onResponderRelease}
        style={bibleStore.scaledFontSize(
          this.state.pressed
            ? styles['page__strongs--selected']
            : styles.page__strongs
        )}
        selectionColor={'#C5D8EA'}
        key={`strongs-${this.props.index}`}
      >
        {`${this.props.item.content} `}
      </Text>
    )
  }
}

const LINE_HEIGHT = 27

const styles = StyleSheet.create({
  page__strongs: {
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.SMALL,
    color: Color.TYNDALE_BLUE,
    lineHeight: LINE_HEIGHT,
  },
  'page__strongs--selected': {
    backgroundColor: '#CBDDEC',
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.SMALL,
    color: Color.TYNDALE_BLUE,
    lineHeight: LINE_HEIGHT,
  },
})
