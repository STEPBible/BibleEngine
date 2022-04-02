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
    const asset = Asset.fromModule(module)
    const fileUri = `${FileSystem.documentDirectory}/${cacheFilename}`
    const { exists } = await FileSystem.getInfoAsync(fileUri)
    if (!exists) {
      if (asset.uri.includes('file://')) {
        await FileSystem.copyAsync({
          from: asset.uri,
          to: fileUri,
        })
      } else {
        await FileSystem.downloadAsync(
          asset.uri,
          fileUri,
        )
      }
    }
    const text = await FileSystem.readAsStringAsync(fileUri)
    const json = JSON.parse(text)
    console.timeEnd(`JSON file initialization: ${cacheFilename}`)
    return new JsonAsset(module, json)
  }
}
