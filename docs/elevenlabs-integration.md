# EstateX — ElevenLabs Voice Agent Integration

This document explains how the ElevenLabs Conversational AI voice agent is wired into the EstateX
project: what it does, the two kinds of tools it uses, every tool we currently expose, and how the
pieces fit together. It's meant as the single reference for anyone working on the voice feature.

---

## 1. What the voice agent is

EstateX embeds an ElevenLabs **Conversational AI** widget — a floating voice assistant that
visitors can talk to on the public pages (landing, listings, property detail). It acts as a
real-estate concierge: it searches live listings, explains pricing in euros, compares properties,
estimates mortgages, and guides visitors on how to inquire, save, or sign up.

The agent's "brain" (persona, rules, tool-routing) lives in the **System Prompt**, configured in
the ElevenLabs dashboard. Static facts ("how do I sign up?") come from the **Knowledge Base**
(`docs/voice-knowledge-base.md`). Live data and actions come from **tools** (described below).

```
Visitor speaks ──▶ ElevenLabs agent (cloud)
                      │
                      ├── System Prompt   → how to behave
                      ├── Knowledge Base  → static "how-to" facts (RAG)
                      ├── Webhook tools    → call our Next.js API for LIVE data
                      └── Client tools     → run JS in the visitor's browser (drive the UI)
```

---

## 2. Where it lives in the codebase

| File | Role |
| --- | --- |
| `components/voice-agent.tsx` | Renders the `<elevenlabs-convai>` widget; registers the **client tools**. |
| `app/layout.tsx` | Mounts `<VoiceAgent />` so it appears on every page. |
| `app/api/voice/*/route.ts` | The **webhook (server) tools** — public, read-only API endpoints. |
| `lib/voice-format.ts` | Shared formatting helpers (`eurSpoken`, `spokenSummary`) used by all webhook tools. |
| `docs/voice-knowledge-base.md` | The Knowledge Base document to upload to the agent. |

### Environment variables used
| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | The agent ID the widget loads. If missing, the widget doesn't render. |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon Supabase client used by the webhook tools (reads only public/active data). |
| `NEXT_PUBLIC_SITE_URL` | Base URL used to build clickable property links the agent hands back. |

### Where the widget shows / hides
In `components/voice-agent.tsx`, the widget is hidden on auth and dashboard routes:

```ts
const HIDDEN_PREFIXES = ["/dashboard", "/sign-in", "/sign-up", "/forgot-password"]
```

This keeps the public concierge on top-of-funnel pages and out of the logged-in/auth flows.

---

## 3. The two kinds of tools (core concept)

ElevenLabs tools come in two flavors. Knowing which is which is the key to the whole integration.

| | **Webhook (server) tool** | **Client tool** |
| --- | --- | --- |
| Runs on | ElevenLabs cloud → calls our Next.js API | The visitor's **browser** (our React app) |
| Has the user's login session? | ❌ No | ✅ Yes |
| Good for | fetching/looking up **data** | driving the **UI** + acting as the logged-in user |
| Needs a public URL? | ✅ Yes (ngrok in dev, Vercel in prod) | ❌ No |
| Where it's defined | `app/api/voice/*/route.ts` | `components/voice-agent.tsx` |

**Rule of thumb:** *Webhook = "go fetch facts." Client = "do something here in my browser, as me."*

> Important: client tools only work in a browser. If the agent is ever used over phone/WhatsApp,
> only webhook tools will run there.

---

## 4. Webhook (server) tools — live data

All of these are **public, read-only** Next.js route handlers under `app/api/voice/`. They use the
anon Supabase client and only read **active** listings (which RLS already exposes publicly), so no
secrets are involved. Each returns voice-friendly fields:

- `price_spoken` — how to *say* the price, e.g. `"350 million euros"` (millions format).
- `spoken_summary` — a full sentence the agent can read aloud, so the LLM doesn't have to assemble
  numbers itself (faster speech, fewer misreads).
- `url` — a clickable link to the property page.

These helpers come from `lib/voice-format.ts`:

