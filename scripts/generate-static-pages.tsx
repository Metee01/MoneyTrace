import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import i18n from "../src/lib/i18n"
import { LegalPage } from "../src/components/legal/LegalPage"
import { getLegalPage } from "../src/components/legal/legal-pages"
import { NotFoundPage } from "../src/components/seo/NotFoundPage"
import { SeoStaticLanding } from "../src/components/seo/SeoLanding"
import { StaticPageShell } from "../src/components/seo/StaticPageShell"
import {
  getAbsoluteUrl,
  getSitePath,
  SEO_COPY,
  SITE_ROUTES,
  type SiteLanguage,
  type SiteRoute,
} from "../src/seo/site"

const rootDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)
const distDirectory = path.join(rootDirectory, "dist")
const template = await readFile(path.join(distDirectory, "index.html"), "utf8")

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c")
}

function buildJsonLd(route: SiteRoute) {
  const url = getAbsoluteUrl(route.path)
  const copy = SEO_COPY[route.pageId][route.language]
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebSite",
      "@id": `${getAbsoluteUrl("/")}#website`,
      name: "MoneyTrace",
      url: getAbsoluteUrl("/"),
      inLanguage: ["tr", "en"],
    },
  ]

  if (route.pageId === "home") {
    graph.push({
      "@type": "WebApplication",
      "@id": `${url}#application`,
      name: "MoneyTrace",
      url,
      description: copy.description,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript for interactive calculations",
      inLanguage: route.language,
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Inflation-adjusted portfolio projections",
        "Compound growth and regular contribution calculations",
        "Scenario comparison",
        "Reference-currency tracking",
      ],
    })
  } else {
    graph.push(
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        name: copy.title,
        description: copy.description,
        url,
        inLanguage: route.language,
        isPartOf: { "@id": `${getAbsoluteUrl("/")}#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "MoneyTrace",
            item: getAbsoluteUrl(getSitePath("home", route.language)),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: copy.title.split(" | ")[0],
            item: url,
          },
        ],
      },
    )
  }

  return { "@context": "https://schema.org", "@graph": graph }
}

function buildHead(route: SiteRoute, indexable = true): string {
  const copy = indexable
    ? SEO_COPY[route.pageId][route.language]
    : {
        title: "404 | MoneyTrace",
        description: "The requested MoneyTrace page could not be found.",
      }
  const canonicalUrl = getAbsoluteUrl(route.path)
  const turkishUrl = getAbsoluteUrl(getSitePath(route.pageId, "tr"))
  const englishUrl = getAbsoluteUrl(getSitePath(route.pageId, "en"))
  const locale = route.language === "tr" ? "tr_TR" : "en_US"
  const alternateLocale = route.language === "tr" ? "en_US" : "tr_TR"
  const imageUrl = getAbsoluteUrl(`/og-image-${route.language}.png`)
  const imageAlt =
    route.language === "tr"
      ? "MoneyTrace reel getiri ve portföy projeksiyonu"
      : "MoneyTrace inflation-adjusted portfolio projection"

  return `<!-- SEO:START -->
    <title>${escapeHtml(copy.title)}</title>
    <meta name="description" content="${escapeHtml(copy.description)}" />
    <meta name="author" content="MoneyTrace" />
    <meta name="robots" content="${indexable ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" : "noindex,nofollow"}" />
    <meta name="theme-color" content="#09090b" />
    <link rel="canonical" href="${canonicalUrl}" />
    <link rel="alternate" hreflang="tr" href="${turkishUrl}" />
    <link rel="alternate" hreflang="en" href="${englishUrl}" />
    <link rel="alternate" hreflang="x-default" href="${turkishUrl}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="MoneyTrace" />
    <meta property="og:locale" content="${locale}" />
    <meta property="og:locale:alternate" content="${alternateLocale}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:title" content="${escapeHtml(copy.title)}" />
    <meta property="og:description" content="${escapeHtml(copy.description)}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${imageAlt}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(copy.title)}" />
    <meta name="twitter:description" content="${escapeHtml(copy.description)}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <meta name="twitter:image:alt" content="${imageAlt}" />
    ${indexable ? `<script type="application/ld+json">${serializeJsonLd(buildJsonLd(route))}</script>` : ""}
    <!-- SEO:END -->`
}

function renderDocument(
  route: SiteRoute,
  bodyMarkup: string,
  indexable = true,
): string {
  return template
    .replace(/<html lang="[^"]+">/, `<html lang="${route.language}">`)
    .replace(
      /<!-- SEO:START -->[\s\S]*?<!-- SEO:END -->/,
      buildHead(route, indexable),
    )
    .replace('<div id="root"></div>', `<div id="root">${bodyMarkup}</div>`)
}

async function renderRoute(route: SiteRoute): Promise<string> {
  await i18n.changeLanguage(route.language)
  const page = route.pageId === "home" ? null : getLegalPage(route.path)
  const content = page ? <LegalPage page={page} /> : <SeoStaticLanding />

  return renderToStaticMarkup(
    <StaticPageShell language={route.language} pageId={route.pageId}>
      {content}
    </StaticPageShell>,
  )
}

async function writeRoute(route: SiteRoute) {
  const markup = await renderRoute(route)
  const outputFile =
    route.path === "/"
      ? path.join(distDirectory, "index.html")
      : path.join(distDirectory, `${route.path.slice(1)}.html`)

  await mkdir(path.dirname(outputFile), { recursive: true })
  await writeFile(outputFile, renderDocument(route, markup), "utf8")
}

function buildSitemap(): string {
  const entries = SITE_ROUTES.map((route) => {
    const location = getAbsoluteUrl(route.path)
    const turkishUrl = getAbsoluteUrl(getSitePath(route.pageId, "tr"))
    const englishUrl = getAbsoluteUrl(getSitePath(route.pageId, "en"))

    return `  <url>
    <loc>${location}</loc>
    <xhtml:link rel="alternate" hreflang="tr" href="${turkishUrl}" />
    <xhtml:link rel="alternate" hreflang="en" href="${englishUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${turkishUrl}" />
  </url>`
  }).join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>
`
}

for (const route of SITE_ROUTES) {
  await writeRoute(route)
}

await i18n.changeLanguage("tr" satisfies SiteLanguage)
const notFoundRoute: SiteRoute = {
  pageId: "home",
  language: "tr",
  path: "/404",
}
const notFoundMarkup = renderToStaticMarkup(
  <StaticPageShell language="tr" pageId="home">
    <NotFoundPage />
  </StaticPageShell>,
)

await writeFile(
  path.join(distDirectory, "404.html"),
  renderDocument(notFoundRoute, notFoundMarkup, false),
  "utf8",
)
await writeFile(path.join(distDirectory, "sitemap.xml"), buildSitemap(), "utf8")
await writeFile(
  path.join(distDirectory, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${getAbsoluteUrl("/sitemap.xml")}\n`,
  "utf8",
)

console.log(
  `Generated ${SITE_ROUTES.length} localized static pages, 404.html, sitemap.xml, and robots.txt.`,
)
