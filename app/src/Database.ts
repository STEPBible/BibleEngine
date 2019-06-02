import * as Expo from 'expo';
import store from 'react-native-simple-store';

export default class Database {
  public static async load(databaseModule: any) {
    const sqliteDirectory = `${Expo.FileSystem.documentDirectory}SQLite`;
    const { exists } = await Expo.FileSystem.getInfoAsync(sqliteDirectory);
    if (!exists) {
      await Expo.FileSystem.makeDirectoryAsync(sqliteDirectory);
    }

    const pathToDownloadTo = `${sqliteDirectory}/bibles.db`;

    const { hash: incomingHash, uri: uriToDownload } = Expo.Asset.fromModule(
      databaseModule
    );

    const { exists: fileExists } = await Expo.FileSystem.getInfoAsync(
      pathToDownloadTo
    );
    const existingHash = await store.get('existingHash');
    if (!fileExists || incomingHash !== existingHash) {
      console.log('Updating database...');
      await Expo.FileSystem.deleteAsync(pathToDownloadTo, { idempotent: true });
      await Expo.FileSystem.downloadAsync(uriToDownload, pathToDownloadTo);
      store.save('existingHash', incomingHash);
    }

    const expoDatabase = await Expo.SQLite.openDatabase('bibles.db');
    return expoDatabase;
  }

  public static async executeSql(database, sql, params = []) {
    return new Promise((resolve, reject) =>
      database.transaction(tx => {
        tx.executeSql(
          sql,
          params,
          (_, { rows: { _array } }) => resolve(_array),
          (_, error) => reject(error)
        );
      })
    );
  }
}
