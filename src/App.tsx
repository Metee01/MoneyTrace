import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Layout } from "@/components/layout/Layout"
import { useTheme } from "@/hooks/useTheme"
import { PortfolioForm } from "@/components/portfolio/PortfolioForm"
import { ProjectionTable } from "@/components/projection/ProjectionTable"
import { ProjectionChart } from "@/components/projection/ProjectionChart"
import { InflationImpactChart } from "@/components/projection/InflationImpactChart"
import { ProjectionSummaryCards } from "@/components/projection/ProjectionSummaryCards"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Flame } from "lucide-react"
import {
  Card,
  CardContent,
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
        {/* 1. Projeksiyon Özeti / Dashboard Özet Kartları */}
        <ProjectionSummaryCards />

        {/* 2. Ana Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Kolon: Portföy Girişi & Senaryolar */}
          <div className="space-y-6 lg:col-span-1">
            {/* Portföy Giriş Formu */}
            <PortfolioForm />

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
            {/* Grafikler (Tabs ile Çizgi & Alan Grafikleri) */}
            <Tabs defaultValue="growth" className="w-full space-y-3">
              <div className="flex items-center justify-between">
                <TabsList className="bg-muted p-1">
                  <TabsTrigger value="growth" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span>Büyüme Grafiği</span>
                  </TabsTrigger>
                  <TabsTrigger value="inflation" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <Flame className="w-4 h-4 text-rose-500" />
                    <span>Enflasyon Etkisi</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="growth" className="mt-0">
                <ProjectionChart />
              </TabsContent>
              <TabsContent value="inflation" className="mt-0">
                <InflationImpactChart />
              </TabsContent>
            </Tabs>

            {/* Projeksiyon Tablosu */}
            <ProjectionTable />
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
