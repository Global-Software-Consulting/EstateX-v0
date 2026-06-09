"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const propertyTypes = ["House", "Apartment", "Villa", "Townhouse", "Loft", "Cabin"] as const

export function EstateHero() {
  const router = useRouter()
  const [mode, setMode] = useState<"buy" | "rent">("buy")
  const [city, setCity] = useState("")
  const [type, setType] = useState("")

  function handleSearch() {
    const params = new URLSearchParams()
    params.set("category", mode)
    if (city.trim()) params.set("city", city.trim())
    if (type) params.set("type", type)
    router.push(`/listings?${params.toString()}`)
  }

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Full-bleed hero image */}
      <div className="absolute inset-0">
        <img
          src="/house-3.jpg"
          alt="Beautiful craftsman home with landscaped garden at golden hour"
          className="ken-burns h-full w-full object-cover"
        />
        {/* Cinematic gradient — dark enough for text but image still shines through */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/5 to-background/30" />
      </div>

      {/* Content over image */}
      <div className="relative mx-auto flex h-full max-w-7xl items-center px-5 md:px-8">
        <div className="w-full max-w-xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/50">
            EstateX — Real Estate, Reimagined
          </p>
          <h1 className="mt-5 text-balance font-display text-4xl leading-[0.95] sm:text-5xl md:text-6xl lg:text-8xl">
            Find Your
            <br />
            Next <span className="word-gradient">Home</span>
          </h1>
          <p className="mt-6 max-w-md text-pretty leading-relaxed text-foreground/60">
            Browse thousands of curated properties across Pakistan&apos;s most desirable cities. Buy or rent with
            confidence.
          </p>

          {/* Buy / Rent toggle */}
          <div className="mt-8 inline-flex rounded-sm border border-white/10 bg-background/40 p-1 backdrop-blur-md">
            {(["buy", "rent"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-[2px] px-6 py-2 text-sm capitalize transition-colors",
                  mode === m ? "bg-foreground text-background" : "text-foreground/60 hover:text-foreground",
                )}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Search row */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch() }}
            className="mt-4 flex flex-col gap-3 rounded-sm border border-white/10 bg-background/40 p-3 backdrop-blur-md sm:flex-row sm:items-center"
          >
            <div className="flex flex-1 items-center gap-2 border-b border-white/10 px-2 py-2 sm:border-b-0 sm:border-r">
              <MapPin className="h-4 w-4 shrink-0 text-foreground/40" />
              <input
                type="text"
                placeholder="City or neighborhood"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-foreground/30"
              />
            </div>
            <div className="relative flex flex-1 items-center px-2 py-2">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full appearance-none bg-transparent text-sm text-foreground/50 outline-none"
              >
                <option value="" className="bg-card">Any type</option>
                {propertyTypes.map((t) => (
                  <option key={t} value={t} className="bg-card">
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none h-4 w-4 text-foreground/40" />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-sm bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs text-foreground/30 sm:gap-x-6">
            <span>Popular:</span>
            {["Karachi", "Lahore", "Islamabad", "Rawalpindi"].map((c) => (
              <button
                key={c}
                onClick={() => { setCity(c); router.push(`/listings?city=${c}`) }}
                className="transition-colors hover:text-foreground"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
