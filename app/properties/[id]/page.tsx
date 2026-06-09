"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Bed, Bath, Maximize, ArrowLeft, Phone, Mail, ChevronLeft, ChevronRight, Loader2, Home, Heart, X, Send, Pencil } from "lucide-react"
import { EstateNav } from "@/components/estate/estate-nav"
import { EstateFooter } from "@/components/estate/estate-footer"
import { supabase } from "@/lib/supabase"
import { getImageUrl } from "@/lib/image-url"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ImageItem = { id: string; storage_path: string; is_cover: boolean; url: string }
type PropertyDetail = {
  id: string; title: string; description: string | null; city: string; location: string | null
  price: number; bedrooms: number; bathrooms: number; area_sqft: number; type: string
  category: string; status: string; agent_id: string; images: ImageItem[]
  agent: { full_name: string | null; phone: string | null } | null
}

function formatPrice(price: number) { return `PKR ${price.toLocaleString()}` }

export default function PropertyPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [property, setProperty] = useState<PropertyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeImage, setActiveImage] = useState(0)

  // Auth
  const [userId, setUserId] = useState<string | null>(null)

  // Save
  const [saved, setSaved] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // Inquiry form
  const [showInquiry, setShowInquiry] = useState(false)
  const [inquiryType, setInquiryType] = useState<"buy" | "rent" | "viewing">("viewing")
  const [inquiryMessage, setInquiryMessage] = useState("")
  const [inquiryPhone, setInquiryPhone] = useState("")
  const [inquiryLoading, setInquiryLoading] = useState(false)
  const [inquiryError, setInquiryError] = useState("")
  const [inquirySent, setInquirySent] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  useEffect(() => {
    async function fetchProperty() {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          id, title, description, city, location, price, agent_id,
          bedrooms, bathrooms, area_sqft, type, category, status,
          property_images ( id, storage_path, is_cover, created_at ),
          profiles:agent_id ( full_name, phone )
        `)
        .eq("id", id)
        .single()

      if (error) { setError(error.message); setLoading(false); return }

      const rawImages = ((data as any).property_images || []).sort(
        (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      const images: ImageItem[] = rawImages.map((img: any) => ({
        id: img.id, storage_path: img.storage_path, is_cover: img.is_cover,
        url: getImageUrl(img.storage_path) || "",
      }))

      setProperty({
        id: data.id, title: data.title, description: data.description,
        city: data.city, location: data.location, price: data.price,
        bedrooms: data.bedrooms, bathrooms: data.bathrooms, area_sqft: data.area_sqft,
        type: data.type, category: data.category, status: data.status,
        agent_id: data.agent_id, images, agent: (data as any).profiles || null,
      })
      setInquiryType(data.category === "rent" ? "rent" : "buy")
      setLoading(false)
    }
    if (id) fetchProperty()
  }, [id])

  // Check if saved
  useEffect(() => {
    if (!userId || !id) return
    supabase.from("saved_properties").select("id").eq("user_id", userId).eq("property_id", id).maybeSingle()
      .then(({ data }) => { if (data) setSaved(true) })
  }, [userId, id])

  async function toggleSave() {
    if (!userId) { router.push("/sign-in"); return }
    setSaveLoading(true)
    if (saved) {
      await supabase.from("saved_properties").delete().eq("user_id", userId).eq("property_id", id)
      setSaved(false)
    } else {
      await supabase.from("saved_properties").insert({ user_id: userId, property_id: id })
      setSaved(true)
    }
    setSaveLoading(false)
  }

  async function handleInquiry(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) { router.push("/sign-in"); return }
    if (!property) return
    setInquiryError("")
    setInquiryLoading(true)

    const { error } = await supabase.from("inquiries").insert({
      property_id: property.id,
      user_id: userId,
      agent_id: property.agent_id,
      inquiry_type: inquiryType,
      message: inquiryMessage || null,
      phone: inquiryPhone || null,
    })

    if (error) { setInquiryError(error.message); setInquiryLoading(false); return }
    setInquirySent(true)
    setInquiryLoading(false)
  }

  function prevImage() { if (!property) return; setActiveImage((i) => (i === 0 ? property.images.length - 1 : i - 1)) }
  function nextImage() { if (!property) return; setActiveImage((i) => (i === property.images.length - 1 ? 0 : i + 1)) }

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <EstateNav />
      <div className="mx-auto max-w-7xl px-5 pb-20 pt-24 md:px-8 md:pb-28 md:pt-28">
        <Link href="/listings" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to listings
        </Link>

        {loading ? (
          <div className="mt-20 flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="mt-8 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3"><p className="text-sm text-destructive">{error}</p></div>
        ) : property ? (
          <>
            {/* Image gallery */}
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-sm border border-border bg-card md:aspect-[2.4/1]">
              {property.images.length > 0 ? (
                <>
                  <img src={property.images[activeImage].url} alt={property.title} className="h-full w-full object-cover" />
                  {property.images.length > 1 && (
                    <>
                      <button onClick={prevImage} className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/70 backdrop-blur-sm transition-colors hover:bg-background"><ChevronLeft className="h-5 w-5" /></button>
                      <button onClick={nextImage} className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/70 backdrop-blur-sm transition-colors hover:bg-background"><ChevronRight className="h-5 w-5" /></button>
                      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                        {property.images.map((_, i) => (
                          <button key={i} onClick={() => setActiveImage(i)} className={`h-1.5 rounded-full transition-all ${i === activeImage ? "w-6 bg-foreground" : "w-1.5 bg-foreground/40"}`} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex h-full items-center justify-center"><Home className="h-12 w-12 text-muted-foreground/20" /></div>
              )}
              <span className="absolute left-4 top-4 rounded-sm bg-background/80 px-2.5 py-1 font-mono text-xs uppercase tracking-wider backdrop-blur-sm">{property.type}</span>
              <span className="absolute right-4 top-4 rounded-sm bg-foreground/90 px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-background">{property.category}</span>
              {/* Save button on image (only for other people's properties) */}
              {(!userId || userId !== property.agent_id) && (
                <button
                  onClick={toggleSave}
                  disabled={saveLoading}
                  className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/70 backdrop-blur-sm transition-colors hover:bg-background"
                >
                  <Heart className={`h-5 w-5 ${saved ? "fill-red-500 text-red-500" : "text-foreground"}`} />
                </button>
              )}
            </div>

            {/* Thumbnail strip */}
            {property.images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {property.images.map((img, i) => (
                  <button key={img.id} onClick={() => setActiveImage(i)} className={`h-16 w-24 shrink-0 overflow-hidden rounded-sm border transition-all ${i === activeImage ? "border-foreground" : "border-border opacity-50 hover:opacity-80"}`}>
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Content grid */}
            <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <span className="font-mono text-2xl tracking-tight sm:text-3xl md:text-4xl">{formatPrice(property.price)}</span>
                <h1 className="mt-3 font-display text-3xl leading-[0.95] sm:text-4xl md:text-5xl">{property.title}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{property.location ? `${property.location}, ` : ""}{property.city}</p>

                <div className="mt-6 flex flex-wrap items-center gap-4 border-y border-border py-5 font-mono text-sm text-muted-foreground sm:gap-6">
                  <span className="flex items-center gap-2"><Bed className="h-4 w-4" />{property.bedrooms} Beds</span>
                  <span className="flex items-center gap-2"><Bath className="h-4 w-4" />{property.bathrooms} Baths</span>
                  <span className="flex items-center gap-2"><Maximize className="h-4 w-4" />{property.area_sqft.toLocaleString()} sqft</span>
                </div>

                {property.description && (
                  <div className="mt-8">
                    <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Description</h2>
                    <p className="mt-4 leading-relaxed text-muted-foreground">{property.description}</p>
                  </div>
                )}
              </div>

              {/* Right: agent card + inquiry */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-24 space-y-4">
                  {/* Agent card */}
                  <div className="rounded-sm border border-border bg-card p-6">
                    <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Listed by</h3>
                    {property.agent ? (
                      <div className="mt-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary font-mono text-lg uppercase text-foreground">{(property.agent.full_name || "A").charAt(0)}</div>
                          <div>
                            <p className="font-medium">{property.agent.full_name || "Agent"}</p>
                            {property.agent.phone && <p className="text-xs text-muted-foreground">{property.agent.phone}</p>}
                          </div>
                        </div>
                        <div className="mt-6 space-y-2">
                          {userId === property.agent_id ? (
                            <Link
                              href="/dashboard"
                              className="flex w-full items-center justify-center gap-2 rounded-sm bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
                            >
                              <Pencil className="h-4 w-4" /> Manage in Dashboard
                            </Link>
                          ) : (
                            <>
                              {property.agent.phone && (
                                <a href={`tel:${property.agent.phone}`} className="flex w-full items-center justify-center gap-2 rounded-sm bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90">
                                  <Phone className="h-4 w-4" /> Call Agent
                                </a>
                              )}
                              <button
                                onClick={() => { if (!userId) { router.push("/sign-in"); return } setShowInquiry(!showInquiry) }}
                                className="flex w-full items-center justify-center gap-2 rounded-sm border border-border px-5 py-3 text-sm transition-colors hover:bg-secondary"
                              >
                                <Mail className="h-4 w-4" /> Send Inquiry
                              </button>
                              <button
                                onClick={toggleSave}
                                disabled={saveLoading}
                                className="flex w-full items-center justify-center gap-2 rounded-sm border border-border px-5 py-3 text-sm transition-colors hover:bg-secondary"
                              >
                                <Heart className={`h-4 w-4 ${saved ? "fill-red-500 text-red-500" : ""}`} />
                                {saved ? "Saved" : "Save Property"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-muted-foreground">Agent information unavailable.</p>
                    )}
                  </div>

                  {/* Inquiry form (only for other people's properties) */}
                  {showInquiry && userId !== property.agent_id && (
                    <div className="rounded-sm border border-border bg-card p-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Send Inquiry</h3>
                        <button onClick={() => setShowInquiry(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                      </div>

                      {inquirySent ? (
                        <div className="mt-4 rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                          <p className="text-sm text-emerald-400">Inquiry sent! The agent will contact you soon.</p>
                        </div>
                      ) : (
                        <form onSubmit={handleInquiry} className="mt-4 space-y-4">
                          <div className="space-y-2">
                            <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">I want to</Label>
                            <div className="flex rounded-sm border border-border bg-background p-1">
                              {(["buy", "rent", "viewing"] as const).map((t) => (
                                <button key={t} type="button" onClick={() => setInquiryType(t)}
                                  className={`flex-1 rounded-[2px] px-3 py-2 text-xs capitalize transition-colors ${inquiryType === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                                >{t === "viewing" ? "Book Viewing" : t}</button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="inq-phone" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Your Phone</Label>
                            <Input id="inq-phone" type="tel" value={inquiryPhone} onChange={(e) => setInquiryPhone(e.target.value)} placeholder="03XX-XXXXXXX" className="h-10 rounded-sm border-border bg-background text-sm placeholder:text-muted-foreground/50 focus-visible:border-foreground focus-visible:ring-foreground/20" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="inq-msg" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Message</Label>
                            <textarea id="inq-msg" value={inquiryMessage} onChange={(e) => setInquiryMessage(e.target.value)} placeholder="I'm interested in this property..." rows={3}
                              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus-visible:border-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/20" />
                          </div>
                          {inquiryError && <p className="text-sm text-destructive">{inquiryError}</p>}
                          <button type="submit" disabled={inquiryLoading}
                            className="flex w-full items-center justify-center gap-2 rounded-sm bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50">
                            {inquiryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            {inquiryLoading ? "Sending..." : "Send Inquiry"}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
      <EstateFooter />
    </main>
  )
}