```ts
eurSpoken(350_000_000)  // "350 million"
spokenSummary(property) // "DHA Phase 6 Villa: a House in DHA Phase 6, Lahore, for sale at
                        //  350 million euros, with 5 beds and 6 baths, 4,500 square feet."
```

### 4.1 `search_listings` — find listings
- **Route:** `GET /api/voice/listings`
- **Purpose:** The workhorse. Called whenever a visitor asks what's available, about prices, or
  about specific properties.
- **Query params (all optional):**
  | Param | Meaning | Example |
  | --- | --- | --- |
  | `q` | free-text keyword; matches title/description/location/type | `q=villa` |
  | `city` | partial city match | `city=Lahore` |
  | `category` | `buy` or `rent` | `category=rent` |
  | `type` | House / Apartment / Villa / … | `type=Apartment` |
  | `max_price` | euro ceiling | `max_price=20000000` |
  | `min_bedrooms` | minimum beds | `min_bedrooms=3` |
  | `limit` | how many to return (default 4, max 10) | `limit=5` |
- **Example:**
  ```
  GET /api/voice/listings?q=villa&city=Lahore&category=buy&min_bedrooms=4
  ```
  ```json
  {
    "count": 1,
    "listings": [{
      "title": "DHA Phase 6 Villa",
      "category": "buy",
      "type": "House",
      "city": "Lahore",
      "price_spoken": "350 million euros",
      "bedrooms": 5,
      "bathrooms": 6,
      "spoken_summary": "DHA Phase 6 Villa: a House in DHA Phase 6, Lahore, for sale ...",
      "url": "https://estatex.example/properties/<id>"
    }]
  }
  ```
- **Why `q` matters:** people say "villa" even when the listing's *type* is "House" but its *title*
  is "DHA Phase 6 Villa". `q` searches the text columns so descriptive words still match.

### 4.2 `get_property_details` — one property in depth
- **Route:** `GET /api/voice/property?id=<uuid>`
- **Purpose:** Full detail on a single property when the visitor wants more — all fields, photos,
  and the listing agent's contact (name/phone).
- **Returns:** `found`, full fields, `price_spoken`, `agent`, `photos`, `spoken_summary`, `url`,
  `next_step`.

### 4.3 `market_overview` — high-level stats
- **Route:** `GET /api/voice/stats` (no params)
- **Purpose:** Answers "how many properties", "cheapest", "average price", "most expensive".
- **Returns:** for-sale and for-rent price ranges (min/max/avg, spoken), city counts, and a
  `spoken_summary`.

### 4.4 `list_cities` — coverage
- **Route:** `GET /api/voice/cities` (no params)
- **Purpose:** "Which cities do you cover?"
- **Returns:** `cities` as `[{ city, count }]` plus a `spoken_summary`.

### 4.5 `compare_properties` — side-by-side
- **Route:** `GET /api/voice/compare?ids=<uuid>,<uuid>`
- **Purpose:** Compare 2–4 properties.
- **Query params:** `ids` — comma-separated list of 2 to 4 property ids (from `search_listings`).
- **Returns:** `items[]` (each with `price_spoken`, `spoken_summary`, `url`), `highlights`
  (cheapest / largest / most_bedrooms), and a `spoken_summary`.
- **Example:**
  ```
  GET /api/voice/compare?ids=<idA>,<idB>
  ```

### 4.6 `mortgage_estimate` — affordability
- **Route:** `GET /api/voice/mortgage?price=<n>&down_payment=<n>&annual_rate=<n>&years=<n>`
- **Purpose:** Estimate a monthly payment when a buyer asks about affordability.
- **Query params:** only `price` is required; defaults are 20% down and 20 years.
- **Returns:** `monthly_payment_spoken`, `spoken_summary`, and a `disclaimer` ("estimate only").
- **Example:**
  ```
  GET /api/voice/mortgage?price=20000000&down_payment=4000000&annual_rate=22&years=20
  ```

---

## 5. Client tools — drive the browser UI

These are JavaScript functions registered in `components/voice-agent.tsx`. ElevenLabs fires the
`elevenlabs-convai:call` event when a conversation starts; we attach our tools to its config then.
The function names **must exactly match** the client tools configured in the dashboard.

