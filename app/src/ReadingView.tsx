import React, { Fragment } from 'react';
import { Text, View, StyleSheet, ScrollView, Dimensions } from 'react-native';

import {
  IBibleContent,
  IBibleOutputRich,
  BibleEngine,
  IBiblePhrase
} from '@bible-engine/core';
import StrongsWord from './StrongsWord';
import { Margin, FontSize, FontFamily, getDebugStyles } from './Constants';
import CrossReference from './CrossReference';
import Footnote from './Footnote';

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

  renderCrossReference = (content: IBiblePhrase): any => {
    if (!content.crossReferences || !content.crossReferences.length) {
      return null;
    }
    return (
      <CrossReference
        crossReferences={content.crossReferences}
        sqlBible={this.props.sqlBible}
      />
    );
  };

  renderFootnote = (content: IBiblePhrase): any => {
    if (!content.notes || !content.notes.length) {
      return null;
    }
    return <Footnote notes={content.notes} />;
  };

  renderPhrase = (content: IBibleContent): any => {
    if (content.strongs) {
      return (
        <Fragment>
          {this.renderFootnote(content)}
          {this.renderVerseNumber(content)}
          {this.renderCrossReference(content)}
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
        {this.renderFootnote(content)}
        {this.renderVerseNumber(content)}
        {this.renderCrossReference(content)}
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
    borderLeftWidth: 1,
    borderRightColor: 'gray',
    borderRightWidth: 0.5
  },
  chapterHeader: {
    fontSize: FontSize.EXTRA_LARGE,
    fontFamily: FontFamily.OPEN_SANS_LIGHT,
    marginTop: Margin.EXTRA_LARGE,
    marginBottom: Margin.LARGE,
    textAlign: 'center',
    ...getDebugStyles()
  },
  phrase: { ...getDebugStyles() },
  phraseText: {
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.MEDIUM,
    marginBottom: Margin.EXTRA_SMALL,
    marginRight: 7
  },
  section: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: Margin.LARGE,
    marginRight: Margin.LARGE,
    ...getDebugStyles()
  },
  title: {
    fontFamily: FontFamily.OPEN_SANS_SEMIBOLD,
    fontSize: FontSize.MEDIUM * 0.8,
    marginBottom: Margin.SMALL,
    marginTop: Margin.SMALL,
    width: Dimensions.get('window').width - Margin.LARGE * 2,
    ...getDebugStyles()
  },
  verseNumber: {
    color: 'black',
    fontSize: FontSize.EXTRA_SMALL,
    fontFamily: FontFamily.OPEN_SANS_SEMIBOLD,
    marginRight: 3,
    marginTop: -2,
    ...getDebugStyles()
  }
});
