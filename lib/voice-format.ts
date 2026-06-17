// Shared formatting helpers for the voice-agent API routes, so every tool speaks
// prices and summaries the same way.

// Format a PKR amount for speech in millions, e.g. 350000000 -> "350 million".
// Smaller amounts (e.g. monthly rent) fall back to grouped digits.
export function pkrSpoken(amount: number): string {
  const n = Number(amount)
  if (!Number.isFinite(n)) return `${amount}`
  const trim = (x: number) => Number(x.toFixed(2)).toString() // drop trailing ".0"
  if (n >= 1_000_000) return `${trim(n / 1_000_000)} million`
  return n.toLocaleString()
}

export interface SpeakableProperty {
  title: string
  type: string
  city: string
  location: string | null
  category: string
  price: number
  bedrooms: number
  bathrooms: number
  area_sqft: number
}

// Build one ready-to-speak sentence per listing. The agent can read this almost
// verbatim — faster than re-deriving it, and it can't misread the price.
export function spokenSummary(p: SpeakableProperty): string {
  const where = p.location ? `${p.location}, ${p.city}` : p.city
  const beds = `${p.bedrooms} bed${p.bedrooms === 1 ? "" : "s"}`
  const baths = `${p.bathrooms} bath${p.bathrooms === 1 ? "" : "s"}`
  const price = `${pkrSpoken(p.price)} PKR`
  const deal = p.category === "rent" ? `for rent at ${price} per month` : `for sale at ${price}`
  return `${p.title}: a ${p.type} in ${where}, ${deal}, with ${beds} and ${baths}, ${Number(p.area_sqft).toLocaleString()} square feet.`
}
