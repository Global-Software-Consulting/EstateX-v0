import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { eurSpoken, spokenSummary } from "@/lib/voice-format"

// Anon client — this endpoint only reads ACTIVE listings, which your RLS policy
// ("Anyone can view active properties") already exposes publicly. No secrets here.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// Used to build clickable links the agent can hand back to the visitor.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

/**
 * Public, read-only listings search for the ElevenLabs voice agent.
 *
 * Called as a server tool (webhook). Example:
 *   GET /api/voice/listings?category=buy&type=House&city=Paris&max_price=2000000&min_bedrooms=3
 *
 * All params are optional; omit them to get the latest active listings.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const category = sp.get("category")        // "buy" | "rent"
  const type = sp.get("type")                // "House" | "Apartment" | "Villa" | ...
  const city = sp.get("city")                // partial match, e.g. "Paris"
  const maxPrice = sp.get("max_price")       // EUR number
  const minBedrooms = sp.get("min_bedrooms") // number
  // Free-text keyword, e.g. "villa", "penthouse", "canal". Matches title/description/
  // location too, so words people use ("villa") still find listings whose TYPE is
  // something else (e.g. an Apartment titled "Haussmann Apartment").
  const q = (sp.get("q") || "").replace(/[(),]/g, " ").trim() // strip chars that break .or()
  // Keep this small: fewer listings = less for the voice LLM to read = faster speech.
  const limit = Math.min(Number(sp.get("limit")) || 4, 10)

  let query = supabase
    .from("properties")
    // Only the columns the agent actually speaks — no heavy `description` text.
    .select("id, title, price, type, category, bedrooms, bathrooms, area_sqft, city, location")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (category) query = query.eq("category", category.toLowerCase())
  if (type && type.toLowerCase() !== "all") query = query.ilike("type", type)
  if (city) query = query.ilike("city", `%${city}%`)
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,location.ilike.%${q}%,type.ilike.%${q}%`)
  if (maxPrice && !Number.isNaN(Number(maxPrice))) query = query.lte("price", Number(maxPrice))
  if (minBedrooms && !Number.isNaN(Number(minBedrooms))) query = query.gte("bedrooms", Number(minBedrooms))

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const listings = (data || []).map((p) => ({
    title: p.title,
    category: p.category, // buy or rent
    type: p.type,
    city: p.city,
    location: p.location,
    price_eur: p.price,
    price_spoken: `${eurSpoken(p.price)} euros`, // how to SAY the price, e.g. "1.85 million euros"
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    area_sqft: p.area_sqft,
    spoken_summary: spokenSummary(p), // a full sentence the agent can read aloud
    url: `${SITE_URL}/properties/${p.id}`,
  }))

  return NextResponse.json({
    count: listings.length,
    listings,
    note: listings.length === 0
      ? "No active listings matched. Suggest the visitor broaden their filters (different city, higher budget, or any type)."
      : undefined,
  })
}
