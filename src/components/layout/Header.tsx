import { useTranslation } from "react-i18next"
import { useTheme } from "@/hooks/useTheme"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Laptop, TrendingUp, Settings } from "lucide-react"

interface HeaderProps {
  onOpenSettings?: () => void
}

export function Header({ onOpenSettings }: HeaderProps) {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  return (
    <header className="border-b bg-card text-card-foreground">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight">MoneyTrace</span>
            <span className="hidden md:inline-block ml-2 text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full font-medium">
              v0.1.0-alpha
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Theme Switcher buttons */}
          <div className="flex items-center border rounded-lg p-0.5 bg-muted/50">
            <Button
              variant="ghost"
              size="icon-xs"
              className={theme === "light" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"}
              onClick={() => setTheme("light")}
              title={t("common.light")}
            >
              <Sun className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className={theme === "dark" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"}
              onClick={() => setTheme("dark")}
              title={t("common.dark")}
            >
              <Moon className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className={theme === "system" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"}
              onClick={() => setTheme("system")}
              title={t("common.system")}
            >
              <Laptop className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Settings Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={onOpenSettings}
            title={t("common.settings")}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
