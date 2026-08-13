# AGENTS.md

Guidance for AI coding assistants working on MoneyTrace.

## Project Identity
- Client-only Vite + React 19 + TypeScript app for inflation-adjusted portfolio projection and AI-assisted financial Q&A.
- All state persisted in browser localStorage via Zustand `persist`.
- No backend server, no CI pipeline, no external test runner framework.

## Commands
- Dev server: `npm run dev` (Vite, default port 5173)
- Typecheck & Build: `npm run build` (`tsc -b && vite build` — `build` is the typecheck step)
- Linting: `npm run lint` / `npm run lint:fix` (ESLint flat config `eslint.config.js`)
- Formatting: `npm run format` (Prettier over `src/**/*.{ts,tsx,css,json}`)
- Testing (plain `console.assert` scripts via `tsx`):
  - `npm run test:engine`
  - `npm run test:store`
  - `npm run test` (runs both engine and store tests)
  - Must update and run tests when changing `src/engine/*` or Zustand stores.

## Architecture
- `src/config/`: Single source of truth for constants (`src/config/index.ts` exporting `APP_CONFIG`). Holds app metadata, AI provider models, Demo API quotas, security limits, and default engine parameters.
- `src/engine/`: Pure, framework-free math (`compound-growth.ts`, `inflation-adjust.ts`, `currency-convert.ts`) orchestrated by `calculateProjection` in `src/engine/index.ts`. Deterministic outputs rounded to 2 decimal places. UI must not execute financial calculations directly.
- `src/store/`: Zustand stores with `persist`.
  - Keys: `moneytrace-portfolio-storage`, `moneytrace-settings-storage`. Theme in `moneytrace-theme` (`src/hooks/useTheme.ts`).
  - `portfolio-store.ts`: Portfolio parameters, saved portfolios, scenarios CRUD.
  - `settings-store.ts`: AI settings (provider, key, model, base URL, CORS proxy), Demo API toggle/quota, language, currency, theme.
  - Keep stores importable without DOM for node test runner.
- `src/lib/`:
  - `ai-service.ts`: Macroeconomic forecasting (inflation, returns, currency rates).
  - `ai-chat-service.ts`: Conversational portfolio Q&A, quota enforcement, rate limiting.
  - `formatters.ts`: Currency and number formatting.
  - `export.ts`: CSV/JSON export and import.
  - `i18n.ts`: i18next setup with static locale imports.
  - `utils.ts`: `cn()` class merge utility (`clsx` + `tailwind-merge`).
- `src/components/`:
  - `chat/`: FAB and slide-up chat modal (`AiChat.tsx`).
  - `ui/`: `@base-ui/react` (shadcn "base-nova" style, **not** Radix). Custom UI components use CVA + `cn()`.
  - `layout/`: Header (version badge from `APP_CONFIG`), Footer, Layout container.
  - `portfolio/`: `PortfolioForm`, `AiForecastModal`.
  - `projection/`: `ProjectionTable`, `ProjectionSummaryCards`, lazy-loaded `ChartSection`.
  - `scenarios/`: `ScenarioManager`, `ScenarioCompareDialog`.
- Paths: `@/*` resolves to `src/*` (configured in `vite.config.ts` and `tsconfig.app.json`).
- Styling: Tailwind CSS v4 via `@tailwindcss/vite`. No `tailwind.config.*`; styles and CSS variables defined in `src/index.css`.

## Conventions
- Commits: Conventional commits (`feat:`, `fix:`, `docs:`, etc.) per `CONTRIBUTING.md`. Run `npm run lint` and `npm run format` prior to committing.
- TypeScript: Strict flags in `tsconfig.app.json`. Avoid `any`.
- i18n: Translations located in `src/locales/<code>/translation.json`. Register new locales with static imports in `src/lib/i18n.ts` (default is `en`). Do not alter translation key names; update values only.
- Deployment: Vercel SPA via `vercel.json` rewrites for client-side routing.
- App Version: Single source of truth is `APP_CONFIG.app.version` in `src/config/index.ts`.

## Gotchas
- Local `dist/` folder is gitignored. Do not commit build artifacts.
- Header comments in some files are in Turkish (e.g., `src/store/index.ts`). Match existing comment language in target file.
- AI settings are configured via Settings dialog (`App.tsx`) and stored in `useSettingsStore`.
- Demo API enforces rate limits (3s cooldown, max 500 chars prompt) and usage caps (5 forecasts, 15 chat messages) defined in `APP_CONFIG.ai.demo`.
- Demo API availability is controlled by `VITE_DEMO_API_KEY`. If unset, demo option is hidden in UI.
