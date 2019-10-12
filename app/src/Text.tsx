import React, { Component } from 'react'
import { Text } from 'react-native'
import { withGlobalContext } from './GlobalContext'

class FontText extends Component<any, any> {
  render() {
    if (this.props.global.fontsAreReady) {
      return <Text {...this.props}>{this.props.children}</Text>
    }
    const { style, ...props } = this.props
    delete style.fontFamily
    return (
      <Text style={style} {...props}>
        {this.props.children}
      </Text>
    )
  }
}

export default withGlobalContext(FontText)
