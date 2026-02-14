# The Conservatory: Complete Workflow & CUJ Manifest

All features, workflows, and critical user journeys — what the app **does**, what it **should do**, and what's **planned**.

---

## 🟢 1. Implemented & Functional

---

### 1.1 The "Principal Curator" Voice Engine

**Flow**: `VoiceButton` → `Gemini Flash Lite` → Structured Intent → `ConfirmationCard` → `store.commitPendingAction` → Firestore

| Intent             | Description                       | Voice Example                                            |
| ------------------ | --------------------------------- | -------------------------------------------------------- |
| `MODIFY_HABITAT`   | Create/update physical containers | "Create a 20 gallon freshwater tank called The Shallows" |
| `ACCESSION_ENTITY` | Multi-species batch entry         | "I just added 12 Neon Tetras to The Shallows"            |
| `LOG_OBSERVATION`  | Environmental chemistry logging   | "pH in The Shallows is 6.8, temp 78"                     |
| `QUERY`            | Freeform questions                | "How many shrimp do I have?"                             |

**Mad-Libs Confirmation**: Every AI-parsed intent goes through `ConfirmationCard` where users tap inline "Slots" to correct species names, quantities, traits, and habitat params before commit.

**Live Transcript**: Real-time speech-to-text preview appears in the UI as the user speaks.

---

### 1.2 Strategy Agent (Intent Fallback)

**Flow**: When the voice parser returns `null` intent or `isAmbiguous: true`, the system automatically calls `geminiService.getIntentStrategy` to interpret complex/unknown input.

| Field              | Purpose                                                                       |
| ------------------ | ----------------------------------------------------------------------------- |
| `advice`           | Friendly interpretation ("It sounds like you want to log a molting event...") |
| `suggestedCommand` | Executable command the system can run                                         |
| `technicalSteps`   | Step-by-step implementation hints                                             |

**Status**: `STRATEGY_REQUIRED` → shown in `ConfirmationCard` with the advice and suggested action.

---

### 1.3 Multimodal Bio-Identification

#### CUJ: Instant Species ID (Direct-to-Store)

1. User taps **Camera Icon** → `PhotoIdentify` opens.
2. Camera captures image → `geminiService.identifyPhoto` (Gemini 3 Pro).
3. Results shown: species, common name, confidence %, kingdom.
4. User taps **Accession** → `store.createActionFromVision(result)`.
5. `PendingAction` created with `ACCESSION_ENTITY` intent, status `CONFIRMING`.
6. `ConfirmationCard` appears immediately — no voice loop detour.

#### CUJ: Rack Discovery (Batch Habitat Setup)

1. User taps **Layers Icon** → rack scan mode activates.
2. `geminiService.analyzeRackScene` maps shelf levels + horizontal positions.
3. `RackReviewModal` shows vertical list of detected containers.
4. User toggles selection per container → **Confirm & Log Events**.
5. Multiple `MODIFY_HABITAT` intents fired in parallel.

---

### 1.4 Automated Enrichment Pipeline

**Flow**: `store.enrichEntity(entityId)` → parallel calls to 4 external sources:

| Source                                       | Data                                         | Priority    |
| -------------------------------------------- | -------------------------------------------- | ----------- |
| **Local Library** (Aquasabi/Flowgrow scrape) | Description, notes, reference images, traits | **Highest** |
| **GBIF**                                     | Taxonomy, scientific name, family, kingdom   | High        |
| **Wikipedia**                                | General description, habitat info            | Medium      |
| **iNaturalist**                              | Common name aliases, occurrence data         | Medium      |

**Merge Logic**: Local library data overrides external sources for plants. GBIF taxonomy stored in `overflow.taxonomy`. iNaturalist common names added as `aliases`.

**Enrichment Status**: `pending` → `enriched` (or `failed`).

---

### 1.5 Zod Validation Layer

All AI-generated payloads are validated at runtime using Zod schemas (`src/schemas.ts`):

