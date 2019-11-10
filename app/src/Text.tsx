import React, { Component } from 'react'
import { Text } from 'react-native'
import { withGlobalContext } from './GlobalContext'

class FontText extends Component<any, any> {
  render() {
    if (this.props.global.fontsAreReady) {
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

export default withGlobalContext(FontText)
