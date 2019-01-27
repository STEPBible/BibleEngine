import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  Dimensions,
  TouchableHighlight
} from 'react-native';
import Popover from './Popover';
import Colors from './Colors';
const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

interface Props {
  phrase: string;
  strongs: string[];
}

interface State {
  popoverIsVisible: boolean;
}

export default class TaggedWord extends React.Component<Props, State> {
  touchable: any;
  state = {
    popoverIsVisible: false
  };
  onPress = () => {
    this.setState({ popoverIsVisible: true });
  };
  closePopover = () => {
    this.setState({ popoverIsVisible: false });
  };
  render() {
    return (
      <React.Fragment>
        <TouchableHighlight
          ref={ref => (this.touchable = ref)}
          onPress={this.onPress}
          activeOpacity={0.5}
          underlayColor="white"
          style={styles.strongWord}
        >
          <Text style={[styles.text, styles.strongWordText]}>
            {this.props.phrase}
          </Text>
        </TouchableHighlight>
        <Popover
          isVisible={this.state.popoverIsVisible}
          fromView={this.touchable}
          onClose={() => this.closePopover()}
        >
          <View style={styles.popover__content}>
            <Text>{this.props.strongs}</Text>
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
    borderRadius: 20
  },
  popover__arrow: {},
  popover__backdrop: {
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  strongWord: {
    marginRight: 7,
    marginBottom: 12
  },
  strongWordText: {
    color: Colors.tyndaleBlue,
    fontFamily: 'cardo',
    fontSize: 22
  },
  text: {
    fontSize: 20,
    fontFamily: 'cardo'
  }
});
