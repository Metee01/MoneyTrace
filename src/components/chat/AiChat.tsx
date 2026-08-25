/**
 * MoneyTrace - AI Chat Component
 *
 * Floating Action Button (FAB) + Chat Panel for conversational AI.
 * Uses portfolio data as context for AI responses.
 * Supports persistent chat session history and switching between conversations.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Trash2,
  Settings,
  Sparkles,
  Bot,
  History,
  Plus,
  ChevronLeft,
  Wrench,
  Square,
  ShieldAlert,
} from "lucide-react"
import { Button } from "../ui/button"
import {
  useSettingsStore,
  usePortfolioStore,
  useChatStore,
  MAX_DEMO_CHAT_MESSAGES,
} from "../../store"
import { calculateProjection } from "../../engine"
import { APP_CONFIG } from "../../config"
import {
  sendChatMessage,
  type PortfolioContext,
  type ChatServiceResponse,
} from "../../lib/ai-chat-service"
import {
  AiForecastError,
  createAbortError,
  isAbortError,
  throwIfAborted,
} from "../../lib/ai-service"
import { isDemoAvailable } from "../../lib/demo-proxy"
import {
  createDefaultToolDeps,
  describeMutationCall,
  executeToolCall,
  getToolCallDisposition,
  isMutationTool,
  stripToolCalls,
} from "../../lib/ai-tools"
import type {
  ChatMessage,
  AiModelProvider,
  AiToolCall,
  AiToolCallResult,
} from "../../types"

const MAX_TOOL_ROUNDS = APP_CONFIG.ai.toolCall.maxRounds

interface AiChatProps {
  onOpenSettings: () => void
}

interface GenerationOperation {
  id: number
  sessionId: string
  autoApproveMutations: boolean
  controller: AbortController
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function abortableDelay(delayMs: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.reject(createAbortError())
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      signal.removeEventListener("abort", handleAbort)
      resolve()
    }, delayMs)
    const handleAbort = () => {
      clearTimeout(timeoutId)
      reject(createAbortError())
    }
    signal.addEventListener("abort", handleAbort, { once: true })
  })
}

/**
 * Simple markdown-like formatting for AI responses.
 * Handles bold, italic, inline code, and line breaks.
 */
function formatMessageContent(content: string): React.ReactNode[] {
  const lines = content.split("\n")
  const result: React.ReactNode[] = []

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) {
      result.push(<br key={`br-${lineIdx}`} />)
    }

    // Bullet points
    const bulletMatch = line.match(/^(\s*)[•\-*]\s+(.*)/)
    if (bulletMatch) {
      const indent = bulletMatch[1].length > 0
      const text = bulletMatch[2]
      result.push(
        <span
          key={`line-${lineIdx}`}
          className={`block ${indent ? "ml-4" : "ml-2"}`}
        >
          <span className="text-primary mr-1.5">•</span>
          {formatInlineText(text, lineIdx)}
        </span>,
      )
      return
    }

    // Numbered lists
    const numberMatch = line.match(/^(\s*)\d+[.)]\s+(.*)/)
    if (numberMatch) {
      result.push(
        <span key={`line-${lineIdx}`} className="block ml-2">
          {formatInlineText(line, lineIdx)}
        </span>,
      )
      return
    }

    result.push(
      <React.Fragment key={`line-${lineIdx}`}>
        {formatInlineText(line, lineIdx)}
      </React.Fragment>,
    )
  })

  return result
}

