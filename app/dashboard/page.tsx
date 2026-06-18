"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Home, LogOut, LayoutDashboard, List, PlusCircle, Pencil, Trash2, Eye,
  Loader2, Upload, X, Search, Heart, MessageSquare, Inbox, Settings, Save,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getImageUrl } from "@/lib/image-url"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { User } from "@supabase/supabase-js"

type DashboardProperty = {
  id: string; title: string; city: string; price: number; status: string; type: string; category: string; cover_url: string | null
}
type InquiryRow = {
  id: string; inquiry_type: string; message: string | null; phone: string | null; status: string; created_at: string
  property: { id: string; title: string } | null
  user: { full_name: string | null } | null
}
type MyInquiryRow = {
  id: string; inquiry_type: string; message: string | null; status: string; created_at: string
  property: { id: string; title: string; city: string; price: number } | null
}
type SavedRow = {
  id: string; property_id: string
  property: { id: string; title: string; city: string; location: string | null; price: number; type: string; category: string; bedrooms: number; bathrooms: number; area_sqft: number; property_images: { storage_path: string; is_cover: boolean }[] } | null
}

const propertyTypes = ["House", "Apartment", "Villa", "Townhouse", "Loft", "Cabin"] as const
function formatPrice(price: number) { return `€${price.toLocaleString()}` }
const emptyForm = { title: "", description: "", price: "", type: "House", category: "buy", bedrooms: "", bathrooms: "", area_sqft: "", city: "", location: "" }

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("overview")
  const [mobileNav, setMobileNav] = useState(false)

  // Agent properties
  const [properties, setProperties] = useState<DashboardProperty[]>([])
  const [propsLoading, setPropsLoading] = useState(true)
  const [propsError, setPropsError] = useState("")

  // Agent inquiries
  const [inquiries, setInquiries] = useState<InquiryRow[]>([])
  const [inqLoading, setInqLoading] = useState(false)

  // User's own inquiries
  const [myInquiries, setMyInquiries] = useState<MyInquiryRow[]>([])
  const [myInqLoading, setMyInqLoading] = useState(false)

  // Saved properties
  const [savedProps, setSavedProps] = useState<SavedRow[]>([])
  const [savedLoading, setSavedLoading] = useState(false)

  // Profile / Settings
  const [profile, setProfile] = useState({ full_name: "", phone: "", role: "" })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState("")

  // Form
  const [form, setForm] = useState({ ...emptyForm })
  const [formError, setFormError] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Detect if user has listings (is an agent)
  const isAgent = properties.length > 0

  const sidebarLinks = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "listings", label: "My Listings", icon: List },
    { key: "add", label: "Add Property", icon: PlusCircle },
    { key: "inquiries", label: "Inquiries", icon: Inbox },
    { key: "my-inquiries", label: "My Inquiries", icon: MessageSquare },
    { key: "saved", label: "Saved", icon: Heart },
    { key: "settings", label: "Settings", icon: Settings },
  ]

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/sign-in"); return }
      // Ensure a profiles row exists for this user. properties.agent_id has an FK
      // to profiles, so without this the first "Add Property" insert fails (23503).
      // Safe to run every load: onConflict(id) makes it a no-op if it already exists.
      await supabase.from("profiles").upsert(
        { id: user.id, full_name: user.user_metadata?.full_name ?? null },
        { onConflict: "id", ignoreDuplicates: true },
      )
      setUser(user)
      setLoading(false)
    })
  }, [router])

  const fetchProperties = useCallback(async () => {
    if (!user) return
    setPropsLoading(true); setPropsError("")
    const { data, error } = await supabase.from("properties")
      .select("id, title, city, price, status, type, category, property_images ( storage_path, is_cover )")
      .eq("agent_id", user.id).order("created_at", { ascending: false })
    if (error) { setPropsError(error.message); setPropsLoading(false); return }
    setProperties((data || []).map((p: any) => {
      const cover = (p.property_images || []).find((img: any) => img.is_cover)
      return { id: p.id, title: p.title, city: p.city, price: p.price, status: p.status, type: p.type, category: p.category, cover_url: getImageUrl(cover?.storage_path || null) }
    }))
    setPropsLoading(false)
  }, [user])

  const fetchInquiries = useCallback(async () => {
    if (!user) return
    setInqLoading(true)
    const { data } = await supabase.from("inquiries")
      .select("id, inquiry_type, message, phone, status, created_at, properties:property_id ( id, title ), profiles:user_id ( full_name )")
      .eq("agent_id", user.id).order("created_at", { ascending: false })
    setInquiries((data || []).map((r: any) => ({ ...r, property: r.properties, user: r.profiles })))
    setInqLoading(false)
  }, [user])

  const fetchMyInquiries = useCallback(async () => {
    if (!user) return
    setMyInqLoading(true)
    const { data } = await supabase.from("inquiries")
      .select("id, inquiry_type, message, status, created_at, properties:property_id ( id, title, city, price )")
      .eq("user_id", user.id).order("created_at", { ascending: false })
    setMyInquiries((data || []).map((r: any) => ({ ...r, property: r.properties })))
    setMyInqLoading(false)
  }, [user])

  const fetchSaved = useCallback(async () => {
    if (!user) return
    setSavedLoading(true)
    const { data } = await supabase.from("saved_properties")
      .select("id, property_id, properties:property_id ( id, title, city, location, price, type, category, bedrooms, bathrooms, area_sqft, property_images ( storage_path, is_cover ) )")
      .eq("user_id", user.id).order("created_at", { ascending: false })
    setSavedProps((data || []).map((r: any) => ({ ...r, property: r.properties })))
    setSavedLoading(false)
  }, [user])

  const fetchProfile = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from("profiles").select("full_name, phone, role").eq("id", user.id).single()
    if (data) setProfile({ full_name: data.full_name || "", phone: data.phone || "", role: data.role || "" })
  }, [user])

  useEffect(() => { if (user) { fetchProperties(); fetchInquiries(); fetchMyInquiries(); fetchSaved(); fetchProfile() } }, [user, fetchProperties, fetchInquiries, fetchMyInquiries, fetchSaved, fetchProfile])

  async function handleSignOut() { await supabase.auth.signOut(); router.replace("/sign-in") }
  async function handleDelete(id: string) { const { error } = await supabase.from("properties").delete().eq("id", id); if (!error) setProperties((prev) => prev.filter((p) => p.id !== id)) }
  async function handleUnsave(savedId: string) { await supabase.from("saved_properties").delete().eq("id", savedId); setSavedProps((prev) => prev.filter((s) => s.id !== savedId)) }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setProfileError(""); setProfileLoading(true); setProfileSaved(false)

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: profile.full_name || null,
      phone: profile.phone || null,
      role: profile.role || null,
    })

    if (error) { setProfileError(error.message); setProfileLoading(false); return }
    setProfileSaved(true); setProfileLoading(false)
  }

  async function updateInquiryStatus(id: string, status: string) {
    await supabase.from("inquiries").update({ status }).eq("id", id)
    setInquiries((prev) => prev.map((i) => i.id === id ? { ...i, status } : i))
  }

  async function handleEdit(id: string) {
    const { data } = await supabase.from("properties").select("title, description, price, type, category, bedrooms, bathrooms, area_sqft, city, location").eq("id", id).single()
    if (!data) return
    setEditingId(id)
    setForm({ title: data.title || "", description: data.description || "", price: String(data.price), type: data.type || "House", category: data.category || "buy", bedrooms: String(data.bedrooms), bathrooms: String(data.bathrooms), area_sqft: String(data.area_sqft), city: data.city || "", location: data.location || "" })
    setImageFiles([]); setFormError(""); setFormSuccess(false); setTab("add")
  }

  function handleCancelEdit() { setEditingId(null); setForm({ ...emptyForm }); setImageFiles([]); setFormError(""); setFormSuccess(false) }

  async function uploadImages(propertyId: string, agentId: string): Promise<boolean> {
    const uploadedPaths: string[] = []
    // Undo any partial work (storage files + image rows) so a failure leaves nothing behind.
    const rollback = async () => {
      if (uploadedPaths.length === 0) return
      await supabase.from("property_images").delete().eq("property_id", propertyId).in("storage_path", uploadedPaths)
      await supabase.storage.from("property-images").remove(uploadedPaths)
    }
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]; const path = `${agentId}/${propertyId}/${file.name}`
      const { error: uploadError } = await supabase.storage.from("property-images").upload(path, file, { upsert: false })
      if (uploadError) { await rollback(); setFormError(`Image upload failed: ${uploadError.message}`); return false }
      uploadedPaths.push(path)
      const { error: insertError } = await supabase.from("property_images").insert({ property_id: propertyId, storage_path: path, is_cover: i === 0 })
      if (insertError) { await rollback(); setFormError(`Saving image record failed: ${insertError.message}`); return false }
    }
    return true
  }

  async function handleSubmitProperty(e: React.FormEvent) {
    e.preventDefault(); if (!user) return
    setFormError(""); setFormLoading(true); setFormSuccess(false)
    const payload = { title: form.title, description: form.description, price: Number(form.price), type: form.type, category: form.category, bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms), area_sqft: Number(form.area_sqft), city: form.city, location: form.location || null }

    if (editingId) {
      const { error } = await supabase.from("properties").update(payload).eq("id", editingId).eq("agent_id", user.id)
      if (error) { setFormError(error.message); setFormLoading(false); return }
      if (imageFiles.length > 0) {
        const ok = await uploadImages(editingId, user.id)
        if (!ok) { setFormLoading(false); fetchProperties(); return }
      }
      setFormSuccess(true); setFormLoading(false); setEditingId(null); setForm({ ...emptyForm }); setImageFiles([]); fetchProperties()
    } else {
      const { data, error } = await supabase.from("properties").insert({ ...payload, agent_id: user.id }).select("id").single()
      if (error || !data) { setFormError(error?.message || "Failed"); setFormLoading(false); return }
      if (imageFiles.length > 0) {
        const ok = await uploadImages(data.id, user.id)
        if (!ok) {
          // Images failed → roll back the just-created property so nothing is stored.
          await supabase.from("properties").delete().eq("id", data.id).eq("agent_id", user.id)
          setFormLoading(false); fetchProperties(); return
        }
      }
      setFormSuccess(true); setFormLoading(false); setForm({ ...emptyForm }); setImageFiles([]); fetchProperties()
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>

  const fullName = user?.user_metadata?.full_name || "User"
  const activeCount = properties.filter((p) => p.status === "active").length
  const newInqCount = inquiries.filter((i) => i.status === "new").length
  const statusColor: Record<string, string> = { active: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20", sold: "bg-blue-500/15 text-blue-500 border-blue-500/20", rented: "bg-violet-500/15 text-violet-500 border-violet-500/20", draft: "bg-yellow-500/15 text-yellow-500 border-yellow-500/20" }
  const inqStatusColor: Record<string, string> = { new: "bg-blue-500/15 text-blue-500 border-blue-500/20", contacted: "bg-yellow-500/15 text-yellow-500 border-yellow-500/20", closed: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20" }
  const inputClass = "h-12 rounded-xl border-border bg-card px-4 text-sm placeholder:text-muted-foreground/50 focus-visible:border-orange-500 focus-visible:ring-orange-500/20"

  function SidebarButton({ link }: { link: typeof sidebarLinks[0] }) {
    return (
      <button key={link.key} onClick={() => { setTab(link.key); if (link.key === "add") handleCancelEdit() }}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${tab === link.key ? "bg-orange-50 text-orange-600 font-medium" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"}`}>
        <link.icon className={`h-4 w-4 ${tab === link.key ? "text-orange-500" : ""}`} />{link.label}
        {link.key === "inquiries" && newInqCount > 0 && <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 font-mono text-[10px] text-white">{newInqCount}</span>}
      </button>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white"><Home className="h-4 w-4" /></span>
            <span className="text-xl font-bold tracking-tight">Estate<span className="text-orange-500">X</span></span>
          </Link>
        </div>
        <div className="border-b border-border px-6 py-5">
          <p className="truncate text-sm font-medium">{fullName}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">{sidebarLinks.map((l) => <SidebarButton key={l.key} link={l} />)}</div>
        </nav>
        <div className="border-t border-border px-3 py-4">
          <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"><LogOut className="h-4 w-4" />Sign Out</button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-white"><Home className="h-3.5 w-3.5" /></span>
            <span className="text-lg font-bold tracking-tight">Estate<span className="text-orange-500">X</span></span>
          </Link>
          <button onClick={() => setMobileNav(!mobileNav)} className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium">Menu</button>
        </div>
        {mobileNav && (
          <div className="border-t border-border bg-card px-4 py-3">
            {sidebarLinks.map((l) => <button key={l.key} onClick={() => { setTab(l.key); setMobileNav(false) }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm ${tab === l.key ? "bg-orange-50 text-orange-600 font-medium" : "text-muted-foreground"}`}><l.icon className={`h-4 w-4 ${tab === l.key ? "text-orange-500" : ""}`} />{l.label}</button>)}
            <button onClick={handleSignOut} className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground"><LogOut className="h-4 w-4" />Sign Out</button>
          </div>
        )}
      </div>

      {/* Main */}
      <main className="flex-1 pt-14 lg:ml-64 lg:pt-0">
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">

          {/* === OVERVIEW / MY LISTINGS === */}
          {(tab === "overview" || tab === "listings") && (
            <>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange-500">{tab === "overview" ? "Dashboard" : "My Listings"}</p>
              <h1 className="mt-3 font-display text-2xl leading-[0.95] sm:text-3xl md:text-4xl lg:text-5xl">{tab === "overview" ? `Welcome, ${fullName}` : "Your Properties"}</h1>

              {tab === "overview" && (
                <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  {[
                    { label: "My Listings", value: properties.length, color: "text-orange-500" },
                    { label: "Active", value: activeCount, color: "text-emerald-500" },
                    { label: "New Inquiries", value: newInqCount, color: "text-blue-500" },
                    { label: "Saved Properties", value: savedProps.length, color: "text-violet-500" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
                      <p className={`mt-2 font-mono text-3xl tracking-tight ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-10">
                {tab === "overview" && <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Recent Properties</h2>}
                {propsLoading ? <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-orange-500" /></div>
                : propsError ? <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3"><p className="text-sm text-destructive">{propsError}</p></div>
                : properties.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center">
                    <Home className="mx-auto h-8 w-8 text-muted-foreground/40" />
                    <p className="mt-3 text-sm text-muted-foreground">No properties yet</p>
                    <button onClick={() => setTab("add")} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600"><PlusCircle className="h-4 w-4" />Add Your First Property</button>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-border"><div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border bg-card">
                        <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Property</th>
                        <th className="hidden px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:table-cell">City</th>
                        <th className="hidden px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground md:table-cell">Price</th>
                        <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Actions</th>
                      </tr></thead>
                      <tbody>{properties.map((p) => (
                        <tr key={p.id} className="border-b border-border last:border-b-0 transition-colors hover:bg-secondary/30">
                          <td className="px-4 py-3"><div className="flex items-center gap-3">
                            <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary">{p.cover_url ? <img src={p.cover_url} alt={p.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Home className="h-4 w-4 text-muted-foreground/40" /></div>}</div>
                            <div className="min-w-0"><p className="truncate font-medium">{p.title}</p><p className="text-xs text-muted-foreground sm:hidden">{p.city} &middot; {formatPrice(p.price)}</p></div>
                          </div></td>
                          <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{p.city}</td>
                          <td className="hidden px-4 py-3 font-mono md:table-cell">{formatPrice(p.price)}</td>
                          <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${statusColor[p.status] || statusColor.draft}`}>{p.status}</span></td>
                          <td className="px-4 py-3"><div className="flex items-center justify-end gap-1">
                            <Link href={`/properties/${p.id}`} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"><Eye className="h-4 w-4" /></Link>
                            <button onClick={() => handleEdit(p.id)} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => handleDelete(p.id)} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                          </div></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div></div>
                )}
              </div>
            </>
          )}

          {/* === INQUIRIES (Agent view) === */}
          {tab === "inquiries" && (
            <>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange-500">Incoming</p>
              <h1 className="mt-3 font-display text-2xl leading-[0.95] sm:text-3xl md:text-4xl lg:text-5xl">Inquiries</h1>
              <div className="mt-10">
                {inqLoading ? <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-orange-500" /></div>
                : inquiries.length === 0 ? <p className="text-sm text-muted-foreground">No inquiries yet.</p>
                : (
                  <div className="space-y-3">
                    {inquiries.map((inq) => (
                      <div key={inq.id} className="rounded-2xl border border-border bg-card p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{inq.user?.full_name || "User"}</span>
                              <span className="font-mono text-xs text-muted-foreground">wants to</span>
                              <span className="rounded-full bg-orange-50 px-2.5 py-0.5 font-mono text-xs uppercase tracking-wider text-orange-600">{inq.inquiry_type === "viewing" ? "book viewing" : inq.inquiry_type}</span>
                            </div>
                            {inq.property && (
                              <Link href={`/properties/${inq.property.id}`} className="mt-1 block text-sm text-muted-foreground underline underline-offset-4 hover:text-orange-500">{inq.property.title}</Link>
                            )}
                            {inq.message && <p className="mt-2 text-sm text-muted-foreground">{inq.message}</p>}
                            {inq.phone && <p className="mt-1 font-mono text-xs text-muted-foreground">Phone: {inq.phone}</p>}
                            <p className="mt-1 font-mono text-[10px] text-muted-foreground/50">{new Date(inq.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${inqStatusColor[inq.status] || inqStatusColor.new}`}>{inq.status}</span>
                            <select
                              value={inq.status}
                              onChange={(e) => updateInquiryStatus(inq.id, e.target.value)}
                              className="h-8 rounded-xl border border-border bg-transparent px-2 text-xs outline-none focus:border-orange-500"
                            >
                              <option value="new" className="bg-card">New</option>
                              <option value="contacted" className="bg-card">Contacted</option>
                              <option value="closed" className="bg-card">Closed</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* === MY INQUIRIES (Buyer view) === */}
          {tab === "my-inquiries" && (
            <>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange-500">Sent</p>
              <h1 className="mt-3 font-display text-2xl leading-[0.95] sm:text-3xl md:text-4xl lg:text-5xl">My Inquiries</h1>
              <div className="mt-10">
                {myInqLoading ? <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-orange-500" /></div>
                : myInquiries.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center">
                    <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/40" />
                    <p className="mt-3 text-sm text-muted-foreground">No inquiries sent yet</p>
                    <Link href="/listings" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600"><Search className="h-4 w-4" />Browse Properties</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myInquiries.map((inq) => (
                      <div key={inq.id} className="rounded-2xl border border-border bg-card p-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            {inq.property && (
                              <Link href={`/properties/${inq.property.id}`} className="font-medium hover:text-orange-500">{inq.property.title}</Link>
                            )}
                            {inq.property && <p className="text-xs text-muted-foreground">{inq.property.city} &middot; {formatPrice(inq.property.price)}</p>}
                            <p className="mt-1 font-mono text-xs text-muted-foreground">Type: {inq.inquiry_type}</p>
                            {inq.message && <p className="mt-1 text-sm text-muted-foreground">{inq.message}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${inqStatusColor[inq.status] || inqStatusColor.new}`}>{inq.status}</span>
                            <span className="font-mono text-[10px] text-muted-foreground/50">{new Date(inq.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* === SAVED === */}
          {tab === "saved" && (
            <>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange-500">Favorites</p>
              <h1 className="mt-3 font-display text-2xl leading-[0.95] sm:text-3xl md:text-4xl lg:text-5xl">Saved Properties</h1>
              <div className="mt-10">
                {savedLoading ? <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-orange-500" /></div>
                : savedProps.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center">
                    <Heart className="mx-auto h-8 w-8 text-muted-foreground/40" />
                    <p className="mt-3 text-sm text-muted-foreground">No saved properties yet</p>
                    <Link href="/listings" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600"><Search className="h-4 w-4" />Browse Properties</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {savedProps.map((s) => {
                      if (!s.property) return null
                      const p = s.property
                      const cover = (p.property_images || []).find((img: any) => img.is_cover)
                      const coverUrl = getImageUrl(cover?.storage_path || null)
                      return (
                        <article key={s.id} className="group hover-lift overflow-hidden rounded-2xl border border-border bg-card">
                          <div className="relative aspect-[4/3] overflow-hidden">
                            <img src={coverUrl || "/placeholder.svg"} alt={p.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2.5 py-1 font-mono text-xs uppercase tracking-wider backdrop-blur-sm">{p.type}</span>
                            <span className="absolute right-3 top-3 rounded-full bg-orange-500 px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-white">{p.category}</span>
                            <button onClick={() => handleUnsave(s.id)} className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/70 backdrop-blur-sm hover:bg-background"><Heart className="h-4 w-4 fill-red-500 text-red-500" /></button>
                          </div>
                          <div className="p-5">
                            <span className="font-mono text-2xl tracking-tight text-orange-500">{formatPrice(p.price)}</span>
                            <h3 className="mt-2 font-display text-2xl leading-none">{p.title}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{p.location ? `${p.location}, ` : ""}{p.city}</p>
                            <div className="mt-4 flex items-center gap-5 border-t border-border pt-4 font-mono text-sm text-muted-foreground">
                              <span className="flex items-center gap-1.5"><span>{p.bedrooms} bd</span></span>
                              <span className="flex items-center gap-1.5"><span>{p.bathrooms} ba</span></span>
                              <span>{p.area_sqft.toLocaleString()} sqft</span>
                            </div>
                            <Link href={`/properties/${p.id}`} className="mt-5 flex w-full items-center justify-between rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600">View details<Eye className="h-4 w-4" /></Link>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* === SETTINGS === */}
          {tab === "settings" && (
            <>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange-500">Account</p>
              <h1 className="mt-3 font-display text-2xl leading-[0.95] sm:text-3xl md:text-4xl lg:text-5xl">Settings</h1>

              <form onSubmit={handleSaveProfile} className="mt-10 max-w-lg space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
                  <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Profile Information</h2>

                  <div className="space-y-2">
                    <Label htmlFor="profile-name" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Full Name</Label>
                    <Input id="profile-name" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} placeholder="Your full name" className={inputClass} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile-phone" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                    <Input id="profile-phone" type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="03XX-XXXXXXX" className={inputClass} />
                    <p className="font-mono text-[10px] text-muted-foreground/50">This will be shown on your property listings so buyers can contact you</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile-role" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Role</Label>
                    <select id="profile-role" value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                      className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none focus-visible:border-orange-500 focus-visible:ring-[3px] focus-visible:ring-orange-500/20">
                      <option value="" className="bg-card">Select role</option>
                      <option value="agent" className="bg-card">Agent</option>
                      <option value="buyer" className="bg-card">Buyer</option>
                      <option value="seller" className="bg-card">Seller</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
                  <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Account Details</h2>
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="text-sm">{user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Member since</span>
                    <span className="text-sm">{user?.created_at ? new Date(user.created_at).toLocaleDateString("en-PK", { month: "long", year: "numeric" }) : "—"}</span>
                  </div>
                </div>

                {profileError && <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3"><p className="text-sm text-destructive">{profileError}</p></div>}
                {profileSaved && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3"><p className="text-sm text-emerald-500">Profile updated successfully!</p></div>}

                <button type="submit" disabled={profileLoading}
                  className="flex items-center gap-2 rounded-xl bg-orange-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600 disabled:opacity-50">
                  {profileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {profileLoading ? "Saving..." : "Save Profile"}
                </button>
              </form>
            </>
          )}

          {/* === ADD / EDIT PROPERTY === */}
          {tab === "add" && (
            <>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange-500">{editingId ? "Edit Listing" : "New Listing"}</p>
              <h1 className="mt-3 font-display text-2xl leading-[0.95] sm:text-3xl md:text-4xl lg:text-5xl">{editingId ? "Edit Property" : "Add Property"}</h1>
              {editingId && <button onClick={handleCancelEdit} className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-orange-500"><X className="h-3.5 w-3.5" />Cancel editing</button>}

              <form onSubmit={handleSubmitProperty} className="mt-10 max-w-2xl space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2"><Label htmlFor="title" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Title</Label><Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. DHA Phase 6 Villa" required className={inputClass} /></div>
                  <div className="space-y-2 sm:col-span-2"><Label htmlFor="description" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Description</Label><textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the property..." rows={4} className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/50 focus-visible:border-orange-500 focus-visible:ring-[3px] focus-visible:ring-orange-500/20" /></div>
                  <div className="space-y-2"><Label htmlFor="price" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Price (EUR)</Label><Input id="price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="850000" required className={inputClass} /></div>
                  <div className="space-y-2"><Label htmlFor="type" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Property Type</Label><select id="type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none focus-visible:border-orange-500 focus-visible:ring-[3px] focus-visible:ring-orange-500/20">{propertyTypes.map((t) => <option key={t} value={t} className="bg-card">{t}</option>)}</select></div>
                  <div className="space-y-2"><Label htmlFor="city" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">City</Label><Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Karachi" required className={inputClass} /></div>
                  <div className="space-y-2"><Label htmlFor="location" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Location</Label><Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="DHA Phase 6" className={inputClass} /></div>
                  <div className="space-y-2"><Label htmlFor="bedrooms" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Bedrooms</Label><Input id="bedrooms" type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} placeholder="3" required className={inputClass} /></div>
                  <div className="space-y-2"><Label htmlFor="bathrooms" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Bathrooms</Label><Input id="bathrooms" type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} placeholder="2" required className={inputClass} /></div>
                  <div className="space-y-2"><Label htmlFor="area_sqft" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Area (sqft)</Label><Input id="area_sqft" type="number" value={form.area_sqft} onChange={(e) => setForm({ ...form, area_sqft: e.target.value })} placeholder="2400" required className={inputClass} /></div>
                  <div className="space-y-2"><Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Category</Label><div className="flex rounded-xl border border-border bg-card p-1">{(["buy", "rent"] as const).map((m) => <button key={m} type="button" onClick={() => setForm({ ...form, category: m })} className={`flex-1 rounded-lg px-4 py-2.5 text-sm capitalize transition-all duration-300 ${form.category === m ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25" : "text-muted-foreground hover:text-foreground"}`}>{m}</button>)}</div></div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Property Images {editingId && "(adds to existing)"}</Label>
                    <div
                      onPaste={(e) => {
                        const items = e.clipboardData?.items
                        if (!items) return
                        const pastedFiles: File[] = []
                        for (let i = 0; i < items.length; i++) {
                          if (items[i].type.startsWith("image/")) {
                            const file = items[i].getAsFile()
                            if (file) pastedFiles.push(file)
                          }
                        }
                        if (pastedFiles.length > 0) {
                          e.preventDefault()
                          setImageFiles((prev) => [...prev, ...pastedFiles])
                        }
                      }}
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-orange-400", "bg-orange-50/50") }}
                      onDragLeave={(e) => { e.currentTarget.classList.remove("border-orange-400", "bg-orange-50/50") }}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.currentTarget.classList.remove("border-orange-400", "bg-orange-50/50")
                        const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"))
                        if (droppedFiles.length > 0) setImageFiles((prev) => [...prev, ...droppedFiles])
                      }}
                      tabIndex={0}
                      className="rounded-xl border border-dashed border-border bg-card px-4 py-8 text-center transition-colors focus:outline-none focus:border-orange-400"
                    >
                      <label htmlFor="image-upload" className="flex cursor-pointer flex-col items-center justify-center gap-2 text-sm text-muted-foreground hover:text-orange-500">
                        <Upload className="h-5 w-5" />
                        <span>Click to select, drag &amp; drop, or paste images</span>
                      </label>
                      <input
                        id="image-upload"
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || [])
                          if (files.length > 0) setImageFiles((prev) => [...prev, ...files])
                          if (fileInputRef.current) fileInputRef.current.value = ""
                        }}
                      />
                    </div>
                    {imageFiles.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {imageFiles.map((f, i) => (
                          <div key={`${f.name}-${f.size}-${i}`} className="group relative overflow-hidden rounded-xl border border-border bg-card">
                            <img
                              src={URL.createObjectURL(f)}
                              alt={f.name}
                              className="aspect-square w-full object-cover"
                            />
                            {i === 0 && (
                              <span className="absolute left-2 top-2 rounded-full bg-orange-500 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">Cover</span>
                            )}
                            <button
                              type="button"
                              onClick={() => setImageFiles((prev) => prev.filter((_, j) => j !== i))}
                              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                            <p className="truncate px-2 py-1.5 text-[11px] text-muted-foreground">{f.name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="font-mono text-[10px] text-muted-foreground/50">First image will be the cover photo. You can also paste (Ctrl+V) images.</p>
                  </div>
                </div>
                {formError && <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3"><p className="text-sm text-destructive">{formError}</p></div>}
                {formSuccess && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3"><p className="text-sm text-emerald-500">{editingId ? "Property updated!" : "Property added!"}</p></div>}
                <button type="submit" disabled={formLoading} className="flex items-center gap-2 rounded-xl bg-orange-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600 disabled:opacity-50">
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
