import { Globe, User } from "lucide-react"
import { useTranslation } from "react-i18next"

export function Footer() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-card text-card-foreground py-6 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Side */}
        <div className="text-sm text-muted-foreground text-center md:text-left">
          <span>&copy; {currentYear} </span>
          <span className="font-semibold text-foreground">MoneyTrace</span>
          <span>. Open source under MIT License.</span>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-5 text-sm text-muted-foreground">
          <a
            href="https://metee.com.tr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors font-medium"
          >
            <User className="h-4 w-4 text-primary" />
            <span>{t("common.website")}</span>
          </a>

          <a
            href="https://github.com/Metee01/MoneyTrace"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors font-medium"
          >
            <Globe className="h-4 w-4" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
