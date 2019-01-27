import React from 'react';
import {
  Text, View, StyleSheet, Dimensions,
  Button,
  TouchableHighlight,
} from 'react-native';
import Popover from './Popover';
import Colors from './Colors';

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

export default class TaggedWord extends React.Component {
  state = {
    popoverIsVisible: false,
  }

  onPress = () => {
    this.setState({ popoverIsVisible: true });
  }

  closePopover = () => {
    this.setState({ popoverIsVisible: false });
  }

  render() {
    return (
      <React.Fragment>
        <TouchableHighlight
          ref={ref => this.touchable = ref}
          onPress={this.onPress}
          activeOpacity={0.5}
          underlayColor="white"
          style={styles.strongWord}
        >
          <Text style={[styles.text, styles.strongWordText]}>
            {this.props.word[0].trim()}
          </Text>
        </TouchableHighlight>
        <Popover
          isVisible={this.state.popoverIsVisible}
          fromView={this.touchable}
          onClose={() => this.closePopover()}
        >
          <View style={styles.popover__content}>
            <Text>{this.props.word[1]}</Text>
          </View>
        </Popover>
      </React.Fragment>
    );
  }
}

const styles = StyleSheet.create({
  popover__content: {
    flex: 1,
    height: DEVICE_HEIGHT * 0.5,
    width: DEVICE_WIDTH - 30,
    borderRadius: 20,
  },
  popover__arrow: {

  },
  popover__backdrop: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  strongWord: {
    margin: 2,
    // backgroundColor: 'orange',
  },
  strongWordText: {
    color: Colors.blue,
  },
  text: {
    fontSize: 20,
    fontFamily: 'cardo',
  },
});