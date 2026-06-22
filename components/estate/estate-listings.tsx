"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bed, Bath, Maximize, ArrowUpRight, Loader2, MapPin } from "lucide-react"
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
  return `€${price.toLocaleString()}`
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
    <section id="listings" className="relative z-10 bg-background">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange-500">Curated Selection</p>
            <h2 className="mt-3 text-balance font-display text-3xl leading-none sm:text-4xl md:text-5xl lg:text-6xl">Featured Listings</h2>
          </div>
          <Link
            href="/listings"
            className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-2.5 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-100"
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
              <Link
                key={p.id}
                href={`/properties/${p.id}`}
                className="group relative overflow-hidden rounded-sm border border-border"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={p.cover_url || "/placeholder.svg"}
                    alt={`${p.title} in ${p.city}`}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Badges — always visible */}
                  <span className="absolute left-3 top-3 z-10 rounded-sm bg-background/80 px-2.5 py-1 font-mono text-xs uppercase tracking-wider backdrop-blur-sm">
                    {p.type}
                  </span>
                  <span className="absolute right-3 top-3 z-10 rounded-full bg-orange-500 px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-white">
                    {p.category}
                  </span>

                  {/* Default state — title + city at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent transition-opacity duration-300 group-hover:opacity-0" />
                  <div className="absolute bottom-4 left-4 z-10 transition-all duration-300 group-hover:translate-y-4 group-hover:opacity-0">
                    <h3 className="font-display text-xl leading-tight">{p.title}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-foreground/60">
                      <MapPin className="h-3 w-3" />
                      {p.location ? `${p.location}, ` : ""}{p.city}
                    </p>
                  </div>

                  {/* Hover state — full data overlay slides up */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute inset-x-0 bottom-0 z-10 translate-y-6 p-5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    {/* Price */}
                    <p className="font-mono text-2xl tracking-tight">{formatPrice(p.price)}</p>

                    {/* Title */}
                    <h3 className="mt-1 font-display text-xl leading-tight">{p.title}</h3>

                    {/* Location */}
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {p.location ? `${p.location}, ` : ""}{p.city}
                    </p>

                    {/* Specs */}
                    <div className="mt-3 flex items-center gap-4 font-mono text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Bed className="h-3.5 w-3.5" /> {p.bedrooms} Beds
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="h-3.5 w-3.5" /> {p.bathrooms} Baths
                      </span>
                      <span className="flex items-center gap-1">
                        <Maximize className="h-3.5 w-3.5" /> {p.area_sqft.toLocaleString()}
                      </span>
                    </div>

                    {/* CTA */}
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white">
                      View details
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
