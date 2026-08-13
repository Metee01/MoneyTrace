/**
 * MoneyTrace - Central Application Configuration
 *
 * All global app settings, AI defaults, demo limits, security thresholds,
 * and engine parameters can be configured here.
 */

export const APP_CONFIG = {
  /** Application metadata */
  app: {
    name: "MoneyTrace",
    version: "1.3.0",
    defaultLanguage: "en",
    defaultCurrencyCode: "USD",
    defaultCurrencySymbol: "$",
    supportedLanguages: ["en", "tr"] as const,
  },

  /** AI Service & Provider Configuration */
  ai: {
    /** Default model names for providers */
    models: {
      gemini: "gemini-3.6-flash",
      openai: "gpt-4o-mini",
      /** Model used for Demo API requests */
      demo: "deepseek/deepseek-v4-flash-0731",
    },
    /** Default max response tokens for AI completion requests */
    maxTokens: 8000,
    /** Provider base endpoints */
    endpoints: {
      geminiBase: "https://generativelanguage.googleapis.com/v1beta/models",
      openaiBase: "https://api.openai.com/v1/chat/completions",
    },
    /** Demo API usage quotas, provider configuration & security limits */
    demo: {
      /** Provider used for Demo API requests ("gemini" | "openai" | "custom") */
      provider: "custom" as const,
      /** Base URL for Demo API requests when provider is "custom" (e.g. OpenRouter or custom endpoint) */
      baseUrl: "https://openrouter.ai/api/v1",
      /** Maximum allowed economic forecast predictions using Demo API */
      maxForecasts: 5,
      /** Maximum allowed chat messages using Demo API */
      maxChatMessages: 15,
      /** Maximum allowed user prompt character length per chat message on Demo API */
      maxMessageLength: 500,
      /** Rate-limiting cooldown period between messages in milliseconds */
      cooldownMs: 3000,
    },
    /** Direct links to acquire API keys */
    links: {
      geminiKey: "https://aistudio.google.com/apikey",
      openaiKey: "https://platform.openai.com/api-keys",
    },
  },

  /** Financial Calculation Engine Limits & Defaults */
  engine: {
    maxTargetYears: 50,
    maxTargetMonths: 600,
    roundingDecimals: 2,
    defaultParams: {
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
    },
  },
} as const

export type AppConfig = typeof APP_CONFIG
