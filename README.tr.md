# 💸 MoneyTrace

### Gizlilik Öncelikli Yatırım Projeksiyonu ve AI Simülasyon Motoru

**[MoneyTrace](https://moneytrace.metee.com.tr)**, yatırımcıların servetlerinin bileşik faiz ve DCA (Dolar Maliyeti Ortalaması) stratejileriyle zaman içinde nasıl büyüyebileceğini anlamalarına yardımcı olan, enflasyonun satın alma gücü üzerindeki gerçek etkisini ortaya koyan, gizlilik öncelikli bir yatırım projeksiyonu ve simülasyon aracıdır. Tüm hesaplamalar tarayıcınızda yerel olarak çalışır; sunucu tarafındaki tek bileşen isteğe bağlı Demo API proxy'sidir.

**AI Finansal Asistan Chat** ve **AI Destekli Ekonomik Tahmin** özellikleriyle MoneyTrace, finansal verilerinizi herhangi bir harici sunucuda saklamadan, portföy projeksiyonlarınız hakkında veri odaklı içgörüler sunar.

---

<p align="center">
  <a href="https://moneytrace.metee.com.tr"><strong>🌐 Canlı Demoyu Başlat</strong></a> &nbsp;|&nbsp;
  <a href="https://github.com/Metee01/MoneyTrace"><strong>💻 GitHub Deposu</strong></a>
</p>

---

## ✨ Temel Özellikler

### 1. 📈 Reel ve Nominal Değer Karşılaştırması
- Nominal bakiye büyümesini **enflasyona göre düzeltilmiş satın alma gücü** ile karşılaştırın.
- Gelecekteki bakiye rakamlarınızın ne kadar büyük göründüğünü değil, o paranın bugünkü koşullarda gerçekte ne satın alabildiğini anlayın.

### 2. 🤖 AI Finansal Asistan Chat
- Aktif portföy projeksiyonlarınız hakkında sorularınızı yanıtlamaya hazır, etkileşimli yüzen sohbet aracı (sağ altta FAB).
- Bileşik getirileri, risk ufuklarını ve DCA strateji varyasyonlarını analiz eder (örn. *"Yıllık DCA artışımı %5 yaparsam ne olur?"*).
- **%100 Gizli:** Tüm portföy bağlamı, sorgular seçtiğiniz AI sağlayıcısına gönderilmeden önce tamamen istemci tarafında oluşturulur.

### 3. ⚡ AI Ekonomik Tahmin
- Tek tıkla makroekonomik parametre tahminleri (öngörülen enflasyon oranları, yıllık getiriler, döviz kurları).
- Gerçek zamanlı piyasa projeksiyonlarını kullanarak yatırım girdilerini otomatik doldurur.

### 4. 🔑 Esnek AI Yapılandırması ve Demo Modu
**Ayarlar** diyaloğundan AI deneyiminizi yapılandırın:
- **Demo API Modu:** Ücretsiz kotalarla (5 tahmin, 15 chat mesajı) AI sohbet ve tahmin özelliklerini kutu açılır açılmaz deneyin.
- **Kendi Anahtarını Getir (BYOK):** Sınırsız AI etkileşimi için kendi API anahtarınızı bağlayın.
- **Desteklenen Sağlayıcılar:** Google Gemini (`gemini-3.6-flash`), OpenAI (`gpt-4o-mini`) ve OpenAI uyumlu özel API'ler (OpenRouter, Groq, LM Studio, Ollama vb.).
- **Yerleşik Güvenlik:** Sunucu tarafında uygulanan kotalar ve cooldown süreleri, mesaj uzunluğu sınırları ve prompt injection koruması.

### 5. 🌍 Global Para Birimi Desteği
- Tamamen para biriminden bağımsız: **USD**, **EUR**, **GBP**, **JPY**, **CAD**, **AUD**, **TRY**, **BRL**, **INR** ve daha fazlasını destekler.
- Sayıları seçilen para birimi standartlarına göre otomatik olarak biçimlendirir.

### 6. 💰 Bileşik Büyüme ve DCA Simülasyonu
**50 yıla** kadar (600 ay) kapsamlı finansal modeller simüle edin:
- Başlangıç sermayesi ve aylık DCA katkıları
- Bileşik yıllık getiri oranı
- Yıllık DCA katkı artışı (%)
- Aylık nakit çekimleri
- Stopaj vergisi kesintileri (%)
- Enflasyon oranı ayarlamaları

### 7. 💱 Referans Para Birimi Takibi
- Yerel para birimi portföylerinizi referans bir para birimine (örn. USD) karşı takip edin.
- Uzun vadeli döviz maruziyetini değerlendirmek için öngörülen döviz kuru büyümesini modelleyin.

### 8. 🎯 Senaryo Yönetimi
- Temel portföy senaryoları oluşturun, kopyalayın, düzenleyin, karşılaştırın ve ayarlayın.
- Önceden yapılandırılmış varsayılanlar: **İyimser**, **Piyasa Büyümesi**, **Muhafazakâr** ve **Özel**.
- Yan yana senaryo karşılaştırma tablosu ve metrikleri.

### 9. 📊 Etkileşimli Görselleştirmeler
**Recharts** destekli görsel analitikler:
- **Portföy Büyümesi:** Nominal vs. Reel Bakiye vs. Yatırılan Sermaye
- **Referans Para Birimi Bakiyesi:** Referans para biriminde değerleme ($)
- **Enflasyon Etkisi:** Satın alma gücü kaybı görselleştirmesi

### 10. 📁 Dışa ve İçe Aktarma
- **CSV Dışa Aktarma:** Yıl yıl ve ay ay eksiksiz projeksiyon tabloları.
- **JSON Yedekleme:** Tüm senaryoları JSON olarak dışa aktarın ve tarayıcılar veya cihazlar arasında sorunsuz geri yükleyin.

### 11. 🌐 Uluslararasılaştırma (i18n)
- Kesintisiz dil değiştirme: **İngilizce (en)** ve **Türkçe (tr)**.

### 12. 🔒 Gizlilik Öncelikli Mimari
- **%100 İstemci Tarafı Motor:** Tüm finansal hesaplamalar tarayıcınızda yerel olarak çalışır.
- **Takip Yok:** Sıfır veritabanı depolama, kullanıcı hesabı yok, finansal girdilerinizin analitik takibi yok.
- **Yerel Kalıcılık:** Veriler, Zustand `persist` middleware'i ile `localStorage` içinde yerel olarak saklanır.
- **İsteğe Bağlı Demo Proxy:** Demo modu etkinleştirildiğinde istekler, paylaşılan demo anahtarına sahip olan ve kotaları sunucu tarafında uygulayan bir sunucusuz proxy'den (`api/demo.ts`) geçer — portföy verileriniz orada asla saklanmaz.

---

## 🛠️ Teknoloji Yığını

| Kategori | Teknoloji ve Kütüphaneler |
| :--- | :--- |
| **Framework ve Dil** | React 19, TypeScript, Vite 8 |
| **Stil ve UI** | Tailwind CSS v4 (`@tailwindcss/vite` eklentisi), `@base-ui/react` (shadcn base-nova stili), Lucide Icons |
| **Durum ve Depolama** | Zustand (`persist` middleware -> `localStorage`) |
| **Grafikler** | Recharts |
| **Uluslararasılaştırma** | i18next & react-i18next |
| **Stil Yardımcıları** | `class-variance-authority`, `clsx`, `tailwind-merge` |
| **Analitik** | `@vercel/analytics` |
| **Backend (isteğe bağlı)** | Vercel Edge Fonksiyonu (`api/demo.ts`), `@upstash/redis` (isteğe bağlı kalıcı kota sayaçları) |

> **Not:** Tailwind CSS v4, `tailwind.config` dosyası olmadan doğrudan `@tailwindcss/vite` eklentisiyle entegre edilmiştir. Tema yapılandırması ve özel CSS değişkenleri `src/index.css` içindedir.

---

## ⚙️ Merkezi Yapılandırma (`src/config/index.ts`)

Tüm uygulama ayarları, AI model yapılandırmaları, demo kota limitleri ve varsayılan motor parametreleri `src/config/index.ts` içinde merkezi olarak yönetilir:

```typescript
// APP_CONFIG'un kısaltılmış özeti
export const APP_CONFIG = {
  app: {
    name: "MoneyTrace",
    version: "x.x.x",
    defaultLanguage: "en",
    defaultCurrencyCode: "USD",
  },
  ai: {
    models: {
      gemini: "gemini-3.6-flash",
      openai: "gpt-4o-mini",
      demo: "nvidia/nemotron-3-ultra-550b-a55b:free",
    },
    demo: { maxForecasts: 5, maxChatMessages: 15, maxMessageLength: 500, cooldownMs: 3000 },
    // ...
  },
  engine: {
    maxTargetYears: 50,
    maxTargetMonths: 600,
    roundingDecimals: 2,
    defaultParams: { /* ... */ }
  }
};
```

---

## 📂 Proje Yapısı

```text
MoneyTrace/
├── api/                    # Vercel sunucusuz demo proxy'si (demo.ts) — demo API anahtarına sahiptir
├── public/                 # Statik varlıklar & favicon
├── src/
│   ├── components/
│   │   ├── chat/          # AI Chat FAB widget'ı & paneli (AiChat.tsx)
│   │   ├── layout/        # Header, Footer, Layout sarmalayıcısı
│   │   ├── portfolio/     # Portföy girdi formu & AI Tahmin modalı
│   │   ├── projection/    # Özet kartlar, Recharts grafik alanı, detay tablosu
│   │   ├── scenarios/     # Senaryo yöneticisi & karşılaştırma diyaloğu
│   │   └── ui/            # Base UI bileşenleri (Button, Card, Dialog, Input, Label, Select, Separator, Switch, Tabs, Tooltip)
│   ├── config/            # Merkezi uygulama yapılandırması (APP_CONFIG)
│   ├── engine/            # Saf ve deterministik finansal hesaplamalar (compound-growth, inflation-adjust, currency-convert)
│   ├── hooks/             # Özel hook'lar (useTheme)
│   ├── lib/               # AI servisi, AI chat servisi, demo-proxy istemcisi, biçimlendiriciler, dışa aktarma, i18n, utils
│   ├── locales/           # Çeviri dosyaları (en, tr)
│   ├── store/             # Zustand depoları (portfolio-store, settings-store)
│   ├── types/             # TypeScript arayüzleri & tipleri
│   ├── App.tsx            # Ana uygulama girişi & Ayarlar diyaloğu
│   ├── index.css          # Tailwind CSS v4 teması & CSS özel değişkenleri
│   └── main.tsx           # React DOM giriş noktası
├── .env.example           # Demo proxy yapılandırması
├── vercel.json            # Vercel SPA yönlendirmeleri (/api/* hariç)
├── vite.config.ts         # React & Tailwind eklentileriyle Vite yapılandırması
├── tsconfig.app.json      # @/* -> src/* path alias'li TypeScript yapılandırması
├── eslint.config.js       # ESLint flat yapılandırması
├── package.json
└── README.tr.md
```

---

## 💻 Gereksinimler ve Kurulum

### Gereksinimler
- **Node.js**: `>= 20.19`
- **npm** veya tercih ettiğiniz paket yöneticisi

### Kurulum Adımları

1. **Depoyu klonlayın:**
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
   Tarayıcınızda `http://localhost:5173` adresini açın.

4. **Prodüksiyon derlemesini oluşturun:**
   ```bash
   npm run build
   ```

5. **Lint ve test paketlerini çalıştırın:**
   ```bash
   npm run lint
   npm run test
   ```

---

## 🔑 Ortam Değişkenleri

Paylaşılan demo API anahtarı **yalnızca sunucu tarafındadır** ve istemci bundle'ına asla girmez. İstemci yalnızca proxy adresini bilir.

### Yerel geliştirme (`.env`)

```bash
# İsteğe bağlı: "Demo API'yi Kullan" seçeneğini UI'da etkinleştirir.
# Yayındaki bir proxy adresini gösterin, örn. https://your-site.vercel.app/api/demo
VITE_DEMO_PROXY_URL=
```

### Vercel dağıtımı

Bunları **Vercel → Proje → Ayarlar → Ortam Değişkenleri** alanına ekleyin:

| Değişken | Değer | Notlar |
| :--- | :--- | :--- |
| `DEMO_API_KEY` | `sk-or-v1-...` | Paylaşılan demo API anahtarı (yalnızca sunucu tarafında) |
| `VITE_DEMO_PROXY_URL` | `/api/demo` | Demo API seçeneğini etkinleştirir (Production) |

İsteğe bağlı: Kalıcı kota sayaçları için Vercel Marketplace'ten **Upstash Redis** entegrasyonunu kurun. Kurulmazsa proxy, bellek içi sayaçlara geri döner.

---

## 🔒 Demo API Mimarisi

```
Tarayıcı ──▶ /api/demo (Vercel Edge Fonksiyonu) ──▶ AI Sağlayıcısı (OpenRouter)
              │
              ├─ DEMO_API_KEY'e sahiptir (ortam değişkeni, bundle'da asla yok)
              ├─ Kullanıcı başına kotaları uygular (5 tahmin / 15 chat mesajı)
              ├─ IP başına günlük limitleri ve 3 sn chat cooldown'ı uygular
              └─ Sayaçlar için isteğe bağlı Upstash Redis kalıcılığı
```

- Demo anahtarı yalnızca sunucusuz fonksiyonun ortamında yaşar ve üst akış isteğine sunucuda eklenir — sitenin JavaScript'inden çıkarılamaz.
- Kota sayaçları her istekten önce atomik olarak ayrılır ve sağlayıcı çağrısı başarısız olursa geri alınır.
- İstemci, anonim ve kalıcı bir `demoUserId` gönderir; tarayıcı depolamasını sıfırlamak artık sunucu tarafı kotaları sıfırlamaz.

---

## 📄 Lisans

Bu proje **MIT Lisansı** ile lisanslanmıştır — ayrıntılar için [LICENSE](LICENSE) dosyasına bakın.