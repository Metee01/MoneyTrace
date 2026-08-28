<p align="center">
  <img src="public/favicon.svg" alt="MoneyTrace" width="64" height="64" />
</p>

<h1 align="center">MoneyTrace</h1>

<p align="center">
  <strong>See your money's real future — inflation-adjusted portfolio projection</strong>
</p>

<p align="center">
  <em>Compound growth & DCA simulation · Real vs. nominal value · AI financial assistant</em>
</p>

<p align="center">
  <a href="https://moneytrace.metee.com.tr">🌐 Live Demo</a> ·
  <a href="https://github.com/Metee01/MoneyTrace">GitHub</a>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img alt="Tailwind v4" src="https://img.shields.io/badge/Tailwind_CSS_v4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img alt="Zustand" src="https://img.shields.io/badge/Zustand-7F56D9?style=flat-square" />
  <img alt="Vercel" src="https://img.shields.io/badge/Vercel-111111?style=flat-square&logo=vercel&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

---

<img src="docs/screenshots/dashboard.png" alt="MoneyTrace dashboard — portfolio parameters, summary cards, and year-by-year projection table" width="100%" />

---

## Why MoneyTrace?

Most financial calculators show you **nominal numbers** — big future balances that quietly lose their purchasing power to inflation. MoneyTrace computes the numbers in **today's money**, so you see not only _how much_ you'll have, but _what it will actually buy_.

It's an open-source, privacy-first investment projection engine:

- **Core calculations run in your browser** — no account or application database is required, and portfolio data stays in local storage. Optional AI requests send relevant context to the provider or demo proxy you select.
- **Deterministic finance engine** — pure, testable math orchestrated in `src/engine/`; the UI only renders results.
- **AI that understands your portfolio** — an optional chat assistant and forecast tool that reads your actual projection context and answers real questions (e.g. _"What happens if I increase my DCA by 5% annually?"_).

## Features

|                                     |                                                                                                                                                                                 |
| :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 📈 **Real vs. Nominal value**       | Track both the raw balance and its inflation-adjusted purchasing power — two curves, one honest picture.                                                                        |
| 💰 **Compound growth & DCA engine** | Simulate up to **50 years**: initial capital, monthly DCA, annual contribution increases, withdrawals, optional estimated gain tax, and inflation.                              |
| 💱 **Multi-currency**               | USD, EUR, GBP, JPY, TRY, BRL, INR and more, with automatic locale-aware number formatting.                                                                                      |
| 📊 **Reference currency tracking**  | Benchmark local-currency portfolios against USD (or any reference) with projected FX growth.                                                                                    |
| 🤖 **AI Financial Assistant**       | Floating chat widget that analyzes your active projection — returns, horizons, DCA variants — and sends its context only when you use the selected AI provider.                 |
| ⚡ **AI Economic Forecasting**      | One click to estimate inflation, returns, and exchange rates, and auto-fill your portfolio inputs.                                                                              |
| 🔑 **Bring your own key**           | Gemini, OpenAI, or any OpenAI-compatible API (OpenRouter, Groq, Ollama, LM Studio…). A hosted **Demo API** mode lets visitors try the AI for free, with server-enforced quotas. |
| 🎯 **Scenario management**          | Create, clone, edit, compare, and pin baseline scenarios — pre-seeded with _Optimistic_, _Market Growth_, _Conservative_, and _Custom_.                                         |
| 📊 **Interactive charts**           | Portfolio growth (nominal vs. real vs. invested), reference-currency valuation, and inflation impact visualizations.                                                            |
| 📁 **Export & import**              | CSV export of year- and month-level tables; JSON backup/restore of all scenarios.                                                                                               |
| 🌐 **i18n**                         | English and Turkish, switch seamlessly.                                                                                                                                         |
| 🔒 **Privacy-first**                | No advertising trackers or analytics cookies; Vercel Web Analytics provides cookie-free aggregate usage metrics. Zustand `persist` keeps portfolio data in `localStorage`.      |

## Screenshots

### 1. Dashboard

<img src="docs/screenshots/dashboard.png" alt="Dashboard: portfolio form and projection table" />

**How:** Start with the default scenario, ~10 years, and capture the main view (portfolio form + summary cards + table).

### 2. Charts

<img src="docs/screenshots/charts.png" alt="Charts: nominal vs real growth, reference currency, inflation impact" />

**How:** Scroll to the chart section — growth vs. real balance vs. invested capital, reference currency line, and inflation impact card.

### 3. Scenario comparison

<img src="docs/screenshots/scenarios.png" alt="Scenario comparison dialog" />

**How:** Create 2–3 scenarios (e.g. _Market Growth_ vs. _Conservative_), open **Compare** and capture the side-by-side table.

### 4. AI Forecast modal

<img src="docs/screenshots/ai-forecast.png" alt="AI economic forecast modal" />

**How:** Open the **AI Forecast** modal, run a forecast, and capture the filled-in parameters.

