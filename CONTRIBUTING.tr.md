# MoneyTrace Katkı Rehberi 🤝

MoneyTrace projesine katkıda bulunmak istediğiniz için teşekkür ederiz! Açık kaynak katkıları, uygulamanın dünya çapındaki yatırımcılar için geliştirilmesine ve iyileştirilmesine büyük katkı sağlar.

MoneyTrace; istemci tarafında çalışan, gizlilik odaklı bir **Vite + React 19 + TypeScript** kişisel finans projeksiyonu ve simülasyon uygulamasıdır.

---

## 🛠️ 1. Nasıl Katkıda Bulunabilirsiniz?

Katkıda bulunmanın birçok farklı yolu vardır:

1. **🐛 Hata Bildirimleri (Bug Reports):** Karşılaştığınız hataları veya beklenmeyen davranışları GitHub Issues üzerinden açık ve anlaşılır adımlarla bildirin.
2. **💡 Özellik İstekleri (Feature Requests):** Uygulamayı geliştirecek yeni fikir ve özellik önerilerinizi bir Issue açarak paylaşın.
3. **💻 Kod Katkıları:** Hataları çözmek veya yeni özellikler eklemek için Pull Request (PR) gönderin.
4. **🌐 Çeviriler (i18n):** `src/locales/` klasörü altına yeni dil destekleri ekleyin veya mevcut çevirileri iyileştirin.
5. **🤖 AI ve Yapılandırma:** `src/config/index.ts` üzerindeki merkezi uygulama ayarlarını (`APP_CONFIG`), AI tahmin servisini (`src/lib/ai-service.ts`) veya AI chat servisini (`src/lib/ai-chat-service.ts`) geliştirin.
6. **📚 Dokümantasyon:** Proje rehberlerini, README dosyalarını veya kod içi yorumları güncelleyerek topluluğa destek olun.

---

## 💻 2. Geliştirme Ortamı Kurulumu

Geliştirme ortamınızı yerel bilgisayarınızda kurmak için aşağıdaki adımları takip edin:

### Ön Gereksinimler
- **Node.js**: `>= 20.19` (veya üzeri)
- **npm** (Node.js ile birlikte gelir)

### Kurulum Adımları

1. **Repoyu klonlayın:**
   ```bash
   git clone https://github.com/Metee01/MoneyTrace.git
   cd MoneyTrace
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Geliştirme sunucusunu başlatın:**
   ```bash
   npm run dev
   ```
   Uygulama yerel olarak `http://localhost:5173` adresinde çalışacaktır.

### Kullanılabilir npm Komutları

| Komut | Açıklama |
| ----- | -------- |
| `npm run dev` | Vite geliştirme sunucusunu başlatır |
| `npm run build` | TypeScript tip kontrolü yapar (`tsc -b`) ve Vite prodüksiyon derlemesini oluşturur |
| `npm run preview` | Prodüksiyon derlemesini yerel olarak önizler |
| `npm run lint` | ESLint (flat config) ile kod kalitesini denetler |
| `npm run lint:fix` | Otomatik düzeltilebilir ESLint hatalarını onarır |
| `npm run format` | Prettier ile tüm kaynak dosyaları biçimlendirir |
| `npm run test:engine` | `tsx` ile `src/engine/engine.test.ts` hesaplama motoru testlerini çalıştırır |
| `npm run test:store` | `tsx` ile `src/store/store.test.ts` Zustand depo testlerini çalıştırır |
| `npm run test` | Tüm test paketlerini sırasıyla çalıştırır |

---

## 📐 3. Kod Standartları

MoneyTrace projesinde kod kalitesini ve sürdürülebilirliği yüksek tutmak için aşağıdaki kurallara kesinlikle uyulmalıdır:

- **Merkezi Yapılandırma (`APP_CONFIG`):** Tüm global limitler, AI modelleri, varsayılan parametreler ve kotalar `src/config/index.ts` içerisinde (`APP_CONFIG`) tanımlanmalıdır. Kod içinde sabit (hardcoded) değerler kullanılmamalıdır.
- **Strict TypeScript & `any` Yasağı:** TypeScript strict mod aktif durumdadır. `any` tipi kullanmak kesinlikle yasaktır. Tüm tip tanımlamaları `src/types/index.ts` içerisinde veya ilgili modülde açıkça (explicit) yapılmalıdır.
- **Saf Hesaplama Motoru (`src/engine/`):** Finansal ve matematiksel hesaplama fonksiyonları kesinlikle saf (pure) ve deterministik olmalıdır. Yan etki (side effect), durum mutasyonu veya dış bağımlılık içermemelidir. Testler `console.assert` tabanlı scriptlerle `tsx` üzerinden yürütülür (`npm run test:engine`).
- **UI Bileşen Mimarisi (CVA + `cn` Kalıbı):** UI bileşenlerinde **Base UI** (`@base-ui/react`) taban alınır (**Radix KULLANILMAZ**). Stil yönetimi için **Tailwind CSS v4** (ayrı bir `tailwind.config` dosyası yoktur, tema ayarları `src/index.css` içindedir) ile birlikte `class-variance-authority` (CVA) ve `cn` (`clsx` + `tailwind-merge`) yardımcısı tercih edilir.
- **Zustand Durum Yönetimi:** Global durum yönetimi için Zustand kullanılır ve veriler `persist` middleware'i ile `localStorage` üzerinde saklanır.
- **Commit Öncesi Verification:** Değişikliklerinizi commit etmeden önce mutlaka `npm run build`, `npm run lint` ve `npm run test` komutlarını çalıştırarak hata olmadığından emin olun.
- **Commit Mesaj Formatı (Conventional Commits):** Commit mesajlarında standart format kullanılmalıdır:
  - `feat:` Yeni bir özellik ekleme
  - `fix:` Bir hatayı düzeltme
  - `docs:` Yalnızca dokümantasyon değişiklikleri
  - `style:` Kodun anlamını etkilemeyen biçimlendirme değişiklikleri (boşluklar, girintiler, vb.)
  - `refactor:` Ne hata düzelten ne de özellik ekleyen kod düzenlemeleri
  - `perf:` Performansı artıran kod değişiklikleri
  - `test:` Eksik testleri ekleme veya mevcut testleri düzeltme
  - `chore:` Derleme süreci veya yardımcı araçlar/kütüphaneler ile ilgili değişiklikler

