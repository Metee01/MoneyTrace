# AGENTS.md

MoneyTrace: client-only Vite + React 19 + TypeScript app for inflation-adjusted portfolio projection. All state lives in the browser (Zustand `persist` -> localStorage). No backend, no CI, no test framework.

## Commands

- `npm run dev` — Vite dev server (port 5173)
- `npm run build` — `tsc -b && vite build`; this is the typecheck step (no standalone typecheck script)
- `npm run lint` / `npm run lint:fix` — ESLint (flat config `eslint.config.js`)
- `npm run format` — Prettier over `src/**/*.{ts,tsx,css,json}`
- Tests are plain `console.assert` scripts run with tsx (a devDependency):
  - `npm run test:engine` / `npm run test:store` / `npm run test` (runs both)
  - When changing `src/engine/*` or the stores, update and run these — they are the only regression checks.

## Architecture

- `src/engine/` — pure, framework-free math functions (`compound-growth.ts`, `inflation-adjust.ts`, `currency-convert.ts`) orchestrated by `calculateProjection` in `src/engine/index.ts`. Keep these pure and deterministic; all output values are rounded to 2 decimals. UI must never do financial math itself.
- `src/store/` — Zustand stores with `persist`. localStorage keys: `moneytrace-portfolio-storage`, `moneytrace-settings-storage`; theme is stored separately as `moneytrace-theme` (`src/hooks/useTheme.ts`). Store tests mock storage — keep them importable without a DOM.
- `src/components/ui/` — shadcn-style components built on `@base-ui/react` (shadcn "base-nova" style), **not** Radix. New UI components belong here following the existing pattern (CVA + `cn` from `@/lib/utils`).
- Path alias `@/*` -> `src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`).
- Tailwind CSS v4 via `@tailwindcss/vite` plugin — there is **no** `tailwind.config.*`; theme/CSS variables live in `src/index.css`.

## Conventions

- Conventional commits (`feat:`, `fix:`, `docs:`, ...) per `CONTRIBUTING.md`; run `npm run lint` and `npm run format` before committing.
- No `any` types; TypeScript strict-style flags enabled in `tsconfig.app.json`.
- i18n (i18next): translations in `src/locales/<code>/translation.json`. Adding a language requires creating the folder **and** registering it with a static import in `src/lib/i18n.ts` (default/fallback is `en`). Never change translation keys, only values.
- SPA deployed to Vercel via `vercel.json` rewrites — client-side routing only.

## Gotchas

- `dist/` exists locally but is gitignored; never commit build output.
- Some file-header comments are in Turkish (e.g. `src/store/index.ts`) — the codebase is mixed-language; match the surrounding file's language when editing.
