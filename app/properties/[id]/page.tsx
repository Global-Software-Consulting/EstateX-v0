"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Bed, Bath, Maximize, ArrowLeft, Phone, Mail, ChevronLeft, ChevronRight, Loader2, Home } from "lucide-react"
import { EstateNav } from "@/components/estate/estate-nav"
import { EstateFooter } from "@/components/estate/estate-footer"
import { supabase } from "@/lib/supabase"
import { getImageUrl } from "@/lib/image-url"

type ImageItem = {
  id: string
  storage_path: string
  is_cover: boolean
  url: string
}

type PropertyDetail = {
  id: string
  title: string
  description: string | null
  city: string
  location: string | null
  price: number
  bedrooms: number
  bathrooms: number
  area_sqft: number
  type: string
  category: string
  status: string
  images: ImageItem[]
  agent: {
    full_name: string | null
    phone: string | null
  } | null
}

function formatPrice(price: number) {
  return `PKR ${price.toLocaleString()}`
}

export default function PropertyPage() {
  const params = useParams()
  const id = params.id as string
  const [property, setProperty] = useState<PropertyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    async function fetchProperty() {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          id, title, description, city, location, price,
          bedrooms, bathrooms, area_sqft, type, category, status,
          property_images ( id, storage_path, is_cover, created_at ),
          profiles:agent_id ( full_name, phone )
        `)
        .eq("id", id)
        .single()

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      const rawImages = ((data as any).property_images || []).sort(
        (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

      const images: ImageItem[] = rawImages.map((img: any) => ({
        id: img.id,
        storage_path: img.storage_path,
        is_cover: img.is_cover,
        url: getImageUrl(img.storage_path) || "",
      }))

      setProperty({
        id: data.id,
        title: data.title,
        description: data.description,
        city: data.city,
        location: data.location,
        price: data.price,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        area_sqft: data.area_sqft,
        type: data.type,
        category: data.category,
        status: data.status,
        images,
        agent: (data as any).profiles || null,
      })
      setLoading(false)
    }

    if (id) fetchProperty()
  }, [id])

  function prevImage() {
    if (!property) return
    setActiveImage((i) => (i === 0 ? property.images.length - 1 : i - 1))
  }

  function nextImage() {
    if (!property) return
    setActiveImage((i) => (i === property.images.length - 1 ? 0 : i + 1))
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <EstateNav />

      <div className="mx-auto max-w-7xl px-5 pb-20 pt-24 md:px-8 md:pb-28 md:pt-28">
        <Link
          href="/listings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </Link>

        {loading ? (
          <div className="mt-20 flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="mt-8 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : property ? (
          <>
            {/* Image gallery */}
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-sm border border-border bg-card md:aspect-[2.4/1]">
              {property.images.length > 0 ? (
                <>
                  <img
                    src={property.images[activeImage].url}
                    alt={property.title}
                    className="h-full w-full object-cover"
                  />
                  {property.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/70 backdrop-blur-sm transition-colors hover:bg-background"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/70 backdrop-blur-sm transition-colors hover:bg-background"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                        {property.images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveImage(i)}
                            className={`h-1.5 rounded-full transition-all ${
                              i === activeImage ? "w-6 bg-foreground" : "w-1.5 bg-foreground/40"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Home className="h-12 w-12 text-muted-foreground/20" />
                </div>
              )}

              <span className="absolute left-4 top-4 rounded-sm bg-background/80 px-2.5 py-1 font-mono text-xs uppercase tracking-wider backdrop-blur-sm">
                {property.type}
              </span>
              <span className="absolute right-4 top-4 rounded-sm bg-foreground/90 px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-background">
                {property.category}
              </span>
            </div>

            {/* Thumbnail strip */}
            {property.images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {property.images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={`h-16 w-24 shrink-0 overflow-hidden rounded-sm border transition-all ${
                      i === activeImage ? "border-foreground" : "border-border opacity-50 hover:opacity-80"
                    }`}
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Content grid */}
            <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
              {/* Left: details */}
              <div className="lg:col-span-2">
                <span className="font-mono text-3xl tracking-tight md:text-4xl">
                  {formatPrice(property.price)}
                </span>
                <h1 className="mt-3 font-display text-4xl leading-[0.95] md:text-5xl">
                  {property.title}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {property.location ? `${property.location}, ` : ""}{property.city}
                </p>

                {/* Specs */}
                <div className="mt-6 flex items-center gap-6 border-y border-border py-5 font-mono text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Bed className="h-4 w-4" />
                    {property.bedrooms} Beds
                  </span>
                  <span className="flex items-center gap-2">
                    <Bath className="h-4 w-4" />
                    {property.bathrooms} Baths
                  </span>
                  <span className="flex items-center gap-2">
                    <Maximize className="h-4 w-4" />
                    {property.area_sqft.toLocaleString()} sqft
                  </span>
                </div>

                {/* Description */}
                {property.description && (
                  <div className="mt-8">
                    <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Description</h2>
                    <p className="mt-4 leading-relaxed text-muted-foreground">{property.description}</p>
                  </div>
                )}
              </div>

              {/* Right: agent card */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 rounded-sm border border-border bg-card p-6">
                  <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Listed by
                  </h3>

                  {property.agent ? (
                    <div className="mt-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary font-mono text-lg uppercase text-foreground">
                          {(property.agent.full_name || "A").charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{property.agent.full_name || "Agent"}</p>
                          {property.agent.phone && (
                            <p className="text-xs text-muted-foreground">{property.agent.phone}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 space-y-2">
                        {property.agent.phone && (
                          <a
                            href={`tel:${property.agent.phone}`}
                            className="flex w-full items-center justify-center gap-2 rounded-sm bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
                          >
                            <Phone className="h-4 w-4" />
                            Call Agent
                          </a>
                        )}
                        <button className="flex w-full items-center justify-center gap-2 rounded-sm border border-border px-5 py-3 text-sm transition-colors hover:bg-secondary">
                          <Mail className="h-4 w-4" />
                          Send Message
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">Agent information unavailable.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <EstateFooter />
    </main>
  )
}
