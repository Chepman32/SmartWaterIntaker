import { MMKV } from 'react-native-mmkv';
import {
  UserProfile,
  Settings,
  IntakeEvent,
  Container,
  DailyGoal,
} from '../types/models';

// MMKV storage for settings, profile
let storage: MMKV;

try {
  storage = new MMKV();
} catch (error) {
  console.warn('MMKV initialization failed, using fallback:', error);
  // Create a new instance with a different ID as fallback
  storage = new MMKV({ id: 'hydration-fallback' });
}

function getLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}

export const StorageService = {
  // Profile operations
  getProfile(): UserProfile | null {
    try {
      const profileJson = storage.getString('profile');
      return profileJson ? JSON.parse(profileJson) : null;
    } catch (error) {
      console.warn('Failed to read profile:', error);
      return null;
    }
  },

  setProfile(profile: UserProfile): void {
    try {
      storage.set('profile', JSON.stringify(profile));
    } catch (error) {
      console.warn('Failed to save profile:', error);
    }
  },

  // Settings operations
  getSettings(): Settings | null {
    try {
      const settingsJson = storage.getString('settings');
      return settingsJson ? JSON.parse(settingsJson) : null;
    } catch (error) {
      console.warn('Failed to read settings:', error);
      return null;
    }
  },

  setSettings(settings: Settings): void {
    try {
      storage.set('settings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  },

  // Migration version
  getMigrationVersion(): number {
    return storage.getNumber('migration_version') ?? 0;
  },

  setMigrationVersion(version: number): void {
    storage.set('migration_version', version);
  },

  // Temporary MMKV-only persistence for events/containers/daily goal
  getIntakeEvents(dateISO?: string): IntakeEvent[] {
    const key = dateISO ? `intake_${dateISO}` : 'intake_today';
    try {
      const json = storage.getString(key);
      return json ? JSON.parse(json) : [];
    } catch (error) {
      console.warn(`Failed to read intake events from ${key}:`, error);
      // Clear corrupted data
      try {
        storage.delete(key);
      } catch {}
      return [];
    }
  },

  // Aggregate all intake events across stored dates
  getAllIntakeEvents(): IntakeEvent[] {
    const keys = storage.getAllKeys();
    const intakeKeys = keys.filter(k => k.startsWith('intake_'));
    const all: IntakeEvent[] = [];
    for (const key of intakeKeys) {
      const json = storage.getString(key);
      if (json) {
        try {
          const arr = JSON.parse(json) as IntakeEvent[];
          for (const e of arr) all.push(e);
        } catch {}
      }
    }
    return all.sort((a, b) => b.timestamp - a.timestamp);
  },

  addIntakeEvent(event: Omit<IntakeEvent, 'id'>): IntakeEvent {
    const withId: IntakeEvent = {
      ...event,
      id: `${Date.now()}`,
    } as IntakeEvent;
    const dateISO = getLocalDateString(new Date(event.timestamp));
    const key = `intake_${dateISO}`;
    const existing = this.getIntakeEvents(dateISO);
    existing.push(withId);

    try {
      const jsonString = JSON.stringify(existing);
      storage.set(key, jsonString);
    } catch (error) {
      console.warn(`Failed to save intake event to ${key}:`, error);
      // Try to clear corrupted data and retry with just the new event
      try {
        storage.delete(key);
        storage.set(key, JSON.stringify([withId]));
      } catch (retryError) {
        console.error('Failed to save intake event after retry:', retryError);
      }
    }

    return withId;
  },

  deleteIntakeEvent(id: string, dateISO: string): void {
    const key = `intake_${dateISO}`;
    const existing = this.getIntakeEvents(dateISO);
    const filtered = existing.filter(e => e.id !== id);
    try {
      storage.set(key, JSON.stringify(filtered));
    } catch (error) {
      console.warn(`Failed to delete intake event from ${key}:`, error);
    }
  },

  getContainers(): Container[] {
    const json = storage.getString('containers');
    return json
      ? JSON.parse(json)
      : [
          {
            id: 'c1',
            name: 'Glass',
            sizeMl: 250,
            color: '#4FC3F7',
            icon: 'cup',
            favorite: false,
          },
          {
            id: 'c2',
            name: 'Bottle',
            sizeMl: 500,
            color: '#81C784',
            icon: 'bottle',
            favorite: false,
          },
          {
            id: 'c3',
            name: 'Large',
            sizeMl: 1000,
            color: '#9575CD',
            icon: 'bottle-large',
            favorite: false,
          },
        ];
  },

  addContainer(container: Omit<Container, 'id'>): Container {
    const withId: Container = {
      ...container,
      id: `${Date.now()}`,
    } as Container;
    const list = this.getContainers();
    list.push(withId);
    storage.set('containers', JSON.stringify(list));
    return withId;
  },

  updateContainer(id: string, updates: Partial<Container>): void {
    const list = this.getContainers();
    const idx = list.findIndex(c => c.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates } as Container;
      storage.set('containers', JSON.stringify(list));
    }
  },

  deleteContainer(id: string): void {
    const list = this.getContainers();
    const next = list.filter(c => c.id !== id);
    storage.set('containers', JSON.stringify(next));
  },

  getDailyGoal(): DailyGoal | null {
    const json = storage.getString('dailyGoal');
    return json ? JSON.parse(json) : null;
  },

  setDailyGoal(goal: DailyGoal): void {
    storage.set('dailyGoal', JSON.stringify(goal));
  },

  clearAll(): void {
    storage.clearAll();
  },
};

// TODO: SQLite operations for events, containers, daily goals
// This will be implemented with react-native-sqlite-storage
export const SQLiteService = {
  // Placeholder methods - will implement with actual SQLite
  async getIntakeEvents(_date?: string): Promise<IntakeEvent[]> {
    return [];
  },

  async addIntakeEvent(_event: IntakeEvent): Promise<void> {
    // TODO: INSERT INTO intake_events
  },

  async deleteIntakeEvent(_id: string): Promise<void> {
    // TODO: DELETE FROM intake_events WHERE id = ?
  },

  async getContainers(): Promise<Container[]> {
    return [];
  },

  async upsertContainer(_container: Container): Promise<void> {
    // TODO: INSERT OR REPLACE INTO containers
  },

  async getDailyGoal(_date: string): Promise<DailyGoal | null> {
    return null;
  },

  async setDailyGoal(_goal: DailyGoal): Promise<void> {
    // TODO: INSERT OR REPLACE INTO daily_goals
  },
};
