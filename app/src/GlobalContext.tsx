import React from 'react'
import 'react-native-console-time-polyfill'
import { StatusBar } from 'react-native'

const GlobalContext = React.createContext({})

export class GlobalContextProvider extends React.Component<{}, {}> {
  render() {
    return (
      <GlobalContext.Provider
        value={{
          ...this.state,
        }}
      >
        {this.props.children}
      </GlobalContext.Provider>
    )
  }
}
