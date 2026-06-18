"use client"

import Script from "next/script"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { eurSpoken } from "@/lib/voice-format"

/**
 * Routes where the public voice agent should NOT appear.
 * Keeps the assistant on top-of-funnel public pages (landing, listings,
 * property detail) and out of the auth flow and the logged-in dashboard.
 */
const HIDDEN_PREFIXES = ["/dashboard", "/sign-in", "/sign-up", "/forgot-password"]

// The ElevenLabs widget is a custom element; cast the tag so TSX accepts it.
const ConvaiWidget = "elevenlabs-convai" as unknown as React.FC<{ "agent-id": string }>

export function VoiceAgent() {
  const pathname = usePathname()
  const router = useRouter()
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
  const hidden = !agentId || HIDDEN_PREFIXES.some((prefix) => pathname?.startsWith(prefix))

  // Register CLIENT tools — these run in the browser so the agent can drive the
  // UI by voice. The function names here MUST match the client tools configured
  // in the ElevenLabs dashboard. ElevenLabs fires "elevenlabs-convai:call" when a
  // conversation starts; we attach our tools to its config then.
  useEffect(() => {
    if (hidden) return
    const el = document.querySelector("elevenlabs-convai")
    if (!el) return

    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail
      if (!detail?.config) return
      detail.config.clientTools = {
        // Navigate the visitor's browser to a property's detail page.
        // `id` comes from a prior search_listings / get_property_details result.
        open_property: ({ id }: { id?: string }) => {
          // `id` is internal — never surfaced to the visitor. If it's missing,
          // tell the model to resolve it by searching, NOT to ask the user for it.
          if (!id) {
            return "No property is selected yet. Call search_listings to find the property the visitor described, then call open_property with that property's id. Do not ask the visitor for an id."
          }
          router.push(`/properties/${id}`)
          return "Opened the property page for the visitor."
        },
        // Take the visitor to the listings page with filters applied.
        apply_filters: ({ category, type, city }: { category?: string; type?: string; city?: string }) => {
          const params = new URLSearchParams()
          if (category && category.toLowerCase() !== "all") params.set("category", category.toLowerCase())
          if (type && type.toLowerCase() !== "all") params.set("type", type)
          if (city) params.set("city", city)
          const qs = params.toString()
          router.push(`/listings${qs ? `?${qs}` : ""}`)
          return "Showing the filtered listings now."
        },

        // ---- Logged-in (buyer) tools ----
        // These run as the signed-in user (RLS uses their session). Each checks
        // auth first, so they're safe to expose on public pages: if the visitor
        // isn't signed in, they return a "please sign in" message instead of
        // failing. `id` always comes from a prior search — never ask the visitor.

        // Save the given property to the visitor's favorites.
        save_property: async ({ id }: { id?: string }) => {
          if (!id) {
            return "No property is selected yet. Call search_listings to find the property the visitor described, then call save_property with that property's id. Do not ask the visitor for an id."
          }
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            return "The visitor isn't signed in. Ask them to sign up or sign in — it's free — so they can save properties, then try again."
          }
          // UNIQUE(user_id, property_id) means re-saving is a no-op, not an error.
          const { error } = await supabase
            .from("saved_properties")
            .upsert({ user_id: user.id, property_id: id }, { onConflict: "user_id,property_id", ignoreDuplicates: true })
          if (error) return `Couldn't save the property: ${error.message}`
          return "Saved to the visitor's favorites. They can find it under Saved in their dashboard."
        },

        // Remove the given property from the visitor's favorites.
        unsave_property: async ({ id }: { id?: string }) => {
          if (!id) {
            return "No property is selected yet. Call search_listings first to resolve which property to remove, then call unsave_property with its id. Do not ask the visitor for an id."
          }
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            return "The visitor isn't signed in, so there's nothing saved to remove. Ask them to sign in."
          }
          const { error } = await supabase
            .from("saved_properties")
            .delete()
            .eq("user_id", user.id)
            .eq("property_id", id)
          if (error) return `Couldn't remove the property: ${error.message}`
          return "Removed from the visitor's favorites."
        },

        // Read back the visitor's saved properties.
        list_my_saved: async () => {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            return "The visitor isn't signed in. Ask them to sign in to see their saved properties."
          }
          const { data, error } = await supabase
            .from("saved_properties")
            .select("properties ( title, city, price )")
            .eq("user_id", user.id)
          if (error) return `Couldn't load saved properties: ${error.message}`
          // The joined `properties` may come back as an object or a single-element
          // array depending on the relationship inference; normalize either way.
          const rows = (data || [])
            .map((r: any) => (Array.isArray(r.properties) ? r.properties[0] : r.properties))
            .filter(Boolean) as { title: string; city: string; price: number }[]
          if (rows.length === 0) return "The visitor hasn't saved any properties yet."
          const list = rows.map((p) => `${p.title} in ${p.city}, ${eurSpoken(p.price)} euros`).join("; ")
          return `The visitor has ${rows.length} saved ${rows.length === 1 ? "property" : "properties"}: ${list}.`
        },

        // Send an inquiry (Buy, Rent, or Viewing) to the listing agent.
        create_inquiry: async ({ id, inquiry_type, phone, message }: { id?: string; inquiry_type?: string; phone?: string; message?: string }) => {
          if (!id) {
            return "No property is selected yet. Call search_listings to find the property the visitor described, then call create_inquiry with that property's id. Do not ask the visitor for an id."
          }
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            return "The visitor isn't signed in. Ask them to sign up or sign in — it's free — so they can send an inquiry, then try again."
          }
          const type = (inquiry_type || "").toLowerCase()
          const validType = type === "rent" || type === "viewing" ? type : "buy"
          // Inquiries are attached to the listing's agent, so look that up first.
          const { data: prop, error: propErr } = await supabase
            .from("properties")
            .select("agent_id")
            .eq("id", id)
            .single()
          if (propErr || !prop) return "Couldn't find that property to send an inquiry. Suggest searching again."
          const { error } = await supabase.from("inquiries").insert({
            property_id: id,
            user_id: user.id,
            agent_id: prop.agent_id,
            inquiry_type: validType,
            message: message || null,
            phone: phone || null,
          })
          if (error) return `Couldn't send the inquiry: ${error.message}`
          return `Sent a ${validType} inquiry to the listing agent. They'll contact the visitor soon.`
        },
      }
    }

    el.addEventListener("elevenlabs-convai:call", handler)
    return () => el.removeEventListener("elevenlabs-convai:call", handler)
  }, [hidden, router, pathname])

  // Render nothing until an agent is configured, or on protected/auth routes.
  if (hidden) return null

  return (
    <>
      <ConvaiWidget agent-id={agentId!} />
      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        async
        strategy="afterInteractive"
      />
    </>
  )
}
