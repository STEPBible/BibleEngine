import React from 'react'
import {
  StyleSheet,
  ScrollView,
  LayoutChangeEvent,
  ScrollViewProps,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Dimensions,
} from 'react-native'
import ScrollViewItem from './ScrollViewItem'

interface Props extends ScrollViewProps {
  items: any[]
  keyExtractor: (item: any, index: number) => string
  onBottomReached: Function
  onTopReached: Function
  onBottomoReachedThreshold: number
  onTopReachedThreshold: number
  scrollViewRef: Function
  renderItem: Function
}

interface State {
  _items: any[]
  itemsToMeasure: any[]
}

export default class InfiniteScrollView extends React.Component<Props, State> {
  listRef?: ScrollView | null
  totalHeight?: number
  itemHeightCache: any = {}
  contentRequestIsPending = false

  constructor(props: any) {
    super(props)
    this.state = {
      _items: this.props.items,
      itemsToMeasure: [],
    }
  }

  componentDidUpdate(prevProps: Props) {
    console.log('componentDidUpdate: ', prevProps.items.length, this.props.items.length)

    if (prevProps.items.length === this.props.items.length) {
      return
    }
    if (this.props.items.length === 0) {
      this.setState({ ...this.state, _items: [] })
      return
    }
    if (prevProps.items[0])
    const numItems = this.numItemsAddedInBeginning(prevProps.items)
    const remainingItems = this.props.items.slice(numItems)
    this.setState({
      ...this.state,
      _items: remainingItems,
      itemsToMeasure: this.props.items.slice(0, numItems)
    })
  }

  numItemsAddedInBeginning(oldItems: any[]): number {
    if (oldItems.length === 0) {
      return 0
    }
    const oldFirstItemKey = this.props.keyExtractor(oldItems[0], 0)
    for (const [item, index] of Object.entries(this.props.items)) {
      const newKey = this.props.keyExtractor(item, index)
      if (oldFirstItemKey === newKey) {
        return index
      }
    }
    return this.props.items.length
  }

  public addItemsToBeginning = (itemsToMeasure: any[]) => {
    this.setState({ ...this.state, itemsToMeasure })
  }

  public addItemsToEnd = (items: any[]) => {
    this.setState({ ...this.state, _items: [...this.state._items, ...items] })
    this.contentRequestIsPending = false
  }

  private onMeasureTestItemLayout = (_: number, height: number) => {
    if (this.state.itemsToMeasure === null) {
      return
    }
    this.addContentToBeginningWithoutJumping(height)
  }

  private addContentToBeginningWithoutJumping = (itemHeight: number) => {
    requestAnimationFrame(() => {
      this.listRef?.scrollTo({ y: itemHeight, animated: false })
    })
    this.setState({
      ...this.state,
      _items: [...this.state.itemsToMeasure, ...this.state._items],
    })
    this.contentRequestIsPending = false
  }

  private onItemLayout = (event: LayoutChangeEvent, index: number) => {
    const itemHeight = event.nativeEvent?.layout?.height
    this.itemHeightCache[index] = itemHeight
  }

  onScrollViewLayout = (event: LayoutChangeEvent) => {
    const topOfScreenOffset = event.nativeEvent.layout.y
    this.checkIfMoreContentNeeded(topOfScreenOffset)
  }

  onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const topOfScreenOffset = event.nativeEvent.contentOffset.y
    this.checkIfMoreContentNeeded(topOfScreenOffset)
  }

  checkIfMoreContentNeeded = (topOfScreenOffset: number) => {
    if (!this.totalHeight) return
    const deviceHeight = Dimensions.get('window').height
    const bottomOfScreenOffset = topOfScreenOffset + deviceHeight
    const percentageToTop = topOfScreenOffset / deviceHeight
    const percentageOfContentConsumed = bottomOfScreenOffset / this.totalHeight
    if (
      percentageOfContentConsumed > this.props.onBottomoReachedThreshold &&
      this.contentRequestIsPending === false
    ) {
      this.contentRequestIsPending = true
      this.props.onBottomReached()
    }
    if (
      percentageToTop < this.props.onTopReachedThreshold &&
      this.contentRequestIsPending === false
    ) {
      this.contentRequestIsPending = true
      this.props.onTopReached()
    }
    console.log('checkIfMoreContentNeeded: ', percentageOfContentConsumed)
  }

  onContentSizeChange = (width: number, height: number) => {
    this.totalHeight = height
  }

  render() {
    return (
      <React.Fragment>
        <ScrollView
          {...this.props}
          ref={ref => {
            this.listRef = ref
            this.props.scrollViewRef(ref)
          }}
          onScroll={this.onScroll}
          onLayout={this.onScrollViewLayout}
          onContentSizeChange={this.onContentSizeChange}
          scrollEventThrottle={0}
        >
          {this.state._items.map((item: any, index: number) => (
            <ScrollViewItem
              key={`item-${index}`}
              item={item}
              index={index}
              renderItem={this.props.renderItem}
              onLayout={this.onItemLayout}
            />
          ))}
        </ScrollView>
        <ScrollView
          style={styles.invisibleCellMeasurer}
          onContentSizeChange={this.onMeasureTestItemLayout}
        >
          {this.state.itemsToMeasure.map((item, index) => (
            <ScrollViewItem
              key={`test-item-${index}`}
              item={item}
              index={index}
              renderItem={this.props.renderItem}
              onLayout={() => {}}
            />
          ))}
        </ScrollView>
      </React.Fragment>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invisibleCellMeasurer: {
    maxHeight: 0,
  },
})
