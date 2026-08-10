# MoneyTrace Katkı Rehberi 🤝

MoneyTrace projesine gösterdiğiniz ilgi için teşekkür ederiz! Açık kaynak katkıları uygulamayı tüm dünyadaki yatırımcılar için geliştirmeye yardımcı olur.

---

## 🛠️ Nasıl Katkıda Bulunabilirsiniz?

1. **Hata Bildirimleri (Bug Reports):** GitHub Issues üzerinde belirgin adımlarla hataları bildirin.
2. **Özellik İstekleri (Feature Requests):** Yeni fikirlerinizi veya önerilerinizi Issue açarak paylaşın.
3. **Kod Katkıları:** Pull Request göndererek var olan sorunları çözün veya yeni özellikler geliştirin.
4. **Çeviriler (i18n):** `src/locales/` klasörü altında yeni dil destekleri ekleyin.

---

## 📐 Kod Standartları

- **TypeScript:** Açık TypeScript arayüzleri kullanın, `any` tipinden kaçının.
- **Formatlama ve Linting:** Commit atmadan önce `npm run lint` ve `npm run format` komutlarını çalıştırın.
- **Commit Mesajları:** Conventional Commits standartlarına uyun:
  - `feat:` Yeni özellik
  - `fix:` Hata düzeltmesi
  - `docs:` Dokümantasyon değişiklikleri
  - `style:` Formatlama değişiklikleri
  - `refactor:` Kod yeniden yapılandırma

---

## 🌐 Yeni Bir Dil Ekleme

1. `src/locales/` altında ISO dil koduna uygun bir klasör oluşturun (örneğin Almanca için `de`).
2. `src/locales/en/translation.json` dosyasını kopyalayın ve metin değerlerini çevirin.
3. Yeni dili `src/lib/i18n.ts` içerisinde kaydedin.

---

## 🔄 Pull Request Süreci

1. Repoyu fork edin.
2. Bir özellik dalı oluşturun: `git checkout -b feature/yeni-ozellik`.
3. Değişikliklerinizi commit edin: `git commit -m 'feat: Yeni özellik eklendi'`.
4. Dalınıza push yapın: `git push origin feature/yeni-ozellik`.
5. GitHub üzerinde PR oluşturun.
