import { useTranslation } from "react-i18next"
import {
  ArrowDown,
  BookOpenText,
  ChartNoAxesCombined,
  CircleDollarSign,
  GitCompareArrows,
  LockKeyhole,
  TrendingDown,
} from "lucide-react"
import { getSitePath, type SiteLanguage } from "@/seo/site"

const GUIDE_ICONS = [TrendingDown, CircleDollarSign, GitCompareArrows]

export function SeoHero() {
  const { t, i18n } = useTranslation()
  const language = (i18n.resolvedLanguage ?? i18n.language).startsWith("en")
    ? "en"
    : "tr"

  return (
    <section className="relative overflow-hidden rounded-2xl border bg-card px-5 py-7 shadow-sm sm:px-8 sm:py-10 lg:px-10">
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[44%] opacity-35 lg:block"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "linear-gradient(to left, black, transparent)",
        }}
      />

      <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <div className="space-y-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <ChartNoAxesCombined className="size-4" aria-hidden="true" />
            {t("seo.hero.eyebrow")}
          </p>
          <div className="space-y-3">
            <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
              {t("seo.hero.title")}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              {t("seo.hero.description")}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="#calculator"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t("seo.hero.start")}
              <ArrowDown className="size-4" aria-hidden="true" />
            </a>
            <a
              href={getSitePath("methodology", language as SiteLanguage)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <BookOpenText className="size-4" aria-hidden="true" />
              {t("seo.hero.methodology")}
            </a>
          </div>

          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
            {[0, 1, 2].map((index) => (
              <li key={index} className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-primary" />
                {t(`seo.hero.signals.${index}`)}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative rounded-xl border bg-background/90 p-5 shadow-sm backdrop-blur">
          <div className="mb-5 flex items-center justify-between gap-4 border-b pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("seo.ledger.label")}
            </span>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {t("seo.ledger.badge")}
            </span>
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{t("seo.ledger.nominal")}</span>
                <span className="font-mono text-muted-foreground">100%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-full rounded-full bg-primary/35" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{t("seo.ledger.real")}</span>
                <span className="font-mono text-primary">
                  {t("seo.ledger.adjusted")}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[68%] rounded-full bg-primary" />
              </div>
            </div>
            <p className="flex items-start gap-2 border-t pt-4 text-xs leading-5 text-muted-foreground">
              <TrendingDown
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              {t("seo.ledger.note")}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export function SeoGuide() {
  const { t } = useTranslation()

  return (
    <section
      className="space-y-8 border-t pt-10"
      aria-labelledby="seo-guide-title"
    >
      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {t("seo.guide.eyebrow")}
        </p>
        <h2
          id="seo-guide-title"
          className="text-2xl font-bold tracking-tight sm:text-3xl"
        >
          {t("seo.guide.title")}
        </h2>
        <p className="leading-7 text-muted-foreground">
          {t("seo.guide.description")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((index) => {
          const Icon = GUIDE_ICONS[index]
          return (
            <article key={index} className="rounded-xl border bg-card p-5">
              <Icon className="mb-4 size-5 text-primary" aria-hidden="true" />
              <h3 className="mb-2 font-semibold">
                {t(`seo.guide.items.${index}.title`)}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {t(`seo.guide.items.${index}.body`)}
              </p>
            </article>
          )
        })}
      </div>

      <aside className="flex flex-col justify-between gap-5 rounded-xl border bg-muted/35 p-5 sm:flex-row sm:items-center">
        <div className="flex max-w-3xl items-start gap-3">
          <LockKeyhole
            className="mt-0.5 size-5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <div>
            <h3 className="font-semibold">{t("seo.privacy.title")}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {t("seo.privacy.body")}
            </p>
          </div>
        </div>
        <a
          href="https://github.com/Metee01/MoneyTrace"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-sm font-semibold text-primary hover:underline"
        >
          {t("seo.privacy.source")}
        </a>
      </aside>
    </section>
  )
}

export function SeoStaticLanding() {
  const { t } = useTranslation()

  return (
    <div className="space-y-10">
      <SeoHero />
      <section id="calculator" className="rounded-xl border bg-card p-6">
        <h2 className="text-xl font-semibold">
          {t("seo.staticCalculator.title")}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          {t("seo.staticCalculator.body")}
        </p>
      </section>
      <SeoGuide />
    </div>
  )
}
