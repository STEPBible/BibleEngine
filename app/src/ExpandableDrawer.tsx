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
import { withGlobalContext } from './GlobalContext'

const DEVICE_WIDTH = Dimensions.get('window').width
const DRAWER_WIDTH = DEVICE_WIDTH
const DRAWER_HEIGHT = 52
const CELL_WIDTH = DRAWER_WIDTH / 5 - 4

interface Props {
  item: IBibleBookEntity
  changeBookAndChapter: Function
  closeDrawer: Function
  drawerStyle: any
  index: number
  open: boolean
  scrollToBook: Function
}
interface State {}

class ExpandableDrawer extends React.PureComponent<Props, State> {
  onBookPress = () => {
    const animation = LayoutAnimation.create(150, 'easeInEaseOut', 'opacity')
    LayoutAnimation.configureNext(animation)
    this.props.scrollToBook(this.props.index)
  }

  onChapterPress = (num: number) => {
    this.props.global.updateCurrentBibleReference({
      bookOsisId: this.props.item.osisId,
      versionChapterNum: num,
      versionUid: this.props.global.versionUid,
    })
    this.props.navigation.navigate('Home')
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
          <Text style={styles.drawer__text}>{this.props.item.title}</Text>
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
    color: '#202124',
    fontFamily: FontFamily.OPEN_SANS,
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
    color: '#202124',
    fontFamily: FontFamily.OPEN_SANS,
    fontSize: FontSize.SMALL,
    textAlign: 'center',
  },
})

export default withNavigation(withGlobalContext(ExpandableDrawer))
