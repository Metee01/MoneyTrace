/**
 * MoneyTrace - AI Chat Component
 *
 * Floating Action Button (FAB) + Chat Panel for conversational AI.
 * Uses portfolio data as context for AI responses.
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
} from "lucide-react"
import { Button } from "../ui/button"
import {
  useSettingsStore,
  usePortfolioStore,
  MAX_DEMO_CHAT_MESSAGES,
} from "../../store"
import { calculateProjection } from "../../engine"
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
      nodes.push(
        <em key={`i-${lineIdx}-${match.index}`}>{match[3]}</em>,
      )
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

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: generateId(),
      role: "assistant",
      content: t("chat.welcome"),
      timestamp: Date.now(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localDemoOverride, setLocalDemoOverride] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatPanelRef = useRef<HTMLDivElement>(null)

  const demoApiKey = useMemo(() => getDemoApiKey(), [])
  const hasDemoKey = demoApiKey.length > 0
  const isUsingDemo = (useDemoApi || localDemoOverride) && hasDemoKey
  const isQuotaExceeded = isUsingDemo && demoChatCount >= MAX_DEMO_CHAT_MESSAGES

  // Determine active API key
  const activeApiKey = isUsingDemo ? demoApiKey : (aiApiKey ?? "")
  const activeProvider: AiModelProvider =
    isUsingDemo ? "gemini" : (aiModelProvider ?? "gemini")
  const hasActiveKey = activeApiKey.trim().length > 0

  // Calculate projection for context
  const projectionResult = useMemo(() => {
    try {
      return calculateProjection(currentParams)
    } catch {
      return null
    }
  }, [currentParams])

  // Build portfolio context
  const portfolioContext: PortfolioContext = useMemo(
    () => ({
      params: currentParams,
      summary: projectionResult?.summary ?? null,
      currencyCode,
      language: i18n.language,
    }),
    [currentParams, projectionResult, currencyCode, i18n.language],
  )

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

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

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setError(null)
    setIsLoading(true)

    try {
      const allMessages = [...messages, userMessage]
      const responseText = await sendChatMessage({
        provider: activeProvider,
        apiKey: activeApiKey,
        model: isUsingDemo ? "" : (aiModel ?? ""),
        baseUrl: aiBaseUrl ?? "",
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

      setMessages((prev) => [...prev, assistantMessage])
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
    isUsingDemo,
    aiModel,
    aiBaseUrl,
    aiCorsProxy,
    aiCorsProxyEnabled,
    portfolioContext,
    t,
  ])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleClearChat = () => {
    setMessages([
      {
        id: generateId(),
        role: "assistant",
        content: t("chat.welcome"),
        timestamp: Date.now(),
      },
    ])
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
        className={`fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] sm:w-[400px] transition-all duration-300 ease-out origin-bottom-right ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="flex flex-col h-[min(70vh,560px)] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-foreground/15 shrink-0">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold truncate">
                  {t("chat.title")}
                </h3>
                <p className="text-[10px] opacity-80 truncate">
                  {t("chat.subtitle")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg hover:bg-primary-foreground/15 transition-colors"
                title={t("chat.clearChat")}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-primary-foreground/15 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Demo API Banner */}
          {isUsingDemo && (
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

          {/* Messages Area */}
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

          {/* No API Key / Quota Exceeded State */}
          {(!hasActiveKey || isQuotaExceeded) && (
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
          {hasActiveKey && !isQuotaExceeded && (
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
              isOpen ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
            }`}
          />
          <X
            className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${
              isOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
            }`}
          />
        </div>
      </button>
    </>
  )
}
