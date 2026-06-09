import Link from "next/link"
import { Home } from "lucide-react"

const footerLinks = [
  { label: "Buy", href: "/listings?category=buy" },
  { label: "Rent", href: "/listings?category=rent" },
  { label: "Listings", href: "/listings" },
  { label: "Cities", href: "#cities" },
  { label: "About", href: "#" },
]

export function EstateFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 py-10 md:flex-row md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
            <Home className="h-4 w-4" />
          </span>
          <span className="text-xl font-bold tracking-tight">
            Estate<span className="text-orange-500">X</span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-x-7">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-orange-500"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="font-mono text-xs text-muted-foreground">&copy; {new Date().getFullYear()} EstateX</p>
      </div>
    </footer>
  )
}
