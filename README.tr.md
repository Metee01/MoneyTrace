<p align="center">
  <img src="public/favicon.svg" alt="MoneyTrace" width="64" height="64" />
</p>

<h1 align="center">MoneyTrace</h1>

<p align="center">
  <strong>Paranızın gerçek geleceğini görün — enflasyondan arındırılmış portföy projeksiyonu</strong>
</p>

<p align="center">
  <em>Bileşik büyüme ve DCA simülasyonu · Reel ve nominal değer · AI finansal asistan</em>
</p>

<p align="center">
  <a href="https://moneytrace.metee.com.tr">🌐 Canlı Demo</a> ·
  <a href="https://github.com/Metee01/MoneyTrace">GitHub</a>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img alt="Tailwind v4" src="https://img.shields.io/badge/Tailwind_CSS_v4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img alt="Zustand" src="https://img.shields.io/badge/Zustand-7F56D9?style=flat-square" />
  <img alt="Vercel" src="https://img.shields.io/badge/Vercel-111111?style=flat-square&logo=vercel&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

---

<!-- ⚠️ TODO: Buraya uygulamanın ana ekran görüntüsünü ekle (portföy formu + özet kartlar + projeksiyon tablosu).
     Dosya yolu: docs/screenshots/dashboard.png (önerilen boyut: 1600x1000, koyu tema) -->
<img src="docs/screenshots/dashboard.png" alt="MoneyTrace paneli — portföy parametreleri, özet kartlar ve yıl yıl projeksiyon tablosu" width="100%" />

---

## Neden MoneyTrace?

Çoğu finansal hesaplayıcı size **nominal rakamlar** gösterir — enflasyon karşısında satın alma gücünü sessizce yitiren büyük gelecek bakiyeleri. MoneyTrace hesaplamaları **bugünün parasıyla** yapar; böylece sadece *ne kadarınızın olacağını* değil, o paranın *gerçekte ne satın alacağını* görürsünüz.

Açık kaynaklı, gizlilik öncelikli bir yatırım projeksiyon motoru:

- **Tüm hesaplamalar tarayıcınızda çalışır** — sunucu yok, hesap yok, takip yok, veritabanı yok. Verileriniz cihazınızdan asla çıkmaz.
- **Deterministik finans motoru** — `src/engine/` içinde saf, test edilebilir matematik; arayüz yalnızca sonuçları gösterir.
- **Portföyünüzü anlayan AI** — isteğe bağlı sohbet asistanı ve tahmin aracı, gerçek projeksiyon bağlamınızı okuyup gerçek soruları yanıtlar (örn. *"Yıllık DCA artışımı %5 yaparsam ne olur?"*).

## Özellikler

| | |
| :--- | :--- |
| 📈 **Reel ve nominal değer** | Ham bakiyenin yanında enflasyona göre düzeltilmiş satın alma gücünü de izleyin — iki eğri, tek dürüst tablo. |
| 💰 **Bileşik büyüme ve DCA motoru** | **50 yıla** kadar simülasyon: başlangıç sermayesi, aylık DCA, yıllık katkı artışı, çekimler, stopaj, enflasyon. |
| 💱 **Çoklu para birimi** | USD, EUR, GBP, JPY, TRY, BRL, INR ve daha fazlası; otomatik, yerelleştirilmiş sayı biçimlendirme. |
| 📊 **Referans para birimi takibi** | Yerel para birimi portföylerini USD (veya herhangi bir referans) karşısında, öngörülen kur büyümesiyle değerlendirin. |
| 🤖 **AI Finansal Asistan** | Aktif projeksiyonunuzu analiz eden yüzen sohbet aracı — getiriler, ufuklar, DCA varyantları; bağlam istemcide kurulur, tam gizlilik. |
| ⚡ **AI Ekonomik Tahmin** | Tek tıkla enflasyon, getiri ve döviz kuru tahminleri; portföy girdilerinizi otomatik doldurun. |
| 🔑 **Kendi anahtarını getir** | Gemini, OpenAI veya herhangi bir OpenAI uyumlu API (OpenRouter, Groq, Ollama, LM Studio…). Hosted **Demo API** modu, ziyaretçilerin AI'yı ücretsiz denemesini sağlar; kotalar sunucuda uygulanır. |
| 🎯 **Senaryo yönetimi** | Senaryolar oluşturun, kopyalayın, düzenleyin, karşılaştırın ve temel senaryo olarak sabitleyin — *İyimser*, *Piyasa Büyümesi*, *Muhafazakâr* ve *Özel* varsayılanlarıyla gelir. |
| 📊 **Etkileşimli grafikler** | Portföy büyümesi (nominal vs. reel vs. yatırılan sermaye), referans para birimi değerlemesi ve enflasyon etkisi görselleştirmeleri. |
| 📁 **Dışa ve içe aktarma** | Yıl ve ay düzeyinde tablolar için CSV dışa aktarma; tüm senaryolar için JSON yedekleme/geri yükleme. |
| 🌐 **i18n** | İngilizce ve Türkçe — anında geçiş. |
| 🔒 **Gizlilik öncelikli** | Sıfır takip, sıfır hesap; Zustand `persist` ile her şey `localStorage` içinde kalır. |

