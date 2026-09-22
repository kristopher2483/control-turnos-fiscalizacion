import { env } from '../config/env';
import { DataStore } from './storage.interface';
import { LocalJsonStore } from './local-json.store';
import { GoogleDriveStore } from './google-drive.store';

let cachedStore: DataStore | null = null;

export function createDataStore(): DataStore {
  if (cachedStore) {
    return cachedStore;
  }

  if (env.storageProvider === 'drive') {
    cachedStore = new GoogleDriveStore({
      credentialsPath: env.googleApplicationCredentials,
      rootFolderName: env.googleDriveRootFolderName
    });
  } else {
    cachedStore = new LocalJsonStore();
  }

  return cachedStore;
}
