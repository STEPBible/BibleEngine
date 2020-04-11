import React from 'react';
import { StyleSheet, ScrollView, LayoutChangeEvent } from 'react-native';
import ScrollViewItem from './ScrollViewItem';

export default class InfiniteScrollView extends React.Component<any, any> {
  listRef?: ScrollView | null
  itemHeightCache: any = {}

  constructor(props: any) {
    super(props)
    this.state = {
      _items: this.props.items,
      itemsToMeasure: null,
    }
  }

  public addItemsToBeginning = (itemsToMeasure: any[]) => {
    this.setState({ ...this.state, itemsToMeasure })
  }

  public addItemsToEnd = (items: any[]) => {
    this.setState({ ...this.state, _items: [...this.state._items, ...items] })
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
      _items: [...this.state.itemsToMeasure, ...this.state._items]
    })
  }

  private onItemLayout = (event: LayoutChangeEvent, index: number) => {
    const itemHeight = event.nativeEvent?.layout?.height
    this.itemHeightCache[index] = itemHeight
  }

  render() {
    return (
      <React.Fragment>
        <ScrollView
          {...this.props}
          ref={(ref) => { this.listRef = ref; this.props.scrollViewRef(ref); }}
        >
          {
            this.state._items.map(
              (item: any, index: number) => (
                <ScrollViewItem
                  key={`item-${index}`}
                  item={item}
                  index={index}
                  renderItem={this.props.renderItem}
                  onLayout={this.onItemLayout}
                />
              )
            )
          }
        </ScrollView>
        <ScrollView
          style={styles.invisibleCellMeasurer}
          onContentSizeChange={this.onMeasureTestItemLayout}
        >
          {this.state.itemsToMeasure &&
            this.state.itemsToMeasure.map((item, index) => (
              <ScrollViewItem
                key={`test-item-${index}`}
                item={item}
                index={index}
                renderItem={this.props.renderItem}
                onLayout={() => { }}
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
    maxHeight: 0
  }
});