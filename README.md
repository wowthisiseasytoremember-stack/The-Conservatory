# The Conservatory

A high-fidelity digital archive and research tool for aquatic curators — an aquarium management tracker that helps you catalog fish tanks, track water parameters, schedule maintenance, and build a rich natural history dossier for every specimen in your care.

---

## 🏛️ Vision: "The Modern Museum"

We don't manage "inventory"; we curate and protect **living artifacts**. The Conservatory transforms your home ecosystem into a documented "Digital Cabinet of Curiosities," connecting every specimen back to its ancestral origins in the wild. Every fish, plant, and invertebrate gets a museum-quality **Living Placard** with taxonomy, care guide, ecology, and provenance.

---

## ✨ Features

### 1. Tank & Habitat Management
Track freshwater, brackish, and marine aquariums (plus paludariums and terrariums). Each habitat stores its size, type, location, and a complete roster of resident species. View a **Habitat Diorama** with an ecosystem narrative and inhabitant list.

### 2. Specimen Catalog (Living Placards)
Every organism logged gets a detailed **Species Placard** — scientific name, common name, trade name, cultivar/morph info, taxonomy (kingdom through species), native range, care requirements (pH, temperature, light, CO₂, substrate, diet), and growth parameters. Powered by the **Deep Research Engine**.

### 3. Deep Research Engine
Instead of generic AI guesses, the `/api/enrich` Cloud Function scrapes four authoritative sources in parallel (Wikipedia, Aquasabi, Flowgrow, Tropica), then synthesizes the raw data via **Google Gemini 2.5 Flash** into a structured dossier with taxonomy, trade info, care narrative, and fun facts. Supports direct species matches and genus-level fallbacks.

### 4. Water Parameter Tracking
Log and trend key water parameters — pH, temperature, ammonia, nitrites, nitrates, hardness, salinity. The system computes ecosystem health scores based on parameter stability, biodiversity bonuses, pH compatibility, and recency of observations. View parameter details and trends on the **ParameterDetail** screen.

### 5. Maintenance & Observation Journal
Log observations via text or voice. The **Voice Command** feature parses natural language into structured actions (accession entities, log readings, modify habitats) using Gemini. All observations appear in the **Event Feed** as a chronological stewardship journal.

### 6. Photo Identification
Snap or upload photos of specimens. The **PhotoIdentify** component sends images to the AI for species identification, with confidence scoring and reasoning. Results include common name, scientific name, and kingdom classification.

### 7. Ecosystem Analytics
An **Ecosystem Health Dashboard** computes and displays:
- **Biodiversity Index** — points per unique species (capped at 40)
- **pH Stability Score** — tracks deviation over recent readings
- **Temperature Stability** — monitors trends
- **Recency Score** — rewards frequent observations
- **Compatibility** — cross-species pH and temperature overlap checking

### 8. AI "Curator's Notes"
Every observation can be enriched with AI-generated context — scientific insights, evolutionary notes, and "Web of Life" narratives connecting species interactions within the habitat.

### 9. Curator's Card Sharing
Generate and share beautiful **Curator's Cards** — snapshot cards summarizing a habitat's ecosystem, complete with biodiversity metrics, health scores, and specimen highlights. Exportable via Capacitor Share.

### 10. Cross-Platform (Web & Mobile)
Built with **React 19 + Capacitor 8**, providing a fluid web experience and native iOS/Android apps. Storage uses Capacitor Preferences with a localStorage fallback for resilience on mobile.

---

## 🛠️ Technical Stack

| Layer | Technology |
|---|---|
| **Language** | TypeScript 5.8 |
| **Frontend** | React 19, Vite 6, React Router 7 |
| **Styling** | Tailwind CSS 4 ("Museum Ivory" & "Botanical Green" palette) |
| **UI Components** | Radix UI (Dialog, Tabs, Slot), Lucide React icons, shadcn-style primitives |
| **State** | Zustand 5 (modular store with persistent hydration) |
| **Server State** | TanStack Query 5 (5-minute stale time, background enrichment polling) |
| **Animation** | Framer Motion |
| **Validation** | Zod 4 (parameter schemas, intent parsing, identification results) |
| **Backend** | Firebase (Firestore, Auth, Storage, Cloud Functions v2 on Node.js 20) |
| **AI/ML** | Google Gemini 2.5 Flash (synthesis, intent parsing, identification, enrichment) |
| **Mobile** | Capacitor 8 (Camera, Preferences, Share, Status Bar) |
| **Testing** | Vitest (unit), Playwright (E2E and integration) |
| **Logging** | Pino (structured JSON logging) |

