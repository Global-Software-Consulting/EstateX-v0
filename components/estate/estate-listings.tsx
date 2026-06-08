"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bed, Bath, Maximize, ArrowUpRight, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getImageUrl } from "@/lib/image-url"

type FeaturedProperty = {
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

function formatPrice(price: number) {
  return `PKR ${price.toLocaleString()}`
}

export function EstateListings() {
  const [properties, setProperties] = useState<FeaturedProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchFeatured() {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          id, title, city, location, price, bedrooms, bathrooms, area_sqft, type, category,
          property_images ( storage_path, is_cover )
        `)
        .eq("is_featured", true)
        .eq("status", "active")
        .order("created_at", { ascending: false })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      const mapped: FeaturedProperty[] = (data || []).map((p: any) => {
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

    fetchFeatured()
  }, [])

  return (
    <section id="listings" className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Curated Selection</p>
          <h2 className="mt-3 text-balance font-display text-5xl leading-none md:text-6xl">Featured Listings</h2>
        </div>
        <Link
          href="/listings"
          className="rounded-sm border border-border px-5 py-2.5 text-sm transition-colors hover:bg-secondary"
        >
          View all properties
        </Link>
      </div>

      {loading ? (
        <div className="mt-12 flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="mt-12 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : properties.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">No featured properties at the moment.</p>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
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
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-2xl tracking-tight">{formatPrice(p.price)}</span>
                </div>
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
      )}
    </section>
  )
}
