import { getAbsoluteUrl, getSitePath, SEO_COPY, type SiteRoute } from "./site"

function setMetaContent(selector: string, value: string) {
  document
    .querySelector<HTMLMetaElement>(selector)
    ?.setAttribute("content", value)
}

function setLinkHref(selector: string, value: string) {
  document.querySelector<HTMLLinkElement>(selector)?.setAttribute("href", value)
}

export function applyDocumentMetadata(route: SiteRoute) {
  const copy = SEO_COPY[route.pageId][route.language]
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

  document.documentElement.lang = route.language
  document.title = copy.title
  setMetaContent('meta[name="description"]', copy.description)
  setMetaContent(
    'meta[name="robots"]',
    "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
  )
  setLinkHref('link[rel="canonical"]', canonicalUrl)
  setLinkHref('link[rel="alternate"][hreflang="tr"]', turkishUrl)
  setLinkHref('link[rel="alternate"][hreflang="en"]', englishUrl)
  setLinkHref('link[rel="alternate"][hreflang="x-default"]', turkishUrl)

  setMetaContent('meta[property="og:locale"]', locale)
  setMetaContent('meta[property="og:locale:alternate"]', alternateLocale)
  setMetaContent('meta[property="og:url"]', canonicalUrl)
  setMetaContent('meta[property="og:title"]', copy.title)
  setMetaContent('meta[property="og:description"]', copy.description)
  setMetaContent('meta[property="og:image"]', imageUrl)
  setMetaContent('meta[property="og:image:alt"]', imageAlt)
  setMetaContent('meta[name="twitter:title"]', copy.title)
  setMetaContent('meta[name="twitter:description"]', copy.description)
  setMetaContent('meta[name="twitter:image"]', imageUrl)
  setMetaContent('meta[name="twitter:image:alt"]', imageAlt)
}

export function applyNotFoundMetadata() {
  document.title = "404 | MoneyTrace"
  setMetaContent('meta[name="robots"]', "noindex,nofollow")
  setLinkHref('link[rel="canonical"]', getAbsoluteUrl("/404"))
}
