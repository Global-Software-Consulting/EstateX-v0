import { NextResponse } from "next/server"

/**
 * Reports whether the ElevenLabs voice agent has credits left. The widget can't
 * start a conversation once credits are exhausted, which looks broken to a
 * visitor — so the client uses this to swap the agent for a lead-capture form.
 *
 * Needs ELEVENLABS_API_KEY (server-only). If the key is missing or the check
 * fails, we default to creditsAvailable=true so the agent keeps showing.
 */
export const dynamic = "force-dynamic"

let cache: { ts: number; available: boolean } | null = null
const TTL_MS = 60_000

export async function GET() {
  const key = process.env.ELEVENLABS_API_KEY
  if (!key) return NextResponse.json({ creditsAvailable: true, reason: "no-key" })

  const now = Date.now()
  if (cache && now - cache.ts < TTL_MS) {
    return NextResponse.json({ creditsAvailable: cache.available, cached: true })
  }

  try {
    const res = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
      headers: { "xi-api-key": key },
      cache: "no-store",
    })
    if (!res.ok) {
      // Cache the failure too, so a flapping/rate-limited API isn't re-hit every
      // page load. We still report available so the agent stays visible.
      cache = { ts: now, available: true }
      return NextResponse.json({ creditsAvailable: true, reason: `status-${res.status}` })
    }
    const d: any = await res.json()
    const used = Number(d.character_count ?? 0)
    const limit = Number(d.character_limit ?? 0)
    const available = limit > 0 ? used < limit : true
    cache = { ts: now, available }
    return NextResponse.json({ creditsAvailable: available, used, limit })
  } catch {
    cache = { ts: now, available: true }
    return NextResponse.json({ creditsAvailable: true, reason: "error" })
  }
}
