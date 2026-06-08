"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Building2, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

const navLinks = [
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
          ? "border-b border-border bg-background/70 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-foreground text-background">
            <Building2 className="h-4 w-4" />
          </span>
          <span className="font-display text-2xl leading-none tracking-tight">EstateX</span>
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {loggedIn ? (
            <Link href="/dashboard" className="hidden rounded-sm bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 md:block">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="hidden rounded-sm border border-border px-4 py-2 text-sm transition-colors hover:bg-secondary md:block">
                Sign In
              </Link>
              <Link href="/sign-up" className="hidden rounded-sm bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 md:block">
                Sign Up
              </Link>
            </>
          )}
          <button
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-border md:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-border bg-background/90 px-5 py-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-sm px-2 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            {loggedIn ? (
              <Link href="/dashboard" className="mt-2 block rounded-sm bg-foreground px-4 py-2.5 text-center text-sm font-medium text-background transition-opacity hover:opacity-90">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="mt-2 block rounded-sm border border-border px-4 py-2.5 text-center text-sm transition-colors hover:bg-secondary">Sign In</Link>
                <Link href="/sign-up" className="mt-1 block rounded-sm bg-foreground px-4 py-2.5 text-center text-sm font-medium text-background transition-opacity hover:opacity-90">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
