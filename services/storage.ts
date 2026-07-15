import { openDB, type IDBPDatabase } from 'idb';
import type { Settings, SessionData, RecognitionHistory } from '@/lib/types';
import { defaultSettings, mergeSettings } from '@/lib/config';
import { DEFAULT_SETTINGS_KEY, DEFAULT_RECOGNITION_HISTORY_KEY } from '@/lib/constants';
import { logger } from './logger';

const DB_NAME = 'airwriter-db';
const DB_VERSION = 1;

class StorageService {
  private db: IDBPDatabase | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings');
          }
          if (!db.objectStoreNames.contains('history')) {
            const store = db.createObjectStore('history', {
              keyPath: 'id',
            });
            store.createIndex('timestamp', 'timestamp');
          }
          if (!db.objectStoreNames.contains('sessions')) {
            const store = db.createObjectStore('sessions', {
              keyPath: 'id',
            });
            store.createIndex('startTime', 'startTime');
          }
          if (!db.objectStoreNames.contains('strokes')) {
            db.createObjectStore('strokes', { keyPath: 'id' });
          }
        },
      });
      this.isInitialized = true;
      logger.info('Storage service initialized');
    } catch (error) {
      logger.warn('IndexedDB not available, using localStorage fallback', error);
      this.isInitialized = true;
    }
  }

  async saveSettings(settings: Settings): Promise<void> {
    try {
      if (this.db) {
        await this.db.put('settings', settings, DEFAULT_SETTINGS_KEY);
      } else {
        localStorage.setItem(DEFAULT_SETTINGS_KEY, JSON.stringify(settings));
      }
    } catch (error) {
      logger.error('Failed to save settings', error);
    }
  }

  async loadSettings(): Promise<Settings> {
    try {
      if (this.db) {
        const saved = await this.db.get('settings', DEFAULT_SETTINGS_KEY);
        return mergeSettings(saved as Partial<Settings> | null);
      }
      const saved = localStorage.getItem(DEFAULT_SETTINGS_KEY);
      return mergeSettings(saved ? JSON.parse(saved) : null);
    } catch {
      return { ...defaultSettings };
    }
  }

  async saveHistory(entry: RecognitionHistory): Promise<void> {
    try {
      if (this.db) {
        await this.db.put('history', entry);
      } else {
        const history = this.getHistorySync();
        history.push(entry);
        localStorage.setItem(DEFAULT_RECOGNITION_HISTORY_KEY, JSON.stringify(history));
      }
    } catch (error) {
      logger.error('Failed to save history', error);
    }
  }

  async getHistory(): Promise<RecognitionHistory[]> {
    try {
      if (this.db) {
        const entries = await this.db.getAll('history');
        return entries.sort((a, b) => b.timestamp - a.timestamp);
      }
      return this.getHistorySync();
    } catch {
      return [];
    }
  }

  async clearHistory(): Promise<void> {
    try {
      if (this.db) {
        await this.db.clear('history');
      } else {
        localStorage.removeItem(DEFAULT_RECOGNITION_HISTORY_KEY);
      }
    } catch (error) {
      logger.error('Failed to clear history', error);
    }
  }

  async saveSession(session: SessionData): Promise<void> {
    try {
      if (this.db) {
        await this.db.put('sessions', session);
      }
    } catch (error) {
      logger.error('Failed to save session', error);
    }
  }

  async getSessions(): Promise<SessionData[]> {
    try {
      if (this.db) {
        return await this.db.getAll('sessions');
      }
      return [];
    } catch {
      return [];
    }
  }

  async deleteSession(id: string): Promise<void> {
    try {
      if (this.db) {
        await this.db.delete('sessions', id);
      }
    } catch (error) {
      logger.error('Failed to delete session', error);
    }
  }

  private getHistorySync(): RecognitionHistory[] {
    try {
      const data = localStorage.getItem(DEFAULT_RECOGNITION_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  async clearAll(): Promise<void> {
    try {
      if (this.db) {
        await this.db.clear('settings');
        await this.db.clear('history');
        await this.db.clear('sessions');
        await this.db.clear('strokes');
      }
      localStorage.clear();
      logger.info('All storage cleared');
    } catch (error) {
      logger.error('Failed to clear storage', error);
    }
  }

  isAvailable(): boolean {
    return this.isInitialized;
  }

  cleanup(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.isInitialized = false;
  }
}

export const storageService = new StorageService();
