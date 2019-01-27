import React from 'react';
import PropTypes from 'prop-types';
import {
  Text, View, StyleSheet, Dimensions,
} from 'react-native';
import TaggedWord from './TaggedWord';

const DEVICE_WIDTH = Dimensions.get('window').width;

export default function Chapter(props) {
  const { words, bookName, chapterNum } = props;
  return (
    <View style={styles.chapter}>
      <Text style={styles.bookAndChapterTitle}>
        {`${bookName} ${chapterNum}`}
      </Text>
      {words.map((word, index) => {
        if (!word || !word[0]) {
          return null;
        }
        if (word[0][0] !== '$') {
          if (/^[.,:!?]/.test(word[0][0])) {
            return (
              <View
                style={styles.punctuation}
                key={index}
              >
                <Text style={styles.text}>
                  {word[0].trim()}
                </Text>
              </View>
            );
          }
          if (word.length === 2) {
            return (
              <TaggedWord key={index} word={word} />
            );
          }
          return (
            <View
              key={index}
              style={styles.word}
            >
              <Text style={styles.text}>
                {word[0].trim()}
              </Text>
            </View>
          );
        }
        if (word[0] === '$verse-num') {
          return (
            <Text
              key={index}
              style={styles.verseNum}
            >
              {word[1]}
            </Text>
          );
        }
        if (word[0] === '$paragraph-break') {
          return (
            <View
              key={index}
              style={styles.paragraphBreak}
            />
          );
        }
        if (word[0] === '$line-break') {
          return (
            <View
              key={index}
              style={styles.lineBreak}
            />
          );
        }
        if (word[0] === '$indentation' && word[1] === 1) {
          return (
            <View
              key={index}
              style={styles.smallIndent}
            />
          );
        }
        if (word[0] === '$indentation' && word[1] === 2) {
          return (
            <View
              key={index}
              style={styles.largeIndent}
            />
          );
        }
        if (word[0].includes('$title')) {
          return (
            <Text
              key={index}
              style={styles.title}
            >
              {word[1]}
            </Text>
          );
        }
        return null;
      })}
    </View>
  );
}

Chapter.propTypes = {
  words: PropTypes.array.isRequired,
  bookName: PropTypes.string.isRequired,
  chapterNum: PropTypes.number.isRequired,
};

const styles = StyleSheet.create({
  chapter: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'white',
    padding: 14,
    paddingBottom: 0,
  },
  bookAndChapterTitle: {
    flex: 1,
    // backgroundColor: 'orange',
    textAlign: 'center',
    fontFamily: 'open-sans-light',
    fontSize: 40,
    marginBottom: 60,
    marginTop: 40,
    color: '#545454',
    width: DEVICE_WIDTH - 28,
  },
  word: {
    margin: 3,
    // backgroundColor: 'orange',
  },
  punctuation: {
    // margin: 2,
    marginLeft: -2,
    // marginRight: -2,
    // backgroundColor: 'orange',
  },
  text: {
    fontSize: 20,
    fontFamily: 'cardo',
  },
  paragraphBreak: {
    // backgroundColor: 'green',
    height: 15,
    width: DEVICE_WIDTH,
  },
  lineBreak: {
    height: 0,
    width: DEVICE_WIDTH,
    // backgroundColor: 'orange',
  },
  smallIndent: {
    height: 30,
    width: 20,
    // backgroundColor: 'blue',
  },
  largeIndent: {
    height: 30,
    width: 40,
    // backgroundColor: 'blue',
  },
  verseNum: {
    fontSize: 14,
    marginRight: 4,
    marginLeft: 6,
    fontFamily: 'open-sans-bold',
    // backgroundColor: 'green',
  },
  title: {
    flexWrap: 'wrap',
    fontSize: 19,
    fontFamily: 'open-sans-semibold',
    width: DEVICE_WIDTH,
    marginBottom: 12,
  },
});
