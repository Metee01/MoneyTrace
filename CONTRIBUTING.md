# MoneyTrace Katkı Rehberi / Contribution Guide 🤝

MoneyTrace projesine katkıda bulunmak istediğiniz için teşekkür ederiz! Açık kaynak topluluğunun geliştirmeleri projemizi güçlendirir.

---

## 🛠️ Nasıl Katkıda Bulunabilirsiniz?

1. **Hata Bildirimi (Bug Reports):** Karşılaştığınız hataları GitHub Issues üzerinden detaylı adımlarla bildirebilirsiniz.
2. **Yeni Özellik Önerileri (Feature Requests):** Projeye faydalı olabileceğini düşündüğünüz fikirleri Issue açarak tartışmaya açabilirsiniz.
3. **Kod Katkısı (Pull Requests):** Mevcut veya yeni özellikleri kodlayarak projeye doğrudan katkıda bulunabilirsiniz.
4. **Çeviri ve Dil Katkısı (i18n):** `src/locales/` klasörü altındaki dil dosyalarına yeni diller ekleyebilirsiniz.

---

## 📐 Kod Standartları ve Kuralları

- **TypeScript:** Tüm bileşenler ve fonksiyonlar için kesin tip tanımlamaları yapılmalı, `any` kullanımından kaçınılmalıdır.
- **Formating & Linting:** Kodunuzu commitlemeden önce `npm run lint` ve `npm run format` komutlarını çalıştırın.
- **Git Commit Mesajları:** Anlaşılır ve standart commit mesajları tercih edilmelidir:
  - `feat:` Yeni bir özellik
  - `fix:` Bir hatanın düzeltilmesi
  - `docs:` Dokümantasyon değişiklikleri
  - `style:` Formatlama, noktalama (işlevsel kod değişimi yok)
  - `refactor:` Yeniden yapılandırma

---

## 🌐 Çoklu Dil (i18n) Katkısı

Yeni bir dil eklemek için:
1. `src/locales/` altında hedef dilin kodunda klasör açın (örn: `en`).
2. `src/locales/tr/translation.json` içeriğini bu klasöre kopyalayıp çevirileri tamamlayın.
3. `src/lib/i18n.ts` içine yeni dili import edin.

---

## 🔄 Pull Request Süreci

1. Depoyu Fork'layın.
2. Anlamlı bir branch adı seçin: `git checkout -b feature/harika-ozellik` veya `fix/hata-duzeltme`.
3. Değişikliklerinizi yapın ve derlemenin hatasız geçtiğini kontrol edin (`npm run build`).
4. Pull Request açın ve yapılan değişikliklerin kısa bir açıklamasını ekleyin.

Destek ve sorularınız için GitHub Issues alanını kullanabilirsiniz. Teşekkürler!
