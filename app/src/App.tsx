import * as React from 'react'
import { useKeepAwake } from 'expo-keep-awake'
import { createAppContainer } from 'react-navigation'
import { createStackNavigator } from 'react-navigation-stack'
import { SafeAreaProvider } from 'react-native-safe-area-view'
import { StatusBar } from 'react-native'
import { Provider as PaperProvider, DarkTheme } from 'react-native-paper'

import HomeScreen from './HomeScreen'
import ReadingScreen from './ReadingScreen'
import BookScreen from './BookScreen'
import VersionScreen from './VersionScreen'
import SearchScreen from './SearchScreen'
import OnboardingScreen from './OnboardingScreen'
import OfflineLoadingScreen from './OfflineLoadingScreen'
import OfflineSuccessScreen from './OfflineSuccessScreen'
import { GlobalContextProvider } from './GlobalContext'

export default function App() {
  try {
    useKeepAwake()
  } catch (e) {}
  return (
    <SafeAreaProvider>
      <PaperProvider theme={DarkTheme}>
        <GlobalContextProvider>
          <StatusBar hidden={true} />
          <AppContainer />
        </GlobalContextProvider>
      </PaperProvider>
    </SafeAreaProvider>
  )
}

const AppStack = createStackNavigator(
  {
    Home: {
      screen: ReadingScreen,
      navigationOptions: {
        header: null,
      },
    },
    Search: SearchScreen,
    Books: BookScreen,
    Versions: VersionScreen,
    Onboarding: OnboardingScreen,
    OfflineLoading: OfflineLoadingScreen,
    OfflineSuccess: OfflineSuccessScreen,
  },
  {
    defaultNavigationOptions: {
      headerTintColor: 'black',
    },
    mode: 'modal',
  }
)

const AppContainer = createAppContainer(AppStack)
