import { Bed, Bath, Maximize, ArrowUpRight } from "lucide-react"
import { properties } from "@/lib/properties-data"

function formatPrice(price: number, unit?: "month" | null) {
  if (unit === "month") {
    return `$${price.toLocaleString()}/mo`
  }
  return `$${price.toLocaleString()}`
}

export function EstateListings() {
  return (
    <section id="listings" className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Curated Selection</p>
          <h2 className="mt-3 text-balance font-display text-5xl leading-none md:text-6xl">Featured Listings</h2>
        </div>
        <button className="rounded-sm border border-border px-5 py-2.5 text-sm transition-colors hover:bg-secondary">
          View all properties
        </button>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((p) => (
          <article
            key={p.id}
            className="group hover-lift overflow-hidden rounded-sm border border-border bg-card"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={p.image || "/placeholder.svg"}
                alt={`${p.title} in ${p.city}`}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <span className="absolute left-3 top-3 rounded-sm bg-background/80 px-2.5 py-1 font-mono text-xs uppercase tracking-wider backdrop-blur-sm">
                {p.type}
              </span>
              <span className="absolute right-3 top-3 rounded-sm bg-foreground/90 px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-background">
                For {p.listing}
              </span>
            </div>

            <div className="p-5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-2xl tracking-tight">{formatPrice(p.price, p.priceUnit)}</span>
              </div>
              <h3 className="mt-2 font-display text-2xl leading-none">{p.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {p.city}, {p.state}
              </p>

              <div className="mt-4 flex items-center gap-5 border-t border-border pt-4 font-mono text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Bed className="h-4 w-4" />
                  {p.beds}
                </span>
                <span className="flex items-center gap-1.5">
                  <Bath className="h-4 w-4" />
                  {p.baths}
                </span>
                <span className="flex items-center gap-1.5">
                  <Maximize className="h-4 w-4" />
                  {p.sqft.toLocaleString()} sqft
                </span>
              </div>

              <button className="mt-5 flex w-full items-center justify-between rounded-sm border border-border px-4 py-2.5 text-sm transition-colors hover:bg-foreground hover:text-background">
                View details
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
