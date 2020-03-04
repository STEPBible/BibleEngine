import * as FileSystem from 'expo-file-system'
import { Asset } from 'expo-asset'

export default class JsonAsset {
  module: any
  json: any

  constructor(module: string, json: string) {
    this.module = module
    this.json = json
  }

  static async init(module: any, cacheFilename: string) {
    console.time(`JSON file initialization: ${cacheFilename}`)
    const remoteUri = Asset.fromModule(module).uri
    const fileUri = `${FileSystem.documentDirectory}/${cacheFilename}`
    const { exists } = await FileSystem.getInfoAsync(fileUri)
    if (!exists) {
      await FileSystem.downloadAsync(remoteUri, fileUri)
    }
    const text = await FileSystem.readAsStringAsync(fileUri)
    const json = JSON.parse(text)
    console.timeEnd(`JSON file initialization: ${cacheFilename}`)
    return new JsonAsset(module, json)
  }
}
