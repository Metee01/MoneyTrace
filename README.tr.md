# MoneyTrace 💸📈

**Enflasyondan Arındırılmış Portföy Projeksiyonu ve Simülasyon Aracı**

MoneyTrace; dünya genelindeki yatırımcılar için yatırım büyümesini, bileşik getiriyi, düzenli tasarrufu (DCA) ve enflasyonun paranın satın alma gücü üzerindeki eritme etkisini simüle eden modern, para biriminden bağımsız bir web uygulamasıdır.

![MoneyTrace Dashboard](public/favicon.svg)

---

## 🚀 Özellikler

- **Reel ve Nominal Bakiye:** Enflasyonun yatırımınızın satın alma gücü üzerindeki erime etkisini anında görün.
- **Global Para Birimi Desteği:** İstediğiniz yerel para birimini seçin (USD, EUR, GBP, JPY, CAD, AUD, TRY, BRL, INR vb.) ve tutarları otomatik formatlayın.
- **Bileşik Büyüme ve DCA Simülasyonu:** Aylık düzenli yatırımları ve opsiyonel yıllık katkı artış oranlarını modelleyin.
- **Referans Döviz Takibi:** Portföyünüzü seçtiğiniz bir referans döviz (USD tavsiye edilir) bazında izleyin ve tahmini kur artışlarını hesaba katın.
- **Dinamik Senaryo Yönetimi:** Farklı senaryolar (İyimser, Muhafazakar, Yüksek Büyüme vb.) oluşturun, yan yana karşılaştırın ve klonlayın.
- **AI Ekonomik Tahmin (Kendi API Anahtarınla):** Google Gemini, OpenAI veya herhangi bir OpenAI-uyumlu uç nokta (OpenRouter, Groq, LM Studio, Ollama) üzerinden para biriminiz için enflasyon, döviz kuru ve getiri beklentilerini tek tıkla üretin. Anahtarınız tarayıcıdan çıkmaz.
- **Etkileşimli Grafikler:** Recharts tabanlı performans büyüme çizgileri ve enflasyon değer kaybı alan grafikleri.
- **Veri Dışa/İçe Aktarımı:** Projeksiyon tablolarını Excel uyumlu CSV olarak indirin veya senaryolarınızı JSON formatında yedekleyin/yükleyin.
- **Çoklu Dil (i18n):** Türkçe ve İngilizce dillerine yerleşik destek.
- **%100 İstemci Taraflı ve Gizli:** Tüm verileriniz yalnızca tarayıcınızın `localStorage` alanında saklanır. Sunucuya veri gönderilmez veya izleme yapılmaz.

---

## 🛠️ Teknolojiler

- **Çekirdek:** React 19, TypeScript, Vite
- **Stil:** Tailwind CSS v4, Lucide Icons, shadcn/ui
- **Durum Yönetimi:** Zustand ve `persist` middleware
- **Görselleştirme:** Recharts
- **Uluslararasılaştırma:** i18next, react-i18next
- **AI Sağlayıcıları:** Google Gemini, OpenAI, özel OpenAI-uyumlu uç noktalar (kullanıcı sağlayıcılı API anahtarları)

---

## 📦 Başlangıç

### Gereksinimler

- Node.js (v20.19.0 veya üzeri)
- npm / yarn / pnpm / bun

### Kurulum ve Yerel Çalıştırma

1. **Repoyu klonlayın:**
   ```bash
   git clone https://github.com/Metee01/MoneyTrace.git
   cd MoneyTrace
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Geliştirici sunucusunu başlatın:**
   ```bash
   npm run dev
   ```
   Tarayıcınızda `http://localhost:5173` adresini açın.

4. **Üretim sürümünü derleyin (Build):**
   ```bash
   npm run build
   ```

5. **Linter ve Kod Kontrolü:**
   ```bash
   npm run lint
   ```

---

## 🤖 AI Ekonomik Tahmin ve CORS Proxy

### Nasıl çalışır?

Portföy formundaki **AI Tahmin** butonu (ışıltı ikonu), seçtiğiniz LLM sağlayıcısını para biriminiz ve yatırım ufkunuzla çağırır; ortalama enflasyon, döviz kuru artışı, portföy getirisi ve güncel kur beklentisini tahmin etmesini ister. Sonuç formu tek tıkla doldurur.