- `PendingActionSchema` — voice command parsing
- `IdentifyResultSchema` — photo identification
- `RackContainerSchema` — rack analysis
- `AdvisoryReportSchema` — architectural advisor
- `IntentStrategySchema` — fallback strategy agent
- `EcosystemNarrativeSchema` — habitat narratives
- `BiologicalDiscoverySchema` — species discovery secrets

Any malformed AI response throws a Zod validation error → shown in `ConfirmationCard` as `ERROR` status.

---

### 1.6 GBIF Taxonomic Verification

**Flow**: `EntityDetailModal` → auto-pings GBIF on open → displays verification badge.

- ✅ **Green Shield**: Exact taxonomic match
- ⚠️ **Yellow Alert**: Fuzzy or partial match

---

### 1.7 Expert Chat (Grounded Guide)

**Flow**: `AIChatBot` → `geminiService.chat` with mode toggles.

| Toggle        | Model                    | Feature                                      |
| ------------- | ------------------------ | -------------------------------------------- |
| **Grounded**  | `gemini-3-flash-preview` | Real-time search with clickable source links |
| **Reasoning** | `gemini-3-pro-preview`   | Deep analytical mode                         |

**Context Injection**: The local `plant_library.json` is automatically injected. Smart lookup matches by species name or genus group.

---

### 1.8 Growth Chart / Sparkline

**Component**: `GrowthChart.tsx` — SVG sparkline with Bezier smoothing.

- Renders time-series data (pH, temp, growth, etc.) from observation events.
- Shows delta percentage change, latest value, and date range.
- Gradient fill with customizable accent color.

---

### 1.9 Data Engineering & Curation

#### Playwright Scraper (`scripts/scrape_aquasabi.ts`)

- Modular TS scripts for Aquasabi/Flowgrow data sourcing.
- Resumable via `plant_urls_cache.json`.
- Extracts: name, **scientific name**, description, narrative HTML, distribution map, traits (placement, difficulty, genus, family, origin), images.

#### Discovery Secrets Generator (`scripts/generate_discovery_secrets.ts`)

- Pre-generates biological discovery data for all library plants.
- Uses `gemini-flash-lite-latest` with rate limiting (4s/call).
- Supports `--limit N` and `--resume` flags.
- Outputs `{ mechanism, evolutionaryAdvantage, synergyNote }` per plant.

---

### 1.10 Developer Workflows (Hidden)

#### Architectural Advisor

`DevTools` → **Contractor** tab → `geminiService.getAdvisoryReport`.
Returns: Strategy, Impact Analysis, Implementation Steps, IDE Prompt.

#### Diagnostic Ping

`DevTools` → **Test DB Connection** → real-time Firebase ping/pong.

#### Ecosystem Narrative

`geminiService.getEcosystemNarrative(snapshot)` → holistic 3-part report:

- **Web of Life**: Species interactions (shelter, filtration)
- **Biomic Story**: Tank's natural theme narrative
- **Evolutionary Tension**: Competition and dynamics

#### Biological Discovery

`geminiService.getBiologicalDiscovery(speciesName)` → reveals "How" and "Why":

- **Mechanism**: Scientific explanation of trait/adaptation
- **Evolutionary Advantage**: Why this trait exists in the wild
- **Synergy Note**: How species benefits others in captive ecosystem

---

### 1.11 Infrastructure

| Feature                   | Implementation                                                                      |
| ------------------------- | ----------------------------------------------------------------------------------- |
| **Auth**                  | Google OAuth via Firebase (`LoginView`)                                             |
| **Persistence**           | Firestore real-time sync + localStorage fallback                                    |
| **Offline**               | Full offline mode via `MockFirestoreService`                                        |
| **Connection Monitoring** | Auto-ping every 30s, status indicator in header                                     |
| **Error States**          | `ConfirmationCard` shows `ERROR` status with AI reasoning                           |
| **Data Sanitization**     | `cleanDataObject` recursion removes `undefined`/empty values before Firestore write |

---

## 🟡 2. Known Gaps / Debt

