import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useNavigation } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSyncStore, checkOnline } from '@/core/store/useSyncStore';

export function useSyncRefresh(queryKeysToRefresh: any[][] = []) {
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const { processQueue, setOnlineStatus, initializeQueue } = useSyncStore();

  useEffect(() => {
    // Initialize the queue on mount
    void initializeQueue();
  }, [initializeQueue]);

  // Screen focus listener — processes pending queue only
  // Data is already in AsyncStorage; cloud sync is handled by background sync hooks
  useEffect(() => {
    const handleFocus = () => {
      void processQueue(queryClient);
    };

    const unsubscribe = navigation.addListener('focus', handleFocus);
    return unsubscribe;
  }, [navigation, queryClient, processQueue]);

  // App resume/active listener — re-check connectivity, process queue
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const online = await checkOnline();
        await setOnlineStatus(online, queryClient);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [queryClient, setOnlineStatus]);

  // Interval connectivity & sync check
  useEffect(() => {
    const interval = setInterval(async () => {
      const online = await checkOnline();
      const currentOnline = useSyncStore.getState().isOnline;
      if (online !== currentOnline) {
        await setOnlineStatus(online, queryClient);
      } else if (online) {
        const pending = useSyncStore.getState().pendingQueue;
        if (pending.length > 0) {
          void processQueue(queryClient);
        }
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [queryClient, setOnlineStatus, processQueue]);
}

export default useSyncRefresh;