Kendi API anahtarınızı kullanırsınız — anahtar `localStorage` içinde saklanır ve yalnızca seçtiğiniz sağlayıcıya (veya proxy'ye) doğrudan HTTPS ile gönderilir.

### Sağlayıcılar

| Sağlayıcı | Notlar |
| --- | --- |
| **Google Gemini** | [AI Studio](https://aistudio.google.com/apikey) üzerinden ücretsiz API anahtarı |
| **OpenAI** | [platform.openai.com](https://platform.openai.com/api-keys) üzerinden API anahtarı |
| **Özel (OpenAI-uyumlu)** | OpenRouter, Groq, LM Studio, Ollama, yerel sunucular — `/chat/completions` uç noktası olan herhangi bir adres. Yerel sunucular için API anahtarı opsiyoneldir. |

### CORS proxy nedir ve ne zaman gerekir?

Tarayıcılar, API'lere üçüncü taraf sitelerden istek yapılmasını, API CORS başlıkları göndermediği sürece engeller. Çoğu sağlayıcı (Gemini, OpenAI, OpenRouter, yerel sunucular) tarayıcıdan doğrudan çalışır. Bazı özel sağlayıcılar — örn. **OpenCode Zen** — tarayıcıdan doğrudan erişimi engeller ve istek ağ/CORS hatasıyla sonuçlanır.

**CORS proxy**, isteğinizi sağlayıcıya ileten ve yanıtı izin veren CORS başlıklarıyla geri döndüren küçük bir ortak (veya kendi barındırdığınız) sunucudur.

### Nasıl kullanılır?

1. **AI Tahmin** penceresini açın → sağlayıcı olarak **Özel (OpenAI-uyumlu)** seçin.
2. **"CORS proxy kullan"** anahtarını açın — URL giriş alanı yalnızca bu anahtar açıkken görünür.
3. İçinde `{url}` yer tutucusu olan bir proxy URL'si yapıştırın. Uygulama `{url}` ifadesini kodlanmış hedef uç noktayla değiştirir:
   ```
   https://corsproxy.io/?url={url}
   ```
4. Tahmini her zamanki gibi alın. Proxy kapalıysa hiçbir proxy kullanılmaz.

> ⚠️ **Güvenlik:** isteğiniz — API anahtarı dahil — proxy üzerinden geçer. Yalnızca güvendiğiniz proxy'leri kullanın veya kendi proxy'nizi barındırın (örn. `{url}` yer tutucusu içeren bir [CORS Anywhere](https://github.com/Rob--W/cors-anywhere) tarzı aktarıcı).

---

## 📁 Proje Yapısı

```
MoneyTrace/
├── public/                 # Statik varlıklar ve favicon
├── src/
│   ├── components/         # React UI bileşenleri
│   │   ├── layout/         # Header, Footer, Layout kapsayıcısı
│   │   ├── portfolio/      # Portföy giriş formu, hazır ayarlar ve AI tahmin penceresi
│   │   ├── projection/     # Özet kartlar, grafikler ve ay-ay detay tablosu
│   │   ├── scenarios/      # Senaryo yöneticisi ve karşılaştırma dialogları
│   │   └── ui/             # Yeniden kullanılabilir UI elemanları (buton, kart, input, dialog, switch)
│   ├── engine/             # Finansal hesaplama motorları (bileşik faiz, enflasyon, döviz)
│   ├── hooks/              # Özel React hook'ları (useTheme)
│   ├── lib/                # Formatlayıcılar, dışa aktarım araçları, i18n, AI servisi, sürüm
│   ├── locales/            # Çeviri JSON dosyaları (en, tr)
│   ├── store/              # Zustand durum mağazaları (portfolio, settings)
│   ├── types/              # TypeScript arayüzleri ve tipleri
│   ├── App.tsx             # Ana dashboard düzeni
│   └── main.tsx            # Uygulama giriş noktası
├── vercel.json             # Vercel dağıtım konfigürasyonu
└── package.json            # Bağımlılıklar ve komutlar
```

---

## 🔖 Sürümleme

Güncel sürüm, başlık rozetinde ve **Ayarlar** penceresinde gösterilir. Yeni bir sürüm yayınlamak için sürümü iki yerde artırın — ikisi eşleşmelidir:

1. `package.json` → `"version": "X.Y.Z"` (sonraki `npm install` ile `package-lock.json` da güncellenir)
2. `src/lib/version.ts` → `APP_VERSION = "X.Y.Z"`

Başlık ve Ayarlar penceresi sürümü otomatik olarak `src/lib/version.ts` dosyasından okur.

---

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Kod standartları, Pull Request adımları ve yeni dil çevirileri eklemek için lütfen [CONTRIBUTING.tr.md](CONTRIBUTING.tr.md) rehberini inceleyin.

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.
