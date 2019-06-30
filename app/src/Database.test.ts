import { checkInternetConnection } from 'react-native-offline';
import * as Expo from 'expo';
import Database from './Database';
import * as store from 'react-native-simple-store';

const EXISTING_HASH = '1';
const NEW_HASH = '2';

describe('Database setup', () => {
  test('if file exists and hash hasnt changed, then db is available', async () => {
    Expo.FileSystem.getInfoAsync = jest.fn(() => {
      return { exists: true };
    });
    Expo.Asset.fromModule = jest.fn(() => {
      return { hash: null };
    });
    // Had trouble mocking this, so by default it returns null
    store.get = jest.fn(() => null);
    const available = await new Database().databaseIsAvailable(null);
    expect(available).toBe(true);
  });
  test('if file does not exist, then db is NOT available', async () => {
    Expo.FileSystem.getInfoAsync = jest.fn(() => {
      return { exists: false };
    });
    Expo.Asset.fromModule = jest.fn(() => {
      return { hash: EXISTING_HASH };
    });
    store.get = jest.fn(() => EXISTING_HASH);
    const available = await new Database().databaseIsAvailable(null);
    expect(available).toBe(false);
  });
  test('if hash has changed, then db is NOT available', async () => {
    Expo.FileSystem.getInfoAsync = jest.fn(() => {
      return { exists: false };
    });
    Expo.Asset.fromModule = jest.fn(() => {
      return { hash: NEW_HASH };
    });
    store.get = jest.fn(() => EXISTING_HASH);
    const available = await new Database().databaseIsAvailable(null);
    expect(available).toBe(false);
  });
});
