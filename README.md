# MoneyTrace 💸📈

**Inflation-Adjusted Portfolio Projection & Simulation Tool**

MoneyTrace is a modern, currency-agnostic web application designed to project investment growth, compound interest, Dollar-Cost Averaging (DCA), and real purchasing power erosion caused by inflation worldwide.

![MoneyTrace Dashboard](public/favicon.svg)

---

## 🚀 Features

- **Real vs. Nominal Balance:** Instantly see the erosion effect of inflation on your investment's purchasing power.
- **Global Currency Support:** Select any local currency (USD, EUR, GBP, JPY, CAD, AUD, TRY, BRL, INR, etc.) and format amounts automatically.
- **Compound Growth & DCA Simulation:** Model monthly Dollar-Cost Averaging with optional annual contribution increase rates.
- **Reference Currency Tracking:** Track your local portfolio against a reference currency (USD) with customizable exchange rate growth projections.
- **Dynamic Scenario Management:** Create, compare side-by-side, clone, and set baseline scenarios (e.g., Optimistic, Conservative, Market Growth).
- **AI Economic Forecast (BYO API Key):** Generate inflation, exchange rate, and return expectations for your currency in one click via Google Gemini, OpenAI, or any custom OpenAI-compatible endpoint (OpenRouter, Groq, LM Studio, Ollama). Your key never leaves the browser.
- **Interactive Visualizations:** Built-in Recharts performance growth lines and inflation purchasing power loss area charts.
- **Data Export & Import:** Export full projection tables to Excel-compatible CSV files or backup/restore scenarios in JSON format.
- **Multi-Language (i18n):** Native support for English and Turkish, with extensible internationalization.
- **100% Client-Side & Private:** All data remains strictly in your browser's `localStorage`. No server uploads or tracking.

---

## 🛠️ Tech Stack

- **Core:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4, Lucide Icons, shadcn/ui
- **State & Persistence:** Zustand with `persist` middleware
- **Visualization:** Recharts
- **Internationalization:** i18next, react-i18next
- **AI Providers:** Google Gemini, OpenAI, custom OpenAI-compatible endpoints (user-supplied API keys)

---

## 📦 Getting Started

### Prerequisites

- Node.js (v20.19.0 or higher)
- npm or yarn / pnpm / bun

### Installation & Local Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Metee01/MoneyTrace.git
   cd MoneyTrace
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start local dev server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Lint & Code Audit:**
   ```bash
   npm run lint
   ```

---

## 🤖 AI Economic Forecast & CORS Proxy

### How it works

The **AI Forecast** button (sparkles icon on the portfolio form) calls an LLM provider with your portfolio's currency and horizon, asking it to estimate average inflation, FX appreciation, portfolio return, and the current exchange rate. The result can fill the form in one click.

You bring your own API key — it is stored in `localStorage` and is only sent directly to the provider (or proxy) you selected.

### Providers

| Provider | Notes |
| --- | --- |
| **Google Gemini** | Free API key from [AI Studio](https://aistudio.google.com/apikey) |
| **OpenAI** | API key from [platform.openai.com](https://platform.openai.com/api-keys) |
| **Custom (OpenAI-compatible)** | OpenRouter, Groq, LM Studio, Ollama, local servers — any endpoint with `/chat/completions`. API key optional for local servers. |

### What is a CORS proxy and when do you need it?

Browsers block websites from calling third-party APIs unless the API sends CORS headers. Most providers (Gemini, OpenAI, OpenRouter, local servers) work directly from the browser. A few custom providers — e.g. **OpenCode Zen** — block direct browser access, so the request fails with a network/CORS error.

A **CORS proxy** is a small public (or self-hosted) server that forwards your request to the provider and returns the response with permissive CORS headers, letting the browser accept it.

### How to use it

1. Open the **AI Forecast** modal → select **Custom (OpenAI-compatible)** as the provider.
2. Enable the **"Use CORS proxy"** switch — the URL field appears only while it is on.
3. Paste a proxy URL that contains a `{url}` placeholder. The app replaces `{url}` with the encoded target endpoint:
   ```
   https://corsproxy.io/?url={url}
   ```
4. Predict as usual. If the proxy is off, no proxy is used.

> ⚠️ **Security:** your request — including the API key — travels through the proxy. Only use proxies you trust, or self-host one (e.g. a [CORS Anywhere](https://github.com/Rob--W/cors-anywhere)-style relay with a `{url}` placeholder).

---

## 📁 Project Structure

```
MoneyTrace/
├── public/                 # Static assets & favicon
├── src/
│   ├── components/         # React UI components
│   │   ├── layout/         # Header, Footer, Layout wrapper
│   │   ├── portfolio/      # Input parameters form, presets & AI forecast modal
│   │   ├── projection/     # Summary cards, charts, monthly detail table
│   │   ├── scenarios/      # Scenario manager & comparison dialogs
│   │   └── ui/             # Reusable UI elements (buttons, cards, inputs, dialogs, switch)
│   ├── engine/             # Financial engines (compounding, inflation adjustment, FX)
│   ├── hooks/              # Custom React hooks (useTheme)
│   ├── lib/                # Formatters, export helpers, i18n setup, AI service, version
│   ├── locales/            # Translation JSON files (en, tr)
│   ├── store/              # Zustand state stores (portfolio, settings)
│   ├── types/              # TypeScript interfaces & types
│   ├── App.tsx             # Main dashboard layout
│   └── main.tsx            # Application entry point
├── vercel.json             # Vercel deployment configuration
└── package.json            # Dependencies and scripts
```

---

## 🔖 Versioning

The current version is shown in the header badge and in **Settings**. To release a new version, bump the version in two places — both must match:

1. `package.json` → `"version": "X.Y.Z"` (and `package-lock.json` will follow on the next `npm install`)
2. `src/lib/version.ts` → `APP_VERSION = "X.Y.Z"`

The header and Settings dialog read from `src/lib/version.ts` automatically.

---

## 🤝 Contributing

Contributions are welcome! Please check out [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on code style, Pull Requests, and adding new language translations.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
