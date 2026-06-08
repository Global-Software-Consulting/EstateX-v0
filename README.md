# EstateX

A premium real estate listing platform for browsing, buying, and renting curated properties across the most desirable cities. Built with a cinematic dark UI, animated interactions, and Supabase-powered authentication.

---

## Tech Stack

| Layer          | Technology                                      |
|----------------|--------------------------------------------------|
| Framework      | Next.js 14 (App Router)                          |
| Language       | TypeScript                                       |
| Styling        | Tailwind CSS, OKLCH dark theme                   |
| UI Components  | shadcn/ui (Radix UI primitives)                  |
| Auth & Backend | Supabase (Auth, PostgreSQL)                      |
| 3D Graphics    | Three.js, React Three Fiber                      |
| Charts         | Recharts                                         |
| Forms          | React Hook Form, Zod                             |
| Icons          | Lucide React                                     |

---

## Pages & Routes

| Route          | Page              | Description                                      |
|----------------|-------------------|--------------------------------------------------|
| `/`            | Landing           | Hero with Ken Burns animation, property search, listings, city grid, CTA, footer |
| `/sign-up`     | Sign Up           | Split-screen registration with full name, email, password (Supabase Auth) |
| `/sign-in`     | Sign In           | Split-screen login with email and password        |
| `/dashboard`   | Dashboard         | Auth-protected hub with user info, quick actions, account details |

---

## Features

- Cinematic split-screen hero with Ken Burns zoom effect
- Buy / Rent toggle with property type filtering
- City-based property browsing with listing counts
- Animated statistics and scroll-triggered counters
- Supabase authentication (sign up, sign in, sign out)
- Auth-aware navigation (shows Dashboard when logged in, Sign In/Up when logged out)
- Protected dashboard with session guard and redirect
- Responsive design with mobile hamburger menu
- Dark theme using OKLCH color space
- 57 pre-built shadcn/ui components
- 3D scene rendering via React Three Fiber
- Data visualization with Recharts

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

## Supabase Schema

Run the following SQL in the Supabase SQL Editor to set up the database tables.

### `profiles`

Stores user profile information, linked to Supabase Auth.

```sql
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  avatar_url    TEXT,
  phone         TEXT,
  bio           TEXT,
  role          TEXT DEFAULT 'user' CHECK (role IN ('user', 'agent', 'admin')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### `properties`

Stores property listings.

```sql
CREATE TABLE properties (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  city          TEXT NOT NULL,
  state         TEXT NOT NULL,
  address       TEXT,
  price         NUMERIC NOT NULL,
  price_unit    TEXT CHECK (price_unit IN ('month', NULL)),
  beds          INT NOT NULL,
  baths         INT NOT NULL,
  sqft          INT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('House', 'Apartment', 'Villa', 'Townhouse', 'Loft', 'Cabin')),
  listing       TEXT NOT NULL CHECK (listing IN ('buy', 'rent')),
  status        TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'rented', 'draft')),
  featured      BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active properties"
  ON properties FOR SELECT
  USING (status = 'active');

CREATE POLICY "Owners can manage their own properties"
  ON properties FOR ALL
  USING (auth.uid() = owner_id);
```

### `property_images`

Stores multiple images per property.

```sql
CREATE TABLE property_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID REFERENCES properties(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  alt           TEXT,
  position      INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view property images"
  ON property_images FOR SELECT
  USING (true);

CREATE POLICY "Property owners can manage images"
  ON property_images FOR ALL
  USING (
    auth.uid() = (SELECT owner_id FROM properties WHERE id = property_id)
  );
```

---

## Project Structure

```
app/
  page.tsx                  # Landing page
  sign-up/page.tsx          # Registration
  sign-in/page.tsx          # Login
  dashboard/page.tsx        # Protected dashboard
  layout.tsx                # Root layout (fonts, metadata)
  globals.css               # Theme variables, animations
components/
  estate/                   # Landing page sections (nav, hero, stats, listings, cities, CTA, footer)
  landing/                  # Alternative landing components
  ui/                       # shadcn/ui component library (57 components)
hooks/                      # Custom hooks (useCountUp, useMobile, useToast)
lib/
  supabase.ts               # Supabase client
  properties-data.ts        # Mock property & city data
  utils.ts                  # Utility functions (cn)
public/
  properties/               # Property listing images
  cities/                   # City images
  images/                   # Feature & marketing images
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
