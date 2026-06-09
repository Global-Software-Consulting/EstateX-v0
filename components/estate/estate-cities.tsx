"use client"

import Link from "next/link"
import { MapPin } from "lucide-react"
import { cities } from "@/lib/properties-data"
import { CircularGallery, type GalleryItem } from "@/components/ui/circular-gallery"

export function EstateCities() {
  const galleryItems: GalleryItem[] = cities.map((city) => ({
    image: city.image,
    text: `${city.name} — ${city.listings} properties`,
  }))

  return (
    <section id="cities" className="relative z-10 bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Where We Operate</p>
          <h2 className="mt-3 text-balance font-display text-3xl leading-none sm:text-4xl md:text-5xl lg:text-6xl">
            Explore by City
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Drag or scroll to explore Pakistan&apos;s most sought-after locations
          </p>
        </div>
      </div>

      <div className="relative mt-10 h-[400px] w-full sm:h-[500px] md:h-[600px]">
        <CircularGallery
          items={galleryItems}
          bend={3}
          borderRadius={0.05}
          scrollSpeed={2}
          scrollEase={0.03}
          className="text-[48px]"
        />
      </div>

      {/* Clickable city links */}
      <div className="mx-auto mt-10 max-w-4xl px-5 md:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {cities.map((city) => (
            <Link
              key={city.name}
              href={`/listings?city=${city.name}`}
              className="group flex flex-col items-center gap-2 rounded-lg border border-border/50 bg-card/50 px-3 py-4 text-center transition-all duration-300 hover:border-foreground/20 hover:bg-card"
            >
              <MapPin className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
              <span className="text-sm font-medium">{city.name}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{city.listings} listings</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
