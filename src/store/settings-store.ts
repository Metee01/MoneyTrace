/**
 * MoneyTrace - Uygulama Ayarları Store'u (Zustand + Persist)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Settings } from '../types';

export interface SettingsState extends Settings {
  setTheme: (theme: Settings['theme']) => void;
  setLanguage: (language: Settings['language']) => void;
  setEvdsApiKey: (key: string) => void;
  setDefaultCurrency: (currency: Settings['defaultCurrency']) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  language: 'tr',
  evdsApiKey: '',
  defaultCurrency: 'TRY',
};

const getLocalStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  // Safe fallback for SSR and Node environment testing
  const dummyMap = new Map<string, string>();
  return {
    getItem: (key: string) => dummyMap.get(key) ?? null,
    setItem: (key: string, value: string) => dummyMap.set(key, value),
    removeItem: (key: string) => dummyMap.delete(key),
  };
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setEvdsApiKey: (evdsApiKey) => set({ evdsApiKey }),
      setDefaultCurrency: (defaultCurrency) => set({ defaultCurrency }),
      resetSettings: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: 'moneytrace-settings-storage',
      storage: createJSONStorage(getLocalStorage),
    }
  )
);
