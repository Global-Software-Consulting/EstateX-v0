import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { eurSpoken, spokenSummary } from "@/lib/voice-format"

// Anon client — reads only ACTIVE listings, which RLS already exposes publicly.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

/**
 * get_property_details — full info for ONE listing the visitor asks about.
 *
 *   GET /api/voice/property?id=<uuid>
 *
 * Returns the description, agent contact, and photo URLs that the lighter
 * search_listings tool intentionally leaves out.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json(
      { error: "Missing 'id'. Use search_listings first to get a property id." },
      { status: 400 },
    )
  }

  const { data: p, error } = await supabase
    .from("properties")
    .select("id, agent_id, title, description, price, type, category, bedrooms, bathrooms, area_sqft, city, location, status")
    .eq("id", id)
    .eq("status", "active")
    .single()

  if (error || !p) {
    return NextResponse.json(
      { found: false, note: "That property isn't available. Suggest the visitor search again with search_listings." },
      { status: 200 },
    )
  }

  // Agent contact (name + phone). profiles may be restricted by RLS — if so we
  // just omit it rather than failing the whole call.
  let agent: { name: string | null; phone: string | null } | undefined
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", p.agent_id)
    .single()
  if (profile) agent = { name: profile.full_name, phone: profile.phone }

  // Photo URLs (public bucket).
  const { data: images } = await supabase
    .from("property_images")
    .select("storage_path, is_cover")
    .eq("property_id", p.id)
    .order("is_cover", { ascending: false })
  const photos = (images || []).map(
    (img) => supabase.storage.from("property-images").getPublicUrl(img.storage_path).data.publicUrl,
  )

  return NextResponse.json({
    found: true,
    title: p.title,
    description: p.description,
    category: p.category,
    type: p.type,
    city: p.city,
    location: p.location,
    price_eur: p.price,
    price_spoken: `${eurSpoken(p.price)} euros`,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    area_sqft: p.area_sqft,
    agent, // { name, phone } — for follow-up; may be undefined
    photo_count: photos.length,
    photos,
    spoken_summary: spokenSummary(p),
    url: `${SITE_URL}/properties/${p.id}`,
    next_step: "To proceed, the visitor signs up free and sends an inquiry (Buy, Rent, or Viewing) on this property's page.",
  })
}
