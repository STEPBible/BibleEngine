import React, { Fragment } from 'react';
import { StyleSheet, Text, View, Platform, Dimensions } from 'react-native';
import Database from './Database';
import {
  Settings,
  FontSize,
  Margin,
  FontFamily,
  getDebugStyles
} from './Constants';
import StrongsWord from './StrongsWord';
import Footnote from './Footnote';
import CrossReference from './CrossReference';
import { ifAndroid, ifIOS, ifIphoneX } from './utils';

interface State {}

interface Props {
  database: Database;
  contents: any;
}

export default class ReadingSection extends React.PureComponent<Props, State> {
  componentDidMount() {
    // const chapterContents = await this.props.database.getChapter('ESV', 'Gen', 1)
    // this.setState({ chapterContents })
  }

  renderSection = (content: IBibleContent): any => {
    const children: IBibleContent[] = content.contents;
    return (
      <View style={styles.section}>
        <Text style={styles.title}>{content.title}</Text>
        {children.map((child, index) => this.renderItem(child, index))}
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
    if (
      !Settings.CROSS_REFERENCES_ENABLED ||
      !content.crossReferences ||
      !content.crossReferences.length
    ) {
      return null;
    }
    return (
      <CrossReference
        crossReferences={content.crossReferences}
        database={this.props.database}
      />
    );
  };

  renderFootnote = (content: IBiblePhrase): any => {
    if (
      !Settings.FOOTNOTES_ENABLED ||
      !content.notes ||
      !content.notes.length
    ) {
      return null;
    }
    return <Footnote notes={content.notes} />;
  };

  renderPhrase = (content: IBibleContent, index): any => {
    if (content.strongs) {
      return (
        <Fragment key={`strong-${this.itemNum}`}>
          {this.renderFootnote(content)}
          {this.renderVerseNumber(content)}
          {this.renderCrossReference(content)}
          <StrongsWord
            key={`${content.content}-${content.strongs}`}
            phrase={content.content}
            strongs={content.strongs}
            database={this.props.database}
          />
        </Fragment>
      );
    }
    return (
      <Fragment key={`phrase-${this.itemNum}`}>
        {this.renderFootnote(content)}
        {this.renderVerseNumber(content)}
        {this.renderCrossReference(content)}
        {content.content.split(' ').map((phrase, index) => (
          <View key={`phrase-${this.itemNum}-${index}`} style={styles.phrase}>
            <Text style={styles.phraseText}>{phrase}</Text>
          </View>
        ))}
      </Fragment>
    );
  };

  renderItem = (content: IBibleContent, index: number) => {
    this.itemNum += 1;
    if (!('type' in content) || content.type === 'phrase') {
      return this.renderPhrase(content, index);
    }
    const children: IBibleContent[] = content.contents;

    if (content.type === 'section') {
      return (
        <Fragment key={`section-${index}`}>
          {this.renderVerseNumber(content)}
          {this.renderSection(content)}
        </Fragment>
      );
    }
    if (content.type === 'group') {
      if (content.groupType === 'paragraph' || content.groupType === 'indent') {
        return (
          <Fragment key={`group-${index}`}>
            <View style={styles.paragraph}>
              {this.renderVerseNumber(content)}
              {children.map((child, index) => this.renderItem(child, index))}
            </View>
          </Fragment>
        );
      }
    }
    throw new Error(`Unrecognized content: ${JSON.stringify(content)}`);
    return <View />;
  };

  render() {
    if (!this.props.contents) {
      return null;
    }
    return this.renderItem(this.props.contents, this.props.index);
  }
}

const styles = StyleSheet.create({
  phrase: { ...getDebugStyles() },
  phraseText: {
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.MEDIUM,
    marginBottom: Margin.EXTRA_SMALL,
    marginRight: 7
  },
  paragraph: {
    flexDirection: 'row',
    flexWrap: 'wrap'
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
