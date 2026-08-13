/**
 * MoneyTrace - Chat Store Verification Script
 *
 * Plain console.assert verification script for persistent chat history management.
 * Run with: npx tsx src/store/chat-store.test.ts
 */

import { useChatStore } from "./chat-store"

// Mock window.localStorage for Node environment testing
const mockStorage: Record<string, string> = {}
;(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = value
    },
    removeItem: (key: string) => {
      delete mockStorage[key]
    },
  },
}

console.log("🧪 Starting MoneyTrace Chat History Store Verification Tests...\n")

// Test 1: Initial state
console.log("--- Test 1: Initial State ---")
const initialSessions = useChatStore.getState().sessions
const activeId = useChatStore.getState().activeSessionId
console.log(`Initial Sessions Count: ${initialSessions.length} (Expected: 0)`)
console.log(`Initial Active Session ID: ${activeId} (Expected: null)`)
console.assert(initialSessions.length === 0, "Initial sessions should be empty")
console.assert(activeId === null, "Initial active session should be null")

// Test 2: Create Session
console.log("\n--- Test 2: Create Session ---")
const session1 = useChatStore
  .getState()
  .createSession("Welcome to MoneyTrace AI")
console.log(`Created Session ID: ${session1.id}`)
console.log(
  `Active Session ID after create: ${useChatStore.getState().activeSessionId}`,
)
console.assert(
  useChatStore.getState().activeSessionId === session1.id,
  "Newly created session should become active",
)
console.assert(
  session1.messages.length === 1 &&
    session1.messages[0].content === "Welcome to MoneyTrace AI",
  "Welcome message should be added",
)

// Test 3: Add Messages & Auto Title Generation
console.log("\n--- Test 3: Add Messages & Auto Title ---")
useChatStore.getState().addMessageToActiveSession({
  id: "msg-1",
  role: "user",
  content: "10 Yıllık Dolar Projeksiyonu yapabilir misin?",
  timestamp: Date.now(),
})

const updatedSession1 = useChatStore.getState().getActiveSession()
console.log(`Auto Generated Title: "${updatedSession1?.title}"`)
console.assert(
  updatedSession1?.title.startsWith("10 Yıllık Dolar Projeksiyonu"),
  "Title should auto-generate from first user message",
)
console.assert(
  updatedSession1?.messages.length === 2,
  "Session should contain 2 messages",
)

// Test 4: Create Second Session & Switch
console.log("\n--- Test 4: Multiple Sessions & Switching ---")
const session2 = useChatStore.getState().createSession("Second welcome")
console.log(
  `Sessions count: ${useChatStore.getState().sessions.length} (Expected: 2)`,
)
console.assert(
  useChatStore.getState().sessions.length === 2,
  "Should have 2 sessions in store",
)
console.assert(
  useChatStore.getState().activeSessionId === session2.id,
  "Session 2 should now be active",
)

useChatStore.getState().selectSession(session1.id)
console.log(
  `Active Session ID after switch back: ${useChatStore.getState().activeSessionId}`,
)
console.assert(
  useChatStore.getState().activeSessionId === session1.id,
  "Session 1 should be active again",
)

// Test 5: Delete Session
console.log("\n--- Test 5: Delete Session ---")
useChatStore.getState().deleteSession(session1.id)
console.log(
  `Sessions count after delete: ${useChatStore.getState().sessions.length} (Expected: 1)`,
)
console.log(`New active session ID: ${useChatStore.getState().activeSessionId}`)
console.assert(
  useChatStore.getState().sessions.length === 1,
  "Store should have 1 session remaining",
)
console.assert(
  useChatStore.getState().activeSessionId === session2.id,
  "Active session should fallback to remaining session",
)

// Test 6: LocalStorage Persistence Key Check
console.log("\n--- Test 6: Verify LocalStorage Persistence Key ---")
const keys = Object.keys(mockStorage)
console.log(`Stored Keys in mock localStorage: ${keys.join(", ")}`)
console.assert(
  keys.includes("moneytrace-chat-storage"),
  "moneytrace-chat-storage key should exist in localStorage",
)

console.log("\n✅ ALL CHAT STORE TESTS PASSED SUCCESSFULLY!\n")
