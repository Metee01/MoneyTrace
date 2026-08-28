import { resolveSiteRoute, type SitePageId } from "@/seo/site"

export type LegalPageId = Exclude<SitePageId, "home">

export interface LegalSection {
  id: string
  bulletCount?: number
}

export interface LegalPageDefinition {
  id: LegalPageId
  sections: LegalSection[]
}

export const LEGAL_PAGES: LegalPageDefinition[] = [
  {
    id: "methodology",
    sections: [
      { id: "compoundGrowth", bulletCount: 3 },
      { id: "inflation", bulletCount: 3 },
      { id: "contributions", bulletCount: 3 },
      { id: "currency", bulletCount: 3 },
      { id: "withdrawals", bulletCount: 3 },
      { id: "limits", bulletCount: 4 },
    ],
  },
  {
    id: "about",
    sections: [
      { id: "purpose" },
      { id: "features", bulletCount: 4 },
      { id: "privacy" },
      { id: "openSource" },
    ],
  },
  {
    id: "privacy",
    sections: [
      { id: "localData", bulletCount: 4 },
      { id: "aiData", bulletCount: 3 },
      { id: "demo", bulletCount: 3 },
      { id: "analytics", bulletCount: 3 },
      { id: "control" },
      { id: "security" },
    ],
  },
  {
    id: "cookies",
    sections: [
      { id: "cookies" },
      { id: "localStorage", bulletCount: 4 },
      { id: "analytics" },
      { id: "control" },
    ],
  },
  {
    id: "contact",
    sections: [
      { id: "channels", bulletCount: 2 },
      { id: "report", bulletCount: 3 },
      { id: "privacy" },
    ],
  },
  {
    id: "financialDisclaimer",
    sections: [
      { id: "notAdvice" },
      { id: "simulations", bulletCount: 4 },
      { id: "ai" },
      { id: "risk" },
      { id: "professional" },
      { id: "responsibility" },
    ],
  },
]

export function getLegalPage(pathname: string): LegalPageDefinition | null {
  const route = resolveSiteRoute(pathname)
  if (!route || route.pageId === "home") return null

  return LEGAL_PAGES.find((page) => page.id === route.pageId) ?? null
}
