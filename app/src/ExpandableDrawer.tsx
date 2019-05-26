import React from 'react';
import {
  View,
  Dimensions,
  LayoutAnimation,
  TouchableHighlight,
  StyleSheet,
  Text,
  ScrollView
} from 'react-native';
import { FontFamily, FontSize, getDebugStyles } from './Constants';
import { IBibleBookEntity } from '@bible-engine/core';
import { TouchableRipple } from 'react-native-paper';

const DEVICE_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = DEVICE_WIDTH * 0.85;
const DRAWER_HEIGHT = 52;
const CELL_WIDTH = DRAWER_WIDTH / 5 - 4;

interface Props {
  item: IBibleBookEntity;
  changeBookAndChapter: Function;
  closeDrawer: Function;
  drawerStyle: any;
  index: number;
  scrollToBook: Function;
}
interface State {
  open: boolean;
}

export default class ExpandableDrawer extends React.PureComponent<
  Props,
  State
> {
  state = {
    open: false
  };

  onBookPress = () => {
    const animation = LayoutAnimation.create(150, 'easeInEaseOut', 'opacity');
    LayoutAnimation.configureNext(animation);
    this.props.scrollToBook(this.props.index);
    this.setState({
      open: !this.state.open
    });
  };

  onChapterPress = (num: number) => {
    this.props.closeDrawer();
    this.props.changeBookAndChapter(this.props.item.osisId, num);
  };

  renderChapterNums = () => (
    <ScrollView>
      <View style={styles.verses}>
        {Array.apply(null, { length: this.props.item.numChapters + 1 })
          .map(Number.call, Number)
          .slice(1)
          .map(this.renderChapterNum)}
      </View>
    </ScrollView>
  );

  renderChapterNum = (num, index) => (
    <TouchableRipple
      onPress={() => this.onChapterPress(num)}
      key={`child-${index}`}
      underlayColor="#e8eaed"
      style={styles.verses__cell}
    >
      <Text style={styles.verses__cell__text}>{num}</Text>
    </TouchableRipple>
  );

  render() {
    return (
      <React.Fragment>
        <TouchableRipple
          borderless
          key={this.props.index}
          underlayColor="#e8eaed"
          style={this.state.open ? styles['drawer--open'] : styles.drawer}
          onPress={this.onBookPress}
        >
          <Text style={styles.drawer__text}>{this.props.item.title}</Text>
        </TouchableRipple>
        {this.state.open ? this.renderChapterNums() : null}
      </React.Fragment>
    );
  }
}

const styles = StyleSheet.create({
  drawer: {
    ...getDebugStyles(),
    borderTopRightRadius: DRAWER_HEIGHT / 2,
    borderBottomRightRadius: DRAWER_HEIGHT / 2,
    justifyContent: 'center',
    height: DRAWER_HEIGHT,
    marginRight: 16
  },
  'drawer--open': {
    borderTopRightRadius: DRAWER_HEIGHT / 2,
    borderBottomRightRadius: DRAWER_HEIGHT / 2,
    backgroundColor: '#e8eaed',
    justifyContent: 'center',
    height: DRAWER_HEIGHT,
    marginRight: 16
  },
  drawer__text: {
    ...getDebugStyles(),
    color: '#202124',
    fontFamily: FontFamily.OPEN_SANS_SEMIBOLD,
    fontSize: FontSize.SMALL,
    marginLeft: 30
  },
  verses: {
    ...getDebugStyles(),
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 10,
    marginRight: 10,
    marginTop: 10
  },
  verses__cell: {
    ...getDebugStyles(),
    alignItems: 'center',
    justifyContent: 'center',
    width: CELL_WIDTH,
    height: CELL_WIDTH,
    borderColor: 'gray'
  },
  verses__cell__text: {
    ...getDebugStyles(),
    color: '#202124',
    fontFamily: FontFamily.OPEN_SANS_SEMIBOLD,
    fontSize: FontSize.SMALL,
    textAlign: 'center'
  }
});
