import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Analytics } from "@vercel/analytics/react"
import "./index.css"
import i18n from "./lib/i18n"
import App from "./App"
import { APP_CONFIG } from "./config"
import { resolveSiteRoute } from "./seo/site"
import {
  applyDocumentMetadata,
  applyNotFoundMetadata,
} from "./seo/document-metadata"

const route = resolveSiteRoute(window.location.pathname)
const initialLanguage = route?.language ?? APP_CONFIG.app.defaultLanguage

if (route) {
  applyDocumentMetadata(route)
} else {
  applyNotFoundMetadata()
}

void i18n.changeLanguage(initialLanguage).then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
      <Analytics />
    </StrictMode>,
  )
})
