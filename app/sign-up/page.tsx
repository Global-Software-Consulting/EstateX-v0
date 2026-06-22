"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Home, ArrowUpRight, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignUpPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Best-effort: create the profiles row now if a session was issued
    // (i.e. email confirmation is off). If confirmation is on there's no session
    // yet and RLS blocks this — the dashboard creates the profile on first login.
    if (data.session && data.user) {
      await supabase.from("profiles").upsert(
        { id: data.user.id, full_name: fullName },
        { onConflict: "id", ignoreDuplicates: true },
      )
    }

    router.push("/")
  }

  return (
    <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left: cinematic image panel */}
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src="/hero-signup.jpg"
          alt="Luxury home with pool"
          className="ken-burns h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/10 to-transparent" />

        {/* Overlay content */}
        <div className="absolute bottom-12 left-10 right-10 z-10">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/60">EstateX</p>
          <h2 className="mt-3 font-display text-3xl leading-[0.95] lg:text-5xl">
            Start Your <span className="word-gradient">Journey</span>
          </h2>
          <p className="mt-4 max-w-sm text-pretty leading-relaxed text-foreground/60">
            Join thousands of homeowners and renters who found their perfect property through EstateX.
          </p>

          <div className="mt-8 flex items-center gap-8 border-t border-white/10 pt-6 font-mono text-xs uppercase tracking-widest text-foreground/40">
            <span>12K+ Properties</span>
            <span>50+ Cities</span>
            <span>98% Satisfaction</span>
          </div>
        </div>
      </div>

      {/* Right: sign-up form */}
      <div className="flex items-center justify-center px-5 py-16 md:px-12 lg:px-16">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
              <Home className="h-4 w-4" />
            </span>
            <span className="text-xl font-bold tracking-tight">Estate<span className="text-orange-500">X</span></span>
          </Link>

          <h1 className="mt-8 font-display text-3xl leading-[0.95] sm:text-4xl md:text-5xl">
            Create Account
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Get started with your free account today
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-12 rounded-xl border-border bg-card px-4 text-sm placeholder:text-muted-foreground/50 focus-visible:border-orange-500 focus-visible:ring-orange-500/20"
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="password" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-12 rounded-xl border-border bg-card px-4 pr-11 text-sm placeholder:text-muted-foreground/50 focus-visible:border-orange-500 focus-visible:ring-orange-500/20"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="font-mono text-[10px] text-muted-foreground/50">Minimum 6 characters</p>
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
              {loading ? "Creating account…" : "Create Account"}
              {!loading && <ArrowUpRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-orange-500 transition-colors hover:text-orange-600"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