```tsx
el.addEventListener("elevenlabs-convai:call", (event) => {
  event.detail.config.clientTools = {
    open_property: ({ id }) => { /* router.push(`/properties/${id}`) */ },
    apply_filters: ({ category, type, city }) => { /* router.push(`/listings?...`) */ },
    save_property: async ({ id }) => { /* insert into saved_properties */ },
    unsave_property: async ({ id }) => { /* delete from saved_properties */ },
    list_my_saved: async () => { /* read the visitor's saved_properties */ },
    create_inquiry: async ({ id, inquiry_type, phone, message }) => { /* insert into inquiries */ },
  }
})
```

Client tools split into two groups: **navigation** tools (work for anyone) and **logged-in
(buyer)** tools (act as the signed-in user).

### 5.1 `open_property` — open a property page
- **Purpose:** "Show me that one" / "open it" → navigates the visitor's browser to
  `/properties/<id>`.
- **Param:** `id` (internal). If missing, the tool returns a message telling the model to search
  first rather than ask the visitor for an id.

### 5.2 `apply_filters` — browse filtered listings
- **Purpose:** "Show rentals in Karachi" → navigates to `/listings?category=rent&city=Karachi`.
- **Params:** `category`, `type`, `city` (all optional).
- **Note:** `app/listings/page.tsx` has a sync effect so the filters update even if the listings
  page is already open (soft navigation doesn't remount the component).

### Logged-in (buyer) tools

These act **as the signed-in user** — RLS uses the browser's Supabase session, so no service key
or spoofing is involved. Each calls `supabase.auth.getUser()` first: if the visitor isn't signed
in, it returns a friendly "please sign in" message instead of failing, which makes them safe to
expose on public pages. As with all property actions, `id` always comes from a prior
`search_listings` — the tools never ask the visitor for an id.

### 5.3 `save_property` — add to favorites
- **Purpose:** "Save this one" / "add it to my favorites" → inserts into `saved_properties`.
- **Param:** `id` (required). Re-saving is a safe no-op (UNIQUE(user_id, property_id)).

### 5.4 `unsave_property` — remove from favorites
- **Purpose:** "Remove the Lahore villa from my saved list" → deletes from `saved_properties`.
- **Param:** `id` (required).

### 5.5 `list_my_saved` — read back favorites
- **Purpose:** "What have I saved?" → reads the visitor's `saved_properties` joined to
  `properties`, returns names + prices (euros, in millions).
- **Params:** none.

### 5.6 `create_inquiry` — send an inquiry to the agent
- **Purpose:** the way a signed-in visitor proceeds on a property (there is no online purchase).
  "I want to buy this" / "book a viewing" → inserts into `inquiries`.
- **Params:** `id` (required), `inquiry_type` (`buy` | `rent` | `viewing`, defaults to `buy`),
  `phone` (optional), `message` (optional).
- **Note:** looks up the listing's `agent_id` first so the inquiry is attached to the right agent.

---

## 6. Critical rule: property ids are internal

Visitors describe properties in words ("the Lahore villa", "the first one") — they can't know
database ids. So:

1. The agent **never** says "id" to the visitor or asks for one.
2. To open / detail / compare a property, the agent **first calls `search_listings`** with the
   visitor's words as `q`, takes the matching result's id, then calls the next tool silently.
3. To compare two properties, it searches for each, then calls `compare_properties` with both ids.

This is enforced in the System Prompt (see `docs/` and the dashboard) and supported in code: the
`q` keyword search exists precisely so descriptive words resolve to ids.

---

## 7. How a real conversation flows (example)

> **Visitor:** "Do you have any villas in Lahore under 4 million euros?"
>
> **Agent:** "Let me check our current listings…" *(bridge line)*
> → calls `search_listings?q=villa&city=Lahore&category=buy`
> → "Yes — the DHA Phase 6 Villa in Lahore, 350 million euros, 5 beds and 6 baths. Want me to open
> it?"
>
> **Visitor:** "Yeah, show me."
> → calls `open_property` with the id from the search → browser navigates to the property page.
>
> **Visitor:** "How much per month if I financed it?"
> → "One moment…" → calls `mortgage_estimate?price=350000000` → reads the estimate + disclaimer.
>
> **Visitor:** "How do I actually buy it?"
> → answers from the **Knowledge Base**: sign up free, send a Buy inquiry on the property page (or
> call the agent) — the sale is arranged offline; there's no online purchase.

---

## 8. Dashboard configuration checklist

The code is only half the picture — these must be set in the ElevenLabs dashboard:

- [ ] **System Prompt** — persona, tool-routing, the "ids are internal" rule, "no online purchase".
- [ ] **Knowledge Base** — upload `docs/voice-knowledge-base.md`.
- [ ] **Webhook tools registered** with exact names and **publicly reachable** URLs
      (`search_listings`, `get_property_details`, `market_overview`, `list_cities`,
      `compare_properties`, `mortgage_estimate`), each with its query-param descriptions.
- [ ] **Client tools registered** with exact names: `open_property`, `apply_filters`, and the
      logged-in buyer tools `save_property`, `unsave_property`, `list_my_saved`, `create_inquiry`.
- [ ] **First message** — greeting + a couple of conversation starters.

> A tool named in the prompt but **not registered** in the dashboard will be *talked about* but
> never actually called.

---

## 9. Development vs production notes

- **Local dev runs on `localhost:3000`** (`next dev`). ElevenLabs (cloud) can't reach `localhost`,
  so webhook tools need a public tunnel (**ngrok**) or a deployment (**Vercel**).
- When using ngrok, **four things must point at the same host** and all change when ngrok restarts:
  1. the webhook tool URLs (in the dashboard),
  2. `NEXT_PUBLIC_SITE_URL` (for clickable links),
  3. the Markdown-links allowlist (needs a dotted domain — `localhost` is rejected),
  4. `allowedDevOrigins` in `next.config.mjs` (so the dev server serves `/_next/*` assets through
     the tunnel — otherwise client JS, incl. Supabase fetches, never runs).
- **Vercel is recommended** for stability: a fixed domain removes the ngrok-sync churn entirely.

---

## 10. Security notes

- The webhook routes use the **anon** Supabase client and only read **active** listings, which RLS
  already exposes publicly. No secrets are returned. They are currently **unauthenticated public
  endpoints** (fine for public data; add a shared-secret header if you want to lock them to
  ElevenLabs).
- **Logged-in actions** (save a property, send an inquiry) are intentionally **not** webhook tools:
  a webhook runs in the cloud with no user session, so it can't act as the signed-in user securely.
  Those belong as **client tools** (browser session) or require forwarding the user's token to a
  secured endpoint. See the client-tool vs webhook discussion above.

---

## 11. Summary table — all current tools

| Tool | Kind | Endpoint / location | Purpose |
| --- | --- | --- | --- |
| `search_listings` | Webhook | `GET /api/voice/listings` | Find/filter live listings |
| `get_property_details` | Webhook | `GET /api/voice/property` | Full detail on one property |
| `market_overview` | Webhook | `GET /api/voice/stats` | Counts, ranges, averages |
| `list_cities` | Webhook | `GET /api/voice/cities` | Cities covered |
| `compare_properties` | Webhook | `GET /api/voice/compare` | Compare 2–4 properties |
| `mortgage_estimate` | Webhook | `GET /api/voice/mortgage` | Monthly payment estimate |
| `open_property` | Client | `components/voice-agent.tsx` | Navigate to a property page |
| `apply_filters` | Client | `components/voice-agent.tsx` | Browse filtered listings |
| `save_property` | Client (logged-in) | `components/voice-agent.tsx` | Add a property to favorites |
| `unsave_property` | Client (logged-in) | `components/voice-agent.tsx` | Remove a property from favorites |
| `list_my_saved` | Client (logged-in) | `components/voice-agent.tsx` | Read back the visitor's saved properties |
| `create_inquiry` | Client (logged-in) | `components/voice-agent.tsx` | Send a Buy/Rent/Viewing inquiry to the agent |
