import React from 'react';
import { Text, View, StyleSheet, ScrollView, Dimensions } from 'react-native';

import { IBibleContent, IBibleOutputRich } from '@bible-engine/core';
import Colors from './Colors';
import StrongsWord from './StrongsWord';

interface State {
  content: IBibleContent[];
}

interface Props {
  content: IBibleOutputRich[];
}

export default class ReadingView extends React.PureComponent<Props, State> {
  renderItem = (content: IBibleContent): any => {
    if (content.type === 'phrase') {
      if (content.strongs) {
        return (
          <StrongsWord phrase={content.content} strongs={content.strongs} />
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
    flex: 1
  },
  phrase: {
    marginBottom: 12,
    marginRight: 7
  },
  phraseText: {
    fontFamily: 'cardo',
    fontSize: 22
  },
  section: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 20,
    marginRight: 20
  },
  strongsPhraseText: {
    color: Colors.tyndaleBlue,
    fontFamily: 'cardo',
    fontSize: 22
  },
  title: {
    fontFamily: 'open-sans-semibold',
    fontSize: 19,
    marginBottom: 14,
    width: Dimensions.get('window').width
  }
});
