import { useState, lazy, Suspense } from "react"
import { useTranslation } from "react-i18next"
import { Layout } from "@/components/layout/Layout"
import { useTheme } from "@/hooks/useTheme"
import { PortfolioForm } from "@/components/portfolio/PortfolioForm"
import { ProjectionTable } from "@/components/projection/ProjectionTable"
import { ProjectionSummaryCards } from "@/components/projection/ProjectionSummaryCards"
import { ScenarioManager } from "@/components/scenarios/ScenarioManager"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// Lazy loaded integrated chart section
const ChartSection = lazy(() =>
  import("@/components/projection/ChartSection").then((module) => ({
    default: module.ChartSection,
  }))
)

function ChartFallback() {
  return (
    <div className="h-[400px] flex flex-col items-center justify-center border rounded-xl bg-card text-muted-foreground gap-2">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <span className="text-sm font-medium">Grafikler Yükleniyor...</span>
    </div>
  )
}

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
            <ScenarioManager />
          </div>

          {/* Sağ Kolon: Grafik ve Tablo */}
          <div className="space-y-6 lg:col-span-2">
            {/* Büyüme & Enflasyon Grafikleri (Entegre Kart) */}
            <Suspense fallback={<ChartFallback />}>
              <ChartSection />
            </Suspense>

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
              Uygulama tercihlerini ve sistem bilgilerini buradan görüntüleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <span className="text-muted-foreground font-medium">Uygulama Sürümü</span>
              <span className="font-semibold text-foreground">v0.1.0</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <span className="text-muted-foreground font-medium">Aktif Tema</span>
              <span className="font-semibold uppercase text-primary">{theme}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <span className="text-muted-foreground font-medium">Varsayılan Dil</span>
              <span className="font-semibold text-foreground">Türkçe (tr)</span>
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
