# Uluslararasılaştırma (i18n) Rehberi

MoneyTrace tam çoklu dil desteğine sahiptir. Yeni bir dil eklemek veya mevcut çevirileri güncellemek için:

## Yeni Bir Dil Ekleme

1. Proje reposunu fork edin.
2. `src/locales/` altında dil koduna uygun yeni bir klasör oluşturun (örneğin Fransızca için `fr`, İspanyolca için `es`).
3. `src/locales/en/translation.json` dosyasını yeni oluşturduğunuz klasöre kopyalayın.
4. Değerleri hedef dilinize çevirin. **Çeviri anahtarlarını değiştirmeyin**.
5. Yeni dili `src/lib/i18n.ts` içinde içe aktarın, kaydedin **ve** `LANGUAGE_LABELS` haritasına yerel adını ekleyin (Ayarlar'daki dil menüsü buradan beslenir; seçici otomatik güncellenir).
6. Değişikliklerinizi commit edip Pull Request açın.
