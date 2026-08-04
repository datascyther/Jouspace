import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OLD_SESSION_KEY = 'neeva_session_context';
const SESSION_KEY = 'jouspace_session_context';

async function getSessionMeta(): Promise<SessionMeta | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY) || await AsyncStorage.getItem(OLD_SESSION_KEY);
  if (!raw) return null;
  if (await AsyncStorage.getItem(OLD_SESSION_KEY) !== null) {
    await AsyncStorage.setItem(SESSION_KEY, raw);
    await AsyncStorage.removeItem(OLD_SESSION_KEY);
  }
  try { return JSON.parse(raw); } catch { return null; }
}

async function setSessionMeta(data: SessionMeta): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(data));
  await AsyncStorage.removeItem(OLD_SESSION_KEY);
}

interface SessionContext {
  mood: string | null;
  firstSessionDate: string | null;
  previousSessionAt: Date | null;
  previousSessionMood: string | null;
  previousSessionFocus: string | null;
  sessionCount: number;
  setMood(mood: string): void;
  setJourneyFocus(focus: string): void;
}

interface SessionMeta {
  lastConversationId?: string | null;
  lastActiveAt?: string;
  messageCount?: number;
  mood?: string | null;
  journeyFocus?: string | null;
  sessionCount?: number;
  firstSessionDate?: string | null;
}

const SessionContext = createContext<SessionContext | null>(null);

export function SessionContextProvider({ children }: { children: React.ReactNode }) {
  const [sessionData, setSessionData] = useState<Partial<SessionContext>>({
    mood: null,
    firstSessionDate: null,
    previousSessionAt: null,
    previousSessionMood: null,
    previousSessionFocus: null,
    sessionCount: 0,
  });

  useEffect(() => {
    const loadSession = async () => {
      try {
        const data = await getSessionMeta();
        if (data) {
          const previousSessionAt = data.lastActiveAt ? new Date(data.lastActiveAt) : null;

          setSessionData({
            mood: data.mood || null,
            firstSessionDate: data.firstSessionDate || null,
            previousSessionAt,
            previousSessionMood: data.mood || null,
            previousSessionFocus: data.journeyFocus || null,
            sessionCount: data.sessionCount || 0,
          });
        }
      } catch (error) {
        console.error('[SessionContext] Failed to load session:', error);
      }
    };

    loadSession();
  }, []);

  const setMood = useCallback(async (mood: string) => {
    setSessionData(prev => ({ ...prev, mood }));
    try {
      const existing = await getSessionMeta();
      const updated: SessionMeta = {
        ...(existing || {}),
        mood,
        lastActiveAt: new Date().toISOString(),
      };
      await setSessionMeta(updated);
    } catch (error) {
      console.error('[SessionContext] Failed to save mood:', error);
    }
  }, []);

  const setJourneyFocus = useCallback(async (focus: string) => {
    setSessionData(prev => ({ ...prev, journeyFocus: focus }));
    try {
      const existing = await getSessionMeta();
      const updated: SessionMeta = {
        ...(existing || {}),
        journeyFocus: focus,
        lastActiveAt: new Date().toISOString(),
      };
      await setSessionMeta(updated);
    } catch (error) {
      console.error('[SessionContext] Failed to save journey focus:', error);
    }
  }, []);

  const value: SessionContext = {
    ...sessionData,
    setMood,
    setJourneyFocus,
  } as SessionContext;

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionContext must be used within a SessionContextProvider');
  }
  return context;
}
