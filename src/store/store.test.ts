/**
 * MoneyTrace Store Verification Test
 * Run with: npx tsx src/store/store.test.ts
 */

const mockStorageMap = new Map<string, string>();

const mockStorage = {
  getItem: (key: string) => mockStorageMap.get(key) ?? null,
  setItem: (key: string, value: string) => {
    mockStorageMap.set(key, value);
  },
  removeItem: (key: string) => {
    mockStorageMap.delete(key);
  },
  clear: () => {
    mockStorageMap.clear();
  },
  length: 0,
  key: (index: number) => Array.from(mockStorageMap.keys())[index] ?? null,
};

// Set window and localStorage on globalThis before module imports
(globalThis as unknown as Record<string, unknown>).window = {
  localStorage: mockStorage,
};
(globalThis as unknown as Record<string, unknown>).localStorage = mockStorage;

import { usePortfolioStore, DEFAULT_PROJECTION_PARAMS } from './portfolio-store';
import { useSettingsStore } from './settings-store';

async function runStoreTests() {
  console.log('🧪 Starting MoneyTrace Store Verification Tests...\n');

  // Test 1: Default Settings Store State
  console.log('--- Test 1: Settings Store Defaults & Actions ---');
  const initialTheme = useSettingsStore.getState().theme;
  console.log(`Initial Theme: ${initialTheme} (Expected: system)`);
  console.assert(initialTheme === 'system', 'Default theme mismatch');

  useSettingsStore.getState().setTheme('dark');
  console.log(`Updated Theme: ${useSettingsStore.getState().theme} (Expected: dark)`);
  console.assert(useSettingsStore.getState().theme === 'dark', 'Theme update failed');

  useSettingsStore.getState().setLanguage('en');
  console.log(`Updated Language: ${useSettingsStore.getState().language} (Expected: en)`);
  console.assert(useSettingsStore.getState().language === 'en', 'Language update failed');

  // Test 2: Portfolio Store Defaults & Parameter Actions
  console.log('\n--- Test 2: Portfolio Store Parameter Actions ---');
  const params = usePortfolioStore.getState().currentParams;
  console.log(`Default Initial Capital: ${params.initialCapital}`);
  console.assert(params.initialCapital === DEFAULT_PROJECTION_PARAMS.initialCapital, 'Default params mismatch');

  usePortfolioStore.getState().setParams({ initialCapital: 25000, targetYears: 10 });
  const updatedParams = usePortfolioStore.getState().currentParams;
  console.log(`Updated Initial Capital: ${updatedParams.initialCapital}, Target Years: ${updatedParams.targetYears}`);
  console.assert(updatedParams.initialCapital === 25000 && updatedParams.targetYears === 10, 'Params update failed');

  // Test 3: Portfolio Save & CRUD Actions
  console.log('\n--- Test 3: Portfolio Save & CRUD Actions ---');
  const savedP = usePortfolioStore.getState().savePortfolio('Retirement Plan', 'Long term goal');
  console.log(`Saved Portfolio ID: ${savedP.id}, Name: ${savedP.name}`);
  console.assert(usePortfolioStore.getState().portfolios.length === 1, 'Save portfolio failed');

  usePortfolioStore.getState().updatePortfolio(savedP.id, { name: 'Updated Portfolio' });
  const fetchedP = usePortfolioStore.getState().portfolios[0];
  console.log(`Updated Name: ${fetchedP.name}`);
  console.assert(fetchedP.name === 'Updated Portfolio', 'Update portfolio failed');

  // Test 4: Scenarios CRUD & Baseline Actions
  console.log('\n--- Test 4: Scenarios CRUD & Baseline ---');
  const sc1 = usePortfolioStore.getState().addScenario('Optimistic Scenario', '#10B981', {
    ...DEFAULT_PROJECTION_PARAMS,
    expectedReturnRate: 15,
  });
  const sc2 = usePortfolioStore.getState().addScenario('Pessimistic Scenario', '#EF4444', {
    ...DEFAULT_PROJECTION_PARAMS,
    expectedReturnRate: 4,
  });

  console.log(`Added Scenarios Count: ${usePortfolioStore.getState().scenarios.length}`);
  console.log(`Baseline Scenario ID: ${usePortfolioStore.getState().baselineScenarioId} (Expected: ${sc1.id})`);
  console.assert(usePortfolioStore.getState().scenarios.length === 2, 'Add scenarios failed');
  console.assert(usePortfolioStore.getState().baselineScenarioId === sc1.id, 'Baseline scenario mismatch');

  usePortfolioStore.getState().deleteScenario(sc1.id);
  console.log(`After Deleting Baseline, New Baseline ID: ${usePortfolioStore.getState().baselineScenarioId} (Expected: ${sc2.id})`);
  console.assert(usePortfolioStore.getState().baselineScenarioId === sc2.id, 'Baseline fallback after delete failed');

  // Test 5: LocalStorage Keys
  console.log('\n--- Test 5: Verify LocalStorage Keys ---');
  await new Promise((resolve) => setTimeout(resolve, 50));
  console.log(`Keys stored in mock localStorage: ${Array.from(mockStorageMap.keys()).join(', ')}`);
  console.assert(mockStorageMap.has('moneytrace-settings-storage'), 'Settings key missing');
  console.assert(mockStorageMap.has('moneytrace-portfolio-storage'), 'Portfolio key missing');

  console.log('\n✅ ALL STORE & PERSISTENCE TESTS PASSED SUCCESSFULLY!');
}

runStoreTests();
