# Waypost — Little notes. Long journeys.

> **Tagline:** “Little notes. Long journeys.”  
> Location-based social discovery web app built as a complete, fully functional local MVP using browser storage only.

---

## 🧭 About Waypost

Waypost is an earthy, human-centered discovery web application where travelers, wanderers, and locals leave short notes and thoughts embedded in physical locations.

### Key Concept: The 150-Metre Discovery Radius
- Wayposts have geographical coordinates.
- **Within 150 metres:** A note is **unlocked**. Travelers can read the full text, see attached photo galleries, view the author, and reflect on the message.
- **Outside 150 metres:** A note is **locked**. The app displays a discreet teaser and the exact distance remaining (e.g. *“320m away — 170m closer needed to unlock”*), encouraging travelers to take the walk and reach the location.
- **Expiry Lifespan:** Wayposts naturally vanish after their chosen lifespan (**24 hours**, **3 days**, or **7 days**), keeping trails fresh and serendipitous.

---

## 🎨 Visual Design & Palette

Waypost follows a quiet, natural editorial aesthetic designed for mobile-first exploration:

- **Background:** `#F4F0E5` (Warm Cream / Parchment)
- **Primary Brand:** `#18392D` (Deep Forest Green)
- **Accent & Borders:** `#C8D3C5` (Muted Sage)
- **Primary Text:** `#242923` (Charcoal Slate)
- **Secondary Text:** `#73776F` (Earthy Stone Gray)
- **Card Surfaces:** Warm white (`#FAF8F3` / `#FFFFFF`) with subtle tactile shadows and organic border radii.

---

## 🏗️ Architecture & Local Data Layer

The entire MVP runs **100% locally in the browser**. No external backend (Supabase, Firebase, or Express) is required.

All application logic is centralized behind service abstractions so the local repository can be replaced with a real database (e.g., Supabase) without rewriting UI components:

```
src/
├── types/
│   └── index.ts                 # Type definitions (WaypostNote, UserProfile, etc.)
├── lib/
│   ├── storage.ts               # LocalStorage manager with schema versioning & quota safety
│   ├── imageStorage.ts          # IndexedDB service for binary photo blobs
│   ├── database.ts              # Core repository for notes, bookmarks, likes, reports, & backup
│   ├── localAuth.ts             # Client-side password hashing (SHA-256) & local sessions
│   ├── location.ts              # Haversine formula & 150m proximity calculation
│   ├── demoData.ts              # Initial curated demo notes & seeded photo blobs
│   └── categoryMeta.ts          # Category colors, icons, and expiry countdowns
├── services/
│   ├── notesService.ts          # Notes CRUD, filtering, & distance unlocking logic
│   ├── bookmarksService.ts      # Bookmarking / travel journal persistence
│   ├── reactionsService.ts      # Like counter & toggle persistence
│   └── profileService.ts        # User profile & account statistics
├── context/
│   ├── AuthContext.tsx          # Local authentication & guest roaming state
│   ├── LocationContext.tsx      # GPS geolocation & simulated demo position switcher
│   └── NotesContext.tsx         # Reactive note queries, categories, & active modal state
├── components/
│   ├── Map/
│   │   └── WaypostMap.tsx       # Leaflet interactive map with custom pins & 150m radar circle
│   ├── Navigation/
│   │   └── Navbar.tsx           # Fixed mobile bottom bar & responsive desktop header
│   ├── Notes/
│   │   ├── NoteCard.tsx         # Locked/unlocked card preview with distance & actions
│   │   ├── NoteDetailModal.tsx  # Note reader, photo gallery, author info, & edit/delete
│   │   └── ReportModal.tsx      # Local moderation report dialog
│   └── Common/
│       ├── CategoryBar.tsx      # Category pill filter
│       ├── IndexedDbImage.tsx   # Blob loader with automatic memory cleanup
│       ├── DemoLocationModal.tsx# Location mode & demo preset switcher
│       └── DevSettingsModal.tsx # Storage inspector, JSON export/import, & demo reset
└── pages/
    ├── ExplorePage.tsx          # Map discovery, search, and nearby notes slide sheet
    ├── AddNotePage.tsx          # Note creation form with photo upload & map pin picker
    ├── SavedPage.tsx            # Bookmarked notes journal
    └── ProfilePage.tsx          # User profile, statistics, test account login & signup
```

