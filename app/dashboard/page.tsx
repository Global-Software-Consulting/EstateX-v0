"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Building2,
  LogOut,
  LayoutDashboard,
  List,
  PlusCircle,
  Pencil,
  Trash2,
  Eye,
  Home,
  Loader2,
  Upload,
  X,
  Search,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getImageUrl } from "@/lib/image-url"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { User } from "@supabase/supabase-js"

type DashboardProperty = {
  id: string
  title: string
  city: string
  price: number
  status: string
  type: string
  category: string
  cover_url: string | null
}

const sidebarLinks = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "listings", label: "My Listings", icon: List },
  { key: "add", label: "Add Property", icon: PlusCircle },
]

const propertyTypes = ["House", "Apartment", "Villa", "Townhouse", "Loft", "Cabin"] as const

function formatPrice(price: number) {
  return `PKR ${price.toLocaleString()}`
}

const emptyForm = {
  title: "",
  description: "",
  price: "",
  type: "House",
  category: "buy",
  bedrooms: "",
  bathrooms: "",
  area_sqft: "",
  city: "",
  location: "",
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("overview")
  const [properties, setProperties] = useState<DashboardProperty[]>([])
  const [propsLoading, setPropsLoading] = useState(true)
  const [propsError, setPropsError] = useState("")
  const [mobileNav, setMobileNav] = useState(false)

  // Form state (shared for add + edit)
  const [form, setForm] = useState({ ...emptyForm })
  const [formError, setFormError] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/sign-in")
        return
      }
      setUser(user)
      setLoading(false)
    })
  }, [router])

  const fetchProperties = useCallback(async () => {
    if (!user) return
    setPropsLoading(true)
    setPropsError("")

    const { data, error } = await supabase
      .from("properties")
      .select(`
        id, title, city, price, status, type, category,
        property_images ( storage_path, is_cover )
      `)
      .eq("agent_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      setPropsError(error.message)
      setPropsLoading(false)
      return
    }

    const mapped: DashboardProperty[] = (data || []).map((p: any) => {
      const cover = (p.property_images || []).find((img: any) => img.is_cover)
      return {
        id: p.id,
        title: p.title,
        city: p.city,
        price: p.price,
        status: p.status,
        type: p.type,
        category: p.category,
        cover_url: getImageUrl(cover?.storage_path || null),
      }
    })

    setProperties(mapped)
    setPropsLoading(false)
  }, [user])

  useEffect(() => {
    if (user) fetchProperties()
  }, [user, fetchProperties])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace("/sign-in")
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("properties").delete().eq("id", id)
    if (!error) setProperties((prev) => prev.filter((p) => p.id !== id))
  }

  async function handleEdit(id: string) {
    const { data, error } = await supabase
      .from("properties")
      .select("title, description, price, type, category, bedrooms, bathrooms, area_sqft, city, location")
      .eq("id", id)
      .single()

    if (error || !data) return

    setEditingId(id)
    setForm({
      title: data.title || "",
      description: data.description || "",
      price: String(data.price),
      type: data.type || "House",
      category: data.category || "buy",
      bedrooms: String(data.bedrooms),
      bathrooms: String(data.bathrooms),
      area_sqft: String(data.area_sqft),
      city: data.city || "",
      location: data.location || "",
    })
    setImageFiles([])
    setFormError("")
    setFormSuccess(false)
    setTab("add")
  }

  function handleCancelEdit() {
    setEditingId(null)
    setForm({ ...emptyForm })
    setImageFiles([])
    setFormError("")
    setFormSuccess(false)
  }

  async function uploadImages(propertyId: string, agentId: string) {
    if (imageFiles.length === 0) return

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      const path = `${agentId}/${propertyId}/${file.name}`

      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(path, file, { upsert: true })

      if (uploadError) continue

      await supabase.from("property_images").insert({
        property_id: propertyId,
        storage_path: path,
        is_cover: i === 0,
      })
    }
  }

  async function handleSubmitProperty(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setFormError("")
    setFormLoading(true)
    setFormSuccess(false)

    const payload = {
      title: form.title,
      description: form.description,
      price: Number(form.price),
      type: form.type,
      category: form.category,
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      area_sqft: Number(form.area_sqft),
      city: form.city,
      location: form.location || null,
    }

    if (editingId) {
      // Update existing
      const { error } = await supabase
        .from("properties")
        .update(payload)
        .eq("id", editingId)
        .eq("agent_id", user.id)

      if (error) {
        setFormError(error.message)
        setFormLoading(false)
        return
      }

      if (imageFiles.length > 0) {
        await uploadImages(editingId, user.id)
      }

      setFormSuccess(true)
      setFormLoading(false)
      setEditingId(null)
      setForm({ ...emptyForm })
      setImageFiles([])
      fetchProperties()
    } else {
      // Insert new
      const { data, error } = await supabase
        .from("properties")
        .insert({ ...payload, agent_id: user.id })
        .select("id")
        .single()

      if (error || !data) {
        setFormError(error?.message || "Failed to insert property")
        setFormLoading(false)
        return
      }

      await uploadImages(data.id, user.id)

      setFormSuccess(true)
      setFormLoading(false)
      setForm({ ...emptyForm })
      setImageFiles([])
      fetchProperties()
    }
  }

  function removeFile(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const fullName = user?.user_metadata?.full_name || "Agent"
  const activeCount = properties.filter((p) => p.status === "active").length

  const statusColor: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    sold: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    rented: "bg-violet-500/15 text-violet-400 border-violet-500/20",
    draft: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  }

  const inputClass = "h-12 rounded-sm border-border bg-card px-4 text-sm placeholder:text-muted-foreground/50 focus-visible:border-foreground focus-visible:ring-foreground/20"

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-foreground text-background">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="font-display text-2xl leading-none tracking-tight">EstateX</span>
          </Link>
        </div>

        <div className="border-b border-border px-6 py-5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {sidebarLinks.map((link) => (
              <button
                key={link.key}
                onClick={() => { setTab(link.key); if (link.key === "add") handleCancelEdit() }}
                className={`flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors ${
                  tab === link.key
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="border-t border-border px-3 py-4 space-y-1">
          <Link
            href="/listings"
            className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
          >
            <Search className="h-4 w-4" />
            Browse Properties
          </Link>
          <Link
            href="/"
            className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-foreground text-background">
              <Building2 className="h-3.5 w-3.5" />
            </span>
            <span className="font-display text-xl leading-none tracking-tight">EstateX</span>
          </Link>
          <button
            onClick={() => setMobileNav(!mobileNav)}
            className="rounded-sm border border-border px-3 py-1.5 text-xs"
          >
            Menu
          </button>
        </div>
        {mobileNav && (
          <div className="border-t border-border bg-card px-4 py-3">
            {sidebarLinks.map((link) => (
              <button
                key={link.key}
                onClick={() => { setTab(link.key); setMobileNav(false); if (link.key === "add") handleCancelEdit() }}
                className={`flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm ${
                  tab === link.key ? "bg-secondary text-foreground" : "text-muted-foreground"
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </button>
            ))}
            <Link href="/listings" className="mt-2 flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm text-muted-foreground" onClick={() => setMobileNav(false)}>
              <Search className="h-4 w-4" />
              Browse Properties
            </Link>
            <Link href="/" className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm text-muted-foreground" onClick={() => setMobileNav(false)}>
              <Home className="h-4 w-4" />
              Home
            </Link>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <main className="flex-1 pt-14 lg:ml-64 lg:pt-0">
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
          {/* Overview / My Listings */}
          {(tab === "overview" || tab === "listings") && (
            <>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {tab === "overview" ? "Dashboard" : "My Listings"}
              </p>
              <h1 className="mt-3 font-display text-4xl leading-[0.95] md:text-5xl">
                {tab === "overview" ? `Welcome, ${fullName}` : "Your Properties"}
              </h1>

              {tab === "overview" && (
                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "Total Listings", value: properties.length },
                    { label: "Active", value: activeCount },
                    { label: "Total Views", value: 1248 },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-sm border border-border bg-card p-5">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                      <p className="mt-2 font-mono text-3xl tracking-tight">{stat.value}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-10">
                {tab === "overview" && (
                  <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Recent Properties</h2>
                )}

                {propsLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : propsError ? (
                  <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3">
                    <p className="text-sm text-destructive">{propsError}</p>
                  </div>
                ) : properties.length === 0 ? (
                  <div className="rounded-sm border border-border bg-card px-6 py-16 text-center">
                    <Home className="mx-auto h-8 w-8 text-muted-foreground/40" />
                    <p className="mt-3 text-sm text-muted-foreground">No properties yet</p>
                    <button
                      onClick={() => setTab("add")}
                      className="mt-4 inline-flex items-center gap-2 rounded-sm bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Your First Property
                    </button>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-sm border border-border">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-card">
                            <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Property</th>
                            <th className="hidden px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:table-cell">City</th>
                            <th className="hidden px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground md:table-cell">Price</th>
                            <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Status</th>
                            <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {properties.map((p) => (
                            <tr key={p.id} className="border-b border-border last:border-b-0 transition-colors hover:bg-secondary/30">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-14 shrink-0 overflow-hidden rounded-sm bg-secondary">
                                    {p.cover_url ? (
                                      <img src={p.cover_url} alt={p.title} className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="flex h-full items-center justify-center">
                                        <Home className="h-4 w-4 text-muted-foreground/40" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate font-medium">{p.title}</p>
                                    <p className="text-xs text-muted-foreground sm:hidden">
                                      {p.city} &middot; {formatPrice(p.price)}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{p.city}</td>
                              <td className="hidden px-4 py-3 font-mono md:table-cell">{formatPrice(p.price)}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${statusColor[p.status] || statusColor.draft}`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-1">
                                  <Link
                                    href={`/properties/${p.id}`}
                                    className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                  <button
                                    onClick={() => handleEdit(p.id)}
                                    className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(p.id)}
                                    className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Add / Edit Property */}
          {tab === "add" && (
            <>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {editingId ? "Edit Listing" : "New Listing"}
              </p>
              <h1 className="mt-3 font-display text-4xl leading-[0.95] md:text-5xl">
                {editingId ? "Edit Property" : "Add Property"}
              </h1>

              {editingId && (
                <button
                  onClick={handleCancelEdit}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel editing
                </button>
              )}

              <form onSubmit={handleSubmitProperty} className="mt-10 max-w-2xl space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="title" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Title</Label>
                    <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. DHA Phase 6 Villa" required className={inputClass} />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="description" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Description</Label>
                    <textarea
                      id="description"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe the property..."
                      rows={4}
                      className="w-full rounded-sm border border-border bg-card px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/50 focus-visible:border-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Price (PKR)</Label>
                    <Input id="price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="85000000" required className={inputClass} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Property Type</Label>
                    <select
                      id="type"
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="h-12 w-full rounded-sm border border-border bg-card px-4 text-sm outline-none focus-visible:border-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/20"
                    >
                      {propertyTypes.map((t) => (
                        <option key={t} value={t} className="bg-card">{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">City</Label>
                    <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Karachi" required className={inputClass} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Location</Label>
                    <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="DHA Phase 6" className={inputClass} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bedrooms" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Bedrooms</Label>
                    <Input id="bedrooms" type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} placeholder="3" required className={inputClass} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bathrooms" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Bathrooms</Label>
                    <Input id="bathrooms" type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} placeholder="2" required className={inputClass} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="area_sqft" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Area (sqft)</Label>
                    <Input id="area_sqft" type="number" value={form.area_sqft} onChange={(e) => setForm({ ...form, area_sqft: e.target.value })} placeholder="2400" required className={inputClass} />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Category</Label>
                    <div className="flex rounded-sm border border-border bg-card p-1">
                      {(["buy", "rent"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setForm({ ...form, category: m })}
                          className={`flex-1 rounded-[2px] px-4 py-2.5 text-sm capitalize transition-colors ${
                            form.category === m
                              ? "bg-foreground text-background"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Image upload */}
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      Property Images {editingId && "(adds to existing)"}
                    </Label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-sm border border-dashed border-border bg-card px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                    >
                      <Upload className="h-4 w-4" />
                      Click to select images
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        setImageFiles((prev) => [...prev, ...files])
                        e.target.value = ""
                      }}
                    />
                    {imageFiles.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {imageFiles.map((f, i) => (
                          <div key={i} className="flex items-center justify-between rounded-sm border border-border bg-card px-3 py-2 text-sm">
                            <span className="truncate text-muted-foreground">
                              {i === 0 && <span className="mr-2 rounded-sm bg-foreground/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-foreground">cover</span>}
                              {f.name}
                            </span>
                            <button type="button" onClick={() => removeFile(i)} className="ml-2 shrink-0 text-muted-foreground hover:text-destructive">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="font-mono text-[10px] text-muted-foreground/50">First image will be the cover photo</p>
                  </div>
                </div>

                {formError && (
                  <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3">
                    <p className="text-sm text-destructive">{formError}</p>
                  </div>
                )}

                {formSuccess && (
                  <div className="rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                    <p className="text-sm text-emerald-400">
                      {editingId ? "Property updated successfully!" : "Property added successfully!"}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex items-center gap-2 rounded-sm bg-foreground px-7 py-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Pencil className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                  {formLoading ? (editingId ? "Updating..." : "Adding...") : (editingId ? "Update Property" : "Add Property")}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
