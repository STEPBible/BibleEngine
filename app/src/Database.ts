import * as Expo from 'expo';

export default class Database {
  public static async load(databaseModule: any) {
    const sqliteDirectory = `${Expo.FileSystem.documentDirectory}SQLite`;
    const { exists, isDirectory } = await Expo.FileSystem.getInfoAsync(
      sqliteDirectory
    );
    if (!exists) {
      await Expo.FileSystem.makeDirectoryAsync(sqliteDirectory);
    } else if (!isDirectory) {
      throw new Error('SQLite dir is not a directory');
    }

    const pathToDownloadTo = `${sqliteDirectory}/bibles.db`;

    const { exists: fileExists } = await Expo.FileSystem.getInfoAsync(
      pathToDownloadTo
    );
    if (!fileExists) {
      const uriToDownload = Expo.Asset.fromModule(databaseModule).uri;
      await Expo.FileSystem.downloadAsync(uriToDownload, pathToDownloadTo);
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
