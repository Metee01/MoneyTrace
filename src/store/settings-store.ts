/**
 * MoneyTrace - Application Settings Store (Zustand + Persist)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Settings } from '../types';

export interface SettingsState extends Settings {
  setTheme: (theme: Settings['theme']) => void;
  setLanguage: (language: Settings['language']) => void;
  setCurrency: (code: string, symbol: string) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  language: 'en',
  currencyCode: 'USD',
  currencySymbol: '$',
};

const getLocalStorage = () => ({
  getItem: (key: string) =>
    typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null,
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
});

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setCurrency: (currencyCode, currencySymbol) => set({ currencyCode, currencySymbol }),
      resetSettings: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: 'moneytrace-settings-storage',
      storage: createJSONStorage(getLocalStorage),
    }
  )
);
