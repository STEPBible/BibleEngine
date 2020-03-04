import React from 'react'
import { observer } from 'mobx-react/native'
import { Dimensions, View, Text, StyleSheet, Linking } from 'react-native'
import { TouchableRipple, Button } from 'react-native-paper'
import { FontSize, Margin } from './Constants'
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
          container: styles.sheet,
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
              style={styles.sheet__fonts__decrease}
            >
              <Text style={styles.sheet__fonts__decrease__text}>A -</Text>
            </TouchableRipple>
            <TouchableRipple
              onPress={bibleStore.increaseFontSize}
              style={styles.sheet__fonts__increase}
            >
              <Text style={styles.sheet__fonts__increase__text}>A +</Text>
            </TouchableRipple>
          </View>
          <Button
            style={styles.sheet__feedback}
            onPress={this.openFeedbackEmail}
            icon="comment-alert"
            mode="text"
            color="black"
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
    backgroundColor: '#FBFBFB',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderColor: '#ebebeb',
    borderWidth: 2,
    elevation: 20,
    flex: 1,
    paddingTop: 8,
    maxHeight: Math.ceil(DEVICE_HEIGHT / 2.5),
    width: DEVICE_WIDTH,
  },
  sheet__fonts: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Margin.SMALL,
  },
  sheet__fonts__decrease: {
    alignItems: 'center',
    backgroundColor: '#DAD9D9',
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
    backgroundColor: '#DAD9D9',
    borderRadius: 4,
    justifyContent: 'center',
    marginLeft: Margin.EXTRA_SMALL,
    width: 100,
    height: 70,
  },
  sheet__fonts__increase__text: {
    fontSize: FontSize.EXTRA_LARGE,
  },
  sheet__feedback: {
    marginTop: Margin.LARGE * 2,
  },
})
