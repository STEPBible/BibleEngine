import React from 'react'
import {
  FlatList,
  Animated,
  Dimensions,
  View,
  StyleSheet,
  StatusBar,
} from 'react-native'
import { IBibleContent, IBiblePhrase } from '@bible-engine/core'
import { withCollapsible } from 'react-navigation-collapsible'
import hoistNonReactStatics from 'hoist-non-react-statics'

import {
  Margin,
  FontSize,
  Settings,
  getDebugStyles,
  FontFamily,
  STATUS_BAR_HEIGHT,
  NAV_BAR_HEIGHT,
} from './Constants'
import { ifAndroid, ifIphoneX } from './utils'
import NavigationHeader from './NavigationHeader'
import StrongsWord from './StrongsWord'
import CrossReference from './CrossReference'
import Footnote from './Footnote'
import { withGlobalContext } from './GlobalContext'
import Text from './Text'
import LoadingScreen from './LoadingScreen'
import NetworkErrorScreen from './NetworkErrorScreen'

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

class HomeScreen extends React.Component<any, any> {
  static navigationOptions = {
    headerTitle: <NavigationHeader />,
    headerStyle: {
      height: NAV_BAR_HEIGHT - STATUS_BAR_HEIGHT,
    },
  }
  itemNum = 0
  renderItem = (content: any, index: number): any => {
    this.itemNum += 1
    if (content.item) {
      content = content.item
    }
    if (!('type' in content) || content.type === 'phrase') {
      return this.renderPhrase(content, index)
    }
    const children: IBibleContent[] = content.contents

    if (content.type === 'section') {
      return <View key={`section-${index}`}>{this.renderSection(content)}</View>
    }
    if (content.type === 'group') {
      if (content.groupType === 'paragraph' || content.groupType === 'indent') {
        return (
          <View key={`group-${index}`}>
            <View style={styles.paragraph}>
              {this.renderVerseNumber(content)}
              {children.map((child, index) => this.renderItem(child, index))}
            </View>
          </View>
        )
      }
    }
  }

  renderSection = (content: any): any => {
    const children: IBibleContent[] = content.contents
    return (
      <View style={styles.section}>
        <Text style={styles.title}>{content.title}</Text>
        {children.map((child, index) => this.renderItem(child, index))}
      </View>
    )
  }

  renderVerseNumber = (content: any): any => {
    if (content.numbering) {
      return (
        <Text style={styles.verseNumber}>
          {content.numbering.versionVerseIsStarting}
        </Text>
      )
    }
    return null
  }

  renderCrossReference = (content: any): any => {
    return null
    if (
      !Settings.CROSS_REFERENCES_ENABLED ||
      !content.crossReferences ||
      !content.crossReferences.length
    ) {
      return null
    }
    return (
      <CrossReference
        crossReferences={content.crossReferences}
        database={this.props.database}
      />
    )
  }

  renderFootnote = (content: IBiblePhrase): any => {
    if (
      !Settings.FOOTNOTES_ENABLED ||
      !content.notes ||
      !content.notes.length
    ) {
      return null
    }
    return <Footnote notes={content.notes} />
  }

  renderPhrase = (content: any, index): any => {
    if (content.strongs) {
      return (
        <View style={styles.phrase} key={`strong-${this.itemNum}`}>
          {this.renderFootnote(content)}
          {this.renderVerseNumber(content)}
          {this.renderCrossReference(content)}
          <StrongsWord
            key={`${content.content}-${content.strongs}`}
            phrase={content.content}
            strongs={content.strongs}
          />
        </View>
      )
    }
    return (
      <View style={styles.phrase} key={`phrase-${this.itemNum}`}>
        {this.renderFootnote(content)}
        {this.renderVerseNumber(content)}
        {this.renderCrossReference(content)}
        {content.content.split(' ').map((phrase, index) => (
          <View key={`phrase-${this.itemNum}-${index}`}>
            <Text style={styles.phraseText}>{phrase}</Text>
          </View>
        ))}
      </View>
    )
  }

  renderFlatlistItem = ({ item, index }) => {
    return this.renderItem(item, index)
  }

  render() {
    if (
      this.props.global.isConnected === false &&
      this.props.global.bibleVersions.length === 0 &&
      this.props.global.loading === false
    ) {
      return <NetworkErrorScreen />
    }
    if (this.props.global.loading) {
      return <LoadingScreen />
    }
    const { paddingHeight, animatedY, onScroll } = this.props.collapsible
    return (
      <React.Fragment>
        <AnimatedFlatList
          data={this.props.global.chapterContent}
          renderItem={this.renderItem}
          bounces={false}
          keyExtractor={(item, index) => `flatlist-item-${index}`}
          contentContainerStyle={{
            paddingTop: paddingHeight + STATUS_BAR_HEIGHT,
          }}
          scrollIndicatorInsets={{ top: paddingHeight }}
          onScroll={onScroll}
          _mustAddThis={animatedY}
          showsVerticalScrollIndicator={false}
        />
      </React.Fragment>
    )
  }
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header__chips: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  header__chips__book: {
    backgroundColor: '#EAEAEA',
    alignItems: 'center',
    margin: 0,
    borderRadius: 4,
  },
  header__chips__book__text: {
    margin: 8,
  },
  header__chips__version: {
    backgroundColor: '#EAEAEA',
    alignItems: 'center',
    marginLeft: 10,
    borderRadius: 4,
  },
  header__chips__version__text: {
    margin: 8,
  },
  background: {
    backgroundColor: 'white',
    flex: 1,
  },
  chapterHeader: {
    fontSize: FontSize.EXTRA_LARGE,
    fontFamily: FontFamily.OPEN_SANS_LIGHT,
    marginTop: ifAndroid(-55, ifIphoneX(-30, -55)),
    marginBottom: Margin.LARGE,
    textAlign: 'center',
    ...getDebugStyles(),
  },
  phrase: { flexDirection: 'row', ...getDebugStyles() },
  phraseText: {
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.MEDIUM,
    marginBottom: Margin.EXTRA_SMALL,
    marginRight: 7,
  },
  paragraph: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  section: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: Margin.LARGE,
    marginRight: Margin.LARGE,
    ...getDebugStyles(),
  },
  title: {
    fontFamily: FontFamily.OPEN_SANS_SEMIBOLD,
    fontSize: FontSize.MEDIUM * 0.8,
    marginBottom: Margin.SMALL,
    marginTop: Margin.SMALL,
    width: Dimensions.get('window').width - Margin.LARGE * 2,
    ...getDebugStyles(),
  },
  verseNumber: {
    color: 'black',
    fontSize: FontSize.EXTRA_SMALL,
    fontFamily: FontFamily.OPEN_SANS_SEMIBOLD,
    marginRight: 3,
    marginTop: -2,
    ...getDebugStyles(),
  },
  footer: {
    flex: 1,
    margin: Margin.LARGE,
    marginBottom: Margin.LARGE * 2,
  },
})

export default hoistNonReactStatics(
  withCollapsible(withGlobalContext(HomeScreen), {
    iOSCollapsedColor: 'white',
  }),
  HomeScreen
)
