export type LegalPageId =
  "about" | "privacy" | "cookies" | "contact" | "financialDisclaimer"

export interface LegalSection {
  id: string
  bulletCount?: number
}

export interface LegalPageDefinition {
  id: LegalPageId
  path: string
  sections: LegalSection[]
}

export const LEGAL_PAGES: LegalPageDefinition[] = [
  {
    id: "about",
    path: "/about",
    sections: [
      { id: "purpose" },
      { id: "features", bulletCount: 4 },
      { id: "privacy" },
      { id: "openSource" },
    ],
  },
  {
    id: "privacy",
    path: "/privacy",
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
    path: "/cookies",
    sections: [
      { id: "cookies" },
      { id: "localStorage", bulletCount: 4 },
      { id: "analytics" },
      { id: "control" },
    ],
  },
  {
    id: "contact",
    path: "/contact",
    sections: [
      { id: "channels", bulletCount: 2 },
      { id: "report", bulletCount: 3 },
      { id: "privacy" },
    ],
  },
  {
    id: "financialDisclaimer",
    path: "/financial-disclaimer",
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

const PAGE_ALIASES: Record<string, LegalPageId> = {
  "/hakkinda": "about",
  "/gizlilik": "privacy",
  "/cerezler": "cookies",
  "/iletisim": "contact",
  "/finansal-uyari": "financialDisclaimer",
}

export function getLegalPage(pathname: string): LegalPageDefinition | null {
  const normalizedPath =
    pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname
  const directMatch = LEGAL_PAGES.find((page) => page.path === normalizedPath)

  if (directMatch) return directMatch

  const aliasId = PAGE_ALIASES[normalizedPath]
  return LEGAL_PAGES.find((page) => page.id === aliasId) ?? null
}
