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
  getDemoApiKey,
  type PortfolioContext,
} from "../../lib/ai-chat-service"
import { AiForecastError } from "../../lib/ai-service"
import type { ChatMessage, AiModelProvider } from "../../types"

interface AiChatProps {
  onOpenSettings: () => void
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
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
    addMessageToActiveSession,
    clearActiveSession,
  } = useChatStore()

  const [isOpen, setIsOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localDemoOverride, setLocalDemoOverride] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatPanelRef = useRef<HTMLDivElement>(null)

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

  const messages = activeSession?.messages ?? []

  const demoApiKey = useMemo(() => getDemoApiKey(), [])
  const hasDemoKey = demoApiKey.length > 0
  const isUsingDemo = (useDemoApi || localDemoOverride) && hasDemoKey
  const isQuotaExceeded = isUsingDemo && demoChatCount >= MAX_DEMO_CHAT_MESSAGES

  // Determine active API key and provider configuration
  const activeApiKey = isUsingDemo ? demoApiKey : (aiApiKey ?? "")
  const activeProvider: AiModelProvider = isUsingDemo
    ? (APP_CONFIG.ai.demo.provider as AiModelProvider)
    : (aiModelProvider ?? "gemini")
  const activeModel = isUsingDemo ? APP_CONFIG.ai.models.demo : (aiModel ?? "")
  const activeBaseUrl = isUsingDemo
    ? (APP_CONFIG.ai.demo.baseUrl ?? "")
    : (aiBaseUrl ?? "")
  const hasActiveKey = activeApiKey.trim().length > 0

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
        setIsOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  const handleSendMessage = useCallback(async () => {
    const trimmed = inputValue.trim()
    if (!trimmed || isLoading || !hasActiveKey) return

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

    addMessageToActiveSession(userMessage)
    setInputValue("")
    setError(null)
    setIsLoading(true)

    try {
      const allMessages = [...messages, userMessage]
      const responseText = await sendChatMessage({
        provider: activeProvider,
        apiKey: activeApiKey,
        model: activeModel,
        baseUrl: activeBaseUrl,
        corsProxy: aiCorsProxyEnabled ? (aiCorsProxy ?? "") : "",
        messages: allMessages,
        context: portfolioContext,
        isDemo: isUsingDemo,
      })

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: responseText,
        timestamp: Date.now(),
      }

      addMessageToActiveSession(assistantMessage)
    } catch (err) {
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
    } finally {
      setIsLoading(false)
    }
  }, [
    inputValue,
    isLoading,
    hasActiveKey,
    isQuotaExceeded,
    messages,
    activeProvider,
    activeApiKey,
    activeModel,
    activeBaseUrl,
    aiCorsProxy,
    aiCorsProxyEnabled,
    portfolioContext,
    isUsingDemo,
    addMessageToActiveSession,
    t,
  ])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleNewChat = () => {
    createSession(t("chat.welcome"))
    setIsHistoryOpen(false)
    setError(null)
  }

  const handleClearCurrentChat = () => {
    clearActiveSession(t("chat.welcome"))
    setError(null)
  }

  const handleUseDemoApi = () => {
    setLocalDemoOverride(true)
  }

  return (
    <>
      {/* Chat Panel */}
      <div
        ref={chatPanelRef}
        className={`fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] sm:w-[420px] transition-all duration-300 ease-out origin-bottom-right ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="flex flex-col h-[min(70vh,580px)] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
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
                    onClick={() => setIsHistoryOpen(true)}
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
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-primary-foreground/15 transition-colors"
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
                      onClick={() => {
                        selectSession(s.id)
                        setIsHistoryOpen(false)
                      }}
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
                          deleteSession(s.id)
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
              {messages.map((msg) => (
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
                      ? formatMessageContent(msg.content)
                      : msg.content}
                  </div>
                </div>
              ))}

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
          {!isHistoryOpen && (!hasActiveKey || isQuotaExceeded) && (
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
                    setIsOpen(false)
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
          {!isHistoryOpen && hasActiveKey && !isQuotaExceeded && (
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
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="shrink-0 rounded-xl h-10 w-10"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* FAB (Floating Action Button) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
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
