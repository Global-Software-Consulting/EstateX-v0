"use client"

import { useState } from "react"
import { Search, MapPin, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { propertyTypes } from "@/lib/properties-data"

export function EstateHero() {
  const [mode, setMode] = useState<"buy" | "rent">("buy")

  return (
    <section className="relative grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left: cinematic image with Ken Burns zoom */}
      <div className="relative h-[55vh] overflow-hidden lg:h-screen">
        <img
          src="/properties/hero-villa.png"
          alt="Modern luxury villa at dusk with infinity pool"
          className="ken-burns h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-background" />
        <div className="absolute bottom-6 left-6 z-10 max-w-xs">
          <p className="font-mono text-xs uppercase tracking-widest text-foreground/70">Featured</p>
          <p className="mt-1 font-display text-2xl">Oceanview Villa, Malibu</p>
          <p className="font-mono text-sm text-foreground/70">$6,900,000</p>
        </div>
      </div>

      {/* Right: search UI */}
      <div className="relative flex items-center px-5 py-16 md:px-12 lg:px-16">
        <div className="w-full max-w-xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            EstateX — Real Estate, Reimagined
          </p>
          <h1 className="mt-5 text-balance font-display text-6xl leading-[0.95] md:text-7xl lg:text-8xl">
            Find Your
            <br />
            Next <span className="word-gradient">Home</span>
          </h1>
          <p className="mt-6 max-w-md text-pretty leading-relaxed text-muted-foreground">
            Browse thousands of curated properties across the country&apos;s most desirable cities. Buy or rent with
            confidence.
          </p>

          {/* Buy / Rent toggle */}
          <div className="mt-8 inline-flex rounded-sm border border-border bg-card p-1">
            {(["buy", "rent"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-[2px] px-6 py-2 text-sm capitalize transition-colors",
                  mode === m ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Search row */}
          <div className="mt-4 flex flex-col gap-3 rounded-sm border border-border bg-card p-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2 border-b border-border px-2 py-2 sm:border-b-0 sm:border-r">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                type="text"
                placeholder="City or neighborhood"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="relative flex flex-1 items-center px-2 py-2">
              <select className="w-full appearance-none bg-transparent text-sm text-muted-foreground outline-none">
                <option className="bg-card">Any type</option>
                {propertyTypes.map((t) => (
                  <option key={t} className="bg-card">
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none h-4 w-4 text-muted-foreground" />
            </div>
            <button className="flex items-center justify-center gap-2 rounded-sm bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90">
              <Search className="h-4 w-4" />
              Search
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-muted-foreground">
            <span>Popular:</span>
            {["Los Angeles", "Miami", "New York", "Austin"].map((c) => (
              <button key={c} className="transition-colors hover:text-foreground">
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
