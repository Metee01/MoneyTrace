import { APP_CONFIG } from "@/config"

export const SITE_LANGUAGES = ["tr", "en"] as const

export type SiteLanguage = (typeof SITE_LANGUAGES)[number]
export type SitePageId =
  | "home"
  | "methodology"
  | "about"
  | "privacy"
  | "cookies"
  | "contact"
  | "financialDisclaimer"

export interface SiteRoute {
  pageId: SitePageId
  language: SiteLanguage
  path: string
}

export interface SeoCopy {
  title: string
  description: string
}

export const PAGE_PATHS: Record<SitePageId, Record<SiteLanguage, string>> = {
  home: { tr: "/", en: "/en" },
  methodology: { tr: "/metodoloji", en: "/en/methodology" },
  about: { tr: "/hakkinda", en: "/en/about" },
  privacy: { tr: "/gizlilik", en: "/en/privacy" },
  cookies: { tr: "/cerezler", en: "/en/cookies" },
  contact: { tr: "/iletisim", en: "/en/contact" },
  financialDisclaimer: {
    tr: "/finansal-uyari",
    en: "/en/financial-disclaimer",
  },
}

export const SEO_COPY: Record<SitePageId, Record<SiteLanguage, SeoCopy>> = {
  home: {
    tr: {
      title: "Reel Getiri ve Portföy Hesaplama | MoneyTrace",
      description:
        "Enflasyonun satın alma gücünüze etkisini görün. Bileşik getiri, düzenli yatırım, reel değer ve farklı senaryoları ücretsiz hesaplayın.",
    },
    en: {
      title: "Inflation-Adjusted Portfolio Calculator | MoneyTrace",
      description:
        "Calculate compound growth, regular contributions, real purchasing power, and portfolio scenarios with an inflation-adjusted projection.",
    },
  },
  methodology: {
    tr: {
      title: "Hesaplama Metodolojisi | MoneyTrace",
      description:
        "MoneyTrace bileşik getiri, düzenli katkı, enflasyon düzeltmesi, döviz karşılaştırması ve çekim hesaplarının nasıl yapıldığını açıklar.",
    },
    en: {
      title: "Calculation Methodology | MoneyTrace",
      description:
        "Learn how MoneyTrace calculates compound growth, regular contributions, inflation-adjusted value, currency comparisons, and withdrawals.",
    },
  },
  about: {
    tr: {
      title: "MoneyTrace Hakkında | Açık Kaynak Portföy Aracı",
      description:
        "MoneyTrace'in enflasyondan arındırılmış portföy projeksiyonlarını, yerel veri yaklaşımını ve açık kaynak hesaplama motorunu keşfedin.",
    },
    en: {
      title: "About MoneyTrace | Open-Source Portfolio Tool",
      description:
        "Explore MoneyTrace's inflation-adjusted portfolio projections, local-first data approach, and open-source calculation engine.",
    },
  },
  privacy: {
    tr: {
      title: "Gizlilik Bildirimi | MoneyTrace",
      description:
        "MoneyTrace'in tarayıcınızda sakladığı verileri, AI sağlayıcılarına giden bilgileri ve çerezsiz toplu analitik kullanımını inceleyin.",
    },
    en: {
      title: "Privacy Notice | MoneyTrace",
      description:
        "Review data stored by MoneyTrace in your browser, information sent to AI providers, and its use of cookie-free aggregate analytics.",
    },
  },
  cookies: {
    tr: {
      title: "Çerez ve Yerel Depolama Bildirimi | MoneyTrace",
      description:
        "MoneyTrace'in localStorage kullanımını, çerezsiz analitiğini ve tarayıcı verilerinizi nasıl kontrol edebileceğinizi öğrenin.",
    },
    en: {
      title: "Cookie and Local Storage Notice | MoneyTrace",
      description:
        "Learn how MoneyTrace uses localStorage, cookie-free analytics, and the controls available for data stored in your browser.",
    },
  },
  contact: {
    tr: {
      title: "İletişim | MoneyTrace",
      description:
        "MoneyTrace için hata bildirimleri, özellik önerileri, dokümantasyon düzeltmeleri ve gizlilik konularında iletişim kanallarını bulun.",
    },
    en: {
      title: "Contact | MoneyTrace",
      description:
        "Find the appropriate MoneyTrace channels for bug reports, feature ideas, documentation corrections, and privacy questions.",
    },
  },
  financialDisclaimer: {
    tr: {
      title: "Finansal Uyarı | MoneyTrace",
      description:
        "MoneyTrace hesaplamalarının varsayıma dayalı eğitim araçları olduğunu ve yatırım, vergi veya hukuk danışmanlığı sunmadığını okuyun.",
    },
    en: {
      title: "Financial Disclaimer | MoneyTrace",
      description:
        "Read why MoneyTrace calculations are assumption-based educational tools and do not provide investment, tax, or legal advice.",
    },
  },
}

export const SITE_ROUTES: SiteRoute[] = Object.entries(PAGE_PATHS).flatMap(
  ([pageId, paths]) =>
    SITE_LANGUAGES.map((language) => ({
      pageId: pageId as SitePageId,
      language,
      path: paths[language],
    })),
)

export function normalizeSitePath(pathname: string): string {
  if (!pathname || pathname === "/") return "/"
  return pathname.replace(/\/+$/, "")
}

export function resolveSiteRoute(pathname: string): SiteRoute | null {
  const normalizedPath = normalizeSitePath(pathname)
  return SITE_ROUTES.find((route) => route.path === normalizedPath) ?? null
}

export function getSitePath(
  pageId: SitePageId,
  language: SiteLanguage,
): string {
  return PAGE_PATHS[pageId][language]
}

export function getAlternatePath(
  pathname: string,
  language: SiteLanguage,
): string {
  const route = resolveSiteRoute(pathname)
  return getSitePath(route?.pageId ?? "home", language)
}

export function getAbsoluteUrl(path: string): string {
  return new URL(path, APP_CONFIG.app.siteUrl).toString()
}
