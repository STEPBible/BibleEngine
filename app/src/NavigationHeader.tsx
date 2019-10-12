import React from 'react'
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native'
import { withNavigation } from 'react-navigation'

interface Props {
  navigation: any
}

class NavigationHeader extends React.Component<Props, {}> {
  render() {
    return (
      <View style={styles.header}>
        <View style={styles.header__chips}>
          <TouchableOpacity
            onPress={() => this.props.navigation.navigate('Books')}
            style={styles.header__chips__book}
          >
            <Text style={styles.header__chips__book__text}>Genesis 1</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => this.props.navigation.navigate('Versions')}
            style={styles.header__chips__version}
          >
            <Text style={styles.header__chips__version__text}>ESV</Text>
          </TouchableOpacity>
        </View>
      </View>
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
})

export default withNavigation(NavigationHeader)
