import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ChartNoAxesCombined } from "lucide-react"
import { getSitePath, type SiteLanguage, type SitePageId } from "@/seo/site"

interface StaticPageShellProps {
  children: ReactNode
  language: SiteLanguage
  pageId: SitePageId
}

const FOOTER_PAGES: SitePageId[] = [
  "methodology",
  "about",
  "privacy",
  "cookies",
  "contact",
  "financialDisclaimer",
]

export function StaticPageShell({
  children,
  language,
  pageId,
}: StaticPageShellProps) {
  const { t } = useTranslation()
  const alternateLanguage: SiteLanguage = language === "tr" ? "en" : "tr"

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <a
            href={getSitePath("home", language)}
            className="flex items-center gap-2 font-bold tracking-tight"
          >
            <span className="rounded-lg bg-primary/10 p-2 text-primary">
              <ChartNoAxesCombined className="size-5" aria-hidden="true" />
            </span>
            MoneyTrace
          </a>
          <a
            href={getSitePath(pageId, alternateLanguage)}
            hrefLang={alternateLanguage}
            className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
          >
            {alternateLanguage.toUpperCase()}
          </a>
        </div>
      </header>
      <main className="container mx-auto flex-1 px-4 py-8">{children}</main>
      <footer className="mt-auto border-t bg-card py-8">
        <div className="container mx-auto space-y-5 px-4 text-sm text-muted-foreground">
          <p>{t("footer.summary")}</p>
          <nav aria-label={t("footer.legalNavigation")}>
            <ul className="flex flex-wrap gap-x-5 gap-y-3">
              {FOOTER_PAGES.map((pageId) => (
                <li key={pageId}>
                  <a
                    href={getSitePath(pageId, language)}
                    className="hover:text-foreground"
                  >
                    {t(`legal.nav.${pageId}`)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  )
}
