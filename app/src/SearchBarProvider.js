import React from 'react'
import SearchBarAnimation from './SearchBarAnimation'
import { SearchBarContext } from './SearchBarContext'

export default class SearchBarProvider extends React.PureComponent {
  constructor(props) {
    super(props)

    this.searchBarAnimation = new SearchBarAnimation({
      scrollToOffset: configScroll => {
        scrollToOffset(configScroll.offset, configScroll.animated)
      },
    })

    this.state = {
      contextProvider: {
        animation: this.searchBarAnimation.animationProps,
      },
    }
  }

  componentWillUnmount() {
    this.searchBarAnimation.destroy()
  }

  render() {
    return (
      <SearchBarContext.Provider value={this.state.contextProvider}>
        {this.props.children(this.searchBarAnimation)}
      </SearchBarContext.Provider>
    )
  }
}
