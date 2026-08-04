import AsyncStorage from '@react-native-async-storage/async-storage';

const OLD_SESSION_KEY = 'neeva_chat_session';
const SESSION_KEY = 'jouspace_chat_session';

export interface SessionMeta {
  lastConversationId: string | null;
  lastActiveAt: string;
  messageCount: number;
  mood?: string | null;
  journeyFocus?: string | null;
  sessionCount?: number;
  firstSessionDate?: string | null;
  streak?: number;
}

export async function saveSessionMeta(meta: SessionMeta): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(meta));
  await AsyncStorage.removeItem(OLD_SESSION_KEY);
}

export async function loadSessionMeta(): Promise<SessionMeta | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY) || await AsyncStorage.getItem(OLD_SESSION_KEY);
  if (!raw) return null;
  if (await AsyncStorage.getItem(OLD_SESSION_KEY) !== null) {
    await AsyncStorage.setItem(SESSION_KEY, raw);
    await AsyncStorage.removeItem(OLD_SESSION_KEY);
  }
  return JSON.parse(raw) as SessionMeta;
}

export async function clearSessionMeta(): Promise<void> {
  await AsyncStorage.multiRemove([SESSION_KEY, OLD_SESSION_KEY]);
}
