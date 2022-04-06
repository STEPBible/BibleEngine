import React from 'react'
import {
  View,
  Dimensions,
  LayoutAnimation,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { IBibleBookEntity } from '@bible-engine/core'
import { TouchableRipple } from 'react-native-paper'
import { withNavigation } from 'react-navigation'

import { FontFamily, FontSize, getDebugStyles } from './Constants'
import Text from './Text'
import bibleStore from './BibleStore'
import { observer } from 'mobx-react/native'

const DEVICE_WIDTH = Dimensions.get('window').width
const DRAWER_WIDTH = DEVICE_WIDTH
const DRAWER_HEIGHT = 52
const CELL_WIDTH = DRAWER_WIDTH / 5 - 4

interface Props {
  item: IBibleBookEntity
  drawerStyle: any
  index: number
  open: boolean
  isCurrentBook: boolean
  scrollToBook: Function
}
interface State {}

@observer
class ExpandableDrawer extends React.Component<Props, State> {
  onBookPress = () => {
    const animation = LayoutAnimation.create(150, 'easeInEaseOut', 'opacity')
    LayoutAnimation.configureNext(animation)
    this.props.scrollToBook(this.props.index)
  }

  onChapterPress = (num: number) => {
    this.props.navigation.popToTop()
    bibleStore.updateCurrentBibleReference({
      bookOsisId: this.props.item.osisId,
      versionChapterNum: num,
      versionUid: bibleStore.versionUid,
    })
  }

  renderChapterNums = () => (
    <ScrollView>
      <View style={styles.verses}>
        {Array.apply(null, { length: this.props.item.chaptersCount.length + 1 })
          .map(Number.call, Number)
          .slice(1)
          .map(this.renderChapterNum)}
      </View>
    </ScrollView>
  )

  renderChapterNum = (num, index) => (
    <TouchableRipple
      onPress={() => this.onChapterPress(num)}
      key={`child-${index}`}
      underlayColor="#e8eaed"
      style={styles.verses__cell}
    >
      <Text style={styles.verses__cell__text}>{num}</Text>
    </TouchableRipple>
  )

  textStyle = () => {
    return this.props.isCurrentBook
      ? styles['drawer__text--bold']
      : styles.drawer__text
  }

  render() {
    return (
      <React.Fragment>
        <TouchableRipple
          borderless
          key={this.props.index}
          underlayColor="#e8eaed"
          style={styles.drawer}
          onPress={this.onBookPress}
        >
          <Text style={this.textStyle()}>{this.props.item.title}</Text>
        </TouchableRipple>
        {this.props.open ? this.renderChapterNums() : null}
      </React.Fragment>
    )
  }
}

const styles = StyleSheet.create({
  drawer: {
    ...getDebugStyles(),
    borderTopRightRadius: DRAWER_HEIGHT / 2,
    borderBottomRightRadius: DRAWER_HEIGHT / 2,
    borderColor: 'white',
    justifyContent: 'center',
    height: DRAWER_HEIGHT,
    marginRight: 16,
  },
  'drawer--open': {
    borderTopRightRadius: DRAWER_HEIGHT / 2,
    borderBottomRightRadius: DRAWER_HEIGHT / 2,
    borderColor: 'white',
    backgroundColor: '#e8eaed',
    justifyContent: 'center',
    height: DRAWER_HEIGHT,
    marginRight: 16,
  },
  drawer__text: {
    ...getDebugStyles(),
    fontFamily: FontFamily.OPEN_SANS,
    fontSize: FontSize.SMALL,
    marginLeft: 30,
  },
  'drawer__text--bold': {
    fontFamily: FontFamily.OPEN_SANS_BOLD,
    fontSize: FontSize.SMALL,
    marginLeft: 30,
  },
  verses: {
    ...getDebugStyles(),
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 10,
    marginRight: 10,
    marginTop: 10,
  },
  verses__cell: {
    ...getDebugStyles(),
    alignItems: 'center',
    justifyContent: 'center',
    width: CELL_WIDTH,
    height: CELL_WIDTH,
    borderColor: 'gray',
  },
  verses__cell__text: {
    ...getDebugStyles(),
    fontFamily: FontFamily.OPEN_SANS,
    fontSize: FontSize.SMALL,
    textAlign: 'center',
  },
})

export default withNavigation(ExpandableDrawer)
