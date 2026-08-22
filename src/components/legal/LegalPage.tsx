import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft,
  Cookie,
  ExternalLink,
  GitFork,
  Info,
  Mail,
  ShieldCheck,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LEGAL_PAGES, type LegalPageDefinition } from "./legal-pages"

interface LegalPageProps {
  page: LegalPageDefinition
}

const PAGE_ICONS: Record<LegalPageDefinition["id"], LucideIcon> = {
  about: Info,
  privacy: ShieldCheck,
  cookies: Cookie,
  contact: Mail,
  financialDisclaimer: TriangleAlert,
}

export function LegalPage({ page }: LegalPageProps) {
  const { t } = useTranslation()
  const Icon = PAGE_ICONS[page.id]
  const pageKey = `legal.pages.${page.id}`

  useEffect(() => {
    document.title = `${t(`${pageKey}.title`)} | MoneyTrace`
    const description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    )
    description?.setAttribute("content", t(`${pageKey}.description`))
  }, [pageKey, t])

  return (
    <article className="mx-auto max-w-4xl space-y-8 pb-8">
      <a
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t("legal.backToApp")}
      </a>

      <header className="space-y-5 border-b pb-8">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-6" aria-hidden="true" />
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {t("legal.eyebrow")}
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t(`${pageKey}.title`)}
          </h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
            {t(`${pageKey}.description`)}
          </p>
          <p className="text-xs font-medium text-muted-foreground">
            {t("legal.lastUpdated")}
          </p>
        </div>
      </header>

      <nav aria-label={t("legal.pageNavigation")}>
        <ul className="flex flex-wrap gap-2">
          {LEGAL_PAGES.map((item) => (
            <li key={item.id}>
              <a
                href={item.path}
                aria-current={item.id === page.id ? "page" : undefined}
                className="inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground aria-[current=page]:border-primary aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
              >
                {t(`legal.nav.${item.id}`)}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Card className="gap-0 py-0">
        <CardContent className="divide-y px-6 sm:px-8">
          {page.sections.map((section) => {
            const sectionKey = `${pageKey}.sections.${section.id}`

            return (
              <section
                key={section.id}
                className="space-y-3 py-7 first:pt-8 last:pb-8"
              >
                <h2 className="text-lg font-semibold tracking-tight">
                  {t(`${sectionKey}.title`)}
                </h2>
                <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base">
                  {t(`${sectionKey}.body`)}
                </p>
                {section.bulletCount ? (
                  <ul className="space-y-2 pl-5 text-sm leading-6 text-muted-foreground sm:text-base">
                    {Array.from({ length: section.bulletCount }, (_, index) => (
                      <li
                        key={index}
                        className="list-disc pl-1 marker:text-primary"
                      >
                        {t(`${sectionKey}.bullets.${index}`)}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            )
          })}
        </CardContent>
      </Card>

      {page.id === "contact" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            render={
              <a
                href="https://github.com/Metee01/MoneyTrace/issues"
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <GitFork aria-hidden="true" />
            {t("legal.actions.githubIssues")}
            <ExternalLink aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            render={
              <a
                href="https://metee.com.tr"
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            {t("legal.actions.developerWebsite")}
            <ExternalLink aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button render={<a href="/" />}>
            {t("legal.actions.openCalculator")}
          </Button>
          <Button
            variant="outline"
            render={
              <a
                href="https://github.com/Metee01/MoneyTrace"
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <GitFork aria-hidden="true" />
            {t("legal.actions.sourceCode")}
            <ExternalLink aria-hidden="true" />
          </Button>
          {page.id === "privacy" || page.id === "cookies" ? (
            <Button
              variant="outline"
              render={
                <a
                  href="https://vercel.com/docs/analytics/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <ShieldCheck aria-hidden="true" />
              {t("legal.actions.analyticsPrivacy")}
              <ExternalLink aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      )}
    </article>
  )
}
