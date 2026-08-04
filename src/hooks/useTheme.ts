import { useEffect, useState } from "react"

export type Theme = "dark" | "light" | "system"

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("moneytrace-theme") as Theme
    return saved || "dark" // default is dark as requested
  })

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"
      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem("moneytrace-theme", newTheme)
    setThemeState(newTheme)
  }

  return { theme, setTheme }
}