### Firebase Cloud Functions

Three v2 HTTP functions deployed via `firebase.json` rewrites:

| Function | Endpoint | Purpose |
|---|---|---|
| `enrichEntity` | `/api/enrich` | Multi-source web scraping + AI synthesis into structured dossiers |
| `proxy` | `/api/proxy` | Generic Gemini API proxy for frontend AI calls |
| `perplexityProxy` | `/api/perplexity` | Perplexity API proxy for web research queries |

---

## 🗂️ Project Structure

```
the-conservatory/
├── components/
│   ├── screens/         # Route-level screens (Home, HabitatDiorama, SpeciesPlacard,
│   │                     # ParameterDetail, BlueprintScreen, PlaygroundScreen, Settings)
│   ├── ui/              # Radix UI primitives (button, card, input, tabs, dialog, badge, etc.)
│   ├── EntityDetailModal.tsx    # The "Placard" — primary specimen detail view
│   ├── HabitatPlacard.tsx       # Habitat overview card
│   ├── EventFeed.tsx            # Chronological observation journal
│   ├── VoiceButton.tsx          # Voice command entry point
│   ├── PhotoIdentify.tsx        # Photo-based species identification
│   ├── GrowthChart.tsx          # Parameter/growth trend charts
│   ├── DeepResearchLoader.tsx   # Research enrichment progress UI
│   └── ... more components
├── services/
│   ├── store.ts          # Zustand state store (entities, habitats, observations)
│   ├── logger.ts         # Pino logger
│   ├── errorService.ts   # Global error telemetry
│   └── ArtifactGenerator.tsx   # Curator's Card generation
├── functions/
│   └── src/index.ts      # Cloud Functions: enrichEntity, proxy, perplexityProxy
├── src/
│   ├── schemas.ts        # Zod schemas (traits, actions, identification, enrichment)
│   ├── constants.ts      # Storage keys, ecosystem thresholds, z-index, timing
│   └── utils/            # cn(), safeStorage (Capacitor Preferences + localStorage)
├── index.tsx             # App entry point with React Query + Router providers
├── App.tsx               # Main app component with routing
├── firebase.json         # Firebase hosting rewrites → Cloud Functions
├── tailwind.config.ts
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Firebase project with Firestore, Auth, and Functions enabled
- Google Gemini API key (for AI features)
- (Optional) Perplexity API key (for web research proxy)
- (Optional) Android Studio / Xcode for mobile builds

### Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd the-conservatory
npm install

# 2. Install Functions dependencies
cd functions
npm install
cd ..

# 3. Environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase credentials and GEMINI_API_KEY

# 4. Run development server
npm run dev
# → Vite dev server at http://localhost:5173
```

### Firebase Emulators (Local Functions Testing)

```bash
cd functions
npm run serve
# → Runs TypeScript build + firebase emulators:start
```

### Deploy

```bash
# Deploy Cloud Functions only
cd functions
npm run deploy

# Deploy web app (hosting)
npm run build
firebase deploy --only hosting

# Deploy everything
firebase deploy
```

### Mobile Builds

```bash
# Android
npm run build:android    # Builds web app + syncs Capacitor Android

# Open in Android Studio
npm run open:android
```

---

## 🧪 Testing

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Vitest UI
npm run test:ui

# E2E tests (Playwright)
npm run test:e2e

# Integration tests
npm run test:integration
```

---

## 🧬 Ecosystem Health Algorithm

The system computes a composite health score per habitat based on:

| Factor | Weight | Details |
|---|---|---|
| **Biodiversity** | Up to +40 | +5 per unique species, capped at 40 |
| **pH Stability** | Up to +40 | Penalizes deviation >1.5 from species tolerances |
| **Temp Stability** | Up to +20 | Penalizes deviation >10°F from species tolerances |
| **Recency** | +5 to +20 | Based on days since last observation (1d → 20, 7d → 15, 30d → 10, older → 5) |

---

## 📂 Key Documents
- `VISION_MANDATE.md` — Core philosophy and UX principles
- `TECHNICAL_BLUEPRINT.md` — Architectural map of the system
- `CLAUDE.md` — Development conventions and coding standards
- `docs/ARCHIVE/` — Legacy documentation and planning materials

---

## 📄 License

ISC

---

*Created for the serious curator. Protecting life, documenting wonder.*
