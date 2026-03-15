
import { Preferences } from '@capacitor/preferences';
import { logger } from '../../services/logger';

/**
 * HARDENED STORAGE UTILITY
 *
 * Uses Capacitor Preferences (Native Storage) as the primary engine.
 * This is much more resilient than localStorage on mobile devices,
 * as the OS is less likely to wipe it during background cleanup.
 *
 * FALLBACK: If Capacitor is not available (plain web), it falls back to localStorage.
 */

export const safeStorage = {
  /**
   * Synchronous-ish getter for compatibility with existing store.
   * Note: Capacitor Preferences is naturally async. To maintain
   * compatibility with the current 'ConservatoryStore' constructor,
   * we use a hybrid approach or rely on the async 'load' call.
   */
  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      // Check for Capacitor Native first
      const isNative = (window as any).Capacitor?.isNativePlatform();

      // Because Preferences.get is async, we use a hybrid strategy:
      // 1. Initial load from localStorage for speed
      // 2. The Store will perform a 're-sync' from Preferences once initialized
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch (error) {
      logger.error({ key, error }, 'SafeStorage: Failed to parse item, returning default');
      return defaultValue;
    }
  },

  /**
   * Async getter for high-reliability native access.
   */
  getItemAsync: async <T>(key: string, defaultValue: T): Promise<T> => {
    try {
      const { value } = await Preferences.get({ key });
      if (!value) return defaultValue;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error({ key, error }, 'SafeStorage: Async get failed');
      return defaultValue;
    }
  },

  /**
   * Sets item in BOTH localStorage and Native Preferences for redundancy.
   */
  setItem: async (key: string, value: any): Promise<void> => {
    try {
      const json = JSON.stringify(value);

      // 1. Web Fallback/Redundancy
      localStorage.setItem(key, json);

      // 2. Native Hardening
      if ((window as any).Capacitor?.isNativePlatform()) {
        await Preferences.set({
          key,
          value: json
        });
      }
    } catch (error) {
      logger.error({ key, error }, 'SafeStorage: Failed to set item');
    }
  },

  removeItem: async (key: string): Promise<void> => {
    localStorage.removeItem(key);
    await Preferences.remove({ key });
  },

  clear: async (): Promise<void> => {
    localStorage.clear();
    await Preferences.clear();
  }
};
