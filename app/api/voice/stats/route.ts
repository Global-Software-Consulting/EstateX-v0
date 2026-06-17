import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { pkrSpoken } from "@/lib/voice-format"

// Anon client — reads only ACTIVE listings (publicly exposed by RLS).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

/**
 * market_overview — high-level stats so the agent can answer
 * "how many homes are available", "which cities", "cheapest / most expensive",
 * "average price". No params.
 *
 *   GET /api/voice/stats
 *
 * The dataset is small, so we pull active rows and aggregate in JS.
 */
export async function GET() {
  const { data, error } = await supabase
    .from("properties")
    .select("price, category, city")
    .eq("status", "active")
    .limit(1000)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = data || []
  if (rows.length === 0) {
    return NextResponse.json({ total: 0, note: "There are no active listings right now." })
  }

  // Counts by category.
  const forSale = rows.filter((r) => r.category === "buy")
  const forRent = rows.filter((r) => r.category === "rent")

  // Per-city counts.
  const cityCounts: Record<string, number> = {}
  for (const r of rows) cityCounts[r.city] = (cityCounts[r.city] || 0) + 1
  const cities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([city, count]) => ({ city, count }))

  // Price range helper for a group.
  const range = (group: typeof rows) => {
    if (group.length === 0) return undefined
    const prices = group.map((r) => Number(r.price))
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    return {
      count: group.length,
      min_spoken: `${pkrSpoken(min)} PKR`,
      max_spoken: `${pkrSpoken(max)} PKR`,
      avg_spoken: `${pkrSpoken(avg)} PKR`,
    }
  }

  return NextResponse.json({
    total: rows.length,
    for_sale: range(forSale),
    for_rent: range(forRent),
    cities, // [{ city, count }] sorted by count
    spoken_summary:
      `There are ${rows.length} active listings` +
      `${forSale.length ? `, ${forSale.length} for sale` : ""}` +
      `${forRent.length ? ` and ${forRent.length} for rent` : ""}` +
      `, across ${cities.length} cit${cities.length === 1 ? "y" : "ies"}: ` +
      `${cities.map((c) => `${c.city} (${c.count})`).join(", ")}.`,
  })
}
