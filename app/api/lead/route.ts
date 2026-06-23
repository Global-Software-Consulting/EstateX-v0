import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

/**
 * Captures a visitor lead from the voice-agent fallback form and emails it to
 * the team via Resend. Needs: RESEND_API_KEY, LEAD_NOTIFY_EMAIL (recipient).
 * RESEND_FROM is optional (defaults to Resend's shared onboarding sender).
 */
function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
  )
}

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  // Cap field lengths so a hostile/huge payload can't be stuffed into the email.
  const clip = (v: unknown, max: number) => (v || "").toString().trim().slice(0, max)
  const firstName = clip(body?.firstName, 100)
  const lastName = clip(body?.lastName, 100)
  const email = clip(body?.email, 254) // RFC 5321 max email length
  const phone = clip(body?.phone, 40)

  if (!firstName || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Please provide a first name and a valid email." }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.LEAD_NOTIFY_EMAIL
  if (!apiKey || !to) {
    return NextResponse.json({ error: "Lead capture is not configured yet." }, { status: 500 })
  }
  const from = process.env.RESEND_FROM || "EstateX Leads <onboarding@resend.dev>"
  const name = `${firstName} ${lastName}`.trim()

  const resend = new Resend(apiKey)
  try {
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `New EstateX lead: ${name}`,
      html: `<h2>New lead from EstateX</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone || "—")}</p>
        <p style="color:#888;font-size:12px">Captured via the voice-assistant contact form (agent unavailable).</p>`,
    })
    if (error) return NextResponse.json({ error: error.message || "Failed to send." }, { status: 502 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to send." }, { status: 500 })
  }
}