function formatInlineText(text: string, lineIdx: number): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  // Simple regex: **bold**, *italic*, `code`
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    if (match[2]) {
      // **bold**
      nodes.push(
        <strong key={`b-${lineIdx}-${match.index}`} className="font-semibold">
          {match[2]}
        </strong>,
      )
    } else if (match[3]) {
      // *italic*
      nodes.push(<em key={`i-${lineIdx}-${match.index}`}>{match[3]}</em>)
    } else if (match[4]) {
      // `code`
      nodes.push(
        <code
          key={`c-${lineIdx}-${match.index}`}
          className="px-1 py-0.5 rounded bg-muted text-xs font-mono"
        >
          {match[4]}
        </code>,
      )
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

export const AiChat: React.FC<AiChatProps> = ({ onOpenSettings }) => {
  const { t, i18n } = useTranslation()
  const {
    aiApiKey,
    aiModelProvider,
    aiModel,
    aiBaseUrl,
    aiCorsProxy,
    aiCorsProxyEnabled,
    aiAutoApproveMutations,
    useDemoApi,
    demoChatCount = 0,
    currencyCode,
  } = useSettingsStore()
  const { currentParams } = usePortfolioStore()
  const {
    sessions,
    activeSessionId,
    createSession,
    selectSession,
    deleteSession,
    addMessageToSession,
    clearActiveSession,
  } = useChatStore()

  const [isOpen, setIsOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localDemoOverride, setLocalDemoOverride] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [panelSize, setPanelSize] = useState({ width: 420, height: 580 })
  const [pendingProposals, setPendingProposals] = useState<{
    calls: AiToolCall[]
    sessionId: string
  } | null>(null)

  const toolDeps = useMemo(() => createDefaultToolDeps(), [])

  /**
   * Starts drag-resizing of the chat panel. The panel is anchored to the
   * bottom-right corner of the viewport, so the free edges (top, left) act
   * as resize handles.
   */
  const startResize = useCallback(
    (dir: "corner" | "top" | "left") => (e: React.PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return
      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)
      const startX = e.clientX
      const startY = e.clientY
      const startW = panelSize.width
      const startH = panelSize.height
      const clampW = (v: number) =>
        Math.min(Math.max(v, 320), Math.max(window.innerWidth - 48, 320))
      const clampH = (v: number) =>
        Math.min(Math.max(v, 360), Math.max(window.innerHeight - 96, 360))

      const onMove = (ev: PointerEvent) => {
        const width =
          dir !== "top" ? clampW(startW + startX - ev.clientX) : startW
        const height =
          dir !== "left" ? clampH(startH + startY - ev.clientY) : startH
        setPanelSize({ width, height })
      }
      const onUp = () => {
        setIsResizing(false)
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
      }
      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
    },
    [panelSize],
  )

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatPanelRef = useRef<HTMLDivElement>(null)
  const activeGenerationRef = useRef<GenerationOperation | null>(null)
  const nextGenerationIdRef = useRef(0)

  // Ensure an active chat session exists
  useEffect(() => {
    if (sessions.length === 0 || !activeSessionId) {
      createSession(t("chat.welcome"))
    }
  }, [sessions.length, activeSessionId, createSession, t])

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  )

  const messages = useMemo(() => activeSession?.messages ?? [], [activeSession])

  const hasDemoKey = useMemo(() => isDemoAvailable(), [])
  const isUsingDemo = (useDemoApi || localDemoOverride) && hasDemoKey
  const isQuotaExceeded = isUsingDemo && demoChatCount >= MAX_DEMO_CHAT_MESSAGES

  // Determine active API key and provider configuration
  const activeApiKey = isUsingDemo ? "" : (aiApiKey ?? "")
  const activeProvider: AiModelProvider = isUsingDemo
    ? (APP_CONFIG.ai.demo.provider as AiModelProvider)
    : (aiModelProvider ?? "gemini")
  const activeModel = isUsingDemo ? APP_CONFIG.ai.models.demo : (aiModel ?? "")
  const activeBaseUrl = isUsingDemo
    ? (APP_CONFIG.ai.demo.baseUrl ?? "")
    : (aiBaseUrl ?? "")
  const hasActiveKey = isUsingDemo || activeApiKey.trim().length > 0

  // Calculate projection for context
  const projectionResult = useMemo(() => {
    try {
      return calculateProjection(currentParams)
    } catch {
      return null
    }
  }, [currentParams])

  // Build portfolio context including calculated projection table & chart rows
  const portfolioContext: PortfolioContext = useMemo(
    () => ({
      params: currentParams,
      summary: projectionResult?.summary ?? null,
      projection: projectionResult,
      currencyCode,
      language: i18n.language,
    }),
    [currentParams, projectionResult, currencyCode, i18n.language],
  )

  const startGeneration = useCallback(
    (
      sessionId: string,
      autoApproveMutations = useSettingsStore.getState()
        .aiAutoApproveMutations ?? false,
    ) => {
      activeGenerationRef.current?.controller.abort()
      const operation: GenerationOperation = {
        id: ++nextGenerationIdRef.current,
        sessionId,
        autoApproveMutations,
        controller: new AbortController(),
      }
      activeGenerationRef.current = operation
      setIsLoading(true)
      return operation
    },
    [],
  )

  const isCurrentGeneration = useCallback(
    (operation: GenerationOperation) =>
      activeGenerationRef.current?.id === operation.id &&
      !operation.controller.signal.aborted,
    [],
  )

  const finishGeneration = useCallback((operation: GenerationOperation) => {
    if (activeGenerationRef.current?.id !== operation.id) return
    activeGenerationRef.current = null
    setIsLoading(false)
  }, [])

  const stopGeneration = useCallback(() => {
    const operation = activeGenerationRef.current
    if (!operation) return
    activeGenerationRef.current = null
    operation.controller.abort()
    setIsLoading(false)
  }, [])

  const handleClose = useCallback(() => {
    stopGeneration()
    setIsOpen(false)
  }, [stopGeneration])

  useEffect(
    () => () => {
      activeGenerationRef.current?.controller.abort()
      activeGenerationRef.current = null
    },
    [],
  )

  // Auto-scroll to bottom
  useEffect(() => {
    if (!isHistoryOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isLoading, isHistoryOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isHistoryOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen, isHistoryOpen])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, handleClose])

  // ── Tool Call Flow ─────────────────────────────────────────────────────────

  const appendToolResults = useCallback(
    (sessionId: string, results: AiToolCallResult[]) => {
      const now = Date.now()
      for (const r of results) {
        addMessageToSession(sessionId, {
          id: generateId(),
          role: "user",
          content: `[Tool result for ${r.tool}]${r.ok ? "" : " — ERROR"}\n${r.output}`,
          timestamp: now,
          internal: true,
        })
      }
    },
    [addMessageToSession],
  )

  const addInternalNote = useCallback(
    (sessionId: string, note: string) => {
      addMessageToSession(sessionId, {
        id: generateId(),
        role: "user",
        content: note,
        timestamp: Date.now(),
        internal: true,
      })
    },
    [addMessageToSession],
  )

  const reportError = useCallback(
    (err: unknown) => {
      if (isAbortError(err)) return
      if (err instanceof AiForecastError) {
        if (err.code === "quota") {
          setError(err.message || t("chat.demoQuotaExceeded"))
        } else {
          setError(
            t(
              `ai.error${err.code.charAt(0).toUpperCase() + err.code.slice(1)}` as "ai.errorAuth",
            ),
          )
        }
      } else {
        setError(t("chat.errorSending"))
      }
    },
    [t],
  )

  const buildRequest = useCallback(
    (
      requestMessages: ChatMessage[],
      signal: AbortSignal,
      autoApproveMutations: boolean,
    ) => ({
      provider: activeProvider,
      apiKey: activeApiKey,
      model: activeModel,
      baseUrl: activeBaseUrl,
      corsProxy: aiCorsProxyEnabled ? (aiCorsProxy ?? "") : "",
      messages: requestMessages,
      context: portfolioContext,
      isDemo: isUsingDemo,
      autoApproveMutations,
      signal,
    }),
    [
      activeProvider,
      activeApiKey,
      activeModel,
      activeBaseUrl,
      aiCorsProxy,
      aiCorsProxyEnabled,
      portfolioContext,
      isUsingDemo,
    ],
  )

  const appendAssistant = useCallback(
    (sessionId: string, response: ChatServiceResponse) => {
      addMessageToSession(sessionId, {
        id: generateId(),
        role: "assistant",
        content: response.text,
        timestamp: Date.now(),
      })
    },
    [addMessageToSession],
  )

  const executeTools = useCallback(
    async (
      operation: GenerationOperation,
      calls: AiToolCall[],
      allowMutation: boolean,
      requireAutoApproval = false,
    ): Promise<boolean> => {
      for (const [index, call] of calls.entries()) {
        throwIfAborted(operation.controller.signal)
        if (!isCurrentGeneration(operation)) throw createAbortError()
        if (
          isMutationTool(call) &&
          requireAutoApproval &&
          !useSettingsStore.getState().aiAutoApproveMutations
        ) {
          setPendingProposals({
            calls: calls.slice(index),
            sessionId: operation.sessionId,
          })
          return false
        }
        const result = await executeToolCall(
          call,
          toolDeps,
          allowMutation,
          operation.controller.signal,
          requireAutoApproval,
        )
        throwIfAborted(operation.controller.signal)
        if (!isCurrentGeneration(operation)) throw createAbortError()
        appendToolResults(operation.sessionId, [result])
      }
      return true
    },
    [appendToolResults, isCurrentGeneration, toolDeps],
  )

  const waitForDemoChatCooldown = useCallback(
    async (signal: AbortSignal) => {
      if (!isUsingDemo) return

      const lastCallTime = useSettingsStore.getState().demoLastChatCallTime ?? 0
      const remaining =
        APP_CONFIG.ai.demo.cooldownMs - (Date.now() - lastCallTime)
      if (remaining > 0) {
        await abortableDelay(remaining + 50, signal)
      }
    },
    [isUsingDemo],
  )

  /**
   * Sends follow-up rounds after tool results were injected into the session.
   * Read-only tools run immediately. Mutation tools either pause for approval
   * or execute under the user's auto-approval setting.
   */
  const runFollowUpRound = useCallback(
    async (operation: GenerationOperation) => {
      let rounds = 0
      while (rounds < MAX_TOOL_ROUNDS) {
        rounds += 1
        throwIfAborted(operation.controller.signal)
        await waitForDemoChatCooldown(operation.controller.signal)
        const session = useChatStore.getState().getSession(operation.sessionId)
        if (!session) throw createAbortError()
        const promptAutoApproval =
          operation.autoApproveMutations &&
          (useSettingsStore.getState().aiAutoApproveMutations ?? false)
        const response = await sendChatMessage(
          buildRequest(
            session.messages,
            operation.controller.signal,
            promptAutoApproval,
          ),
        )
        throwIfAborted(operation.controller.signal)
        if (!isCurrentGeneration(operation)) throw createAbortError()
        appendAssistant(operation.sessionId, response)

        const autoApproveMutations =
          operation.autoApproveMutations &&
          (useSettingsStore.getState().aiAutoApproveMutations ?? false)
        const disposition = getToolCallDisposition(
          response.toolCalls,
          autoApproveMutations,
        )
        if (disposition === "none") return
        if (disposition === "approval") {
          setPendingProposals({
            calls: response.toolCalls,
            sessionId: operation.sessionId,
          })
          return
        }
        if (rounds >= MAX_TOOL_ROUNDS) return

        const hasMutations = response.toolCalls.some(isMutationTool)
        const completed = await executeTools(
          operation,
          response.toolCalls,
          hasMutations,
          hasMutations,
        )
        if (!completed) return
      }
    },
    [
      waitForDemoChatCooldown,
      buildRequest,
      isCurrentGeneration,
      appendAssistant,
      executeTools,
    ],
  )

  const handleApproveProposals = useCallback(async () => {
    if (!pendingProposals || isLoading) return
    const { calls, sessionId } = pendingProposals
    if (!useChatStore.getState().getSession(sessionId)) {
      setPendingProposals(null)
      return
    }
    const operation = startGeneration(sessionId)
    setPendingProposals(null)
    setError(null)
    try {
      await executeTools(operation, calls, true)
      await runFollowUpRound(operation)
    } catch (err) {
      if (isCurrentGeneration(operation)) reportError(err)
    } finally {
      finishGeneration(operation)
    }
  }, [
    pendingProposals,
    isLoading,
    executeTools,
    runFollowUpRound,
    reportError,
    startGeneration,
    isCurrentGeneration,
    finishGeneration,
  ])

  const handleRejectProposals = useCallback(async () => {
    if (!pendingProposals || isLoading) return
    const { sessionId } = pendingProposals
    if (!useChatStore.getState().getSession(sessionId)) {
      setPendingProposals(null)
      return
    }
    const operation = startGeneration(sessionId, false)
    setPendingProposals(null)
    setError(null)
    try {
      addInternalNote(
        sessionId,
        "The user REJECTED the proposed tool calls above. Do NOT apply any proposed changes. State briefly that no changes were applied, without an offer or follow-up question.",
      )
      await runFollowUpRound(operation)
    } catch (err) {
      if (isCurrentGeneration(operation)) reportError(err)
    } finally {
      finishGeneration(operation)
    }
  }, [
    pendingProposals,
    isLoading,
    addInternalNote,
    runFollowUpRound,
    reportError,
    startGeneration,
    isCurrentGeneration,
    finishGeneration,
  ])

  const handleSendMessage = useCallback(async () => {
    const trimmed = inputValue.trim()
    if (!trimmed || isLoading || pendingProposals || !hasActiveKey) return

    if (isQuotaExceeded) {
      setError(t("chat.demoQuotaExceeded"))
      return
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    }

    const sessionId =
      activeSessionId && useChatStore.getState().getSession(activeSessionId)
        ? activeSessionId
        : createSession(t("chat.welcome")).id
    addMessageToSession(sessionId, userMessage)
    const operation = startGeneration(sessionId)
    setInputValue("")
    setError(null)

    try {
      const session = useChatStore.getState().getSession(sessionId)
      const response = await sendChatMessage(
        buildRequest(
          session?.messages ?? [userMessage],
          operation.controller.signal,
          operation.autoApproveMutations,
        ),
      )
      throwIfAborted(operation.controller.signal)
      if (!isCurrentGeneration(operation)) throw createAbortError()
      appendAssistant(sessionId, response)

      const autoApproveMutations =
        operation.autoApproveMutations &&
        (useSettingsStore.getState().aiAutoApproveMutations ?? false)
      const disposition = getToolCallDisposition(
        response.toolCalls,
        autoApproveMutations,
      )
      if (disposition === "approval") {
        setPendingProposals({ calls: response.toolCalls, sessionId })
      } else if (disposition === "execute") {
        const hasMutations = response.toolCalls.some(isMutationTool)
        const completed = await executeTools(
          operation,
          response.toolCalls,
          hasMutations,
          hasMutations,
        )
        if (!completed) return
        await runFollowUpRound(operation)
      }
    } catch (err) {
      if (isCurrentGeneration(operation)) reportError(err)
    } finally {
      finishGeneration(operation)
    }
  }, [
    inputValue,
    isLoading,
    pendingProposals,
    hasActiveKey,
    isQuotaExceeded,
    activeSessionId,
    buildRequest,
    appendAssistant,
    executeTools,
    runFollowUpRound,
    reportError,
    addMessageToSession,
    createSession,
    startGeneration,
    isCurrentGeneration,
    finishGeneration,
    t,
  ])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleNewChat = () => {
    stopGeneration()
    createSession(t("chat.welcome"))
    setIsHistoryOpen(false)
    setPendingProposals(null)
    setError(null)
  }

  const handleClearCurrentChat = () => {
    stopGeneration()
    clearActiveSession(t("chat.welcome"))
    setPendingProposals(null)
    setError(null)
  }

  const handleUseDemoApi = () => {
    setLocalDemoOverride(true)
  }

  const handleSelectSession = (sessionId: string) => {
    stopGeneration()
    selectSession(sessionId)
    setPendingProposals(null)
    setError(null)
    setIsHistoryOpen(false)
  }

  const handleDeleteSession = (sessionId: string) => {
    stopGeneration()
    deleteSession(sessionId)
    setPendingProposals(null)
    setError(null)
  }

  const handleOpenHistory = () => {
    stopGeneration()
    setIsHistoryOpen(true)
  }

  return (
    <>
      {/* Chat Panel */}
      <div
        ref={chatPanelRef}
        className={`fixed bottom-20 right-4 z-50 select-none origin-bottom-right ${
          isResizing ? "" : "transition-all duration-300 ease-out"
        } ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        }`}
        style={{
          width: `min(${panelSize.width}px, calc(100vw - 2rem))`,
          height: `min(${panelSize.height}px, calc(100vh - 96px))`,
        }}
      >
        {/* Resize handles (desktop only; panel spans full width on mobile) */}
        <div
          className="absolute -top-1.5 -left-1.5 z-30 w-4 h-4 cursor-nwse-resize touch-none hidden sm:block"
          onPointerDown={startResize("corner")}
        />
        <div
          className="absolute -top-1.5 left-3 right-3 z-30 h-2 cursor-ns-resize touch-none hidden sm:block"
          onPointerDown={startResize("top")}
        />
        <div
          className="absolute -left-1.5 top-3 bottom-3 z-30 w-2 cursor-ew-resize touch-none hidden sm:block"
          onPointerDown={startResize("left")}
        />

        <div className="flex flex-col h-full rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2.5 min-w-0">
              {isHistoryOpen ? (
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-1 rounded-lg hover:bg-primary-foreground/15 transition-colors shrink-0"
                  title={t("chat.backToChat")}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              ) : (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-foreground/15 shrink-0">
                  <Bot className="w-4.5 h-4.5" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-sm font-semibold truncate">
                  {isHistoryOpen
                    ? t("chat.history")
                    : activeSession?.title || t("chat.title")}
                </h3>
                <p className="text-[10px] opacity-80 truncate">
                  {isHistoryOpen
                    ? `${sessions.length} conversations`
                    : t("chat.subtitle")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!isHistoryOpen && (
                <>
                  <button
                    onClick={handleNewChat}
                    className="p-1.5 rounded-lg hover:bg-primary-foreground/15 transition-colors"
                    title={t("chat.newChat")}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleOpenHistory}
                    className="p-1.5 rounded-lg hover:bg-primary-foreground/15 transition-colors"
                    title={t("chat.history")}
                  >
                    <History className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleClearCurrentChat}
                    className="p-1.5 rounded-lg hover:bg-primary-foreground/15 transition-colors"
                    title={t("chat.clearChat")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-primary-foreground/15 transition-colors"
                title={t("chat.close")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Demo API Banner */}
          {isUsingDemo && !isHistoryOpen && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-400">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles className="w-3 h-3 shrink-0" />
                <span className="text-[10px] font-medium truncate">
                  {t("chat.usingDemoApi")}
                </span>
              </div>
              <span className="text-[10px] font-semibold shrink-0 bg-amber-500/20 px-1.5 py-0.5 rounded">
                {t("settings.demoChatQuota", {
                  used: demoChatCount,
                  max: MAX_DEMO_CHAT_MESSAGES,
                })}
              </span>
            </div>
          )}

          {aiAutoApproveMutations && !isHistoryOpen && (
            <div className="flex items-center gap-1.5 border-b border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-rose-700 dark:text-rose-400">
              <ShieldAlert className="h-3 w-3 shrink-0" />
              <span className="truncate text-[10px] font-medium">
                {t("chat.autoApprovalEnabled")}
              </span>
            </div>
          )}

          {/* History View Overlay */}
          {isHistoryOpen ? (
            <div className="flex-1 flex flex-col overflow-y-auto px-3 py-3 space-y-2">
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("chat.history")}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNewChat}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="w-3 h-3" />
                  {t("chat.newChat")}
                </Button>
              </div>

              {sessions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground text-xs">
                  <History className="w-8 h-8 mb-2 opacity-40" />
                  <p>{t("chat.noHistory")}</p>
                </div>
              ) : (
                sessions.map((s) => {
                  const isActive = s.id === activeSessionId
                  const firstUserMsg = s.messages.find((m) => m.role === "user")
                  const displayTitle =
                    s.title ||
                    (firstUserMsg
                      ? firstUserMsg.content.slice(0, 35)
                      : t("chat.untitledChat"))
                  const dateStr = new Date(s.updatedAt).toLocaleDateString(
                    i18n.language === "tr" ? "tr-TR" : "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )

                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSession(s.id)}
                      className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? "border-primary/50 bg-primary/10 text-foreground"
                          : "border-border/60 bg-muted/40 hover:bg-muted text-foreground"
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold truncate">
                            {displayTitle}
                          </p>
                          {isActive && (
                            <span className="text-[9px] bg-primary text-primary-foreground font-bold px-1.5 py-0.5 rounded-full shrink-0">
                              {t("chat.activeChat")}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                          {s.messages.length} msgs • {dateStr}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSession(s.id)
                        }}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-80 group-hover:opacity-100 shrink-0"
                        title={t("chat.deleteSession")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          ) : (
            /* Active Messages View */
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scroll-smooth">
              {messages.map((msg) => {
                if (msg.internal) {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/80 bg-muted/60 px-2 py-0.5 rounded-full">
                        <Wrench className="w-2.5 h-2.5" />
                        {t("chat.toolExecuted")}
                      </span>
                    </div>
                  )
                }

                const visibleContent =
                  msg.role === "assistant"
                    ? stripToolCalls(msg.content)
                    : msg.content
                if (!visibleContent) return null

                return (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}
                    >
                      {msg.role === "assistant"
                        ? formatMessageContent(visibleContent)
                        : msg.content}
                    </div>
                  </div>
                )
              })}

              {/* Tool Call Approval Card */}
              {pendingProposals !== null &&
                pendingProposals.calls.some(isMutationTool) && (
                  <div className="border border-primary/40 bg-primary/5 dark:bg-primary/10 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-foreground">
                      {t("chat.proposalTitle")}
                    </p>
                    <ul className="space-y-1">
                      {pendingProposals.calls
                        .filter(isMutationTool)
                        .map((call, idx) => (
                          <li
                            key={`${call.tool}-${idx}`}
                            className="text-[11px] text-muted-foreground leading-relaxed"
                          >
                            <span className="text-primary mr-1.5">•</span>
                            {describeMutationCall(call, () => currentParams)}
                          </li>
                        ))}
                    </ul>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={handleApproveProposals}
                        disabled={isLoading}
                        className="text-xs flex-1"
                      >
                        {t("chat.proposalApply")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRejectProposals}
                        disabled={isLoading}
                        className="text-xs flex-1"
                      >
                        {t("chat.proposalReject")}
                      </Button>
                    </div>
                  </div>
                )}

              {/* Typing Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted text-muted-foreground rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[13px] flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t("chat.thinking")}</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex justify-center">
                  <div className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-xs border border-destructive/20 text-center">
                    {error}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* No API Key / Quota Exceeded State */}
          {!isHistoryOpen &&
            (!hasActiveKey || (isQuotaExceeded && !isLoading)) && (
              <div className="px-4 py-3 border-t border-border bg-muted/30 space-y-2">
                <p className="text-xs text-muted-foreground text-center">
                  {isQuotaExceeded
                    ? t("chat.demoQuotaExceeded")
                    : t("chat.noApiKey")}
                </p>
                <div className="flex items-center justify-center gap-2">
                  {hasDemoKey && !isUsingDemo && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleUseDemoApi}
                      className="text-xs gap-1.5"
                    >
                      <Sparkles className="w-3 h-3" />
                      {t("chat.useDemoApi")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleClose()
                      onOpenSettings()
                    }}
                    className="text-xs gap-1.5"
                  >
                    <Settings className="w-3 h-3" />
                    {t("chat.configureInSettings")}
                  </Button>
                </div>
                {hasDemoKey && !isUsingDemo && (
                  <p className="text-[10px] text-muted-foreground/70 text-center">
                    {t("chat.demoApiNote")}
                  </p>
                )}
              </div>
            )}

          {/* Input Area */}
          {!isHistoryOpen &&
            hasActiveKey &&
            (!isQuotaExceeded || isLoading) && (
              <div className="flex items-end gap-2 px-3 py-3 border-t border-border bg-card">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("chat.placeholder")}
                  rows={1}
                  className="flex-1 resize-none bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 max-h-24 scrollbar-thin"
                  style={{
                    height: "auto",
                    minHeight: "40px",
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = "auto"
                    target.style.height = `${Math.min(target.scrollHeight, 96)}px`
                  }}
                  disabled={isLoading || pendingProposals !== null}
                />
                {isLoading ? (
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={stopGeneration}
                    className="shrink-0 rounded-xl h-10 w-10"
                    title={t("chat.stopGenerating")}
                    aria-label={t("chat.stopGenerating")}
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || pendingProposals !== null}
                    className="shrink-0 rounded-xl h-10 w-10"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
        </div>
      </div>

      {/* FAB (Floating Action Button) */}
      <button
        onClick={() => (isOpen ? handleClose() : setIsOpen(true))}
        className={`fixed bottom-4 right-4 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
          isOpen
            ? "bg-muted text-muted-foreground hover:bg-muted/80 rotate-0"
            : "bg-primary text-primary-foreground hover:bg-primary/90 rotate-0"
        } hover:scale-105 active:scale-95`}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        <div className="relative w-6 h-6">
          <MessageCircle
            className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${
              isOpen
                ? "opacity-0 rotate-90 scale-0"
                : "opacity-100 rotate-0 scale-100"
            }`}
          />
          <X
            className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${
              isOpen
                ? "opacity-100 rotate-0 scale-100"
                : "opacity-0 -rotate-90 scale-0"
            }`}
          />
        </div>
      </button>
    </>
  )
}