---

## 🌐 4. Yeni Bir Dil Ekleme (i18n)

MoneyTrace, `i18next` ve `react-i18next` altyapısını kullanır. Çeviriler `src/locales/<code>/translation.json` konumunda yer alır. Yeni bir dil eklemek son derece kolaydır:

1. `src/locales/` klasörü altında dilin ISO kodu adıyla yeni bir klasör oluşturun (örneğin Almanca için `de`, İspanyolca için `es`).
2. `src/locales/en/translation.json` dosyasını yeni oluşturduğunuz klasöre kopyalayın.
3. Dosya içerisindeki metin değerlerini (anahtarları değiştirmeden) yeni dile çevirin.
4. Yeni dili `src/lib/i18n.ts` dosyasında statik import ile tanımlayın ve `resources` nesnesine kaydedin.
5. Dilin görünür adını (örn. `de: "Deutsch (DE)"`) `src/lib/i18n.ts` içindeki `LANGUAGE_LABELS` haritasına ekleyin (Ayarlar'daki dil seçicisi buradan beslenir).
6. **Merkezi yapılandırmayı güncelleyin:** `src/config/index.ts` dosyasındaki `APP_CONFIG.app.supportedLanguages` dizisine yeni dil kodunu ekleyin (şu an `["en", "tr"] as const`):
   ```typescript
   supportedLanguages: ["en", "tr", "de"] as const,
   ```
   Desteklenen dillerin tek kaynağı yapılandırma dosyasıdır.

Örnek `src/lib/i18n.ts` kaydı:
```typescript
import deTranslation from '../locales/de/translation.json';

// resources nesnesine ekleyin:
const resources = {
  en: { translation: enTranslation },
  tr: { translation: trTranslation },
  de: { translation: deTranslation },
};

// LANGUAGE_LABELS haritasına ekleyin:
const LANGUAGE_LABELS = {
  en: "English (EN)",
  tr: "Türkçe (TR)",
  de: "Deutsch (DE)",
};
```

---

## 🧩 5. Yeni UI Bileşeni Ekleme

Projeye yeni bir UI bileşeni eklerken aşağıdaki yönergeleri uygulayın:

1. **Konum:** Tüm temel UI bileşenleri `src/components/ui/` dizininde yer almalıdır.
2. **Taban Kütüphane:** Erişilebilir ve stil verilebilir bileşenler için **Radix DEĞİL**, `@base-ui/react` (Base UI) kullanılmalıdır (shadcn base-nova stili).
3. **Stillendirme:** Bileşen varyasyonlarını yönetmek için `class-variance-authority` (`cva`) kullanılmalı ve `className` birleştirmeleri için `src/lib/utils.ts` içerisindeki `cn()` fonksiyonu tercih edilmelidir.

Örnek bileşen yapısı:
```tsx
import * as React from 'react';
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
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
```

---

## 🔄 6. Pull Request (PR) Süreci

Bir Pull Request göndermeden önce lütfen aşağıdaki adımları izleyin:

1. **Repoyu Fork Edin:** GitHub üzerinde projeyi kendi hesabınıza fork edin.
2. **Özellik Dalı Oluşturun:** Anlamlı bir dal (branch) ismi seçin:
   ```bash
   git checkout -b feature/yeni-ozellik
   # veya
   git checkout -b fix/hata-duzeltmesi
   ```
3. **Değişikliklerinizi Yapın:** Kod standartlarına ve TypeScript kurallarına uygun olarak kodunuzu geliştirin.
4. **Yerel Test & Doğrulama:** Commit atmadan önce derleme, lint ve test adımlarının sorunsuz geçtiğini kontrol edin:
   ```bash
   npm run lint
   npm run test
   npm run build
   ```
5. **Commit Edin:** Conventional Commit standartlarına uygun mesajlar yazın:
   ```bash
   git commit -m "feat: yeni grafik bileşeni eklendi"
   ```
6. **Push Edin:** Değişiklikleri kendi fork'unuza gönderin:
   ```bash
   git push origin feature/yeni-ozellik
   ```
7. **PR Açın:** GitHub üzerinden ana depoya (`main` dalına) bir Pull Request açın. PR açıklamasında yaptığınız değişiklikleri, çözülen sorunları ve ekran görüntülerini (varsa) ekleyin.

---

## 🤝 7. Davranış Kuralları (Code of Conduct)

MoneyTrace açık kaynak topluluğu, herkes için saygılı, kapsayıcı, güvenli ve yapıcı bir ortam sunmayı hedefler.

- Katkıda bulunurken, tartışmalarda ve kod incelemelerinde tüm topluluk üyelerine saygılı, kibar ve profesyonel yaklaşın.
- Her türlü ayrımcılık, taciz veya yapıcı olmayan eleştiri kabul edilemez.
- Projede karşılaştığınız herhangi bir uygunsuz davranışı proje yöneticilerine bildirebilirsiniz.

---

MoneyTrace'e katkıda bulunduğunuz için tekrar teşekkür ederiz! 🚀
