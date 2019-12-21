import React from 'react'
import { View, FlatList, Dimensions, StyleSheet } from 'react-native'
import hoistNonReactStatics from 'hoist-non-react-statics'
import { withGlobalContext } from './GlobalContext'
import ExpandableDrawer from './ExpandableDrawer'
import bibleStore from './BibleStore'
import { observer } from 'mobx-react/native'

const DRAWER_HEIGHT = 52

@observer
class BookScreen extends React.Component<{}, {}> {
  static navigationOptions = {
    headerTitle: 'Books',
  }
  bookListRef: any
  state = {
    activeBookIndex: null,
    currentBookIndex: 0,
  }
  componentDidMount() {
    const currentBookIndex =
      bibleStore.books.findIndex(
        book => book.osisId === bibleStore.bookOsisId
      ) || 0
    this.setState({ ...this.state, currentBookIndex })
  }
  getItemLayout = (data: any, index: any) => ({
    length: DRAWER_HEIGHT,
    offset: DRAWER_HEIGHT * index,
    index,
  })
  scrollToBook = (index: number) => {
    if (index === this.state.activeBookIndex) {
      this.setState({
        ...this.state,
        activeBookIndex: undefined,
      })
      return
    }
    this.setState({
      ...this.state,
      activeBookIndex: index,
    })
    this.bookListRef.scrollToIndex({ index })
  }

  render() {
    return (
      <FlatList
        data={bibleStore.books}
        initialScrollIndex={Math.max(0, this.state.currentBookIndex - 2)}
        keyExtractor={(item, index) => index.toString()}
        getItemLayout={this.getItemLayout}
        ref={ref => (this.bookListRef = ref)}
        renderItem={({ item, index }) => (
          <ExpandableDrawer
            item={item}
            open={index === this.state.activeBookIndex}
            isCurrentBook={index === this.state.currentBookIndex}
            scrollToBook={this.scrollToBook}
            index={index}
          />
        )}
        ListFooterComponent={<View style={styles.footer} />}
        showsVerticalScrollIndicator={false}
      />
    )
  }
}

const styles = StyleSheet.create({
  footer: {
    height: 100,
  },
})

export default hoistNonReactStatics(withGlobalContext(BookScreen), BookScreen)
