import * as React from 'react'
import { useKeepAwake } from 'expo-keep-awake'
import { createAppContainer } from 'react-navigation'
import { createStackNavigator } from 'react-navigation-stack'

import HomeScreen from './HomeScreen'
import { GlobalContextProvider } from './GlobalContext'
import BookScreen from './BookScreen'
import VersionScreen from './VersionScreen'

export default function App() {
  useKeepAwake()
  return (
    <GlobalContextProvider>
      <AppContainer />
    </GlobalContextProvider>
  )
}

const AppNavigator = createStackNavigator(
  {
    Home: {
      screen: HomeScreen,
    },
    Books: {
      screen: BookScreen,
    },
    Versions: {
      screen: VersionScreen,
    },
  },
  {
    defaultNavigationOptions: {
      headerTintColor: 'black',
    },
    mode: 'modal',
  }
)
const AppContainer = createAppContainer(AppNavigator)
