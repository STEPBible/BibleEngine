//  Created by Artem Bogoslavskiy on 7/5/18.

import React from 'react'
import { ifIphoneX, isAndroid } from './utils'
import { FlatList, Animated } from 'react-native'
import { SearchBarContext } from './SearchBarContext'

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

class FlatListHelper extends React.PureComponent {
  componentDidMount() {
    let { animation } = this.props

    setTimeout(() => {
      // Fix bug initialScroll set
      this.scrollToOffset(animation.initialScroll, false)
    }, 250)
  }

  scrollToOffset = (offset, animated = true) => {
    if (this.flatList) {
      this.flatList.getNode().scrollToOffset({ offset, animated })
    }
  }

  _onScrollEndDrag = e => {
    let velocity = e.nativeEvent.velocity.y
  }

  render() {
    let { scrollY, fullHeight } = this.props.animation
    let { contentContainerStyle } = this.props

    return (
      <AnimatedFlatList
        {...this.props}
        scrollEventThrottle={1}
        onScrollEndDrag={this._onScrollEndDrag}
        contentContainerStyle={[
          { paddingTop: fullHeight },
          contentContainerStyle,
        ]}
        ref={component => {
          this.flatList = component
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      />
    )
  }
}

export default React.forwardRef((props, ref) => (
  <SearchBarContext.Consumer>
    {context => <FlatListHelper ref={ref} {...context} {...props} />}
  </SearchBarContext.Consumer>
))
