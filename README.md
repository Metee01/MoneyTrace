# 💸 MoneyTrace

### Privacy-First Investment Projection & AI Simulation Engine

**[MoneyTrace](https://moneytrace.metee.com.tr)** is a privacy-first investment projection and simulation tool designed to help investors understand how their wealth grows over time through compound interest and Dollar-Cost Averaging (DCA) strategies — while revealing the real impact of inflation on purchasing power. All calculations run locally in your browser; the only server-side component is the optional Demo API proxy.

Featuring an **AI Financial Assistant Chat** and **AI-powered Economic Forecasting**, MoneyTrace gives you data-driven insights into your portfolio projections without storing your financial data on any external server.

---

<p align="center">
  <a href="https://moneytrace.metee.com.tr"><strong>🌐 Launch Live Demo</strong></a> &nbsp;|&nbsp;
  <a href="https://github.com/Metee01/MoneyTrace"><strong>💻 GitHub Repository</strong></a>
</p>

---

## ✨ Key Features

### 1. 📈 Real vs. Nominal Value Comparison
- Compare nominal balance growth alongside **inflation-adjusted purchasing power**.
- Understand not just how large your future balance numbers appear, but what that money can actually buy in today's terms.

### 2. 🤖 AI Financial Assistant Chat
- Interactive floating chat widget (bottom-right FAB) ready to answer questions about your active portfolio projections.
- Analyzes compound returns, risk horizons, and DCA strategy variations (e.g., *"What happens if I increase my DCA by 5% annually?"*).
- **100% Private:** Full portfolio context is constructed entirely client-side before sending queries to your selected AI provider.

### 3. ⚡ AI Economic Forecasting
- One-click macroeconomic parameter estimates (projected inflation rates, annual returns, currency exchange rates).
- Auto-fills investment inputs using real-time market projections.

### 4. 🔑 Flexible AI Configuration & Demo Mode
Configure your AI experience inside the **Settings** dialog:
- **Demo API Mode:** Test AI chat and forecasting out-of-the-box with free quotas (5 forecasts, 15 chat messages).
- **Bring Your Own Key (BYOK):** Connect your own API key for unlimited AI interactions.
- **Supported Providers:** Google Gemini (`gemini-3.6-flash`), OpenAI (`gpt-4o-mini`), and custom OpenAI-compatible APIs (OpenRouter, Groq, LM Studio, Ollama, etc.).
- **Built-in Security:** Server-enforced quotas and cooldowns, prompt length limits, and prompt injection protection safeguards.

### 5. 🌍 Global Currency Support
- Fully currency-agnostic: Supports **USD**, **EUR**, **GBP**, **JPY**, **CAD**, **AUD**, **TRY**, **BRL**, **INR**, and more.
- Automatically formats numbers according to chosen currency standards.

### 6. 💰 Compound Growth & DCA Simulation
Simulate comprehensive financial models up to **50 years** (600 months):
- Initial capital & monthly DCA contributions
- Compound annual return rate
- Annual DCA contribution increases (%)
- Monthly cash withdrawals
- Withholding tax deductions (%)
- Inflation rate adjustments

### 7. 💱 Reference Currency Tracking
- Track local currency portfolios against a benchmark reference currency (e.g., USD).
- Model projected exchange-rate growth to evaluate foreign currency exposure over long horizons.

### 8. 🎯 Scenario Management
- Create, clone, edit, compare, and set baseline portfolio scenarios.
- Pre-configured defaults included: **Optimistic**, **Market Growth**, **Conservative**, and **Custom**.
- Side-by-side scenario comparison table and metrics.

### 9. 📊 Interactive Visualizations
Visual analytics powered by **Recharts**:
- **Portfolio Growth:** Nominal vs. Real Balance vs. Invested Capital
- **Reference Currency Balance:** Valuation in reference currency ($)
- **Inflation Impact:** Purchasing power loss visualization

### 10. 📁 Export & Import
- **CSV Export:** Full year-by-year and month-by-month projection tables.
- **JSON Backup:** Export all scenarios to JSON and restore them seamlessly across browsers or devices.

### 11. 🌐 Internationalization (i18n)
- Seamless language switching: **English (en)** and **Turkish (tr)**.

### 12. 🔒 Privacy-First Architecture
- **100% Client-Side Engine:** All financial calculations run locally in your browser.
- **No Tracking:** Zero database storage, no user accounts, no analytics tracking of your financial inputs.
- **Local Persistence:** Data is saved locally using Zustand `persist` middleware in `localStorage`.
- **Optional Demo Proxy:** When demo mode is enabled, requests pass through a serverless proxy (`api/demo.ts`) that owns the shared demo key and enforces quotas server-side — your portfolio data is never stored on it.

---

## 🛠️ Tech Stack

| Category | Technology & Libraries |
| :--- | :--- |
| **Framework & Language** | React 19, TypeScript, Vite 8 |
| **Styling & UI** | Tailwind CSS v4 (`@tailwindcss/vite` plugin), `@base-ui/react` (shadcn base-nova style), Lucide Icons |
| **State & Storage** | Zustand (with `persist` middleware -> `localStorage`) |
| **Charts** | Recharts |
| **Internationalization** | i18next & react-i18next |
| **Styling Utilities** | `class-variance-authority`, `clsx`, `tailwind-merge` |
| **Analytics** | `@vercel/analytics` |
| **Backend (optional)** | Vercel Edge Function (`api/demo.ts`), `@upstash/redis` (optional persistent quota counters) |

> **Note:** Tailwind CSS v4 is integrated directly via the `@tailwindcss/vite` plugin without a `tailwind.config` file. Theme configuration and custom CSS variables are located in `src/index.css`.

---

## ⚙️ Central Configuration (`src/config/index.ts`)

All application settings, AI model configurations, demo quota limits, and default engine parameters are managed centrally in `src/config/index.ts`:

```typescript
// Abbreviated summary of APP_CONFIG
export const APP_CONFIG = {
  app: {
    name: "MoneyTrace",
    version: "x.x.x",
    defaultLanguage: "en",
    defaultCurrencyCode: "USD",
  },
  ai: {
    models: {
      gemini: "gemini-3.6-flash",
      openai: "gpt-4o-mini",
      demo: "nvidia/nemotron-3-ultra-550b-a55b:free",
    },
    demo: { maxForecasts: 5, maxChatMessages: 15, maxMessageLength: 500, cooldownMs: 3000 },
    // ...
  },
  engine: {
    maxTargetYears: 50,
    maxTargetMonths: 600,
    roundingDecimals: 2,
    defaultParams: { /* ... */ }
  }
};
```

---

## 📂 Project Structure

```text
MoneyTrace/
├── api/                    # Vercel serverless demo proxy (demo.ts) — owns the demo API key
├── public/                 # Static assets & favicon
├── src/
│   ├── components/
│   │   ├── chat/          # AI Chat FAB widget & panel (AiChat.tsx)
│   │   ├── layout/        # Header, Footer, Layout wrapper
│   │   ├── portfolio/     # Portfolio input form & AI Forecast modal
│   │   ├── projection/    # Summary cards, Recharts section, detail table
│   │   ├── scenarios/     # Scenario manager & comparison dialog
│   │   └── ui/            # Base UI primitives (Button, Card, Dialog, Input, Label, Select, Separator, Switch, Tabs, Tooltip)
│   ├── config/            # Central app configuration (APP_CONFIG)
│   ├── engine/            # Pure deterministic financial math (compound-growth, inflation-adjust, currency-convert)
│   ├── hooks/             # Custom hooks (useTheme)
│   ├── lib/               # AI service, AI chat service, demo-proxy client, formatters, export, i18n, utils
│   ├── locales/           # Translation dictionaries (en, tr)
│   ├── store/             # Zustand stores (portfolio-store, settings-store)
│   ├── types/             # TypeScript interfaces & types
│   ├── App.tsx            # Main application entry & Settings dialog
│   ├── index.css          # Tailwind CSS v4 theme & CSS custom properties
│   └── main.tsx           # React DOM entry point
├── .env.example           # Demo proxy configuration
├── vercel.json            # Vercel SPA rewrites (/api/* excluded)
├── vite.config.ts         # Vite config with React & Tailwind plugins
├── tsconfig.app.json      # TypeScript config with path alias @/* -> src/*
├── eslint.config.js       # ESLint flat config
├── package.json
└── README.md
```

---

## 💻 Prerequisites & Installation

### Requirements
- **Node.js**: `>= 20.19`
- **npm** or preferred package manager

### Setup Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Metee01/MoneyTrace.git
   cd MoneyTrace
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Run linters and test suites:**
   ```bash
   npm run lint
   npm run test
   ```

---

## 🔑 Environment Variables

The shared demo API key is **server-only** and never ships in the client bundle. The client only knows the proxy address.

### Local development (`.env`)

```bash
# Optional: enables the "Use Demo API" option in the UI.
# Point it at a deployed proxy, e.g. https://your-site.vercel.app/api/demo
VITE_DEMO_PROXY_URL=
```

### Vercel deployment

Set these in **Vercel → Project → Settings → Environment Variables**:

| Variable | Value | Notes |
| :--- | :--- | :--- |
| `DEMO_API_KEY` | `sk-or-v1-...` | The shared demo API key (server-side only) |
| `VITE_DEMO_PROXY_URL` | `/api/demo` | Enables the Demo API option (Production) |

Optional: install the **Upstash Redis** integration from the Vercel Marketplace for persistent quota counters. Without it, the proxy falls back to in-memory counters.

---

## 🔒 Demo API Architecture

```
Browser ──▶ /api/demo (Vercel Edge Function) ──▶ AI Provider (OpenRouter)
              │
              ├─ Owns DEMO_API_KEY (env var, never in the bundle)
              ├─ Enforces per-user quotas (5 forecasts / 15 chat messages)
              ├─ Enforces per-IP daily caps and 3s chat cooldown
              └─ Optional Upstash Redis persistence for counters
```

- The demo key lives only in the serverless function's environment and is attached to the upstream request on the server — it cannot be extracted from the site's JavaScript.
- Quota counters are reserved atomically before each request and rolled back if the provider call fails.
- The client sends an anonymous persisted `demoUserId`; browser-storage resets no longer reset server-side quotas.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.