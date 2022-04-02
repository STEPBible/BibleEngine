import React, { Component } from 'react'
import { Text } from 'react-native-paper'
import { observer } from 'mobx-react/native'

import bibleStore from './BibleStore'

@observer
class FontText extends Component<any, any> {
  render() {
    if (bibleStore.fontsAreReady) {
      return <Text {...this.props}>{this.props.children}</Text>
    }
    const { style, ...props } = this.props
    const styleWithoutFontFamily = JSON.parse(JSON.stringify(style))
    if (styleWithoutFontFamily) delete styleWithoutFontFamily.fontFamily
    return (
      <Text style={styleWithoutFontFamily} {...props}>
        {this.props.children}
      </Text>
    )
  }
}

export default FontText
