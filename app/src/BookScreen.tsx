import React from 'react'
import { View, FlatList, Dimensions, StyleSheet } from 'react-native'
import hoistNonReactStatics from 'hoist-non-react-statics'
import { withGlobalContext } from './GlobalContext'
import ExpandableDrawer from './ExpandableDrawer'

const DEVICE_WIDTH = Dimensions.get('window').width
const DRAWER_HEIGHT = 52

interface State {
  activeBookIndex?: number
  books: any[]
}

class BookScreen extends React.Component<{}, State> {
  static navigationOptions = {
    headerTitle: 'Books',
  }
  bookListRef: any
  state = {
    books: [],
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
        data={this.props.global.books}
        keyExtractor={(item, index) => index.toString()}
        getItemLayout={this.getItemLayout}
        ref={ref => (this.bookListRef = ref)}
        renderItem={({ item, index }) => (
          <ExpandableDrawer
            item={item}
            open={index === this.state.activeBookIndex}
            scrollToBook={this.scrollToBook}
            changeBookAndChapter={() => {}}
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
