/**
 * MoneyTrace - Application Settings Store (Zustand + Persist)
 */

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Settings } from "../types"

export interface SettingsState extends Settings {
  setTheme: (theme: Settings["theme"]) => void
  setLanguage: (language: string) => void
  setCurrency: (code: string, symbol: string) => void
  setAiSettings: (settings: {
    provider?: Settings["aiModelProvider"]
    apiKey?: string
    model?: string
    baseUrl?: string
    corsProxy?: string
    corsProxyEnabled?: boolean
  }) => void
  resetSettings: () => void
}

const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  language: "en",
  currencyCode: "USD",
  currencySymbol: "$",
  aiApiKey: "",
  aiModelProvider: "gemini",
  aiModel: "",
  aiBaseUrl: "",
  aiCorsProxy: "",
  aiCorsProxyEnabled: false,
}

const getLocalStorage = () => ({
  getItem: (key: string) =>
    typeof window !== "undefined" && window.localStorage
      ? window.localStorage.getItem(key)
      : null,
  setItem: (key: string, value: string) => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value)
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key)
    }
  },
})

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setCurrency: (currencyCode, currencySymbol) =>
        set({ currencyCode, currencySymbol }),
      setAiSettings: ({
        provider,
        apiKey,
        model,
        baseUrl,
        corsProxy,
        corsProxyEnabled,
      }) =>
        set((state) => ({
          aiModelProvider: provider ?? state.aiModelProvider,
          aiApiKey: apiKey !== undefined ? apiKey : state.aiApiKey,
          aiModel: model !== undefined ? model : state.aiModel,
          aiBaseUrl: baseUrl !== undefined ? baseUrl : state.aiBaseUrl,
          aiCorsProxy: corsProxy !== undefined ? corsProxy : state.aiCorsProxy,
          aiCorsProxyEnabled:
            corsProxyEnabled !== undefined
              ? corsProxyEnabled
              : state.aiCorsProxyEnabled,
        })),
      resetSettings: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: "moneytrace-settings-storage",
      storage: createJSONStorage(getLocalStorage),
    },
  ),
)
