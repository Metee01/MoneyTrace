# Internationalization (i18n) Guide

MoneyTrace supports full multi-language capability. To add a new language or update existing translations:

## Adding a New Language

1. Fork the project repository.
2. Create a new folder under `src/locales/` named after the language code (e.g. `fr` for French, `es` for Spanish).
3. Copy `src/locales/en/translation.json` into your newly created folder.
4. Translate the values to your target language. **Do not modify the keys**.
5. Import and register the new language inside `src/lib/i18n.ts`.
6. Commit your changes and submit a Pull Request.
