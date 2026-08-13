# Contributing to MoneyTrace 🚀

Thank you for your interest in contributing to **MoneyTrace**! We appreciate your time and effort in helping build a privacy-focused, client-only financial tracking and forecasting application.

This document outlines the guidelines and best practices for contributing to the project.

---

## 💡 How to Contribute

There are many ways you can contribute to MoneyTrace:

- **Reporting Bugs:** Open an issue describing the bug, how to reproduce it, and your environment.
- **Suggesting Features:** Share ideas for new features or improvements by opening a feature request issue.
- **Submitting Code:** Pick up an open issue or propose a bug fix or new feature via a Pull Request (PR).
- **Adding Translations:** Translate MoneyTrace into new languages or improve existing translations in `src/locales/`.
- **Enhancing AI & Configuration:** Refine AI prompt helpers (`src/lib/ai-service.ts`, `src/lib/ai-chat-service.ts`) or centralized application settings in `src/config/index.ts`.
- **Improving Documentation:** Fix typos, improve guide explanations, or update code docstrings.

---

## 🛠️ Development Setup

### Prerequisites

- **Node.js**: `>= 20.19`
- **Package Manager**: `npm`

### Setup Instructions

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
   Open your browser at `http://localhost:5173`.

4. **Lint and format code:**
   ```bash
   npm run lint
   ```

5. **Run test suites:**
   ```bash
   npm run test          # Runs all tests
   npm run test:engine   # Runs calculation engine tests
   npm run test:store    # Runs Zustand store tests
   ```

6. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📏 Code Standards

To keep the codebase clean, consistent, and maintainable, please follow these guidelines:

### Centralized Configuration
- All central configuration, feature defaults, and app-wide options must reside in `src/config/index.ts` (`APP_CONFIG`). Avoid hardcoding magic strings or constants across components.

### Strict TypeScript
- TypeScript is enforced strictly.
- Do **NOT** use `any`. Always define explicit interfaces or types.

### Pure Math Engine
- All financial calculations and domain logic must live in `src/engine/`.
- Functions in `src/engine/` must be **pure, deterministic, and free of framework dependencies** (no React hooks, DOM calls, or Zustand imports inside engine modules).

### UI Architecture
- Tailwind CSS v4 is used for styling (note: there is no `tailwind.config` file).
- UI components are built using `@base-ui/react` (base-nova) with **Class Variance Authority (`cva`)** and the `cn` utility (`clsx` + `tailwind-merge`).
- Do **NOT** use Radix UI primitives.

### Verification Before Committing
Before opening a PR or submitting a commit, ensure your code passes build, linting, and testing:
```bash
npm run lint
npm run test
npm run build
```

### Commit Message Format
We follow the **Conventional Commits** specification. Please format your commit messages as follows:

- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation changes
- `style:` Code style fixes (formatting, missing semi-colons, etc.)
- `refactor:` Code refactoring without behavioral changes
- `perf:` Performance improvements
- `test:` Adding or updating tests
- `chore:` Maintenance tasks, dependency updates, build configuration

*Example:* `feat: add export to CSV functionality in transaction engine`

---

## 🌐 Adding a New Language

MoneyTrace uses `i18next` for internationalization. To add a new language:

1. **Create a language folder:**
   Create a new directory in `src/locales/<code>/` (e.g., `src/locales/fr/` for French).

2. **Add translation file:**
   Copy `src/locales/en/translation.json` into your new language folder and translate all string keys.

3. **Register language statically:**
   Open `src/lib/i18n.ts` and register the new translation resource using a static import:
   ```typescript
   import translationFR from '../locales/fr/translation.json';

   // Add translationFR to the i18n resources object
   ```

4. **Add a language label (optional but recommended):**
   In `src/lib/i18n.ts`, add a friendly label to the `LANGUAGE_LABELS` map so the
   language appears properly in the UI language selector:
   ```typescript
   const LANGUAGE_LABELS: Record<string, string> = {
     en: "English (EN)",
     tr: "Türkçe (TR)",
     fr: "Français (FR)",
   }
   ```

5. **Update the central configuration:**
   Open `src/config/index.ts` and add the new locale code to
   `APP_CONFIG.app.supportedLanguages` (currently `["en", "tr"] as const`):
   ```typescript
   supportedLanguages: ["en", "tr", "fr"] as const,
   ```
   This keeps the config as the single source of truth for supported app locales.

---

## 🧩 Adding a UI Component

When adding a reusable UI component:

1. Create the component file in `src/components/ui/` (e.g., `src/components/ui/button.tsx`).
2. Build on top of `@base-ui/react` primitives where applicable.
3. Structure variants and class overrides using `cva` and `cn`:
   ```typescript
   import { cva, type VariantProps } from 'class-variance-authority';
   import { cn } from '@/lib/utils';

   const buttonVariants = cva(
     'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
     {
       variants: {
         variant: {
           default: 'bg-primary text-primary-foreground hover:bg-primary/90',
           outline: 'border border-input bg-background hover:bg-accent',
         },
         size: {
           default: 'h-9 px-4 py-2',
           sm: 'h-8 px-3 text-xs',
         },
       },
       defaultVariants: {
         variant: 'default',
         size: 'default',
       },
     }
   );
   ```
4. Ensure components are fully accessible, support dark mode classes, and do not import Radix UI packages.

---

## 🔀 Pull Request Process

1. **Fork & Branch:** Create a feature or bugfix branch off `main` (e.g., `feat/transaction-filters` or `fix/chart-tooltip`).
2. **Implement Changes:** Make your edits following the code standards outlined above.
3. **Run Checks:** Ensure `npm run lint`, `npm run test`, and `npm run build` all pass cleanly without errors or warnings.
4. **Submit PR:** Open a Pull Request against the `main` branch with a clear title and description of your changes.
5. **Review:** Respond to any feedback or review comments promptly.

---

## 📜 Code of Conduct

We expect all contributors to foster a welcoming, respectful, and inclusive environment. Please keep discussions constructive, civil, and collaborative in issues and PRs.
