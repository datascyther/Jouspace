import { moodRepository as backendMoodRepo } from '../../backend/repositories/MoodRepository';
import { NotAuthenticatedError } from '../../backend/repositories/baseRepository';
import { storageService } from '@/services/storage';
import type { Mood, MoodRating } from '@/shared/types';

const COLLECTION = 'users';

// App-side Mood.rating (1–5) <-> DB `moods.level` enum (`mood_level`).
type MoodLevel = 'very_low' | 'low' | 'neutral' | 'good' | 'great';
const RATING_TO_LEVEL: Record<MoodRating, MoodLevel> = {
  1: 'very_low',
  2: 'low',
  3: 'neutral',
  4: 'good',
  5: 'great',
};
const LEVEL_TO_RATING: Record<string, MoodRating> = {
  very_low: 1,
  low: 2,
  neutral: 3,
  good: 4,
  great: 5,
};

function getLocalKey(uid: string): string {
  return `moods_${uid}`;
}

export class MoodRepository {
  async loadMoods(uid: string): Promise<Mood[]> {
    if (!uid) return [];

    const local = await this.loadFromLocal(uid);
    if (local.length > 0) return local;

    const fromCloud = await this.loadFromCloud();
    if (fromCloud.length > 0) {
      await this.persistMoods(uid, fromCloud);
    }
    return fromCloud;
  }

  async saveMood(uid: string, entry: Mood): Promise<void> {
    if (!uid) return;

    await this.persistMoods(uid, [entry]);
    await this.syncToCloud(uid, entry);
  }

  async syncToCloud(uid: string, entry: Mood): Promise<boolean> {
    if (!uid) return false;
    try {
      await backendMoodRepo.create({
        level: RATING_TO_LEVEL[entry.rating],
        note: entry.note,
        recorded_at: entry.timestamp.toISOString(),
      });
      return true;
    } catch (error) {
      if (error instanceof NotAuthenticatedError) return false;
      // Network/socket failures (timeouts, closed sockets) must never surface
      // to the UI — the local copy is the source of truth and sync retries later.
      console.warn('[MoodRepository] Cloud sync skipped (will retry):', error);
      return false;
    }
  }

  async syncFromCloud(uid: string): Promise<Mood[]> {
    if (!uid) return [];
    const cloudData = await this.loadFromCloud();
    if (cloudData.length > 0) {
      await this.persistMoods(uid, cloudData);
    }
    return this.loadFromLocal(uid);
  }

  async persistMoods(uid: string, entries: Mood[]): Promise<void> {
    if (!uid || entries.length === 0) return;
    try {
      const key = getLocalKey(uid);
      const existing = await storageService.getJSON<Mood[]>(key) || [];
      const merged = [...existing];
      for (const entry of entries) {
        const idx = merged.findIndex((m) => m.id === entry.id);
        if (idx >= 0) {
          merged[idx] = entry;
        } else {
          merged.push(entry);
        }
      }
      await storageService.setJSON(key, merged);
    } catch (error) {
      console.error('Error persisting moods locally:', error);
    }
  }

  private async loadFromLocal(uid: string): Promise<Mood[]> {
    try {
      const local = await storageService.getJSON<Mood[]>(getLocalKey(uid));
      if (!local) return [];
      // `setJSON` serializes Dates to ISO strings, so rehydrate `timestamp`
      // back into a Date — consumers (e.g. getRecommendations) call .getTime().
      return local.map((m) => ({
        ...m,
        timestamp:
          m.timestamp instanceof Date
            ? m.timestamp
            : m.timestamp
            ? new Date(m.timestamp)
            : new Date(),
      }));
    } catch {
      return [];
    }
  }

  private async loadFromCloud(): Promise<Mood[]> {
    try {
      const rows = await backendMoodRepo.list();
      return rows.map((row) => ({
        id: row.id,
        rating: LEVEL_TO_RATING[row.level] ?? 3,
        note: row.note || '',
        timestamp: new Date(row.recorded_at),
      }));
    } catch (error) {
      console.error('Error loading moods from cloud:', error);
      return [];
    }
  }
}

export const moodRepository = new MoodRepository();
export default moodRepository;