---

## 💾 Storage Rules

1. **LocalStorage:**
   - Note metadata (titles, text, author, coordinates, timestamps, expiry, like counts).
   - User account records and current simulated session.
   - User bookmarks and likes.
   - Moderation reports.
   - Passwords are hashed using client-side SHA-256 via the Web Crypto API prior to storage.
2. **IndexedDB:**
   - Binary photo blobs are stored directly in the `waypost_media_db` object store.
   - Notes store references (`img_uuid`) instead of base64 strings to prevent LocalStorage quota exhaustion.
   - Memory is managed with temporary `URL.createObjectURL` and explicit revocation.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v22)
- npm 9+

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Open in your browser
http://localhost:5173/
```

### Production Build

```bash
npm run build
npm run preview
```

---

## 🗺️ Map Configuration

Waypost uses **Leaflet** with CartoDB Voyager and OpenStreetMap tile layers.

- **No API credentials are required** out of the box. The map loads and operates immediately.
- If you wish to configure a custom Mapbox or tile proxy in the future, set `VITE_MAP_TILE_URL` and `VITE_MAP_ATTRIBUTION` in a `.env` file.

---

## 🧪 Testing the 150-Metre Unlocking Flow

Because GPS positions are often stationary during local testing, Waypost includes a dedicated **Location & Simulation Mode**:

1. Click the **Demo Location** button (or badge) in the top header / map corner.
2. Select **"The Ramble, Central Park"** to be within 50m of the initial notes (they will appear **Unlocked** with full text and photos).
3. Switch to **"North Meadow (Farther Out)"** (~450m away). The notes will transition to the **Locked** state.
4. Click on any locked note. You can click **"Simulate Walking Within 150m to Unlock"** to immediately test the transition from locked to unlocked!
5. To test real GPS, click **"Use My Real Device GPS"** in the location modal. If permissions are granted, your device's actual latitude and longitude will be used.

---

## 🔌 Supabase setup (required for synced accounts and notes)

1. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env` (then restart Vite).
2. In the Supabase SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql). It creates the profile trigger, notes, reactions, bookmarks, storage bucket, and RLS policies.
3. In **Authentication → Providers → Email**, enable Email. For local development, either disable Confirm email or configure the application's local URL as a redirect URL.

The app uses Supabase when these environment variables are configured. It uses local browser storage only when they are absent.

To migrate from this local MVP to a production Supabase backend:

1. **Replace `src/lib/database.ts` & services:**
   - Replace LocalStorage reads with `supabase.from('notes').select('*')`.
   - In `NotesService.createNote`, insert into the `notes` table.
   - In `imageStorage.ts`, replace IndexedDB with `supabase.storage.from('waypost-images').upload()`.
2. **Authentication:**
   - In `AuthContext.tsx`, replace `LocalAuthService` with `supabase.auth.signUp()` and `supabase.auth.signInWithPassword()`.
3. **Location queries (PostGIS):**
   - The 150m Haversine calculation currently done client-side can be offloaded to PostGIS via `ST_DWithin(location, ST_MakePoint(lon, lat)::geography, 150)`.
4. **No UI rewrite necessary:**
   - Because all components consume `useNotes()`, `useLocation()`, and `useAuth()`, none of the page or modal UI components require refactoring.

---

## ⚠️ Prototype Limitations

- **Browser Storage Only:** Data created in one browser does not automatically synchronize to other users' devices.
- **Client-Side Authentication:** Accounts and sessions are simulated locally for UX evaluation and are not a substitute for server-side authentication.
- **Local Moderation:** Flagged reports are recorded in browser storage for administrative review in the Dev Settings panel rather than being transmitted to a central moderation team.
