/**
 * MoneyTrace - Portföy ve Senaryo Yönetimi Store'u (Zustand + Persist)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Portfolio, ProjectionParams, Scenario } from '../types';

export const DEFAULT_PROJECTION_PARAMS: ProjectionParams = {
  initialCapital: 100000,
  monthlyDca: 10000,
  dcaIncreaseRate: 30,
  expectedReturnRate: 50,
  expectedInflationRate: 35,
  usdRate: 36.5,
  expectedUsdGrowthRate: 25,
  targetYears: 5,
};

export interface PortfolioState {
  /** Aktif Hesaplama Parametreleri */
  currentParams: ProjectionParams;
  /** Kayıtlı Portföy Listesi */
  portfolios: Portfolio[];
  /** Seçili Portföy ID */
  activePortfolioId: string | null;
  /** Karşılaştırma Senaryoları */
  scenarios: Scenario[];
  /** Baz Alınan Senaryo ID */
  baselineScenarioId: string | null;

  // Actions - Parameters
  setParams: (params: Partial<ProjectionParams>) => void;
  resetParams: () => void;

  // Actions - Portfolios
  savePortfolio: (name: string, description?: string) => Portfolio;
  updatePortfolio: (id: string, updates: Partial<Omit<Portfolio, 'id' | 'createdAt'>>) => void;
  deletePortfolio: (id: string) => void;
  selectPortfolio: (id: string | null) => void;

  // Actions - Scenarios
  addScenario: (name: string, color: string, params?: ProjectionParams) => Scenario;
  updateScenario: (id: string, updates: Partial<Omit<Scenario, 'id'>>) => void;
  deleteScenario: (id: string) => void;
  setBaselineScenario: (id: string | null) => void;
}

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `mt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      currentParams: { ...DEFAULT_PROJECTION_PARAMS },
      portfolios: [],
      activePortfolioId: null,
      scenarios: [],
      baselineScenarioId: null,

      setParams: (newParams) =>
        set((state) => ({
          currentParams: { ...state.currentParams, ...newParams },
        })),

      resetParams: () =>
        set({
          currentParams: { ...DEFAULT_PROJECTION_PARAMS },
          activePortfolioId: null,
        }),

      savePortfolio: (name, description) => {
        const now = new Date().toISOString();
        const newPortfolio: Portfolio = {
          id: generateId(),
          name,
          description,
          params: { ...get().currentParams },
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          portfolios: [...state.portfolios, newPortfolio],
          activePortfolioId: newPortfolio.id,
        }));

        return newPortfolio;
      },

      updatePortfolio: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          portfolios: state.portfolios.map((p) =>
            p.id === id
              ? {
                  ...p,
                  ...updates,
                  updatedAt: now,
                }
              : p
          ),
        }));
      },

      deletePortfolio: (id) =>
        set((state) => ({
          portfolios: state.portfolios.filter((p) => p.id !== id),
          activePortfolioId:
            state.activePortfolioId === id ? null : state.activePortfolioId,
        })),

      selectPortfolio: (id) => {
        const portfolio = get().portfolios.find((p) => p.id === id);
        if (portfolio) {
          set({
            activePortfolioId: id,
            currentParams: { ...portfolio.params },
          });
        } else {
          set({ activePortfolioId: null });
        }
      },

      addScenario: (name, color, params) => {
        const newScenario: Scenario = {
          id: generateId(),
          name,
          color,
          params: params ? { ...params } : { ...get().currentParams },
          isBaseline: get().scenarios.length === 0,
        };

        set((state) => ({
          scenarios: [...state.scenarios, newScenario],
          baselineScenarioId:
            state.baselineScenarioId === null ? newScenario.id : state.baselineScenarioId,
        }));

        return newScenario;
      },

      updateScenario: (id, updates) =>
        set((state) => ({
          scenarios: state.scenarios.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      deleteScenario: (id) =>
        set((state) => {
          const remainingScenarios = state.scenarios.filter((s) => s.id !== id);
          let newBaselineId = state.baselineScenarioId;

          if (state.baselineScenarioId === id) {
            newBaselineId = remainingScenarios.length > 0 ? remainingScenarios[0].id : null;
          }

          return {
            scenarios: remainingScenarios,
            baselineScenarioId: newBaselineId,
          };
        }),

      setBaselineScenario: (id) =>
        set((state) => ({
          baselineScenarioId: id,
          scenarios: state.scenarios.map((s) => ({
            ...s,
            isBaseline: s.id === id,
          })),
        })),
    }),
    {
      name: 'moneytrace-portfolio-storage',
      storage: createJSONStorage(getLocalStorage),
    }
  )
);
