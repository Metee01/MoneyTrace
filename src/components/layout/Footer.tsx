import { Globe } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-card text-card-foreground py-6 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Side */}
        <div className="text-sm text-muted-foreground text-center md:text-left">
          <span>&copy; {currentYear} </span>
          <span className="font-semibold text-foreground">MoneyTrace</span>
          <span>. Open source under MIT License.</span>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <a
            href="https://github.com/Metee01/MoneyTrace"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <Globe className="h-4 w-4" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