| Feature                         | Expected                                        | Reality                                                                 |
| ------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| **Enrichment Auto-Trigger**     | Accessioning should auto-trigger `enrichEntity` | Must be manually triggered or called programmatically                   |
| **E2E Test Coverage**           | Full Playwright suite                           | Some tests disabled; race conditions with hard timeouts                 |
| **Historical Chemistry Curves** | Graph view for water params over time           | `GrowthChart` component exists but not wired to observation history yet |
| **Multi-Tab Sync**              | Real-time cross-tab                             | Implemented but prone to race conditions                                |
| **Rapid Capture Mode**          | Auto-advance photo mode                         | Camera logic is single-shot only                                        |

---

## ⭕ 3. Types Defined, UI Missing

These are defined in `types.ts` and/or `schemas.ts` but have no dedicated UI surfaces yet:

| Feature                    | Type/Schema                                   | Notes                                       |
| -------------------------- | --------------------------------------------- | ------------------------------------------- |
| **Terrarium Metrics**      | `humidity`, `substrate` params                | In `TraitParametersSchema`                  |
| **Botany Tracking**        | `growth_cm`, `is_blooming`, `CO2`, `lightReq` | In `observationParams` + `TraitSchema`      |
| **Invertebrate Biology**   | `molting`, `colony` status                    | In `INVERTEBRATE` trait params              |
| **Plant Groups**           | `PLANT_GROUP` taxonomy                        | Referenced in code, no categorization logic |
| **Deep Research Skeleton** | Multi-stage loader                            | Referenced in history, no UI                |

---

## 📋 4. Complete Component Index

| Component                 | Purpose                                               |
| ------------------------- | ----------------------------------------------------- |
| `App.tsx`                 | Root orchestrator, tab routing, modal management      |
| `MainLayout.tsx`          | Shell with header, nav tabs, status bar               |
| `VoiceButton.tsx`         | Microphone capture → text transcription               |
| `ConfirmationCard.tsx`    | Mad-Libs slot editing, trait editor, strategy display |
| `PhotoIdentify.tsx`       | Camera capture → species ID or rack scan              |
| `RackReviewModal.tsx`     | Multi-container selection from rack analysis          |
| `EntityList.tsx`          | Collection view with grouping                         |
| `EntityDetailModal.tsx`   | Full entity detail with GBIF verification             |
| `EventFeed.tsx`           | Activity log with structured event display            |
| `GrowthChart.tsx`         | SVG sparkline for observation metrics                 |
| `AIChatBot.tsx`           | Grounded/Reasoning chat with plant library context    |
| `DevTools.tsx`            | Contractor advisor, diagnostics                       |
| `FirebaseConfigModal.tsx` | Database configuration                                |
| `LoginView.tsx`           | Google OAuth login                                    |

---

## 📋 5. Service Index

| Service                   | Purpose                                              |
| ------------------------- | ---------------------------------------------------- |
| `store.ts`                | Central state management, all business logic         |
| `geminiService.ts`        | All Gemini AI calls (voice, vision, chat, discovery) |
| `enrichmentService.ts`    | External API enrichment (GBIF, Wiki, iNat, Aquasabi) |
| `plantService.ts`         | Local plant library search & retrieval               |
| `connectionService.ts`    | Firestore connection monitoring                      |
| `firebase.ts`             | Firebase config, auth, Firestore refs                |
| `MockFirestoreService.ts` | Offline/test mock for Firestore                      |

---

## 📋 6. Script Index

| Script                          | Purpose                                | Usage                                                                    |
| ------------------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| `scrape_aquasabi.ts`            | Playwright scraper for plant data      | `npx ts-node scripts/scrape_aquasabi.ts`                                 |
| `scraper_logic.js`              | Browser-injected extraction logic      | Used by `scrape_aquasabi.ts`                                             |
| `generate_discovery_secrets.ts` | AI-generated biological discovery data | `API_KEY=xxx npx ts-node scripts/generate_discovery_secrets.ts --resume` |
