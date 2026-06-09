"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Home, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Buy", href: "/listings?category=buy" },
  { label: "Rent", href: "/listings?category=rent" },
  { label: "Listings", href: "/listings" },
]

export function EstateNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setLoggedIn(!!user)
    })
  }, [])

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-border bg-background/90 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-500",
              scrolled ? "bg-orange-500 text-white" : "bg-white/10 text-white backdrop-blur-md",
            )}
          >
            <Home className="h-4 w-4" />
          </span>
          <span
            className={cn(
              "text-xl font-bold tracking-tight transition-colors duration-500",
              scrolled ? "text-foreground" : "text-white",
            )}
          >
            Estate<span className={cn(scrolled ? "text-orange-500" : "text-orange-400")}>X</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-300",
                scrolled
                  ? "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex items-center gap-3">
          {loggedIn ? (
            <Link
              href="/dashboard"
              className={cn(
                "hidden rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-300 md:block",
                scrolled
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "bg-white text-gray-900 hover:bg-white/90",
              )}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className={cn(
                  "hidden rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-300 md:block",
                  scrolled
                    ? "text-foreground hover:bg-secondary"
                    : "text-white/80 hover:text-white",
                )}
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className={cn(
                  "hidden rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-300 md:block",
                  scrolled
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "bg-white text-gray-900 hover:bg-white/90",
                )}
              >
                Sign Up
              </Link>
            </>
          )}
          <button
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border transition-colors md:hidden",
              scrolled
                ? "border-border text-foreground"
                : "border-white/20 text-white",
            )}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className={cn(
            "border-t px-5 py-4 backdrop-blur-xl md:hidden",
            scrolled
              ? "border-border bg-background/90"
              : "border-white/10 bg-black/80",
          )}
        >
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  scrolled
                    ? "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                )}
              >
                {link.label}
              </Link>
            ))}
            {loggedIn ? (
              <Link href="/dashboard" className="mt-2 block rounded-xl bg-orange-500 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-orange-600">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/sign-in" onClick={() => setMobileOpen(false)} className={cn("mt-2 block rounded-xl border px-4 py-2.5 text-center text-sm font-medium", scrolled ? "border-border text-foreground" : "border-white/20 text-white")}>
                  Sign In
                </Link>
                <Link href="/sign-up" onClick={() => setMobileOpen(false)} className="mt-1 block rounded-xl bg-orange-500 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-orange-600">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
