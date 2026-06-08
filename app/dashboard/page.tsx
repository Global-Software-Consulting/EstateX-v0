"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Building2, LogOut, MapPin, Home, Heart, Search } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/sign-in")
        return
      }
      setUser(user)
      setLoading(false)
    })
  }, [router])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace("/sign-in")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
      </div>
    )
  }

  const fullName = user?.user_metadata?.full_name || "there"
  const email = user?.email

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="border-b border-border">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-foreground text-background">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="font-display text-2xl leading-none tracking-tight">EstateX</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 md:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary font-mono text-xs uppercase text-foreground">
                {fullName.charAt(0)}
              </div>
              <span className="text-sm text-muted-foreground">{email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-sm border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </nav>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Dashboard</p>
        <h1 className="mt-3 font-display text-4xl leading-[0.95] md:text-5xl">
          Welcome, {fullName}
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Your personal hub for exploring, saving, and managing properties.
        </p>

        {/* Quick action cards */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/#listings"
            className="group rounded-sm border border-border bg-card p-6 transition-colors hover:border-foreground/20 hover:bg-card/80"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-secondary">
              <Search className="h-5 w-5 text-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-medium">Browse Properties</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Search thousands of curated homes across the country.
            </p>
          </Link>

          <div className="rounded-sm border border-border bg-card p-6 opacity-60">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-secondary">
              <Heart className="h-5 w-5 text-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-medium">Saved Properties</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Your favorited listings will appear here.
            </p>
            <span className="mt-3 inline-block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Coming soon</span>
          </div>

          <div className="rounded-sm border border-border bg-card p-6 opacity-60">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-secondary">
              <Home className="h-5 w-5 text-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-medium">My Listings</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Manage and track your listed properties.
            </p>
            <span className="mt-3 inline-block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Coming soon</span>
          </div>
        </div>

        {/* Account info */}
        <div className="mt-12 rounded-sm border border-border bg-card p-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Account Details</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm">{fullName}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm">{email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Member since</span>
              <span className="text-sm">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