### 5. AI Chat

<img src="docs/screenshots/ai-chat.png" alt="AI financial assistant chat" />

**How:** Open the chat FAB (bottom-right), ask one of the question, and capture the conversation.

### 6. Settings

<img src="docs/screenshots/settings.png" alt="Settings dialog: AI provider configuration" />

**How:** Open the Settings dialog and capture the AI configuration (provider, key, model, base URL, Demo API toggle).

## Tech Stack

| Category           | Choice                                                                               |
| :----------------- | :----------------------------------------------------------------------------------- |
| Frontend           | React 19 · TypeScript · Vite 8                                                       |
| Styling            | Tailwind CSS v4 (`@tailwindcss/vite`) · `@base-ui/react` · CVA + `cn()`              |
| State              | Zustand + `persist` (`localStorage`)                                                 |
| Charts             | Recharts                                                                             |
| i18n               | i18next · react-i18next                                                              |
| AI (client)        | `src/lib/ai-service.ts` · `ai-chat-service.ts` — Gemini / OpenAI / OpenAI-compatible |
| Backend (optional) | Vercel Edge Function `api/demo.ts` + Upstash Redis quota counters                    |

## SEO & Localized Routes

- Turkish is served from `/`; English is served from `/en`. Information and legal pages have matching locale-specific URLs and reciprocal `hreflang` links.
- `npm run build` prerenders all public routes, generates route-specific metadata and JSON-LD, creates `sitemap.xml`, `robots.txt`, and `404.html`, then verifies the SEO output.
- The canonical production origin is `https://moneytrace.metee.com.tr`, configured in `APP_CONFIG.app.siteUrl`.
- Social previews use the localized 1200×630 images in `public/og-image-{tr,en}.png`.

## Getting Started

```bash
git clone https://github.com/Metee01/MoneyTrace.git
cd MoneyTrace
npm install
npm run dev      # → http://localhost:5173
```

Useful scripts:

| Script                            | Purpose                                                                    |
| :-------------------------------- | :------------------------------------------------------------------------- |
| `npm run dev`                     | Start the Vite dev server                                                  |
| `npm run build`                   | Typecheck, production build, static route generation, and SEO verification |
| `npm run lint` · `npm run format` | ESLint · Prettier                                                          |
| `npm test`                        | Deterministic engine + store + AI tools tests (via `tsx`)                  |

<details>
<summary><b>🔑 Environment variables & demo proxy</b> (for deploying your own instance)</summary>

| Variable              | Where           | Purpose                                                                 |
| :-------------------- | :-------------- | :---------------------------------------------------------------------- |
| `VITE_DEMO_PROXY_URL` | `.env` / Vercel | Enables the hosted **Demo API** option; points at `/api/demo`           |
| `DEMO_API_KEY`        | Vercel **only** | Shared demo key — lives in the edge function, never ships in the bundle |

The proxy in `api/demo.ts` enforces per-user quotas (5 forecasts / 15 chat messages), per-IP daily caps, a 3s chat cooldown, and optional persistent counters via Upstash Redis — see `api/demo.ts` for details.

</details>

## Architecture

```
┌──────────────────────────────┐       ┌──────────────────────────────┐
│           Browser            │       │     Vercel (optional)        │
│  PortfolioForm → engine/     │  AI   │  /api/demo (Edge Function)   │
│  (pure, deterministic)       │ ───▶  │  • owns DEMO_API_KEY         │
│  Zustand persist (local)     │       │  • quota + rate limiting     │
│  AI service / chat (BYOK)    │       │  • Upstash Redis (optional)  │
└──────────────────────────────┘       └──────────────────────────────┘
         ▲ all financial math
         │ stays on device
```

- `src/engine/` — pure, framework-free financial math (compound growth, inflation adjustment, currency conversion), orchestrated by `calculateProjection`; deterministic, rounded to 2 decimals.
- `src/config/index.ts` — single source of truth (`APP_CONFIG`): app metadata, AI models, demo quotas, engine limits.
- UI components never compute financials themselves — they only consume the engine.

## Project Structure

```text
src/
├── components/       UI — portfolio form, projection cards/table/charts,
│                     scenarios, chat widget, layout
├── config/           APP_CONFIG — single source of truth (app, AI, engine)
├── engine/           Pure financial math (compound-growth, inflation-adjust, …)
├── lib/              AI services, demo-proxy client, formatters, export, i18n
├── store/            Zustand stores with persist (portfolio, settings)
├── locales/          en / tr translation dictionaries
├── seo/              canonical routes, metadata, and browser head sync
└── types/            Shared TypeScript types
api/demo.ts           Vercel serverless Demo API proxy
scripts/              Static-page generation and SEO verification
```

## Contributing & License

Found a bug or have an idea? Open an issue or PR — [CONTRIBUTING.md](CONTRIBUTING.md) has the details.

Released under the [MIT License](LICENSE). Made for people who want to know the _real_ price of their future 💸
