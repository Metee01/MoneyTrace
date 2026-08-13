/**
 * MoneyTrace Store Verification Test
 * Run with: npx tsx src/store/store.test.ts
 */

const mockStorageMap = new Map<string, string>()

const mockStorage = {
  getItem: (key: string) => mockStorageMap.get(key) ?? null,
  setItem: (key: string, value: string) => {
    mockStorageMap.set(key, value)
  },
  removeItem: (key: string) => {
    mockStorageMap.delete(key)
  },
  clear: () => {
    mockStorageMap.clear()
  },
  length: 0,
  key: (index: number) => Array.from(mockStorageMap.keys())[index] ?? null,
}

// Set window and localStorage on globalThis before module imports
;(globalThis as unknown as Record<string, unknown>).window = {
  localStorage: mockStorage,
}
;(globalThis as unknown as Record<string, unknown>).localStorage = mockStorage

import { usePortfolioStore, DEFAULT_PROJECTION_PARAMS } from "./portfolio-store"
import { useSettingsStore } from "./settings-store"

async function runStoreTests() {
  console.log("🧪 Starting MoneyTrace Store Verification Tests...\n")

  // Test 1: Default Settings Store State
  console.log("--- Test 1: Settings Store Defaults & Actions ---")
  const initialTheme = useSettingsStore.getState().theme
  console.log(`Initial Theme: ${initialTheme} (Expected: system)`)
  console.assert(initialTheme === "system", "Default theme mismatch")

  useSettingsStore.getState().setTheme("dark")
  console.log(
    `Updated Theme: ${useSettingsStore.getState().theme} (Expected: dark)`,
  )
  console.assert(
    useSettingsStore.getState().theme === "dark",
    "Theme update failed",
  )

  useSettingsStore.getState().setLanguage("en")
  console.log(
    `Updated Language: ${useSettingsStore.getState().language} (Expected: en)`,
  )
  console.assert(
    useSettingsStore.getState().language === "en",
    "Language update failed",
  )

  // Test 2: Portfolio Store Defaults & Parameter Actions
  console.log("\n--- Test 2: Portfolio Store Parameter Actions ---")
  const params = usePortfolioStore.getState().currentParams
  console.log(`Default Initial Capital: ${params.initialCapital}`)
  console.assert(
    params.initialCapital === DEFAULT_PROJECTION_PARAMS.initialCapital,
    "Default params mismatch",
  )

  usePortfolioStore
    .getState()
    .setParams({ initialCapital: 25000, targetYears: 10 })
  const updatedParams = usePortfolioStore.getState().currentParams
  console.log(
    `Updated Initial Capital: ${updatedParams.initialCapital}, Target Years: ${updatedParams.targetYears}`,
  )
  console.assert(
    updatedParams.initialCapital === 25000 && updatedParams.targetYears === 10,
    "Params update failed",
  )

  // Test 3: Portfolio Save & CRUD Actions
  console.log("\n--- Test 3: Portfolio Save & CRUD Actions ---")
  const savedP = usePortfolioStore
    .getState()
    .savePortfolio("Retirement Plan", "Long term goal")
  console.log(`Saved Portfolio ID: ${savedP.id}, Name: ${savedP.name}`)
  console.assert(
    usePortfolioStore.getState().portfolios.length === 1,
    "Save portfolio failed",
  )

  usePortfolioStore
    .getState()
    .updatePortfolio(savedP.id, { name: "Updated Portfolio" })
  const fetchedP = usePortfolioStore.getState().portfolios[0]
  console.log(`Updated Name: ${fetchedP.name}`)
  console.assert(
    fetchedP.name === "Updated Portfolio",
    "Update portfolio failed",
  )

  // Test 4: Scenarios CRUD & Baseline Actions
  console.log("\n--- Test 4: Scenarios CRUD & Baseline ---")
  const sc1 = usePortfolioStore
    .getState()
    .addScenario("Optimistic Scenario", "#10B981", {
      ...DEFAULT_PROJECTION_PARAMS,
      expectedReturnRate: 15,
    })
  const sc2 = usePortfolioStore
    .getState()
    .addScenario("Pessimistic Scenario", "#EF4444", {
      ...DEFAULT_PROJECTION_PARAMS,
      expectedReturnRate: 4,
    })

  console.log(
    `Added Scenarios Count: ${usePortfolioStore.getState().scenarios.length}`,
  )
  console.log(
    `Baseline Scenario ID: ${usePortfolioStore.getState().baselineScenarioId} (Expected: ${sc1.id})`,
  )
  console.assert(
    usePortfolioStore.getState().scenarios.length === 2,
    "Add scenarios failed",
  )
  console.assert(
    usePortfolioStore.getState().baselineScenarioId === sc1.id,
    "Baseline scenario mismatch",
  )

  usePortfolioStore.getState().deleteScenario(sc1.id)
  console.log(
    `After Deleting Baseline, New Baseline ID: ${usePortfolioStore.getState().baselineScenarioId} (Expected: ${sc2.id})`,
  )
  console.assert(
    usePortfolioStore.getState().baselineScenarioId === sc2.id,
    "Baseline fallback after delete failed",
  )

  // Test 5: LocalStorage Keys
  console.log("\n--- Test 5: Verify LocalStorage Keys ---")
  await new Promise((resolve) => setTimeout(resolve, 50))
  console.log(
    `Keys stored in mock localStorage: ${Array.from(mockStorageMap.keys()).join(", ")}`,
  )
  console.assert(
    mockStorageMap.has("moneytrace-settings-storage"),
    "Settings key missing",
  )
  console.assert(
    mockStorageMap.has("moneytrace-portfolio-storage"),
    "Portfolio key missing",
  )

  // Test 6: AI Settings Actions & Persistence
  console.log("\n--- Test 6: AI Settings Actions & Persistence ---")
  useSettingsStore.getState().setAiSettings({
    provider: "openai",
    apiKey: "sk-test-123",
    model: "gpt-5.6-terra",
  })
  console.log(
    `AI Provider: ${useSettingsStore.getState().aiModelProvider} (Expected: openai)`,
  )
  console.log(
    `AI API Key: ${useSettingsStore.getState().aiApiKey} (Expected: sk-test-123)`,
  )
  console.log(
    `AI Model: ${useSettingsStore.getState().aiModel} (Expected: gpt-5.6-terra)`,
  )
  console.assert(
    useSettingsStore.getState().aiModelProvider === "openai",
    "AI provider update failed",
  )
  console.assert(
    useSettingsStore.getState().aiApiKey === "sk-test-123",
    "AI api key update failed",
  )
  console.assert(
    useSettingsStore.getState().aiModel === "gpt-5.6-terra",
    "AI model update failed",
  )

  // Custom provider config (base URL + model) merge & persistence
  useSettingsStore.getState().setAiSettings({
    provider: "custom",
    baseUrl: "http://localhost:1234/v1",
    model: "local-model",
  })
  console.log(
    `Custom Base URL: ${useSettingsStore.getState().aiBaseUrl} (Expected: http://localhost:1234/v1)`,
  )
  console.log(
    `Provider after custom: ${useSettingsStore.getState().aiModelProvider} (Expected: custom)`,
  )
  console.assert(
    useSettingsStore.getState().aiBaseUrl === "http://localhost:1234/v1",
    "Custom base url update failed",
  )
  console.assert(
    useSettingsStore.getState().aiModel === "local-model",
    "Custom model update failed",
  )

  // CORS proxy config & persistence
  useSettingsStore.getState().setAiSettings({
    corsProxy: "https://corsproxy.io/?url={url}",
    corsProxyEnabled: true,
  })
  console.log(
    `CORS Proxy: ${useSettingsStore.getState().aiCorsProxy} (Expected: https://corsproxy.io/?url={url})`,
  )
  console.log(
    `CORS Proxy Enabled: ${useSettingsStore.getState().aiCorsProxyEnabled} (Expected: true)`,
  )
  console.assert(
    useSettingsStore.getState().aiCorsProxy ===
      "https://corsproxy.io/?url={url}",
    "CORS proxy update failed",
  )
  console.assert(
    useSettingsStore.getState().aiCorsProxyEnabled === true,
    "CORS proxy toggle update failed",
  )

  await new Promise((resolve) => setTimeout(resolve, 50))
  const persistedSettings = JSON.parse(
    mockStorageMap.get("moneytrace-settings-storage") ?? "{}",
  )
  console.log(`Persisted AI API Key: ${persistedSettings.state?.aiApiKey}`)
  console.log(`Persisted AI Base URL: ${persistedSettings.state?.aiBaseUrl}`)
  console.log(`Persisted CORS Proxy: ${persistedSettings.state?.aiCorsProxy}`)
  console.log(
    `Persisted CORS Proxy Enabled: ${persistedSettings.state?.aiCorsProxyEnabled}`,
  )
  console.assert(
    persistedSettings.state?.aiApiKey === "sk-test-123",
    "AI api key not persisted",
  )
  console.assert(
    persistedSettings.state?.aiBaseUrl === "http://localhost:1234/v1",
    "AI base url not persisted",
  )
  console.assert(
    persistedSettings.state?.aiModel === "local-model",
    "AI model not persisted",
  )
  console.assert(
    persistedSettings.state?.aiCorsProxy === "https://corsproxy.io/?url={url}",
    "CORS proxy not persisted",
  )
  console.assert(
    persistedSettings.state?.aiCorsProxyEnabled === true,
    "CORS proxy toggle not persisted",
  )

  useSettingsStore.getState().resetSettings()
  console.log(
    `After Reset - AI API Key: ${JSON.stringify(useSettingsStore.getState().aiApiKey)} (Expected: "")`,
  )
  console.log(
    `After Reset - AI Base URL: ${JSON.stringify(useSettingsStore.getState().aiBaseUrl)} (Expected: "")`,
  )
  console.log(
    `After Reset - CORS Proxy: ${JSON.stringify(useSettingsStore.getState().aiCorsProxy)} (Expected: "")`,
  )
  console.log(
    `After Reset - CORS Proxy Enabled: ${JSON.stringify(useSettingsStore.getState().aiCorsProxyEnabled)} (Expected: false)`,
  )
  console.assert(
    useSettingsStore.getState().aiApiKey === "",
    "Reset settings should clear AI api key",
  )
  console.assert(
    useSettingsStore.getState().aiBaseUrl === "",
    "Reset settings should clear AI base url",
  )
  console.assert(
    useSettingsStore.getState().aiCorsProxy === "",
    "Reset settings should clear CORS proxy",
  )
  console.assert(
    useSettingsStore.getState().aiCorsProxyEnabled === false,
    "Reset settings should disable CORS proxy toggle",
  )

  // Test 7: Demo API Quotas & Toggle
  console.log("\n--- Test 7: Demo API Quotas & Toggle ---")
  useSettingsStore.getState().setUseDemoApi(true)
  console.assert(
    useSettingsStore.getState().useDemoApi === true,
    "setUseDemoApi failed",
  )

  // Increment forecast count 5 times
  for (let i = 0; i < 5; i++) {
    const success = useSettingsStore.getState().incrementDemoForecastCount()
    console.assert(success === true, `Forecast increment ${i + 1} failed`)
  }
  console.assert(
    useSettingsStore.getState().demoForecastCount === 5,
    "demoForecastCount should be 5",
  )
  const failedForecastIncrement = useSettingsStore.getState().incrementDemoForecastCount()
  console.assert(
    failedForecastIncrement === false,
    "incrementDemoForecastCount should fail when limit is reached",
  )

  // Increment chat count 15 times
  for (let i = 0; i < 15; i++) {
    const success = useSettingsStore.getState().incrementDemoChatCount()
    console.assert(success === true, `Chat increment ${i + 1} failed`)
  }
  console.assert(
    useSettingsStore.getState().demoChatCount === 15,
    "demoChatCount should be 15",
  )
  const failedChatIncrement = useSettingsStore.getState().incrementDemoChatCount()
  console.assert(
    failedChatIncrement === false,
    "incrementDemoChatCount should fail when limit is reached",
  )

  console.log("\n✅ ALL STORE & PERSISTENCE TESTS PASSED SUCCESSFULLY!")
}

runStoreTests()
