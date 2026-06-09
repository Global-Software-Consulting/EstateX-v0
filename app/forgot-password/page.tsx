"use client"

import { useState } from "react"
import Link from "next/link"
import { Home, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/sign-in`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
            <Home className="h-4 w-4" />
          </span>
          <span className="text-xl font-bold tracking-tight">Estate<span className="text-orange-500">X</span></span>
        </Link>

        <h1 className="mt-8 font-display text-3xl leading-[0.95] sm:text-4xl md:text-5xl">
          Reset Password
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        {success ? (
          <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4">
            <p className="text-sm text-emerald-500">
              Check your email! We&apos;ve sent a password reset link to <strong>{email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border-border bg-card px-4 text-sm placeholder:text-muted-foreground/50 focus-visible:border-orange-500 focus-visible:ring-orange-500/20"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="mt-8 text-center">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-orange-500"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
