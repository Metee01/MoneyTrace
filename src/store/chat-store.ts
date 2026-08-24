/**
 * MoneyTrace - Persistent Chat History Store (Zustand + Persist)
 */

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { ChatMessage, ChatSession } from "../types"

export interface ChatState {
  sessions: ChatSession[]
  activeSessionId: string | null

  // Actions
  createSession: (welcomeMessageText?: string) => ChatSession
  selectSession: (id: string) => void
  deleteSession: (id: string) => void
  addMessageToSession: (id: string, message: ChatMessage) => void
  addMessageToActiveSession: (message: ChatMessage) => void
  clearActiveSession: (welcomeMessageText?: string) => void
  getSession: (id: string) => ChatSession | null
  getActiveSession: () => ChatSession | null
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function appendMessage(
  session: ChatSession,
  message: ChatMessage,
  now: number,
): ChatSession {
  const messages = [...session.messages, message]
  let title = session.title
  if (!title) {
    const firstUserMessage = messages.find((item) => item.role === "user")
    if (firstUserMessage) {
      const cleaned = firstUserMessage.content.trim().slice(0, 30)
      title = firstUserMessage.content.length > 30 ? `${cleaned}...` : cleaned
    }
  }

  return { ...session, title, updatedAt: now, messages }
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

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,

      createSession: (welcomeMessageText) => {
        const now = Date.now()
        const initialMessages: ChatMessage[] = welcomeMessageText
          ? [
              {
                id: generateId(),
                role: "assistant",
                content: welcomeMessageText,
                timestamp: now,
              },
            ]
          : []

        const newSession: ChatSession = {
          id: generateId(),
          title: "",
          createdAt: now,
          updatedAt: now,
          messages: initialMessages,
        }

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: newSession.id,
        }))

        return newSession
      },

      selectSession: (id) => {
        const exists = get().sessions.some((s) => s.id === id)
        if (exists) {
          set({ activeSessionId: id })
        }
      },

      deleteSession: (id) => {
        set((state) => {
          const remaining = state.sessions.filter((s) => s.id !== id)
          let nextActiveId = state.activeSessionId
          if (state.activeSessionId === id) {
            nextActiveId = remaining.length > 0 ? remaining[0].id : null
          }
          return {
            sessions: remaining,
            activeSessionId: nextActiveId,
          }
        })
      },

      addMessageToSession: (id, message) => {
        const now = Date.now()
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === id ? appendMessage(session, message, now) : session,
          ),
        }))
      },

      addMessageToActiveSession: (message) => {
        const activeId = get().activeSessionId
        const now = Date.now()

        set((state) => {
          let targetSessionId = activeId
          let sessions = [...state.sessions]

          // If no active session exists, create one on the fly
          if (
            !targetSessionId ||
            !sessions.some((s) => s.id === targetSessionId)
          ) {
            const newSession: ChatSession = {
              id: generateId(),
              title: "",
              createdAt: now,
              updatedAt: now,
              messages: [],
            }
            sessions = [newSession, ...sessions]
            targetSessionId = newSession.id
          }

          const updatedSessions = sessions.map((session) =>
            session.id === targetSessionId
              ? appendMessage(session, message, now)
              : session,
          )

          return {
            sessions: updatedSessions,
            activeSessionId: targetSessionId,
          }
        })
      },

      clearActiveSession: (welcomeMessageText) => {
        const activeId = get().activeSessionId
        if (!activeId) return
        const now = Date.now()
        const initialMessages: ChatMessage[] = welcomeMessageText
          ? [
              {
                id: generateId(),
                role: "assistant",
                content: welcomeMessageText,
                timestamp: now,
              },
            ]
          : []

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === activeId
              ? {
                  ...s,
                  title: "",
                  updatedAt: now,
                  messages: initialMessages,
                }
              : s,
          ),
        }))
      },

      getSession: (id) => get().sessions.find((s) => s.id === id) || null,

      getActiveSession: () => {
        const { sessions, activeSessionId } = get()
        if (!activeSessionId) return null
        return sessions.find((s) => s.id === activeSessionId) || null
      },
    }),
    {
      name: "moneytrace-chat-storage",
      storage: createJSONStorage(getLocalStorage),
    },
  ),
)
