# MoneyTrace Contribution Guidelines 🤝

Thank you for your interest in contributing to MoneyTrace! Open-source contributions help improve the application for investors worldwide.

---

## 🛠️ How Can You Contribute?

1. **Bug Reports:** Report bugs or issues on GitHub Issues with clear steps to reproduce.
2. **Feature Requests:** Suggest new features or ideas by opening an Issue.
3. **Code Contributions:** Fix issues or implement new features via Pull Requests.
4. **Translations (i18n):** Add support for new languages under `src/locales/`.

---

## 📐 Code Standards

- **TypeScript:** Use explicit TypeScript interfaces and avoid `any` types.
- **Formatting & Linting:** Run `npm run lint` and `npm run format` before committing.
- **Commit Messages:** Follow conventional commit messages:
  - `feat:` New feature
  - `fix:` Bug fix
  - `docs:` Documentation changes
  - `style:` Formatting changes
  - `refactor:` Code refactoring

---

## 🌐 Adding a New Language

1. Create a folder under `src/locales/` named after the ISO language code (e.g., `de` for German).
2. Copy `src/locales/en/translation.json` into your folder and translate the string values.
3. Register the new language in `src/lib/i18n.ts`.

---

## 🔄 Pull Request Process

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`.
3. Commit your changes: `git commit -m 'feat: Add my feature'`.
4. Push to your branch: `git push origin feature/my-feature`.
5. Open a Pull Request on GitHub with a summary of changes.
