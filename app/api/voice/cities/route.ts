import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Anon client — reads only ACTIVE listings (publicly exposed by RLS).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

/**
 * list_cities — which cities currently have listings, with counts. No params.
 *
 *   GET /api/voice/cities
 */
export async function GET() {
  const { data, error } = await supabase
    .from("properties")
    .select("city")
    .eq("status", "active")
    .limit(1000)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const counts: Record<string, number> = {}
  for (const r of data || []) counts[r.city] = (counts[r.city] || 0) + 1
  const cities = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([city, count]) => ({ city, count }))

  return NextResponse.json({
    count: cities.length,
    cities,
    spoken_summary: cities.length
      ? `We currently have listings in ${cities.map((c) => `${c.city} (${c.count})`).join(", ")}.`
      : "There are no active listings in any city right now.",
  })
}
