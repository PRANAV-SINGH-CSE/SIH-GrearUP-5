import { IStorageProvider } from './storage.interface';
import { LocalStorageProvider } from './local-storage.provider';

let storageInstance: IStorageProvider | null = null;

export function getStorageProvider(): IStorageProvider {
  if (storageInstance) {
    return storageInstance;
  }
  // Default to local storage provider
  storageInstance = new LocalStorageProvider();
  return storageInstance;
}
