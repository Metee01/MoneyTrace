import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Layout } from "@/components/layout/Layout"
import { useTheme } from "@/hooks/useTheme"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

function App() {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <Layout onOpenSettings={() => setIsSettingsOpen(true)}>
      <div className="space-y-6">
        {/* 1. Projeksiyon Özeti / Dashboard Kartları (Placeholder) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {["Nominal Değer", "Reel Bakiye", "Dolar Değeri", "Reel Getiri"].map(
            (title, idx) => (
              <Card key={idx} className="bg-card">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                    {title}
                  </CardDescription>
                  <CardTitle className="text-2xl font-bold">
                    {idx === 2 ? "$0.00" : idx === 3 ? "%0.00" : "₺0,00"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Placeholder veri - Adım 3
                  </p>
                </CardContent>
              </Card>
            ),
          )}
        </div>

        {/* 2. Ana Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Kolon: Portföy Girişi & Senaryolar */}
          <div className="space-y-6 lg:col-span-1">
            {/* Portföy Girişi */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("portfolio.title")}</CardTitle>
                <CardDescription>{t("portfolio.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center border border-dashed rounded-lg m-4 mt-0 bg-muted/20">
                <span className="text-sm text-muted-foreground text-center">
                  Portföy Parametreleri Formu (Adım 6)
                </span>
              </CardContent>
            </Card>

            {/* Senaryo Yönetimi */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("scenarios.title")}</CardTitle>
              </CardHeader>
              <CardContent className="h-[150px] flex items-center justify-center border border-dashed rounded-lg m-4 mt-0 bg-muted/20">
                <span className="text-sm text-muted-foreground text-center">
                  Senaryolar Listesi (Adım 10)
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Sağ Kolon: Grafik ve Tablo */}
          <div className="space-y-6 lg:col-span-2">
            {/* Grafik Kartı */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("projection.chartTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px] flex items-center justify-center border border-dashed rounded-lg m-4 mt-0 bg-muted/20">
                <span className="text-sm text-muted-foreground text-center">
                  Recharts Performans Grafiği (Adım 8)
                </span>
              </CardContent>
            </Card>

            {/* Tablo Kartı */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("projection.tableTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] flex items-center justify-center border border-dashed rounded-lg m-4 mt-0 bg-muted/20">
                <span className="text-sm text-muted-foreground text-center">
                  Ay-Ay Detay Tablosu (Adım 7)
                </span>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Ayarlar Dialog (Settings Dialog) */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("settings.title")}</DialogTitle>
            <DialogDescription>
              Uygulama ayarlarını buradan yönetebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Ayarlar parametreleri (EVDS API Anahtarı vb.) Adım 12'de eklenecektir.
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Aktif Tema: <span className="font-semibold uppercase">{theme}</span></p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setIsSettingsOpen(false)}>
              Kapat
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

export default App
