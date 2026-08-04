# Dil Katkısı Rehberi / Translation Guide

MoneyTrace, çoklu dil altyapısına sahiptir. Projeye yeni bir dil eklemek veya mevcut dilleri güncellemek için aşağıdaki adımları izleyebilirsiniz.

## Yeni Bir Dil Ekleme

1. Bu projeyi fork'layın.
2. `src/locales/` klasörü altında yeni dil için bir klasör oluşturun (örn: İngilizce için `en`).
3. `src/locales/tr/translation.json` dosyasını kopyalayıp yeni oluşturduğunuz klasörün içine yapıştırın.
4. Dosyadaki Türkçe değerleri (sağ taraftakiler) yeni dile çevirin. Anahtarları (sol taraftakiler) **kesinlikle değiştirmeyin**.
5. `src/lib/i18n.ts` (veya `src/main.tsx` içerisindeki i18n konfigürasyonu) dosyasına yeni dilinizi import edip ekleyin.
6. Değişikliklerinizi commit edip Pull Request (PR) gönderin.

---

MoneyTrace supports internationalization. To add a new language or update existing translations:

1. Fork the project.
2. Create a folder under `src/locales/` named after the language code (e.g. `en` for English).
3. Copy `src/locales/tr/translation.json` into your new folder.
4. Translate the values to your target language. **Do not modify the keys**.
5. Import and register the new language inside the i18n configuration.
6. Commit your changes and submit a Pull Request (PR).
