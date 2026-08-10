# 💸 MoneyTrace

### Inflation-Adjusted Portfolio Projection & Simulation

**MoneyTrace** is a modern, privacy-first investment projection and simulation tool built to help you understand how your money can grow — and how inflation can affect its real purchasing power over time.

📊 Simulate compound growth and DCA strategies,
💸 compare nominal vs. real returns,
🌍 model inflation and currency movements,
🤖 and optionally generate economic forecasts with AI.

### 🌐 Live Demo

**[moneytrace.metee.com.tr](https://moneytrace.metee.com.tr)**

---

## ✨ Features

### 📈 Real vs. Nominal Value

See the difference between your portfolio's nominal balance and its inflation-adjusted purchasing power.

Understand not only **how much your money grows**, but also **what that money may actually be worth in today's terms**.

### 🌍 Global Currency Support

MoneyTrace is currency-agnostic and supports currencies including:

`USD` · `EUR` · `GBP` · `JPY` · `CAD` · `AUD` · `TRY` · `BRL` · `INR` · and more.

Amounts are automatically formatted according to the selected currency.

### 💰 Compound Growth & DCA

Simulate long-term investment strategies with:

* Initial capital
* Monthly contributions
* Compound returns
* Annual contribution increases
* Custom investment horizons
* Inflation-adjusted results

Perfect for modelling long-term investing and Dollar-Cost Averaging (DCA).

### 💱 Reference Currency Tracking

Track your portfolio against a reference currency such as USD.

Configure projected exchange-rate growth to estimate how your local-currency portfolio could perform relative to another currency.

### 🎯 Scenario Management

Create and compare multiple investment scenarios side-by-side.

For example:

* 🚀 Optimistic
* 📊 Market Growth
* 🛡️ Conservative
* 🧪 Custom

You can **create, clone, compare, edit, and set baseline scenarios** without losing your existing projections.

### 🤖 AI Economic Forecast

Generate economic assumptions with AI directly from the portfolio form.

MoneyTrace can estimate:

* Average inflation
* Exchange-rate growth
* Expected portfolio return
* Current exchange rate

Supported providers include:

* Google Gemini
* OpenAI
* OpenAI-compatible APIs
* OpenRouter
* Groq
* LM Studio
* Ollama
* Other compatible local/custom endpoints

**Bring your own API key (BYOK).**

Your API key is stored locally in your browser and is only sent to the provider or proxy you explicitly configure.

### 📊 Interactive Visualizations

Understand your projections through interactive charts powered by **Recharts**.

Visualize:

* Portfolio growth
* Inflation-adjusted purchasing power
* Contribution vs. growth
* Long-term value changes

### 📁 Export & Import

Take your data with you.

**Export:**

* Full projection tables as Excel-compatible CSV
* Scenario backups as JSON

**Import:**

* Restore previously exported scenarios
* Move your configuration between browsers or devices

### 🌐 Internationalization

Built-in multilingual support with:

* 🇬🇧 English
* 🇹🇷 Turkish

The translation architecture is designed to make adding additional languages straightforward.

### 🔒 Privacy First

MoneyTrace is **100% client-side**.

Your portfolio data stays in your browser's `localStorage`.

There is:

* ❌ No backend database
* ❌ No portfolio data upload
* ❌ No account required
* ❌ No tracking of your financial data

Your data stays with you.

---

## 🛠️ Tech Stack

| Category             | Technology                              |
| -------------------- | --------------------------------------- |
| Framework            | React 19                                |
| Language             | TypeScript                              |
| Build Tool           | Vite                                    |
| Styling              | Tailwind CSS v4                         |
| UI                   | shadcn/ui                               |
| Icons                | Lucide                                  |
| State Management     | Zustand                                 |
| Persistence          | Zustand Persist                         |
| Charts               | Recharts                                |
| Internationalization | i18next + react-i18next                 |
| AI                   | Gemini, OpenAI & OpenAI-compatible APIs |
| Deployment           | Vercel                                  |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have:

* **Node.js 20.19.0+**
* npm, pnpm, yarn, or bun

### 1. Clone the repository

```bash
git clone https://github.com/Metee01/MoneyTrace.git
cd MoneyTrace
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Then open:

```text
http://localhost:5173
```

### 4. Build for production

```bash
npm run build
```

### 5. Run lint & code audit

```bash
npm run lint
```

---

## 🤖 AI Economic Forecast

MoneyTrace includes an optional AI-powered forecasting system.

The **AI Forecast** button can generate assumptions for your selected currency and investment horizon.

The AI is asked to estimate:

```text
Inflation
Exchange-rate growth
Portfolio return
Current exchange rate
```

These values can then be automatically applied to the portfolio simulation.

### 🔑 Bring Your Own API Key

MoneyTrace does not provide or manage API keys.

You provide your own key and choose the provider you want to use.

### Supported Providers

| Provider            | Description                                 |
| ------------------- | ------------------------------------------- |
| **Google Gemini**   | Gemini API through Google AI Studio         |
| **OpenAI**          | OpenAI API                                  |
| **Custom**          | Any OpenAI-compatible endpoint              |
| **OpenRouter**      | OpenAI-compatible API                       |
| **Groq**            | OpenAI-compatible API                       |
| **LM Studio**       | Local models                                |
| **Ollama**          | Local models                                |
| **Other endpoints** | Any compatible `/chat/completions` endpoint |

For local providers, an API key may not be required.

---

## 🌐 CORS Proxy

Some API providers do not allow direct browser requests because of CORS restrictions.

For these providers, MoneyTrace supports an optional **CORS proxy**.

### How to enable it

1. Open **AI Forecast**.
2. Select **Custom (OpenAI-compatible)**.
3. Enable **Use CORS proxy**.
4. Enter a proxy URL containing the `{url}` placeholder.

Example:

```text
https://corsproxy.io/?url={url}
```

MoneyTrace replaces `{url}` with the encoded target endpoint before sending the request.

### ⚠️ Security

When using a proxy, your request — including your API key — passes through that proxy.

**Only use a proxy you trust.**

For sensitive usage, consider running your own proxy instead of relying on a public service.

---

## 🧮 How the Simulation Works

MoneyTrace combines several financial models to provide a long-term projection.

### Compound Growth

Investment growth is modelled using compound returns over the selected time horizon.

### Monthly DCA

Monthly contributions can be added throughout the simulation.

You can also configure an **annual contribution increase rate** to model increasing your investments over time.

### Inflation Adjustment

Nominal portfolio values are adjusted for projected inflation to estimate their future purchasing power.

This allows you to compare:

```text
Nominal Value
      ↓
Inflation Adjustment
      ↓
Real Purchasing Power
```

### Currency / FX Projection

When a reference currency is selected, projected exchange-rate changes can be incorporated into the simulation.

This makes it possible to view your portfolio from both a **local-currency** and **reference-currency** perspective.

> MoneyTrace is a projection and simulation tool. Its outputs are mathematical estimates based on user-provided assumptions and should not be considered financial advice.

---

## 📊 Example Use Cases

MoneyTrace can be used for questions such as:

> "If I invest ₺10,000 today and add ₺5,000 every month, how much could I have in 10 years?"

Or:

> "What happens to my portfolio if inflation averages 30% per year?"

Or:

> "How does my TRY portfolio compare against USD over the next 10 years?"

Or:

> "What happens if I increase my monthly contribution by 10% every year?"

Create multiple scenarios and compare them side-by-side to explore different assumptions.

---

## 📁 Project Structure

```text
MoneyTrace/
├── public/
│   ├── Static assets
│   └── favicon
│
├── src/
│   ├── components/
│   │   ├── layout/
│   │   ├── portfolio/
│   │   ├── projection/
│   │   ├── scenarios/
│   │   └── ui/
│   │
│   ├── engine/
│   │   ├── compounding
│   │   ├── inflation
│   │   └── FX calculations
│   │
│   ├── hooks/
│   │
│   ├── lib/
│   │   ├── formatters
│   │   ├── export helpers
│   │   ├── i18n
│   │   ├── AI service
│   │   └── version
│   │
│   ├── locales/
│   │   ├── en/
│   │   └── tr/
│   │
│   ├── store/
│   │   ├── portfolio
│   │   └── settings
│   │
│   ├── types/
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── vercel.json
├── package.json
└── README.md
```

---

## 🔖 Versioning

The application version is displayed in the header and Settings dialog.

When releasing a new version, update the version in:

### `package.json`

```json
{
  "version": "X.Y.Z"
}
```

### `src/lib/version.ts`

```ts
export const APP_VERSION = "X.Y.Z";
```

Both values should remain synchronized.

`package-lock.json` will be updated automatically when running `npm install`.

---

## 🤝 Contributing

Contributions, ideas, bug reports, and improvements are welcome.

Before contributing, please read:

```text
CONTRIBUTING.md
```

Areas where contributions are especially welcome:

* New translations
* UI/UX improvements
* Financial calculation improvements
* New simulation features
* Accessibility
* Performance optimizations
* Bug fixes

---

## 📄 License

MoneyTrace is released under the **MIT License**.

See [`LICENSE`](LICENSE) for the complete license text.

---

## 🔗 Links

🌐 **Live Demo:**
https://moneytrace.metee.com.tr

💻 **GitHub:**
https://github.com/Metee01/MoneyTrace

---

<p align="center">
  Built with ❤️ using React, TypeScript & Vite.
</p>
