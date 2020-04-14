import React from 'react'
import { View } from 'react-native'

export default class ScrollViewItem extends React.Component<any, any> {
  render() {
    return (
      <View onLayout={event => this.props.onLayout(event, this.props.index)}>
        {this.props.renderItem({
          item: this.props.item,
          index: this.props.index,
        })}
      </View>
    )
  }
}
