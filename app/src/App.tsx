import * as React from 'react'
import { createAppContainer } from 'react-navigation'
import { createStackNavigator } from 'react-navigation-stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar, Appearance } from 'react-native'
import {
  Provider as PaperProvider,
  DarkTheme as PaperDark,
  DefaultTheme as PaperDefault,
} from 'react-native-paper'
import { observer } from 'mobx-react/native'

import bibleStore from './BibleStore'
import HomeScreen from './HomeScreen'
import BookScreen from './BookScreen'
import VersionScreen from './VersionScreen'
import SearchScreen from './SearchScreen'
import OnboardingScreen from './OnboardingScreen'
import OfflineLoadingScreen from './OfflineLoadingScreen'
import OfflineSuccessScreen from './OfflineSuccessScreen'
import { GlobalContextProvider } from './GlobalContext'

const DefaultTheme = {
  ...PaperDefault,
  roundness: 2,
  colors: {
    ...PaperDefault.colors,
    primary: 'black',
    text: 'black',
    accent: '#F9F9F9',
  },
}
const DarkTheme = {
  ...PaperDark,
  roundness: 2,
  colors: {
    ...PaperDark.colors,
    primary: 'white',
    text: 'white',
    accent: '#333333',
  },
}

@observer
class App extends React.Component<any, any> {
  async componentDidMount() {
    bibleStore.setIsDarkTheme()
    // update isDarkTheme when system color scheme changes
    Appearance.addChangeListener(() => bibleStore.setIsDarkTheme())
  }
  render() {
    return (
      <SafeAreaProvider>
        <GlobalContextProvider>
          <PaperProvider
            theme={bibleStore.isDarkTheme ? DarkTheme : DefaultTheme}
          >
            <StatusBar hidden={true} />
            <AppContainer theme={bibleStore.isDarkTheme ? 'dark' : 'light'} />
          </PaperProvider>
        </GlobalContextProvider>
      </SafeAreaProvider>
    )
  }
}

export default App

const AppStack = createStackNavigator(
  {
    Home: HomeScreen,
    Search: SearchScreen,
    Books: BookScreen,
    Versions: VersionScreen,
    Onboarding: OnboardingScreen,
    OfflineLoading: OfflineLoadingScreen,
    OfflineSuccess: OfflineSuccessScreen,
  },
  {
    mode: 'modal',
  }
)

const AppContainer = createAppContainer(AppStack)