## Ekran Görüntüleri

<!-- Aşağıdaki ekran görüntülerini çekip docs/screenshots/ altına kaydet; her görselin beklenen yolu yanında belirtildi. Dosyalar eklendiğinde bu bölüm otomatik bir galeriye dönüşür. -->

### 1. Ana Panel

<!-- TODO: docs/screenshots/dashboard.png — masaüstü, koyu tema; solda portföy formu, sağda özet kartlar + projeksiyon tablosu -->
<img src="docs/screenshots/dashboard.png" alt="Ana panel: portföy formu ve projeksiyon tablosu" />

**Nasıl çekilir:** Varsayılan senaryoyla başlayın (~10 yıl) ve ana görünümü yakalayın (portföy formu + özet kartlar + tablo).

### 2. Grafikler

<!-- TODO: docs/screenshots/charts.png — ChartSection, üç Recharts görselleştirmesi de görünecek şekilde -->
<img src="docs/screenshots/charts.png" alt="Grafikler: nominal vs reel büyüme, referans para birimi, enflasyon etkisi" />

**Nasıl çekilir:** Grafik bölümüne kaydırın — büyüme vs. reel bakiye vs. yatırılan sermaye, referans para birimi çizgisi ve enflasyon etkisi kartı.

### 3. Senaryo Karşılaştırma

<!-- TODO: docs/screenshots/scenarios.png — ScenarioComparisonDialog, en az 3 senaryo yan yana -->
<img src="docs/screenshots/scenarios.png" alt="Senaryo karşılaştırma diyaloğu" />

**Nasıl çekilir:** 2–3 senaryo oluşturun (örn. *Piyasa Büyümesi* vs. *Muhafazakâr*), **Karşılaştır**'ı açın ve yan yana tabloyu yakalayın.

### 4. AI Tahmin Modalı

<!-- TODO: docs/screenshots/ai-forecast.png — AiForecastModal, tahmin edilen parametreler doldurulmuş halde -->
<img src="docs/screenshots/ai-forecast.png" alt="AI ekonomik tahmin modalı" />

**Nasıl çekilir:** **AI Tahmin** modalını açın, bir tahmin çalıştırın ve doldurulan parametreleri yakalayın.

### 5. AI Sohbet

<!-- TODO: docs/screenshots/ai-chat.png — sohbet widget'ı, görünür bir soru-cevap oturumuyla -->
<img src="docs/screenshots/ai-chat.png" alt="AI finansal asistan sohbeti" />

**Nasıl çekilir:** Sohbet FAB'ını (sağ altta) açın, önerilen sorulardan birini sorun ve konuşmayı yakalayın.

### 6. Ayarlar

<!-- TODO: docs/screenshots/settings.png — Ayarlar diyaloğu, AI sağlayıcı sekmesi açık -->
<img src="docs/screenshots/settings.png" alt="Ayarlar diyaloğu: AI sağlayıcı yapılandırması" />

**Nasıl çekilir:** Ayarlar diyaloğunu açın ve AI yapılandırmasını yakalayın (sağlayıcı, anahtar, model, base URL, Demo API anahtarı).

## Teknoloji Yığını

