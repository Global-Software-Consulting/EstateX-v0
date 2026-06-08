"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function EstateCta() {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setLoggedIn(!!user)
    })
  }, [])

  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-5 py-24 text-center md:py-32">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Sell Smarter</p>
        <h2 className="mt-5 text-balance font-display text-5xl leading-[0.95] md:text-7xl">
          Have a property to <span className="word-gradient">sell?</span>
        </h2>
        <p className="mt-6 max-w-lg text-pretty leading-relaxed text-muted-foreground">
          List your home with EstateX and reach thousands of qualified buyers and renters. Our agents handle the rest.
        </p>
        <Link
          href={loggedIn ? "/dashboard" : "/sign-in"}
          className="mt-9 flex items-center gap-2 rounded-sm bg-foreground px-7 py-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          List Your Property
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
