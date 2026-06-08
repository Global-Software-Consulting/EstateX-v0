"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Building2, ArrowUpRight } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push("/dashboard")
  }

  return (
    <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left: cinematic image panel */}
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src="/properties/hero-villa.png"
          alt="Modern luxury villa"
          className="ken-burns h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/30" />

        {/* Overlay content */}
        <div className="absolute bottom-12 left-10 right-10 z-10">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/60">Welcome Back</p>
          <h2 className="mt-3 font-display text-5xl leading-[0.95]">
            Your Dream <span className="word-gradient">Awaits</span>
          </h2>
          <p className="mt-4 max-w-sm text-pretty leading-relaxed text-foreground/60">
            Pick up right where you left off. Your saved properties and searches are waiting.
          </p>

          <div className="mt-8 flex items-center gap-8 border-t border-white/10 pt-6 font-mono text-xs uppercase tracking-widest text-foreground/40">
            <span>12K+ Properties</span>
            <span>50+ Cities</span>
            <span>98% Satisfaction</span>
          </div>
        </div>
      </div>

      {/* Right: sign-in form */}
      <div className="flex items-center justify-center px-5 py-16 md:px-12 lg:px-16">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-foreground text-background">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="font-display text-2xl leading-none tracking-tight">EstateX</span>
          </Link>

          <h1 className="mt-8 font-display text-4xl leading-[0.95] md:text-5xl">
            Welcome Back
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Sign in to continue exploring properties
          </p>

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
                className="h-12 rounded-sm border-border bg-card px-4 text-sm placeholder:text-muted-foreground/50 focus-visible:border-foreground focus-visible:ring-foreground/20"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Password
                </Label>
                <Link
                  href="#"
                  className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                >
                  Forgot?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-sm border-border bg-card px-4 text-sm placeholder:text-muted-foreground/50 focus-visible:border-foreground focus-visible:ring-foreground/20"
              />
            </div>

            {error && (
              <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-sm bg-foreground px-7 py-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign In"}
              {!loading && <ArrowUpRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
