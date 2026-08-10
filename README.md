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

---

## 📦 Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
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

## 📁 Project Structure

```
MoneyTrace/
├── public/                 # Static assets & favicon
├── src/
│   ├── components/         # React UI components
│   │   ├── layout/         # Header, Footer, Layout wrapper
│   │   ├── portfolio/      # Input parameters form & presets
│   │   ├── projection/     # Summary cards, charts, monthly detail table
│   │   ├── scenarios/      # Scenario manager & comparison dialogs
│   │   └── ui/             # Reusable UI elements (buttons, cards, inputs, dialogs)
│   ├── engine/             # Financial engines (compounding, inflation adjustment, FX)
│   ├── hooks/              # Custom React hooks (useTheme)
│   ├── lib/                # Formatters, export helpers, i18n setup, utilities
│   ├── locales/            # Translation JSON files (en, tr)
│   ├── store/              # Zustand state stores (portfolio, settings)
│   ├── types/              # TypeScript interfaces & types
│   ├── App.tsx             # Main dashboard layout
│   └── main.tsx            # Application entry point
├── vercel.json             # Vercel deployment configuration
└── package.json            # Dependencies and scripts
```

---

## 🤝 Contributing

Contributions are welcome! Please check out [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on code style, Pull Requests, and adding new language translations.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
