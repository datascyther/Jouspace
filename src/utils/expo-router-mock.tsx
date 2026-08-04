import React, { useEffect } from 'react';
import { useAppStore } from '@/core/store/useAppStore';

export const useRouter = () => {
  return {
    push: (path: string) => {
      if (path.includes('signup')) {
        window.location.hash = '#/auth/signup';
      } else if (path.includes('login')) {
        window.location.hash = '#/auth/login';
      } else if (path.includes('forgot-password')) {
        window.location.hash = '#/auth/forgot-password';
      } else if (path.includes('email-verification')) {
        window.location.hash = '#/auth/email-verification';
      } else if (path.includes('onboarding')) {
        window.location.hash = '#/onboarding';
      } else if (path.includes('chat')) {
        useAppStore.getState().setCurrentTab('chat');
        window.location.hash = '#/chat';
      } else {
        useAppStore.getState().setCurrentTab('home');
        window.location.hash = '#/home';
      }
    },
    replace: (path: string) => {
      useRouter().push(path);
    },
    back: () => {
      window.history.back();
    }
  };
};

export const router = {
  push: (path: string) => useRouter().push(path),
  replace: (path: string) => useRouter().replace(path),
  back: () => useRouter().back(),
};

export const Redirect = ({ href }: { href: string }) => {
  useEffect(() => {
    useRouter().replace(href);
  }, [href]);
  return null;
};

export const useNavigation = () => {
  return {
    addListener: (event: string, callback: () => void) => {
      return () => {};
    }
  };
};

export function useLocalSearchParams<T extends Record<string, string | string[] | undefined> = Record<string, string | undefined>>(): T {
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) return {} as T;
  const params = new URLSearchParams(hash.slice(queryIndex + 1));
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result as T;
}

export default {
  useRouter,
  router,
  Redirect,
  useNavigation,
  useLocalSearchParams,
};
