import React from 'react'
import { observer } from 'mobx-react/native'
import { Button, Text, TouchableRipple } from 'react-native-paper'
import { Dimensions, Linking, StyleSheet, View } from 'react-native'
import { FontSize, Margin, Theme } from './Constants'
import bibleStore from './BibleStore'
import BottomSheet from 'react-native-raw-bottom-sheet'

const DEVICE_HEIGHT = Dimensions.get('window').height
const DEVICE_WIDTH = Dimensions.get('window').width

@observer
export default class QuickSettings extends React.Component<{}, {}> {
  settingsRef = React.createRef()

  componentDidMount() {
    bibleStore.setSettingsRef(this.settingsRef)
  }

  onClose() {
    bibleStore.showSettings = false
  }

  openFeedbackEmail() {
    const EMAIL = 'TyndaleSTEP@gmail.com'
    const SUBJECT = 'STEP Bible App Feedback'
    const BODY = ''
    Linking.openURL(`mailto:${EMAIL}?subject=${SUBJECT}&body=${BODY}`)
  }

  render() {
    return (
      <BottomSheet
        closeOnDragDown={true}
        closeOnPressMask={true}
        ref={this.settingsRef}
        customStyles={{
          container: Object.assign({}, styles.sheet, {
            backgroundColor: bibleStore.isDarkTheme ? '#333333' : '#FBFBFB',
            borderColor: bibleStore.isDarkTheme ? '#333333' : '#EBEBEB',
          }),
          wrapper: {
            backgroundColor: 'transparent',
          },
        }}
        animationType="slide"
      >
        <View style={styles.container}>
          <View style={styles.sheet__fonts}>
            <TouchableRipple
              onPress={bibleStore.decreaseFontSize}
              style={Object.assign({}, styles.sheet__fonts__decrease, {
                backgroundColor: bibleStore.isDarkTheme ? '#222222' : '#DAD9D9',
              })}
            >
              <Text style={styles.sheet__fonts__decrease__text}>A -</Text>
            </TouchableRipple>
            <TouchableRipple
              onPress={bibleStore.increaseFontSize}
              style={Object.assign({}, styles.sheet__fonts__increase, {
                backgroundColor: bibleStore.isDarkTheme ? '#222222' : '#DAD9D9',
              })}
            >
              <Text style={styles.sheet__fonts__increase__text}>A +</Text>
            </TouchableRipple>
          </View>
          <Text style={styles.sheet__theme}>THEME</Text>
          <View style={styles.sheet__fonts}>
            <Button
              style={styles.sheet__theme__buttons}
              onPress={() => bibleStore.setTheme(Theme.AUTO)}
              mode={bibleStore.theme === Theme.AUTO ? 'contained' : 'outlined'}
            >
              Auto
            </Button>
            <Button
              style={styles.sheet__theme__buttons}
              onPress={() => bibleStore.setTheme(Theme.LIGHT)}
              mode={bibleStore.theme === Theme.LIGHT ? 'contained' : 'outlined'}
            >
              Light
            </Button>
            <Button
              style={styles.sheet__theme__buttons}
              onPress={() => bibleStore.setTheme(Theme.DARK)}
              mode={bibleStore.theme === Theme.DARK ? 'contained' : 'outlined'}
            >
              Dark
            </Button>
          </View>
          <Button
            style={styles.sheet__feedback}
            onPress={this.openFeedbackEmail}
            icon="comment-alert"
            mode="text"
          >
            Send Feedback
          </Button>
        </View>
      </BottomSheet>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  sheet: {
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 2,
    elevation: 20,
    flex: 1,
    paddingTop: 8,
    maxHeight: Math.ceil(DEVICE_HEIGHT / 2.4),
    width: DEVICE_WIDTH,
  },
  sheet__fonts: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Margin.SMALL,
  },
  sheet__fonts__decrease: {
    alignItems: 'center',
    borderRadius: 4,
    justifyContent: 'center',
    marginRight: Margin.EXTRA_SMALL,
    width: 100,
    height: 70,
  },
  sheet__fonts__decrease__text: {
    fontSize: FontSize.LARGE,
  },
  sheet__fonts__increase: {
    alignItems: 'center',
    borderRadius: 4,
    justifyContent: 'center',
    marginLeft: Margin.EXTRA_SMALL,
    width: 100,
    height: 70,
  },
  sheet__fonts__increase__text: {
    fontSize: FontSize.EXTRA_LARGE,
  },
  sheet__theme: {
    marginTop: Margin.LARGE * 1.5,
    marginBottom: 0,
  },
  sheet__theme__buttons: {
    borderRadius: 0,
  },
  sheet__feedback: {
    marginTop: Margin.LARGE * 1.5,
  },
})
