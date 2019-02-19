import React from 'react';
import { Text, View, StyleSheet, ScrollView, Dimensions } from 'react-native';

import {
  IBibleContent,
  IBibleOutputRich,
  BibleEngine
} from '@bible-engine/core';
import StrongsWord from './StrongsWord';
import { Margin, FontSize, FontFamily, Color } from './Constants';

interface State {
  content: IBibleContent[];
}

interface Props {
  chapterNum: number;
  bookName: string;
  content: IBibleOutputRich[];
  sqlBible: BibleEngine;
}

export default class ReadingView extends React.PureComponent<Props, State> {
  componentWillReceiveProps(props: Props) {
    console.log(JSON.stringify(props.bookName));
  }
  renderItem = (content: IBibleContent): any => {
    if (content.type === 'phrase') {
      if (content.strongs) {
        return (
          <StrongsWord
            phrase={content.content}
            strongs={content.strongs}
            sqlBible={this.props.sqlBible}
          />
        );
      }
      return (
        <View style={styles.phrase}>
          <Text style={styles.phraseText}>{content.content}</Text>
        </View>
      );
    }
    const children: IBibleContent[] = content.contents;
    if (content.type === 'section') {
      return (
        <View style={styles.section}>
          <Text style={styles.title}>{content.title}</Text>
          {children.map(child => this.renderItem(child))}
        </View>
      );
    }
    if (content.type === 'group') {
      if (content.groupType === 'paragraph') {
        return children.map(child => this.renderItem(child));
      }
      if (content.groupType === 'indent') {
        return children.map(child => this.renderItem(child));
      }
    }
    throw new Error(`Unrecognized content: ${JSON.stringify(content)}`);
  };

  render() {
    return (
      <View style={styles.background}>
        <ScrollView
          bounces={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ marginTop: 30 }}
        >
          <Text style={styles.chapterHeader}>
            {`${this.props.bookName} ${this.props.chapterNum}`}
          </Text>
          {this.props.content
            ? this.props.content.map((element: IBibleContent) =>
                this.renderItem(element)
              )
            : null}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: 'white',
    flex: 1,
    borderLeftColor: 'gray',
    borderLeftWidth: 1
  },
  chapterHeader: {
    fontSize: FontSize.EXTRA_LARGE,
    fontFamily: FontFamily.OPEN_SANS_LIGHT,
    marginTop: Margin.LARGE,
    marginBottom: Margin.LARGE,
    textAlign: 'center'
  },
  phrase: {
    marginBottom: Margin.EXTRA_SMALL,
    marginRight: Margin.EXTRA_SMALL
  },
  phraseText: {
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.MEDIUM
  },
  section: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: Margin.LARGE,
    marginRight: Margin.LARGE
  },
  strongsPhraseText: {
    color: Color.TYNDALE_BLUE,
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.MEDIUM
  },
  title: {
    fontFamily: FontFamily.OPEN_SANS_SEMIBOLD,
    fontSize: FontSize.MEDIUM * 0.8,
    marginBottom: Margin.SMALL,
    marginTop: Margin.SMALL,
    width: Dimensions.get('window').width
  }
});
