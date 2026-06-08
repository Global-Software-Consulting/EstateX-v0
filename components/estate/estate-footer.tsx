import { Building2 } from "lucide-react"

const footerLinks = [
  { label: "Buy", href: "#listings" },
  { label: "Rent", href: "#listings" },
  { label: "Agents", href: "#cities" },
  { label: "Cities", href: "#cities" },
  { label: "About", href: "#" },
]

export function EstateFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 py-10 md:flex-row md:px-8">
        <a href="#" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-foreground text-background">
            <Building2 className="h-4 w-4" />
          </span>
          <span className="font-display text-2xl leading-none tracking-tight">EstateX</span>
        </a>

        <nav className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
          {footerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <p className="font-mono text-xs text-muted-foreground">© {new Date().getFullYear()} EstateX</p>
      </div>
    </footer>
  )
}
