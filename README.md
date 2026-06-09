# EstateX

A premium real estate listing platform for browsing, buying, and renting curated properties across Pakistan. Built with a cinematic dark UI, animated interactions, Supabase-powered authentication, and real-time data from PostgreSQL.

---

## Tech Stack

| Layer          | Technology                                      |
|----------------|--------------------------------------------------|
| Framework      | Next.js 16 (App Router)                          |
| Language       | TypeScript                                       |
| Styling        | Tailwind CSS 4, OKLCH dark theme                 |
| UI Components  | shadcn/ui, 21st.dev Magic components             |
| Animations     | Motion (Framer Motion), Swiper.js, CSS keyframes |
| Auth & Backend | Supabase (Auth, PostgreSQL, Storage)             |
| 3D Graphics    | Three.js, React Three Fiber                      |
| Charts         | Recharts                                         |
| Forms          | React Hook Form, Zod                             |
| Icons          | Lucide React                                     |

---

## Pages & Routes

| Route              | Page             | Description                                                                 |
|--------------------|------------------|-----------------------------------------------------------------------------|
| `/`                | Landing          | Full-bleed hero, featured listings with hover reveal, city carousel, CTA    |
| `/sign-up`         | Sign Up          | Split-screen registration with password visibility toggle                   |
| `/sign-in`         | Sign In          | Split-screen login with forgot password link                                |
| `/forgot-password` | Forgot Password  | Password reset via Supabase email                                           |
| `/dashboard`       | Dashboard        | Sidebar layout with Overview, My Listings, Add/Edit Property, Inquiries, Saved, Settings |
| `/listings`        | All Listings     | All active properties with filter bar (type, category, city) + URL params   |
| `/properties/[id]` | Property Detail  | Image gallery, specs, description, inquiry form, save, agent contact card   |

---

## Features

### Property Browsing
- Full-bleed cinematic hero with Ken Burns zoom animation
- Featured listings with hover data reveal (price, specs, CTA)
- Interactive city carousel with hover-to-expand cards (Motion/Framer)
- All listings page with client-side filtering by type, category, and city
- Hero search bar navigates to filtered listings
- Property detail page with image gallery, thumbnail strip, and specs

### Buy / Rent / Inquiry System
- Buyers can send inquiries (buy, rent, or book viewing) from property detail page
- Inquiry form with type selector, phone, and message
- Agents see incoming inquiries in dashboard with status management (New/Contacted/Closed)
- Buyers track their sent inquiries and status in "My Inquiries" tab
- Own property detection — no inquiry/save buttons on your own listings

### Save / Favorite
- Heart icon on property cards and detail page
- Saved properties tab in dashboard with full property cards
- Unsave with one click

### Agent Dashboard
- Overview: stat cards (listings, active, new inquiries, saved)
- My Listings: property table with thumbnail, city, price, status badge, edit/delete
- Add Property: full form with image upload to Supabase Storage
- Edit Property: pre-filled form with update support
- Inquiries: incoming buyer inquiries with status dropdown
- Settings: update profile (name, phone, role)

### Authentication
- Sign up with full name metadata
- Sign in with password visibility toggle
- Forgot password with email reset link
- Auth-aware navigation (Dashboard vs Sign In/Up)
- Protected dashboard with session guard
- Redirects to home page after auth

### Design
- Dark theme using OKLCH color space
- Responsive across all screen sizes (320px to 4K)
- Mobile hamburger menu with full navigation
- Glassmorphism search bar and UI elements
- PKR currency formatting
- Animated statistics with scroll-triggered counters

---

## Local Setup

### Prerequisites

- **Node.js** >= 18
- **pnpm** (install via `npm install -g pnpm`)
- A [Supabase](https://supabase.com) project

### Installation

```bash
git clone <repo-url>
cd real-estate-platform
pnpm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Find these in your Supabase dashboard under **Settings > API**.

### Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
pnpm build
pnpm start
```

---

## Supabase Setup

### Storage

Create a **public** storage bucket named `property-images` in your Supabase dashboard (Storage > New Bucket).

### Database Schema

Run the following SQL in the Supabase SQL Editor.

#### `profiles`

```sql
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  phone         TEXT,
  role          TEXT DEFAULT 'user',
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

#### `properties`

```sql
CREATE TABLE properties (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC NOT NULL,
  type          TEXT NOT NULL,
  category      TEXT NOT NULL,
  bedrooms      INT NOT NULL,
  bathrooms     INT NOT NULL,
  area_sqft     NUMERIC NOT NULL,
  city          TEXT NOT NULL,
  location      TEXT,
  is_featured   BOOLEAN DEFAULT false,
  status        TEXT DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active properties" ON properties FOR SELECT USING (status = 'active');
CREATE POLICY "Agents can manage their own properties" ON properties FOR ALL USING (auth.uid() = agent_id);
```

#### `property_images`

```sql
CREATE TABLE property_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID REFERENCES properties(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,
  is_cover      BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view property images" ON property_images FOR SELECT USING (true);
CREATE POLICY "Agents can manage their property images" ON property_images FOR ALL USING (
  auth.uid() = (SELECT agent_id FROM properties WHERE id = property_id)
);
```

#### `inquiries`

```sql
CREATE TABLE inquiries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  agent_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  inquiry_type  TEXT NOT NULL CHECK (inquiry_type IN ('buy', 'rent', 'viewing')),
  message       TEXT,
  phone         TEXT,
  status        TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own inquiries" ON inquiries FOR SELECT USING (auth.uid() = user_id OR auth.uid() = agent_id);
CREATE POLICY "Authenticated users can create inquiries" ON inquiries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Agents can update inquiry status" ON inquiries FOR UPDATE USING (auth.uid() = agent_id);
```

#### `saved_properties`

```sql
CREATE TABLE saved_properties (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id   UUID REFERENCES properties(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, property_id)
);

ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their saved" ON saved_properties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save" ON saved_properties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave" ON saved_properties FOR DELETE USING (auth.uid() = user_id);
```

---

## Project Structure

```
app/
  page.tsx                    # Landing page
  sign-up/page.tsx            # Registration
  sign-in/page.tsx            # Login
  forgot-password/page.tsx    # Password reset
  dashboard/page.tsx          # Dashboard (sidebar + 7 tabs)
  listings/page.tsx           # All properties with filters
  properties/[id]/page.tsx    # Property detail + inquiry
  layout.tsx                  # Root layout (fonts, metadata)
  globals.css                 # Theme variables, animations
components/
  estate/                     # Landing sections (nav, hero, stats, listings, cities, CTA, footer)
  ui/                         # shadcn/ui + 21st.dev components (carousel, badge, card, etc.)
hooks/                        # Custom hooks (useCountUp, useMobile, useToast)
lib/
  supabase.ts                 # Single Supabase client instance
  image-url.ts                # Smart image URL resolver (storage vs external)
  utils.ts                    # Utility functions (cn)
types/
  database.ts                 # TypeScript interfaces (Profile, Property, PropertyImage, Inquiry, SavedProperty)
public/
  properties/                 # Static property images
  cities/                     # City images
```

---

## Screenshots

| Landing Page | Listings | Property Detail |
|:---:|:---:|:---:|
| ![Landing](screenshots/landing.png) | ![Listings](screenshots/listings.png) | ![Detail](screenshots/detail.png) |

| Dashboard | Sign In | Inquiries |
|:---:|:---:|:---:|
| ![Dashboard](screenshots/dashboard.png) | ![Sign In](screenshots/sign-in.png) | ![Inquiries](screenshots/inquiries.png) |

---

## License

This project is licensed under the [MIT License](LICENSE).
