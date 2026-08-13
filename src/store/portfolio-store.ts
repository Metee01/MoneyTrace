/**
 * MoneyTrace - Portfolio & Scenario Management Store (Zustand + Persist)
 */

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Portfolio, ProjectionParams, Scenario } from "../types"

export const DEFAULT_PROJECTION_PARAMS: ProjectionParams = {
  initialCapital: 10000,
  monthlyDca: 500,
  dcaIncreaseRate: 5,
  monthlyWithdrawal: 0,
  expectedReturnRate: 8,
  expectedInflationRate: 3,
  usdRate: 1,
  expectedUsdGrowthRate: 0,
  targetYears: 10,
  withholdingTaxRate: 0,
}

export interface PortfolioState {
  /** Current Calculation Parameters */
  currentParams: ProjectionParams
  /** Saved Portfolio List */
  portfolios: Portfolio[]
  /** Active Selected Portfolio ID */
  activePortfolioId: string | null
  /** Comparison Scenarios */
  scenarios: Scenario[]
  /** Baseline Scenario ID */
  baselineScenarioId: string | null

  // Actions - Parameters
  setParams: (params: Partial<ProjectionParams>) => void
  resetParams: () => void

  // Actions - Portfolios
  savePortfolio: (name: string, description?: string) => Portfolio
  updatePortfolio: (
    id: string,
    updates: Partial<Omit<Portfolio, "id" | "createdAt">>,
  ) => void
  deletePortfolio: (id: string) => void
  selectPortfolio: (id: string | null) => void

  // Actions - Scenarios
  addScenario: (
    name: string,
    color: string,
    params?: ProjectionParams,
  ) => Scenario
  duplicateScenario: (id: string) => Scenario | null
  applyScenarioToCurrent: (id: string) => void
  updateScenario: (id: string, updates: Partial<Omit<Scenario, "id">>) => void
  deleteScenario: (id: string) => void
  setBaselineScenario: (id: string | null) => void
}

const generateId = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `mt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
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
        const now = new Date().toISOString()
        const newPortfolio: Portfolio = {
          id: generateId(),
          name,
          description,
          params: { ...get().currentParams },
          createdAt: now,
          updatedAt: now,
        }

        set((state) => ({
          portfolios: [...state.portfolios, newPortfolio],
          activePortfolioId: newPortfolio.id,
        }))

        return newPortfolio
      },

      updatePortfolio: (id, updates) => {
        const now = new Date().toISOString()
        set((state) => ({
          portfolios: state.portfolios.map((p) =>
            p.id === id
              ? {
                  ...p,
                  ...updates,
                  updatedAt: now,
                }
              : p,
          ),
        }))
      },

      deletePortfolio: (id) =>
        set((state) => ({
          portfolios: state.portfolios.filter((p) => p.id !== id),
          activePortfolioId:
            state.activePortfolioId === id ? null : state.activePortfolioId,
        })),

      selectPortfolio: (id) => {
        const portfolio = get().portfolios.find((p) => p.id === id)
        if (portfolio) {
          set({
            activePortfolioId: id,
            currentParams: { ...portfolio.params },
          })
        } else {
          set({ activePortfolioId: null })
        }
      },

      addScenario: (name, color, params) => {
        const newScenario: Scenario = {
          id: generateId(),
          name,
          color,
          params: params ? { ...params } : { ...get().currentParams },
          isBaseline: get().scenarios.length === 0,
        }

        set((state) => ({
          scenarios: [...state.scenarios, newScenario],
          baselineScenarioId:
            state.baselineScenarioId === null
              ? newScenario.id
              : state.baselineScenarioId,
        }))

        return newScenario
      },

      duplicateScenario: (id) => {
        const scenario = get().scenarios.find((s) => s.id === id)
        if (!scenario) return null

        const newScenario: Scenario = {
          id: generateId(),
          name: `${scenario.name} (Copy)`,
          color: scenario.color,
          params: { ...scenario.params },
          isBaseline: false,
        }

        set((state) => ({
          scenarios: [...state.scenarios, newScenario],
        }))

        return newScenario
      },

      applyScenarioToCurrent: (id) => {
        const scenario = get().scenarios.find((s) => s.id === id)
        if (scenario) {
          set({
            currentParams: { ...scenario.params },
          })
        }
      },

      updateScenario: (id, updates) =>
        set((state) => ({
          scenarios: state.scenarios.map((s) =>
            s.id === id ? { ...s, ...updates } : s,
          ),
        })),

      deleteScenario: (id) =>
        set((state) => {
          const remainingScenarios = state.scenarios.filter((s) => s.id !== id)
          let newBaselineId = state.baselineScenarioId

          if (state.baselineScenarioId === id) {
            newBaselineId =
              remainingScenarios.length > 0 ? remainingScenarios[0].id : null
          }

          return {
            scenarios: remainingScenarios,
            baselineScenarioId: newBaselineId,
          }
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
      name: "moneytrace-portfolio-storage",
      storage: createJSONStorage(getLocalStorage),
    },
  ),
)
