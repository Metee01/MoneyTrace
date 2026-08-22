import { Globe, TriangleAlert, User } from "lucide-react"
import { useTranslation } from "react-i18next"

export function Footer() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t bg-card py-8 text-card-foreground">
      <div className="container mx-auto space-y-6 px-4">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div className="max-w-md space-y-2 text-sm text-muted-foreground">
            <p>
              <span>&copy; {currentYear} </span>
              <span className="font-semibold text-foreground">MoneyTrace</span>
              <span>. {t("footer.license")}</span>
            </p>
            <p className="leading-6">{t("footer.summary")}</p>
          </div>

          <nav aria-label={t("footer.legalNavigation")}>
            <ul className="flex max-w-2xl flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground">
              <li>
                <a
                  className="transition-colors hover:text-foreground"
                  href="/about"
                >
                  {t("legal.nav.about")}
                </a>
              </li>
              <li>
                <a
                  className="transition-colors hover:text-foreground"
                  href="/privacy"
                >
                  {t("legal.nav.privacy")}
                </a>
              </li>
              <li>
                <a
                  className="transition-colors hover:text-foreground"
                  href="/cookies"
                >
                  {t("legal.nav.cookies")}
                </a>
              </li>
              <li>
                <a
                  className="transition-colors hover:text-foreground"
                  href="/contact"
                >
                  {t("legal.nav.contact")}
                </a>
              </li>
              <li>
                <a
                  className="transition-colors hover:text-foreground"
                  href="/financial-disclaimer"
                >
                  {t("legal.nav.financialDisclaimer")}
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex flex-col justify-between gap-4 border-t pt-5 md:flex-row md:items-center">
          <a
            href="/financial-disclaimer"
            className="flex max-w-2xl items-start gap-2 text-xs leading-5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <TriangleAlert
              className="mt-0.5 size-4 shrink-0 text-amber-500"
              aria-hidden="true"
            />
            <span>{t("footer.disclaimer")}</span>
          </a>

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
      </div>
    </footer>
  )
}