| Kategori | Seçim |
| :--- | :--- |
| Ön yüz | React 19 · TypeScript · Vite 8 |
| Stil | Tailwind CSS v4 (`@tailwindcss/vite`) · `@base-ui/react` · CVA + `cn()` |
| Durum | Zustand + `persist` (`localStorage`) |
| Grafikler | Recharts |
| i18n | i18next · react-i18next |
| AI (istemci) | `src/lib/ai-service.ts` · `ai-chat-service.ts` — Gemini / OpenAI / OpenAI uyumlu |
| Backend (isteğe bağlı) | Vercel Edge Function `api/demo.ts` + Upstash Redis kota sayaçları |

## Hızlı Başlangıç

```bash
git clone https://github.com/Metee01/MoneyTrace.git
cd MoneyTrace
npm install
npm run dev      # → http://localhost:5173
```

Kullanışlı komutlar:

| Komut | Amaç |
| :--- | :--- |
| `npm run dev` | Vite geliştirme sunucusunu başlatır |
| `npm run build` | Tip kontrolü (`tsc -b`) + prodüksiyon derlemesi |
| `npm run lint` · `npm run format` | ESLint · Prettier |
| `npm test` | Deterministik motor + store + AI araç testleri (`tsx` ile) |

<details>
<summary><b>🔑 Ortam değişkenleri ve demo proxy</b> (kendi örneğinizi dağıtmak için)</summary>

| Değişken | Nerede | Amaç |
| :--- | :--- | :--- |
| `VITE_DEMO_PROXY_URL` | `.env` / Vercel | Hosted **Demo API** seçeneğini etkinleştirir; `/api/demo` adresini gösterir |
| `DEMO_API_KEY` | Yalnızca Vercel | Paylaşılan demo anahtarı — edge fonksiyonunda yaşar, bundle'a asla girmez |

`api/demo.ts` içindeki proxy; kullanıcı başına kotaları (5 tahmin / 15 chat mesajı), IP başına günlük limitleri, 3 saniyelik chat cooldown'ını ve Upstash Redis ile isteğe bağlı kalıcı sayaçları uygular — ayrıntılar için `api/demo.ts` dosyasına bakın.

</details>

## Mimari

```
┌──────────────────────────────┐       ┌──────────────────────────────┐
│           Tarayıcı            │       │     Vercel (isteğe bağlı)    │
│  PortfolioForm → engine/     │  AI   │  /api/demo (Edge Function)   │
│  (saf, deterministik)        │ ───▶  │  • DEMO_API_KEY'e sahiptir   │
│  Zustand persist (yerel)     │       │  • kota + hız sınırlama      │
│  AI servis / sohbet (BYOK)   │       │  • Upstash Redis (isteğe    │
└──────────────────────────────┘       │    bağlı)                    │
         ▲ tüm finansal hesaplar       └──────────────────────────────┘
         │ cihazda kalır
```

- `src/engine/` — saf, çerçevesiz finansal matematik (bileşik büyüme, enflasyon düzeltmesi, kur çevirimi); `calculateProjection` tarafından yönetilir; deterministik, 2 ondalığa yuvarlanır.
- `src/config/index.ts` — tek doğruluk kaynağı (`APP_CONFIG`): uygulama meta verileri, AI modelleri, demo kotaları, motor limitleri.
- UI bileşenleri finansal hesaplama yapmaz — yalnızca motorun sonuçlarını tüketir.

## Proje Yapısı

```text
src/
├── components/       UI — portföy formu, projeksiyon kartları/tablo/grafik,
│                     senaryolar, sohbet widget'ı, yerleşim
├── config/           APP_CONFIG — tek doğruluk kaynağı (app, AI, engine)
├── engine/           Saf finansal matematik (compound-growth, inflation-adjust, …)
├── lib/              AI servisleri, demo-proxy istemcisi, biçimlendiriciler, dışa aktarma, i18n
├── store/            persist'li Zustand depoları (portfolio, settings)
├── locales/          en / tr çeviri sözlükleri
└── types/            Paylaşılan TypeScript tipleri
api/demo.ts           Vercel sunucusuz Demo API proxy'si
```

## Katkı ve Lisans

Bir hata buldunuz veya bir fikriniz mi var? Issue veya PR açın — ayrıntılar [CONTRIBUTING.md](CONTRIBUTING.md) içinde.

Proje [MIT Lisansı](LICENSE) ile lisanslanmıştır. Geleceğinizin *gerçek* fiyatını bilmek isteyenler için yapıldı 💸