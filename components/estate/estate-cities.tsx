import { cities } from "@/lib/properties-data"

export function EstateCities() {
  return (
    <section id="cities" className="border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Where We Operate</p>
        <h2 className="mt-3 text-balance font-display text-5xl leading-none md:text-6xl">Explore by City</h2>
      </div>

      <div className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cities.map((city) => (
          <button
            key={city.name}
            className="group relative aspect-[3/4] w-64 shrink-0 snap-start overflow-hidden rounded-sm border border-border text-left"
          >
            <img
              src={city.image || "/placeholder.svg"}
              alt={`${city.name} skyline`}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5">
              <h3 className="font-display text-3xl leading-none">{city.name}</h3>
              <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {city.listings} listings
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
