# MoneyTrace 💸📈

**Türkiye'ye Özel Enflasyondan Arındırılmış Portföy Projeksiyon ve Simülasyon Aracı**

MoneyTrace, Türkiye'deki yüksek enflasyon, döviz dalgalanmaları ve bileşik getiri dinamiklerini dikkate alarak yatırımlarınızın reel satın alma gücünü ve gelecekteki değerini simüle eden modern bir web uygulamasıdır.

![MoneyTrace Dashboard](public/favicon.svg)

---

## 🚀 Özellikler

- **Reel vs. Nominal Bakiye:** Enflasyonun paranız üzerindeki erime etkisini anlık olarak görün.
- **Bileşik Büyüme & DCA Simülasyonu:** Aylık düzenli ek yatırımlar (DCA) ve yıllık DCA artış oranları ile uzun vadeli birikiminizi hesaplayın.
- **USD / Dolar Bazlı Getiri:** TL varlıklarınızın döviz karşısındaki performansını ve kur artış senaryolarını takip edin.
- **Dinamik Senaryo Yönetimi:** İyimser, Kötümser ve Dengeli gibi farklı senaryolar oluşturun, senaryoları birbiriyle karşılaştırın ve baseline olarak atayın.
- **Etkileşimli Grafikler:** Recharts tabanlı dinamik büyüme çizgisi ve enflasyon erime alanı grafikleri.
- **JSON & CSV Aktarımı:** Tüm projeksiyon verilerinizi Excel uyumlu CSV olarak veya senaryolarınızı yedeklemek için JSON formatında indirin/yükleyin.
- **Çoklu Dil & Koyu/Açık Tema:** Türkçe ve İngilizce altyapı desteği (i18n), sistem uyumlu karanlık mod.
- **Kişisel Veri Gizliliği:** Tüm verileriniz tarayıcınızın yerel depolamasında (localStorage) saklanır, hiçbir veri sunucuya gönderilmez.

---

## 🛠️ Teknoloji Yığını

- **Core:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4, Lucide Icons, shadcn/ui
- **State & Storage:** Zustand (`persist` middleware)
- **Visualization:** Recharts
- **Internationalization:** i18next, react-i18next

---

## 📦 Kurulum ve Çalıştırma

Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin:

### Gereksinimler
- Node.js (v18.0.0 veya üzeri)
- npm veya yarn / pnpm / bun

### Adımlar

1. **Repoyu klonlayın:**
   ```bash
   git clone https://github.com/user/MoneyTrace.git
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
   Tarayıcınızda `http://localhost:5173` adresine giderek uygulamayı görüntüleyin.

4. **Üretim için build alın:**
   ```bash
   npm run build
   ```

5. **Linting & Kod Kontrolü:**
   ```bash
   npm run lint
   ```

---

## 📁 Proje Yapısı

```
MoneyTrace/
├── public/                 # Statik varlıklar ve favicon
├── src/
│   ├── components/         # UI bileşenleri
│   │   ├── layout/         # Header, Footer, Layout
│   │   ├── portfolio/      # Portföy parametre giriş formu
│   │   ├── projection/     # Özet kartları, grafikler, ay-ay tablo
│   │   ├── scenarios/      # Senaryo yönetim ve karşılaştırma dialogları
│   │   └── ui/             # shadcn/ui temel bileşenleri
│   ├── engine/             # Finansal hesaplama motorları (büyüme, enflasyon, kur)
│   ├── hooks/              # Custom React hook'ları (useTheme)
│   ├── locales/            # i18n dil çevirileri (tr, en)
│   ├── store/              # Zustand store'ları (portfolio-store, settings-store)
│   ├── types/              # TypeScript tip tanımları
│   ├── App.tsx             # Ana uygulama bileşeni
│   └── main.tsx            # Giriş noktası
├── ROADMAP.md              # Proje yol haritası ve ilerleme kaydı
├── vercel.json             # Vercel deployment konfigürasyonu
└── package.json            # Proje bağımlılıkları ve script'ler
```

---

## 🤝 Katkıda Bulunma

MoneyTrace açık kaynaklı bir projedir! Katkıda bulunmak isterseniz lütfen [CONTRIBUTING.md](CONTRIBUTING.md) dosyasını inceleyin.

1. Bu depoyu Fork'layın
2. Yeni bir Feature Branch oluşturun (`git checkout -b feature/YeniOzellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Yeni özellik eklendi'`)
4. Branch'inizi Push edin (`git push origin feature/YeniOzellik`)
5. Bir Pull Request (PR) açın

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.
