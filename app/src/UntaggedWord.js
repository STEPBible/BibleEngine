import React from 'react';
import PropTypes from 'prop-types';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function UntaggedWord(props) {
  const { word } = props;
  return (
    <View
      style={styles.word}
    >
      <Text style={styles.text}>
        {word.trim()}
      </Text>
    </View>
  );
}

UntaggedWord.propTypes = {
  word: PropTypes.string.isRequired,
};

const styles = StyleSheet.create({
  text: {
    fontSize: 20,
    fontFamily: 'cardo',
  },
  word: {
    margin: 3,
  },
});
