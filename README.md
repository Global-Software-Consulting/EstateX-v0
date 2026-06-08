# EstateX

A premium real estate listing platform for browsing, buying, and renting curated properties across Pakistan. Built with a cinematic dark UI, animated interactions, Supabase-powered authentication, and real-time data from PostgreSQL.

---

## Tech Stack

| Layer          | Technology                                      |
|----------------|--------------------------------------------------|
| Framework      | Next.js 14 (App Router)                          |
| Language       | TypeScript                                       |
| Styling        | Tailwind CSS, OKLCH dark theme                   |
| UI Components  | shadcn/ui (Radix UI primitives)                  |
| Auth & Backend | Supabase (Auth, PostgreSQL, Storage)             |
| 3D Graphics    | Three.js, React Three Fiber                      |
| Charts         | Recharts                                         |
| Forms          | React Hook Form, Zod                             |
| Icons          | Lucide React                                     |

---

## Pages & Routes

| Route              | Page            | Description                                                                 |
|--------------------|-----------------|-----------------------------------------------------------------------------|
| `/`                | Landing         | Hero with Ken Burns animation, featured listings from Supabase, city grid, CTA |
| `/sign-up`         | Sign Up         | Split-screen registration (full_name, email, password)                      |
| `/sign-in`         | Sign In         | Split-screen login with email and password                                  |
| `/dashboard`       | Dashboard       | Sidebar layout — Overview (stats + property table), My Listings, Add Property |
| `/listings`        | All Listings    | All active properties with filter bar (type, category, city search)         |
| `/properties/[id]` | Property Detail | Image gallery, specs, description, agent contact card                       |

---

## Features

- Cinematic split-screen hero with Ken Burns zoom effect
- Featured listings fetched from Supabase (is_featured = true)
- All listings page with client-side filtering by type, category, and city
- Property detail page with image gallery, specs, and agent contact card
- Agent dashboard with sidebar navigation
  - Overview tab: stat cards + property table with thumbnails
  - My Listings tab: full property management table
  - Add Property tab: form to insert new listings
  - Delete properties directly from the table
- Supabase authentication (sign up with full_name metadata, sign in, sign out)
- Auth-aware navigation (Dashboard button when logged in, Sign In/Up when logged out)
- Protected dashboard with session guard and redirect
- Property images served via Supabase Storage public URLs
- Responsive design with mobile hamburger menu
- Dark theme using OKLCH color space
- PKR currency formatting
- 57 pre-built shadcn/ui components
- 3D scene rendering via React Three Fiber

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

You can find these values in your Supabase dashboard under **Settings > API**.

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

### Linting

```bash
pnpm lint
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

CREATE POLICY "Users can view any profile"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
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

CREATE POLICY "Anyone can view active properties"
  ON properties FOR SELECT USING (status = 'active');

CREATE POLICY "Agents can manage their own properties"
  ON properties FOR ALL USING (auth.uid() = agent_id);
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

CREATE POLICY "Anyone can view property images"
  ON property_images FOR SELECT USING (true);

CREATE POLICY "Agents can manage their property images"
  ON property_images FOR ALL USING (
    auth.uid() = (SELECT agent_id FROM properties WHERE id = property_id)
  );
```

---

## Project Structure

```
app/
  page.tsx                    # Landing page
  sign-up/page.tsx            # Registration
  sign-in/page.tsx            # Login
  dashboard/page.tsx          # Agent dashboard (sidebar + tabs)
  listings/page.tsx           # All properties with filters
  properties/[id]/page.tsx    # Property detail page
  layout.tsx                  # Root layout (fonts, metadata)
  globals.css                 # Theme variables, animations
components/
  estate/                     # Landing page sections (nav, hero, stats, listings, cities, CTA, footer)
  landing/                    # Alternative landing components
  ui/                         # shadcn/ui component library (57 components)
hooks/                        # Custom hooks (useCountUp, useMobile, useToast)
lib/
  supabase.ts                 # Single Supabase client instance
  utils.ts                    # Utility functions (cn)
types/
  database.ts                 # TypeScript interfaces (Profile, Property, PropertyImage)
public/
  properties/                 # Static property images
  cities/                     # City images
  images/                     # Feature & marketing images
```

---

## Screenshots

<!-- Add screenshots here -->

| Landing Page | Sign Up | Dashboard |
|:---:|:---:|:---:|
| ![Landing](screenshots/landing.png) | ![Sign Up](screenshots/sign-up.png) | ![Dashboard](screenshots/dashboard.png) |

---

## License

This project is licensed under the [MIT License](LICENSE).

```
MIT License

Copyright (c) 2024 EstateX

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
