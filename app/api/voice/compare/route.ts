import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { eurSpoken, spokenSummary } from "@/lib/voice-format"

// Anon client — reads only ACTIVE listings (publicly exposed by RLS).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

/**
 * compare_properties — compare 2 to 4 listings side by side.
 *
 *   GET /api/voice/compare?ids=<uuid>,<uuid>
 *
 * `ids` is a comma-separated list of property ids from search_listings.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("ids") || ""
  const ids = raw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4)

  if (ids.length < 2) {
    return NextResponse.json(
      { error: "Provide at least two property ids in 'ids' (comma-separated), from search_listings." },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from("properties")
    .select("id, title, price, type, category, bedrooms, bathrooms, area_sqft, city, location")
    .eq("status", "active")
    .in("id", ids)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = data || []
  if (rows.length < 2) {
    return NextResponse.json(
      { note: "Couldn't find at least two of those properties. Suggest searching again with search_listings." },
      { status: 200 },
    )
  }

  const items = rows.map((p) => ({
    title: p.title,
    city: p.city,
    type: p.type,
    category: p.category,
    price_eur: p.price,
    price_spoken: `${eurSpoken(p.price)} euros`,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    area_sqft: p.area_sqft,
    url: `${SITE_URL}/properties/${p.id}`,
    spoken_summary: spokenSummary(p),
  }))

  // Pick out the standout properties so the agent can contrast them directly.
  const cheapest = items.reduce((a, b) => (b.price_eur < a.price_eur ? b : a))
  const largest = items.reduce((a, b) => (b.area_sqft > a.area_sqft ? b : a))
  const mostBeds = items.reduce((a, b) => (b.bedrooms > a.bedrooms ? b : a))

  return NextResponse.json({
    count: items.length,
    items,
    highlights: {
      cheapest: `${cheapest.title} (${cheapest.price_spoken})`,
      largest: `${largest.title} (${largest.area_sqft.toLocaleString()} sq ft)`,
      most_bedrooms: `${mostBeds.title} (${mostBeds.bedrooms} beds)`,
    },
    spoken_summary:
      `Comparing ${items.length} properties: ${cheapest.title} is the cheapest at ${cheapest.price_spoken}; ` +
      `${largest.title} is the largest at ${largest.area_sqft.toLocaleString()} square feet; ` +
      `${mostBeds.title} has the most bedrooms with ${mostBeds.bedrooms}.`,
  })
}
