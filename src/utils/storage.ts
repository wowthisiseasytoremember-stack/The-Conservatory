
import { logger } from '../../services/logger';

export const safeStorage = {
  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch (error) {
      logger.error({ key, error }, 'SafeStorage: Failed to parse item, returning default');
      return defaultValue;
    }
  },

  setItem: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      logger.error({ key, error }, 'SafeStorage: Failed to set item');
    }
  },

  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  }
};
