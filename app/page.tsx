import { EstateNav } from "@/components/estate/estate-nav"
import { EstateHero } from "@/components/estate/estate-hero"
import { EstateStats } from "@/components/estate/estate-stats"
import { EstateListings } from "@/components/estate/estate-listings"
import { EstateCities } from "@/components/estate/estate-cities"
import { EstateTestimonials } from "@/components/estate/estate-testimonials"
import { EstateCta } from "@/components/estate/estate-cta"
import { EstateFooter } from "@/components/estate/estate-footer"

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <EstateNav />
      <EstateHero />
      <EstateStats />
      <EstateListings />
      <EstateCities />
      <EstateTestimonials />
      <EstateCta />
      <EstateFooter />
    </main>
  )
}
