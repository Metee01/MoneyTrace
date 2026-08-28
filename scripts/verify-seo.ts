import assert from "node:assert/strict"
import { readFile, stat } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  getAbsoluteUrl,
  getSitePath,
  SEO_COPY,
  SITE_ROUTES,
} from "../src/seo/site"

const rootDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)
const distDirectory = path.join(rootDirectory, "dist")

function getOutputFile(routePath: string): string {
  return routePath === "/"
    ? path.join(distDirectory, "index.html")
    : path.join(distDirectory, `${routePath.slice(1)}.html`)
}

for (const route of SITE_ROUTES) {
  const html = await readFile(getOutputFile(route.path), "utf8")
  const copy = SEO_COPY[route.pageId][route.language]

  assert.match(html, new RegExp(`<html lang="${route.language}">`))
  assert.ok(html.includes(`<title>${copy.title}</title>`))
  assert.ok(
    html.includes(`<link rel="canonical" href="${getAbsoluteUrl(route.path)}"`),
  )
  assert.ok(
    html.includes(
      `hreflang="tr" href="${getAbsoluteUrl(getSitePath(route.pageId, "tr"))}"`,
    ),
  )
  assert.ok(
    html.includes(
      `hreflang="en" href="${getAbsoluteUrl(getSitePath(route.pageId, "en"))}"`,
    ),
  )
  assert.ok(html.includes('type="application/ld+json"'))
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1)
  const disallowedCopy = [
    [["Tür", "kiye"].join(""), "'ye özel"].join(""),
    ["Stop", "aj"].join(""),
  ]
  for (const phrase of disallowedCopy) {
    assert.ok(
      !html.toLocaleLowerCase("tr").includes(phrase.toLocaleLowerCase("tr")),
    )
  }
}

const sitemap = await readFile(path.join(distDirectory, "sitemap.xml"), "utf8")
for (const route of SITE_ROUTES) {
  assert.ok(sitemap.includes(`<loc>${getAbsoluteUrl(route.path)}</loc>`))
}

const robots = await readFile(path.join(distDirectory, "robots.txt"), "utf8")
assert.ok(robots.includes(`Sitemap: ${getAbsoluteUrl("/sitemap.xml")}`))

const notFound = await readFile(path.join(distDirectory, "404.html"), "utf8")
assert.ok(notFound.includes('content="noindex,nofollow"'))

for (const language of ["tr", "en"]) {
  const image = await stat(path.join(distDirectory, `og-image-${language}.png`))
  assert.ok(
    image.size > 10_000,
    `og-image-${language}.png is unexpectedly small`,
  )
}

console.log(
  `Verified ${SITE_ROUTES.length} localized pages, metadata, structured data, sitemap, robots, 404, and social images.`,
)
