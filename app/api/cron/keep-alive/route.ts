import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * keep-alive — pings the Supabase database so a free-tier project doesn't get
 * paused for inactivity (free projects pause after ~7 days with no DB traffic).
 *
 * A Vercel cron (see vercel.json) hits this every few days. It MUST run a real
 * database query — pinging Vercel alone does not count as Supabase activity.
 *
 * Protection: if CRON_SECRET is set, the request must carry
 * `Authorization: Bearer <CRON_SECRET>` (Vercel cron sends this automatically).
 * If CRON_SECRET is unset, the endpoint is open (harmless — it only reads a count).
 */
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    return NextResponse.json({ ok: false, error: "Supabase env not configured" }, { status: 500 })
  }

  // Lightweight head request — returns just the row count, no row data, but it's
  // a genuine query against the database, which is what keeps the project awake.
  const supabase = createClient(url, anon)
  const { count, error } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 502 })
  }
  return NextResponse.json({ ok: true, pinged: "properties", count: count ?? 0 })
}
