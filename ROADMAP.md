# MoneyTrace - Yol Haritasi / Roadmap

Turkiye'ye ozel enflasyondan arindirilmis portfoy projeksiyon araci.

## Durum Ikonlari

- ✅ Tamamlandi
- 🔄 Devam ediyor
- ⬚ Beklemede

---

## Adim 1: Proje Scaffolding ve Temel Kurulum ✅

- [x] Vite + React + TypeScript projesi olustur
- [x] Tailwind CSS v4 kurulumu
- [x] shadcn/ui kurulumu ve temel bilesenler (Button, Card, Input, Label, Dialog, Select, Tabs, Tooltip, Separator)
- [x] ESLint + Prettier konfigurasyonu
- [x] .editorconfig, .gitignore, vercel.json
- [x] Git repo init

**Test:** `npm run dev` ile sayfa acilir, `npm run build` hatasiz tamamlanir, shadcn Button render edilir.

---

## Adim 2: i18n Altyapisi + Tema Sistemi ⬚

- [ ] i18next + react-i18next kurulumu
- [ ] tr/translation.json — tum UI metinleri Turkce
- [ ] locales/README.md — katki rehberi
- [ ] Dark/Light tema sistemi (CSS degiskenleri, Tailwind dark mode)
- [ ] useTheme hook'u, localStorage'da tema tercihi
- [ ] Sistem temasi algilama (prefers-color-scheme)

**Test:** Turkce metinler gorunur, tema toggle calisir, sayfa yenilenince tercih korunur.

---

## Adim 3: Layout ve Tek Sayfa Dashboard Iskeleti ⬚

- [ ] Header.tsx: Logo, tema toggle
- [ ] Footer.tsx: GitHub linki, versiyon
- [ ] Layout.tsx: Header + icerik + Footer
- [ ] Dashboard placeholder kartlari (4 bolum)
- [ ] Responsive grid layout

**Test:** Header/Footer gorunur, placeholder kartlar responsive, dark/light gecis calisiyor.

---

## Adim 4: TypeScript Tipleri + Hesaplama Motoru ⬚

- [ ] types/index.ts: Portfolio, Scenario, ProjectionRow, ProjectionParams, Settings
- [ ] engine/compound-growth.ts: Bilesik buyume + DCA
- [ ] engine/inflation-adjust.ts: Reel deger hesabi
- [ ] engine/currency-convert.ts: USD donusum
- [ ] engine/index.ts: calculateProjection() ana fonksiyon

**Test:** Console'da hesaplama sonuclari dogrulanir (hesap makinesiyle karsilastir).

---

## Adim 5: Zustand Store (localStorage Persist) ⬚

- [ ] zustand + persist middleware kurulumu
- [ ] portfolio-store.ts: Portfoy ve senaryo CRUD, persist
- [ ] settings-store.ts: Tema, API key, dil tercihi, persist

**Test:** Store'a veri ekle, sayfayi yenile, veri localStorage'dan geri yuklenir.

---

## Adim 6: Portfoy Giris Formu ⬚

- [ ] PortfolioForm.tsx: Sermaye, sure, getiri, enflasyon, kur, DCA girisleri
- [ ] Form validasyonu
- [ ] Form submit → store → calculateProjection

**Test:** Form doldur → konsola sonuclar yazilir, validasyon calisir, sayfa yenilenince form korunur.

---

## Adim 7: Projeksiyon Tablosu ⬚

- [ ] ProjectionTable.tsx: Ay-ay detay tablosu
- [ ] Sayi formatlari (TL, USD, yuzde)
- [ ] Renk kodlari (yesil/kirmizi)

**Test:** Form doldur → tablo verilerle dolsun, formatlar dogru, reaktif guncelleme.

---

## Adim 8: Grafikler (Recharts) ⬚

- [ ] ProjectionChart.tsx: Cizgi grafigi (Nominal/Reel/USD)
- [ ] InflationImpactChart.tsx: Alan grafigi (enflasyon etkisi)
- [ ] Responsive, tema uyumlu

**Test:** Grafikler veriyle render olur, tooltip calisir, tema degisiminde renkler uyumlu.

---

## Adim 9: Dashboard Ozet Kartlari + Son Duzen ⬚

- [ ] ProjectionSummary.tsx: 6-8 ozet kart
- [ ] Dashboard final layout (form + kartlar + grafikler + tablo)
- [ ] Scroll-to-results

**Test:** Tum bilesenler birlikte calisir, kartlar/tablo/grafik tutarli, responsive OK.

---

## Adim 10: Senaryo Yonetimi ve Karsilastirma ⬚

- [ ] ScenarioManager.tsx: CRUD, kopyalama, silme (onay dialogu)
- [ ] ScenarioComparison.tsx: Overlay grafik, karsilastirma tablosu
- [ ] Store'da senaryo operasyonlari

**Test:** 3 senaryo olustur, gecis yap, sil, kopyala, karsilastirma grafigi calisir.

---

## Adim 11: CSV/JSON Disa Aktarim ⬚

- [ ] export.ts: exportToCSV, exportToJSON
- [ ] Tabloda "CSV Indir" butonu
- [ ] JSON import/export

**Test:** CSV dosyasi indirilir ve Excel'de acilir, JSON export/import dongusunde veri korunur.

---

## Adim 12: EVDS API Entegrasyonu ⬚

- [ ] api/evds.ts: Vercel serverless proxy
- [ ] evds/client.ts, series.ts, types.ts
- [ ] ApiKeyDialog.tsx: API anahtari giris dialogu
- [ ] useEvdsData.ts: Veri cekme hook'u
- [ ] Formda "EVDS'den Cek" butonu

**Test:** EVDS API anahtariyla gercek TUFE/kur verisi cekilir, proxy calisir, hata yonetimi OK.

---

## Adim 13: Son Dokunuslar ve Yayina Hazirlik ⬚

- [ ] README.md: Proje tanitimi, kurulum, katki rehberi
- [ ] LICENSE: MIT
- [ ] CONTRIBUTING.md
- [ ] Favicon, meta tags, OG tags
- [ ] Performance (React.lazy)
- [ ] Erisebilirlik kontrolu
- [ ] Vercel deploy

**Test:** `npm run build` OK, Vercel'de canli, Lighthouse skoru kontrol, README'den sifirdan kurulum.

---

## Gelecek Gelistirmeler (v2+)

- [ ] Ingilizce dil destegi
- [ ] Farkli yatirim araclari (altin, Euro, BIST)
- [ ] PWA destegi (offline calisma)
- [ ] Veri import/export (cihazlar arasi tasima)
- [ ] Gercek gecmis verilere dayali backtesting
