"use client"

import { useState } from "react"
import { Phone, X, Loader2, CheckCircle2 } from "lucide-react"

/**
 * Fallback shown in place of the voice agent when ElevenLabs credits are out.
 * A floating button opens a small contact form; on submit it POSTs to /api/lead,
 * which emails the team via Resend. To the visitor this just looks like a normal
 * "contact us" assistant — they never see a broken agent.
 */
export function VoiceLeadForm() {
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" })

  const input =
    "h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-orange-500 focus:ring-[3px] focus:ring-orange-500/20"

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSending(true)
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Something went wrong. Please try again.")
      setDone(true)
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.")
    } finally {
      setSending(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-orange-500 px-5 py-3.5 text-white shadow-lg shadow-orange-500/30 transition-all hover:bg-orange-600 hover:shadow-orange-500/40"
        aria-label="Contact us about buying or renting"
      >
        <Phone className="h-5 w-5" />
        <span className="text-sm font-semibold">Need help buying/renting?</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[min(92vw,380px)] rounded-2xl border border-border bg-card p-5 shadow-2xl">
      <button
        onClick={() => setOpen(false)}
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>

      {done ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-orange-500" />
          <h3 className="text-lg font-semibold">Thank you!</h3>
          <p className="text-sm text-muted-foreground">
            Our team has your details and will reach out to you shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div className="pr-6">
            <h3 className="text-lg font-semibold">Talk to our team</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Leave your details and we&apos;ll get right back to you.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              className={input}
              placeholder="First name"
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
            <input
              className={input}
              placeholder="Last name"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
          <input
            className={input}
            type="email"
            placeholder="Email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className={input}
            type="tel"
            placeholder="Phone number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={sending}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600 disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
          </button>
        </form>
      )}
    </div>
  )
}
