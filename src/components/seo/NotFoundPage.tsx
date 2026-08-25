import { useTranslation } from "react-i18next"

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto flex min-h-[55vh] max-w-2xl flex-col items-center justify-center space-y-5 text-center">
      <p className="font-mono text-sm font-semibold text-primary">404</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {t("notFound.title")}
      </h1>
      <p className="max-w-lg leading-7 text-muted-foreground">
        {t("notFound.description")}
      </p>
      <a
        href="/"
        className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
      >
        {t("notFound.action")}
      </a>
    </div>
  )
}
