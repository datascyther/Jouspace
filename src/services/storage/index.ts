/**
 * Storage Service
 *
 * Secure data → expo-secure-store
 * General data → AsyncStorage on native, localStorage on web
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let SecureStore: any = null;
try {
  SecureStore = require('expo-secure-store');
} catch {
  // Secure store not available
}

const OLD_PREFIX = 'neeva_';
const STORAGE_PREFIX = 'jouspace_';

class StorageService {
  private prefix(key: string): string {
    return `${STORAGE_PREFIX}${key}`;
  }

  async setSecure(key: string, value: string): Promise<void> {
    const prefixedKey = this.prefix(key);
    if (SecureStore) {
      await SecureStore.setItemAsync(prefixedKey, value);
      return;
    }
    if (Platform.OS === 'web') {
      localStorage.setItem(prefixedKey, value);
    } else {
      await AsyncStorage.setItem(prefixedKey, value);
    }
  }

  async getSecure(key: string): Promise<string | null> {
    const prefixedKey = this.prefix(key);
    if (SecureStore) {
      return SecureStore.getItemAsync(prefixedKey);
    }
    if (Platform.OS === 'web') {
      return localStorage.getItem(prefixedKey);
    }
    return AsyncStorage.getItem(prefixedKey);
  }

  async deleteSecure(key: string): Promise<void> {
    const prefixedKey = this.prefix(key);
    if (SecureStore) {
      await SecureStore.deleteItemAsync(prefixedKey);
      return;
    }
    if (Platform.OS === 'web') {
      localStorage.removeItem(prefixedKey);
    } else {
      await AsyncStorage.removeItem(prefixedKey);
    }
  }

  async set(key: string, value: string): Promise<void> {
    const prefixedKey = this.prefix(key);
    if (Platform.OS === 'web') {
      localStorage.setItem(prefixedKey, value);
      return;
    }
    await AsyncStorage.setItem(prefixedKey, value);
  }

  async get(key: string): Promise<string | null> {
    const prefixedKey = this.prefix(key);
    if (Platform.OS === 'web') {
      return localStorage.getItem(prefixedKey);
    }
    return AsyncStorage.getItem(prefixedKey);
  }

  async delete(key: string): Promise<void> {
    const prefixedKey = this.prefix(key);
    if (Platform.OS === 'web') {
      localStorage.removeItem(prefixedKey);
    } else {
      await AsyncStorage.removeItem(prefixedKey);
    }
  }

  async migrateFromOldStorage(): Promise<void> {
    if (Platform.OS === 'web') return;
    const keys = await AsyncStorage.getAllKeys();
    const oldKeys = keys.filter((key) => key.startsWith(OLD_PREFIX));
    for (const oldKey of oldKeys) {
      const unprefixed = oldKey.slice(OLD_PREFIX.length);
      const newKey = `${STORAGE_PREFIX}${unprefixed}`;
      try {
        const value = await AsyncStorage.getItem(oldKey);
        if (value !== null) {
          await AsyncStorage.setItem(newKey, value);
          await AsyncStorage.removeItem(oldKey);
        }
      } catch {
        // skip individual key failures
      }
    }
  }

  async clear(): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }
    const keys = await AsyncStorage.getAllKeys();
    const jouspaceKeys = keys.filter((key) => key.startsWith(STORAGE_PREFIX));
    if (jouspaceKeys.length > 0) {
      await AsyncStorage.multiRemove(jouspaceKeys);
    }
  }

  async setJSON<T>(key: string, value: T): Promise<void> {
    await this.set(key, JSON.stringify(value));
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setSecureJSON<T>(key: string, value: T): Promise<void> {
    await this.setSecure(key, JSON.stringify(value));
  }

  async getSecureJSON<T>(key: string): Promise<T | null> {
    const raw = await this.getSecure(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
}

export const storageService = new StorageService();
export default storageService;
