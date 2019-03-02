import React, { Fragment } from 'react';
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
      return this.renderPhrase(content);
    }
    const children: IBibleContent[] = content.contents;

    if (content.type === 'section') {
      return (
        <Fragment>
          {this.renderVerseNumber(content)}
          {this.renderSection(content)}
        </Fragment>
      );
    }
    if (content.type === 'group') {
      if (content.groupType === 'paragraph') {
        return (
          <Fragment>
            {this.renderVerseNumber(content)}
            {children.map(child => this.renderItem(child))}
          </Fragment>
        );
      }
      if (content.groupType === 'indent') {
        return (
          <Fragment>
            {this.renderVerseNumber(content)}
            {children.map(child => this.renderItem(child))}
          </Fragment>
        );
      }
    }
    throw new Error(`Unrecognized content: ${JSON.stringify(content)}`);
  };

  renderSection = (content: IBibleContent): any => {
    const children: IBibleContent[] = content.contents;
    return (
      <View style={styles.section}>
        <Text style={styles.title}>{content.title}</Text>
        {children.map(child => this.renderItem(child))}
      </View>
    );
  };

  renderVerseNumber = (content: IBibleContent): any => {
    if (content.numbering) {
      return (
        <Text style={styles.verseNumber}>
          {content.numbering.versionVerseIsStarting}
        </Text>
      );
    }
    return null;
  };

  renderPhrase = (content: IBibleContent): any => {
    if (content.strongs) {
      return (
        <Fragment>
          {this.renderVerseNumber(content)}
          <StrongsWord
            phrase={content.content}
            strongs={content.strongs}
            sqlBible={this.props.sqlBible}
          />
        </Fragment>
      );
    }
    return (
      <Fragment>
        {this.renderVerseNumber(content)}
        <View style={styles.phrase}>
          <Text style={styles.phraseText}>{content.content}</Text>
        </View>
      </Fragment>
    );
  };

  render() {
    return (
      <View style={styles.background}>
        <ScrollView bounces={true} showsVerticalScrollIndicator={false}>
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
    marginTop: Margin.EXTRA_LARGE,
    marginBottom: Margin.LARGE,
    textAlign: 'center'
  },
  phrase: {
    // backgroundColor: 'yellow',
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
    // backgroundColor: 'yellow',
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
  },
  verseNumber: {
    //backgroundColor: 'magenta',
    color: 'gray',
    fontSize: FontSize.EXTRA_SMALL,
    fontFamily: FontFamily.CARDO,
    marginRight: 3,
    marginBottom: Margin.MEDIUM,
    marginTop: -2
  }
});
