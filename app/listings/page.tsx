"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Bed, Bath, Maximize, ArrowUpRight, Search, Loader2 } from "lucide-react"
import { EstateNav } from "@/components/estate/estate-nav"
import { EstateFooter } from "@/components/estate/estate-footer"
import { supabase } from "@/lib/supabase"
import { getImageUrl } from "@/lib/image-url"
import { Input } from "@/components/ui/input"

type ListingProperty = {
  id: string
  title: string
  city: string
  location: string | null
  price: number
  bedrooms: number
  bathrooms: number
  area_sqft: number
  type: string
  category: string
  cover_url: string | null
}

const propertyTypes = ["All", "House", "Apartment", "Villa", "Townhouse", "Loft", "Cabin"] as const
const categories = ["All", "buy", "rent"] as const

function formatPrice(price: number) {
  return `PKR ${price.toLocaleString()}`
}

function ListingsContent() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get("category")
  const initialType = searchParams.get("type")
  const initialCity = searchParams.get("city")
  const [properties, setProperties] = useState<ListingProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<"All" | "buy" | "rent">(
    initialCategory === "buy" || initialCategory === "rent" ? initialCategory : "All"
  )
  const [typeFilter, setTypeFilter] = useState(initialType || "All")
  const [citySearch, setCitySearch] = useState(initialCity || "")

  useEffect(() => {
    async function fetchAll() {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          id, title, city, location, price, bedrooms, bathrooms, area_sqft, type, category,
          property_images ( storage_path, is_cover )
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      const mapped: ListingProperty[] = (data || []).map((p: any) => {
        const cover = (p.property_images || []).find((img: any) => img.is_cover)
        return {
          id: p.id,
          title: p.title,
          city: p.city,
          location: p.location,
          price: p.price,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          area_sqft: p.area_sqft,
          type: p.type,
          category: p.category,
          cover_url: getImageUrl(cover?.storage_path || null),
        }
      })

      setProperties(mapped)
      setLoading(false)
    }

    fetchAll()
  }, [])

  const filtered = properties.filter((p) => {
    if (categoryFilter !== "All" && p.category !== categoryFilter) return false
    if (typeFilter !== "All" && p.type !== typeFilter) return false
    if (citySearch && !p.city.toLowerCase().includes(citySearch.toLowerCase())) return false
    return true
  })

  return (
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-28 md:px-8 md:pb-28 md:pt-32">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Browse</p>
      <h1 className="mt-3 text-balance font-display text-5xl leading-none md:text-6xl">All Properties</h1>

      {/* Filters */}
      <div className="mt-10 flex flex-col gap-4 rounded-sm border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="flex rounded-sm border border-border p-1">
          {categories.map((m) => (
            <button
              key={m}
              onClick={() => setCategoryFilter(m)}
              className={`rounded-[2px] px-5 py-2 text-sm capitalize transition-colors ${
                categoryFilter === m
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "All" ? "All" : m}
            </button>
          ))}
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 rounded-sm border border-border bg-transparent px-3 text-sm outline-none focus-visible:border-foreground"
        >
          {propertyTypes.map((t) => (
            <option key={t} value={t} className="bg-card">
              {t}
            </option>
          ))}
        </select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by city..."
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            className="h-10 rounded-sm border-border bg-transparent pl-9 text-sm placeholder:text-muted-foreground/50 focus-visible:border-foreground focus-visible:ring-foreground/20"
          />
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="mt-12 flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="mt-12 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">
          No properties match your filters.
        </p>
      ) : (
        <>
          <p className="mt-6 font-mono text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "property" : "properties"} found
          </p>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <article
                key={p.id}
                className="group hover-lift overflow-hidden rounded-sm border border-border bg-card"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={p.cover_url || "/placeholder.svg"}
                    alt={`${p.title} in ${p.city}`}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-sm bg-background/80 px-2.5 py-1 font-mono text-xs uppercase tracking-wider backdrop-blur-sm">
                    {p.type}
                  </span>
                  <span className="absolute right-3 top-3 rounded-sm bg-foreground/90 px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-background">
                    {p.category}
                  </span>
                </div>

                <div className="p-5">
                  <span className="font-mono text-2xl tracking-tight">{formatPrice(p.price)}</span>
                  <h3 className="mt-2 font-display text-2xl leading-none">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {p.location ? `${p.location}, ` : ""}{p.city}
                  </p>

                  <div className="mt-4 flex items-center gap-5 border-t border-border pt-4 font-mono text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Bed className="h-4 w-4" />
                      {p.bedrooms}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Bath className="h-4 w-4" />
                      {p.bathrooms}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Maximize className="h-4 w-4" />
                      {p.area_sqft.toLocaleString()} sqft
                    </span>
                  </div>

                  <Link
                    href={`/properties/${p.id}`}
                    className="mt-5 flex w-full items-center justify-between rounded-sm border border-border px-4 py-2.5 text-sm transition-colors hover:bg-foreground hover:text-background"
                  >
                    View details
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default function ListingsPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <EstateNav />
      <Suspense fallback={
        <div className="flex items-center justify-center py-40">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      }>
        <ListingsContent />
      </Suspense>
      <EstateFooter />
    </main>
  )
}
