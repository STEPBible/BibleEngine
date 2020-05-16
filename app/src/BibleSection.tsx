import React from 'react'
import { Text, StyleSheet, View, Dimensions } from 'react-native'
import { FontFamily, FontSize, Color, Margin } from './Constants'
import { observer } from 'mobx-react/native'
import bibleStore from './BibleStore'
import StrongsWord from './StrongsWord'
import unicodeMapping from './unicode_superscript_mapping.json'

@observer
export default class BibleSection extends React.Component<any, any> {
  sectionTitle = (title, index) => (
    <Text
      style={bibleStore.scaledFontSize(styles.page__section__title)}
      key={`title-${index}`}
    >
      {title}
    </Text>
  )

  renderItem = (item, index) => {
    if (!('type' in item)) {
      return (
        <React.Fragment key={`item-${index}`}>
          {this.verseNumber(item, index)}
          {this.phrase(item, index)}
        </React.Fragment>
      )
    }
    if (item.type === 'group') {
      if (item.groupType === 'paragraph') {
        return this.paragraph(item, index)
      }
      if (item.groupType === 'indent') {
        return this.indentedGroup(item, index)
      }
    }
    return this.mappedContents(item, index)
  }

  phrase = (item, index) => {
    if ('strongs' in item) {
      return (
        <StrongsWord
          onWordPress={this.props.onWordPress}
          item={item}
          index={index}
        />
      )
    }
    return (
      <Text
        style={bibleStore.scaledFontSize(styles.page__phrase)}
        key={`phrase-${index}`}
      >{`${item.content} `}</Text>
    )
  }

  paragraph = (item, index) => (
    <React.Fragment key={`paragraph-${index}`}>
      {this.lineBreak(index)}
      {this.verseNumber(item, index)}
      {this.mappedContents(item, index)}
    </React.Fragment>
  )

  indentedGroup = (item, index) => (
    <React.Fragment key={`indent-${index}`}>
      {this.lineBreak(index)}
      <Text style={bibleStore.scaledFontSize(styles.page__phrase)}>
        {'\t\t\t'}
      </Text>
      {this.verseNumber(item, index)}
      {this.mappedContents(item, index)}
    </React.Fragment>
  )

  mappedContents = (item, index, multiplier = 100) =>
    item.contents.map((content, innerIndex) =>
      this.renderItem(content, index + innerIndex * multiplier)
    )

  verseNumber = (item, index) => {
    if (!('numbering' in item)) return
    const verseNum = item?.numbering?.normalizedVerseIsStarting
    return this.verseNumberText(verseNum, index)
  }

  verseNumberText = (verseNum, index) => (
    <Text
      style={bibleStore.scaledFontSize(styles.page__verseNum)}
      key={`verse-num-${verseNum}-${index}`}
    >
      {`${this.getSuperscriptOfWord(verseNum)} `}
    </Text>
  )

  getSuperscriptOfWord(input: number | string) {
    return String(input).split('').map(character => unicodeMapping[character]).join('')
  }

  lineBreak = index => (
    <Text
      key={`line-break-${index}`}
      style={bibleStore.scaledFontSize(styles.page__break)}
    >
      {'\n'}
    </Text>
  )

  render() {
    return (
      <Text style={bibleStore.scaledFontSize(styles.page__section)} selectable>
        {this.sectionTitle(this.props.section.title, 0)}
        {this.mappedContents(this.props.section, 0)}
      </Text>
    )
  }
}

const LINE_HEIGHT = 27
const DEVICE_WIDTH = Dimensions.get('window').width

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  page__container: {
    paddingTop: Margin.MEDIUM,
  },
  page__section: {
    fontSize: FontSize.SMALL,
    paddingLeft: Margin.LARGE,
    paddingRight: Margin.LARGE,
    paddingBottom: Margin.SMALL,
  },
  page__section__title: {
    fontFamily: FontFamily.OPEN_SANS_SEMIBOLD,
    fontSize: FontSize.EXTRA_SMALL,
    lineHeight: LINE_HEIGHT,
  },
  page__break: {
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.SMALL,
    lineHeight: LINE_HEIGHT,
  },
  page__phrase: {
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.SMALL,
    lineHeight: LINE_HEIGHT,
  },
  page__strongs: {
    fontFamily: FontFamily.CARDO,
    fontSize: FontSize.SMALL,
    color: Color.TYNDALE_BLUE,
    lineHeight: LINE_HEIGHT,
  },
  page__verseNumberMarkerForSearch: {
    height: 10,
    width: 0,
  },
  page__verseNum: {
    fontFamily: FontFamily.OPEN_SANS_SEMIBOLD,
    fontSize: FontSize.SMALL,
    lineHeight: LINE_HEIGHT,
  },
  page__popover: {
    overflow: 'hidden',
    width: DEVICE_WIDTH - 20,
  },
  page__footer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
})
