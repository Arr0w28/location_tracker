<div align="center">

# 🌍 3D Travel Diary

**A private, interactive 3D globe that maps your life's journey — powered by your Snapchat location history.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

## ✨ What is this?

**3D Travel Diary** is a personal, private web application that transforms your Snapchat location history into a stunning interactive 3D globe. Every place you've ever been becomes a pin on the globe, connected by animated flight paths, enriched with personal diary entries and photo memories.

> Built for two — your travel data, beautifully visualised.

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| 🌐 **Interactive 3D Globe** | Powered by `react-globe.gl` with atmospheric rendering and night-sky backdrop |
| ✈️ **Animated Flight Paths** | Smooth arc animations trace your journeys between locations |
| 🛩️ **3D Airplane** | A custom Three.js airplane model flies along your real flight trajectories |
| 📸 **Polaroid Hover Cards** | Hover over any pin to see a floating Polaroid with your photos and date |
| 📖 **Diary Panel** | Slide-out side panel to write journal entries, add custom titles, and upload photos |
| ⏱️ **Timeline Scrubber** | Bottom scrubber lets you replay your travel history chronologically |
| 🔒 **Private Auth** | Secure email/password login via Supabase — no public sign-up |
| 📂 **Snapchat Import** | Upload `snap_map_places_history.html` directly — no manual data entry |
| 🗺️ **Free Geocoding** | Uses OpenStreetMap Nominatim API — no API key required |

---

## 🛠️ Tech Stack

- **Framework** — [Next.js 14](https://nextjs.org/) (App Router, TypeScript)
- **Globe Engine** — [react-globe.gl](https://github.com/vasturiano/react-globe.gl) + [Three.js](https://threejs.org/)
- **Backend** — [Supabase](https://supabase.com/) (Auth, PostgreSQL, Storage)
- **Styling** — [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Animations** — [Framer Motion](https://www.framer.com/motion/)
- **Geocoding** — [OpenStreetMap Nominatim](https://nominatim.org/) (free, no key needed)

---

## ⚙️ Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/Arr0w28/location_tracker.git
cd location_tracker
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Set Up Supabase

Run the following in your Supabase **SQL Editor**:

```sql
-- Create locations table
create table public.locations (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  latitude      double precision not null,
  longitude     double precision not null,
  timestamp     timestamptz not null,
  place_name    text not null,
  place_location text,
  title         text,
  blog_content  text,
  image_urls    text[] default '{}',
  created_at    timestamptz default now() not null,
  constraint unique_user_timestamp unique (user_id, timestamp)
);

-- Enable Row Level Security
alter table public.locations enable row level security;

create policy "Users can view their own locations"   on public.locations for select using (auth.uid() = user_id);
create policy "Users can insert their own locations" on public.locations for insert with check (auth.uid() = user_id);
create policy "Users can update their own locations" on public.locations for update using (auth.uid() = user_id);
create policy "Users can delete their own locations" on public.locations for delete using (auth.uid() = user_id);
```

Then in **Storage**, create a public bucket named **`travel-photos`**.

### 4. Create User Accounts

Go to **Authentication → Users → Add user** in your Supabase dashboard to create login accounts.

### 5. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in, and upload your Snapchat history file.

---

## 📂 How to Export Your Snapchat Data

1. Open Snapchat → **Profile → Settings → My Data**
2. Submit a data export request
3. Wait for the email from Snapchat (usually a few hours)
4. Download and extract the zip
5. Find `snap_map_places_history.html` inside
6. Upload it via the **Import Dashboard** in the app

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── api/locations/     # REST API for location data
│   ├── dashboard/         # File upload & processing UI
│   ├── login/             # Auth page
│   └── map/               # Main 3D globe view
├── components/
│   ├── globe/GlobeView    # Core 3D globe component
│   ├── panels/DetailsPanel # Slide-out diary editor
│   └── ui/                # Shared UI components
├── hooks/
│   └── useLocations       # Data fetching hook
└── lib/
    ├── geocoding/          # Nominatim geocoder (rate-limited)
    ├── parsers/            # Snapchat HTML parser
    └── supabase/           # Client & server Supabase helpers
```

---

## 🔒 Privacy

This app is designed to be **100% private**:
- No analytics, no tracking, no third-party data sharing
- All data lives in your own Supabase project
- `.env.local` and raw Snapchat export files are gitignored by default
- RLS policies ensure each user can only access their own rows

---

## 📄 License

Private project — not licensed for redistribution.
