# The Conservatory: Complete Feature Manifest

Every feature, tweak, new component, and desired end state — organized by surface. Each item references the exact data source or code it needs.

---

## 🏛️ A. DASHBOARD (Home Screen Reimagining)

The home screen is currently: Event Feed OR Entity List. Two tabs. This should feel like entering a conservatory.

### A1. Featured Specimen Card

- **What**: A hero card at the top of the feed that rotates daily/on-refresh showing one entity from your collection.
- **Content**: Hero image (from `entity.overflow?.images[0]` or enrichment), common name, scientific name italic, one-line discovery (`entity.overflow?.discovery?.mechanism` first sentence).
- **Data Source**: `entity.overflow.discovery`, `entity.overflow.images`, `entity.scientificName`, GBIF family/kingdom.
- **Interaction**: Tap → opens full Specimen Placard (see B below).
- **Visual**: Full-bleed image with dark gradient overlay, serif typography, emerald accent glow.

### A2. Ecosystem Pulse Summary

- **What**: A living status strip below the featured specimen. Not a log — a _sentence_.
- **Content**: "**The Shallows** is stable. pH trending ↓ 0.2 over 14 days. 8 residents, 3 plants thriving."
- **Data Source**: Computed from `entities.filter(e => e.habitat_id === X)`, plus observation history deltas.
- **Interaction**: Tap → opens Habitat Diorama (see C below).

### A3. Wonder Feed (replaces Event Feed)

- **What**: The event feed, but each event is enriched with _meaning_ instead of raw data.
- **Examples**:
  - Instead of `LOG_OBSERVATION: { pH: 6.8 }` → "💧 pH logged at 6.8 in The Shallows — stable within your 2-week trend."
  - Instead of `ACCESSION_ENTITY: Cardinal Tetra x12` → "🐟 12 Cardinal Tetras joined The Shallows. _Did you know? Their iridescent stripe is structural coloration from guanine crystals._"
  - After enrichment completes: "🧬 **New Discovery**: Java Fern reproduces via adventitious plantlets — tiny clones that grow on leaf margins."
- **Data Source**: `event.domain_event` + `entity.overflow.discovery` + computed observation deltas.
- **Visual**: Each card type has a distinct aesthetic — accession events feel celebratory, observations feel clinical/precise, discoveries feel magical.

### A4. Quick Stats Bar

- **What**: Compact stats at the top: Total Species | Total Habitats | Pending Enrichment | Last Observation.
- **Data Source**: `entities.length`, `entities.filter(HABITAT).length`, `entities.filter(enrichment_status === 'pending').length`.

### A5. "What's Happening" Ambient Ticker

- **What**: A subtle one-line ticker that rotates biological facts about your collection.
- **Examples**: "Your Anubias is an epiphyte — it doesn't need soil" / "Neocaridina shrimp molt every 3-4 weeks" / "The Shallows has 3 predator-prey relationships"
- **Data Source**: Pre-generated `discovery.synergyNote` from plant library + `getBiologicalDiscovery` results.

---

## 📜 B. SPECIMEN PLACARD (Entity Detail Reimagining)

The current `EntityDetailModal` is: GBIF card + GrowthChart + Alias editor + Group selector. Functional. Not a placard. Here's the full desired state:

### B1. Hero Image Section

- **What**: Full-width image at the top of the modal, with gradient overlay.
- **Data Source**: `entity.overflow?.images[0]` (from enrichment/scraper) or `entity.overflow?.referenceImages[0]`.
- **Fallback**: A generated botanical illustration via `geminiService.generateHabitatVisualPrompt` or a placeholder with the entity's icon enlarged.
- **Visual**: Dark gradient from bottom, entity name in large serif font overlaid.

### B2. Taxonomy Ribbon

- **What**: A slim, elegant bar: `Kingdom Plantae · Family Araceae · Genus Anubias`
- **Data Source**: `entity.overflow?.taxonomy` (populated by GBIF enrichment) or `gbifData` from the live fetch.
- **Visual**: Small caps, slate-400 text, separated by centered dots.

### B3. Discovery Secrets Section ("The Why")

- **What**: The biological "placard" text. Three labeled paragraphs:
  1. 🔬 **Mechanism**: How this species works biologically.
  2. 🌍 **Evolutionary Advantage**: Why this trait exists in the wild.
  3. 🤝 **Synergy**: How it interacts with other species in your conservatory.
- **Data Source**: `entity.overflow?.discovery` (populated by `enrichEntity` or `generate_discovery_secrets.ts`).
- **Visual**: Serif font, generous line-height, emerald section headers. Should feel like reading a museum placard.

### B4. Origin & Distribution

- **What**: Origin text + distribution map image.
- **Data Source**: `entity.details?.origin` or `entity.overflow?.traits?.Origin`, plus `entity.overflow?.details?.distributionMap` (URL to map image from scraper).
- **Visual**: Map image with rounded corners, origin text in italic below.

### B5. Rich Narrative (from Aquasabi/Flowgrow)

- **What**: The detailed care/description narrative from the local plant library.
- **Data Source**: `entity.overflow?.details?.narrativeHtml` (raw HTML from scraper).
- **Render**: Sanitized HTML rendering (use `dangerouslySetInnerHTML` with a sanitizer or render markdown).
- **Visual**: Styled prose block with botanical green accents.

### B6. Trait Dashboard

- **What**: Visual display of all traits. Not a form — a _dashboard_.
  - **PHOTOSYNTHETIC**: Light req (☀️ low/med/high), CO2 (bubble icon), Placement (diagram showing foreground/mid/background), Growth rate (speedometer), Difficulty (1-4 leaves).
  - **AQUATIC**: pH range, Temp range, Salinity badge.
  - **INVERTEBRATE**: Molting status (last molt date if tracked), Colony boolean, diet.
  - **TERRESTRIAL**: Humidity gauge, Substrate type.
- **Data Source**: `entity.traits[].parameters`.
- **Visual**: Icon grid with subtle backgrounds per trait type. Emerald for plant traits, cyan for aquatic, amber for invertebrate.

### B7. Personal History Timeline

- **What**: A vertical timeline of this entity's life in your conservatory.
  - "Feb 2 — Accessioned to The Shallows (x12)"
  - "Feb 5 — Growth recorded: 4.2cm (+0.8cm)"
  - "Feb 10 — pH dropped to 6.4 ⚠️"
- **Data Source**: `entity.observations[]` + `entity.created_at` + events filtered by entity.
- **Visual**: Vertical line with dots, alternating left/right cards. Similar aesthetic to GrowthChart.

### B8. Growth Sparkline (already exists, needs wiring)

- **What**: `GrowthChart` component is built. Needs to be wired to specific observation types.
- **Enhancement**: Multiple sparklines — one per metric type (growth, pH, temp). Tabbed or stacked.
- **Data Source**: `entity.observations.filter(o => o.label === 'growth')`, etc.

### B9. "In Your Conservatory" Context

- **What**: A footer section showing: "Lives in **The Shallows** with **3 tankmates**: Cardinal Tetra (x12), Amano Shrimp (x5), Java Fern (x3)."
- **Data Source**: `entities.filter(e => e.habitat_id === entity.habitat_id && e.id !== entity.id)`.
- **Interaction**: Tap a tankmate name → navigate to their placard.

### B10. Enrichment Status Indicator

- **What**: Subtle indicator showing enrichment state. If pending or none, show "🔍 Researching..." button that triggers `enrichEntity`.
- **Data Source**: `entity.enrichment_status`.
- **Visual**: Small pill badge. `none` = gray "Not enriched", `pending` = amber pulse "Researching...", `complete` = emerald "Verified", `failed` = red "Retry".

### B11. Quick Edit Mode Toggle

- **What**: The current alias editor, group selector, and observation logger should be in a collapsible "Edit" section, not cluttering the placard.
- **Interaction**: A small pencil icon toggles between "View" (placard mode) and "Edit" (current form mode).

---

## 🌊 C. HABITAT DIORAMA (New View)

Currently, habitats are just entity cards (`EntityType.HABITAT`). Tapping one sets it as active. There's no dedicated habitat view. This needs to be a rich, immersive page.

### C1. Habitat Header

- **What**: Name, type badge (Freshwater/Saltwater/Paludarium/Terrarium), size, location.
- **Data Source**: Habitat entity fields + `habitatParams` from creation event.
- **Visual**: Large serif title, type-colored accent (cyan for aquatic, amber for terrestrial, green for paludarium).

### C2. AI-Generated Habitat Illustration

- **What**: A botanical illustration of this habitat generated by AI.
- **Flow**: `generateHabitatSnapshot(id)` → `getEcosystemNarrative(snapshot)` → `generateHabitatVisualPrompt(narrative)` → image generation.
- **Cache**: Store the generated image URL in `habitat.overflow.illustration`.
- **Visual**: Full-width, rounded, with a film-grain overlay for that botanical illustration feel.

### C3. Ecosystem Narrative (3-Part Story)

- **What**: The holistic biological story of this habitat, rendered as beautiful prose.
  1. **Web of Life**: "Your Java Fern provides shelter for juvenile shrimp, while the Anubias filters nitrates..."
  2. **Biomic Story**: "This tank echoes the blackwater streams of the Rio Negro..."
  3. **Evolutionary Tension**: "The Amano Shrimp and Neocaridina compete for biofilm..."
- **Data Source**: `geminiService.getEcosystemNarrative(snapshot)`, cached in habitat overflow.
- **Visual**: Three collapsible sections with nature-themed icons. Serif prose.

### C4. Residents Grid

- **What**: Visual grid of all entities in this habitat. Each card shows: image, name, type icon, quantity.
- **Data Source**: `entities.filter(e => e.habitat_id === habitat.id)`.
- **Interaction**: Tap → opens Specimen Placard.
- **Visual**: Mini versions of entity cards with images if available.

### C5. Chemistry Timeline (Multi-Metric Sparklines)

- **What**: Stacked sparklines for pH, Temperature, Ammonia, Nitrates — all from observation events logged against this habitat.
- **Data Source**: Events with `LOG_OBSERVATION` intent where `targetHabitatId === habitat.id`. Extract `observationParams`.
- **Visual**: Multiple `GrowthChart` instances, each with a different accent color. pH=cyan, Temp=red, NH3=amber, NO3=purple.
- **Enhancement**: Horizontal danger zones (red bands for pH < 6.0 or > 8.0, etc.).

### C6. Species Interaction Web (Visual)

- **What**: A simple force-directed or radial graph showing how species interact.
- **Nodes**: Each entity in the habitat.
- **Edges**: Derived from `discovery.synergyNote` or AI-generated connections.
- **Visual**: SVG canvas with animated connections. Emerald lines = symbiotic, Red lines = competitive.

### C7. Habitat Health Score

- **What**: A computed 0-100 score based on: parameter stability, biodiversity, observation recency.
- **Formula**: Weight recent observation consistency, number of species, absence of alerts.
- **Visual**: Large circular gauge with color gradient (red → amber → emerald).

### C8. Maintenance Log

- **What**: Habitat-specific event timeline (water changes, cleaning, equipment changes).
- **Data Source**: Observation events with `observationNotes` containing maintenance keywords.

---

## 🌳 D. TAXONOMY BROWSER (New Navigation Mode)

### D1. Hierarchy Navigator

- **What**: A browseable tree: Kingdom → Family → Genus → Species.
- **Data Source**: GBIF taxonomy stored in `entity.overflow.taxonomy`, plus `traits.Genus`, `traits.Family` from scraper.
- **Visual**: Indented tree with expand/collapse. Each level has a subtle color shift.

### D2. Category Lanes

- **What**: Horizontal scrolling lanes on the Collection tab: "Epiphytes", "Stem Plants", "Invertebrates", "Habitats".
- **Data Source**: `entity.traits[0].type` for primary grouping, `traits.parameters.placement` for plant sub-categories.
- **Visual**: Netflix-style horizontal scroll lanes with entity cards.

### D3. "Related Species" Suggestions

- **What**: On a Specimen Placard, show "Other [Genus] in your conservatory" and "Other [Genus] in the library".
- **Data Source**: `plantService.getGenusGroup(genus)` for library matches, `entities.filter(e => e.overflow?.taxonomy?.genus === thisGenus)` for owned.

### D4. Genus Encyclopedia Page

- **What**: When browsing by genus, show a page about the entire genus with: all species you own, all species in the library, shared traits, origin regions.
- **Data Source**: `plantService.getGenusGroup()` + GBIF family data.

---

## ✨ E. DISCOVERY & WONDER (Proactive Delight)

### E1. Post-Enrichment Discovery Toast

- **What**: When `enrichEntity` completes, show a beautiful toast/notification with the discovery secret.
- **Content**: "🧬 **Discovery Unlocked**: [entity.name] — [discovery.mechanism, first sentence]"
- **Trigger**: `enrichment_status` changes from `pending` to `complete`.
- **Visual**: Slides in from bottom, glassmorphism background, auto-dismisses after 8 seconds.

### E2. "Today I Learned" (Daily Rotation)

- **What**: On the dashboard, show one random discovery fact from your collection that rotates daily.
- **Data Source**: Random entity with `overflow.discovery.mechanism`, seeded by `Date.now() / 86400000`.
- **Visual**: Elegant card with a small "🎓" badge. Serif italic text.

### E3. Growth Milestone Celebrations

- **What**: When a growth observation shows significant change (>2× previous delta), celebrate.
- **Content**: "🌱 Your [Plant] grew [X]cm this week — [2×] its normal rate! [High light + CO2 is working.]"
- **Trigger**: Computed on `LOG_OBSERVATION` commit.
- **Visual**: Confetti animation or subtle sparkle effect.

### E4. Seasonal Context

- **What**: Show seasonally relevant facts about your species.
- **Content**: "🌊 February is dry season in the Orinoco basin — your Cardinal Tetras' native waters are at their lowest."
- **Data Source**: `entity.details.origin` + current month + AI-generated seasonal context.
- **Trigger**: Passive — shown in Wonder Feed or dashboard.

### E5. "Deep Research" Multi-Stage Loader

- **What**: When enrichment is running, show a beautiful multi-stage loading animation instead of a spinner.
- **Stages**: "Querying GBIF taxonomy..." → "Searching Wikipedia..." → "Checking iNaturalist..." → "Consulting local library..." → "Synthesizing discoveries..."
- **Data Source**: Progress events from `enrichEntity` via stage callbacks (see H1 for architecture).
- **Visual**: Vertical stepper with animated checkmarks. Each step fades in with a subtle delay.
- **Component**: `DeepResearchLoader.tsx` — receives `ResearchProgress` state from the store.
- **States per stage**: `waiting` (gray, dimmed) → `active` (amber pulse, text visible) → `complete` (emerald checkmark, slide-in) → `error` (red X, retry link).
- **Entity-level sub-progress**: If researching a habitat with 8 residents, show: "Researching Cardinal Tetra (3 of 8)..." with a horizontal progress bar.
- **Completion Moment**: When all entities finish, burst animation → show summary: "🧬 8 species researched. 3 new discoveries unlocked." → Tap to see Discovery Feed.

### E6. Comparison View

- **What**: Select two entities and compare them side-by-side.
- **Content**: Traits, parameters, growth rates, origin, taxonomy.
- **Use Case**: "Is my Anubias barteri growing faster than my Anubias nana?"

---

## 📸 F. CAMERA & VISION ENHANCEMENTS

### F1. Rapid Capture Mode

- **What**: After identifying one species, auto-reset camera for next shot without closing the modal.
- **Flow**: Identify → Accession → Camera resets → Identify next → Accession → ... → User taps "Done".
- **Visual**: Counter badge showing how many species identified this session.

### F2. Multi-Species Detection

- **What**: Identify multiple species in a single photo.
- **Enhancement**: Return array of `IdentifyResult` instead of single result.
- **Visual**: Tap each detected species to accession individually or batch-accession all.

### F3. Photo Attachment to Entity

- **What**: After photo ID, attach the captured image to the entity record.
- **Data Source**: Store base64 or upload to Firebase Storage, link URL to `entity.overflow.images[]`.

### F4. Growth Comparison Photos

- **What**: Take periodic photos of the same plant to visually compare growth over time.
- **Visual**: Side-by-side slider (before/after) with timestamps.

### F5. AR-Style Labels (Future)

- **What**: Point camera at tank → overlay species names on recognized organisms.
- **Feasibility**: Stretch goal. Would require continuous frame analysis.

---

## 🎨 G. VISUAL & AESTHETIC UPGRADES

### G1. Biome Theming (Already Typed, Not Implemented)

- **What**: `BiomeTheme` type exists (`'blackwater' | 'tanganyika' | 'paludarium' | 'marine'`). CSS variables exist. No UI to select or auto-apply.
- **Desired**: Each habitat auto-selects a theme based on its type. Viewing a blackwater tank shifts the entire app's color palette to warm amber/dark brown. Marine → deep blue. Paludarium → mossy green.
- **Implementation**: CSS variables are already in `MainLayout`. Need theme picker or auto-detection.

### G2. Entity Card Images

- **What**: The Collection grid cards are currently icon + text. Add thumbnail images.
- **Data Source**: `entity.overflow?.images[0]` or `entity.overflow?.referenceImages[0]`.
- **Visual**: Small rounded square image on the card, with fallback to the current icon.

### G3. Animated State Transitions

- **What**: Smooth transitions between views. Entity list → Detail modal should feel like zooming into a specimen.
- **Implementation**: Shared element transitions or spring animations.

### G4. Empty State Illustrations

- **What**: When there are no entities, no events, no observations — show beautiful empty states instead of italic gray text.
- **Visual**: Subtle botanical line illustrations with encouraging copy: "Your conservatory awaits its first specimen."

### G5. Glassmorphism Cards

- **What**: Upgrade card backgrounds from `bg-slate-900/50` to glassmorphism with `backdrop-blur` + subtle gradients.
- **Apply To**: ConfirmationCard, Featured Specimen, Discovery toasts.

### G6. Typography Upgrade

- **What**: Import a proper serif font (e.g., Playfair Display, Cormorant Garamond) for specimen names and headings.
- **Current**: Using `font-serif` which falls through to system serif. Should be specific.

### G7. Micro-Animations

- **What**: Subtle animations on data changes.
  - Growth value updates → number counter animation.
  - New entity added → card entrance animation.
  - Enrichment complete → shimmer effect on the entity card.
  - pH change → color pulse on the metric badge.

---

## 🔧 H. DATA & BACKEND ENHANCEMENTS

### H1. Enrichment Orchestration (The "Deep Research" Pipeline)

**Problem**: You don't want enrichment to fire 21 times when setting up a new tank and adding organisms one by one. You want to set up the tank, add all the residents, and _then_ say "research everything."

**Architecture: Queue → Trigger → Serial Process → Surface**

#### H1a. Queue on Accession (Passive)

- On `ACCESSION_ENTITY` commit, set `enrichment_status: 'queued'` (new status, distinct from `'pending'` which means actively enriching).
- Entity appears in the collection with a subtle "📋 Queued for research" badge.
- **No API calls fire. Nothing happens until the user says go.**

#### H1b. Trigger: "Deep Research" Button (User-Initiated)

- **Per-Habitat**: On the Habitat Diorama (C), a prominent button: **"🔬 Deep Research This Habitat"**.
  - Finds all entities in this habitat with `enrichment_status === 'queued' || 'none'`.
  - Starts the enrichment queue.
- **Per-Entity**: On the Specimen Placard (B), if `enrichment_status !== 'complete'`, show: **"Research this species"**.
- **Global**: On the Dashboard, if any entities are queued: **"🔬 12 species awaiting research"** button.

#### H1c. Serial Processing with Stage Callbacks

- `store.deepResearch(entityIds: string[])` — new method.
- Processes entities **one at a time** (serial, not parallel) to respect API rate limits.
- Emits progress via a new `researchProgress` state field on the store:

```typescript
interface ResearchProgress {
  isActive: boolean;
  totalEntities: number;
  completedEntities: number;
  currentEntity: { id: string; name: string } | null;
  currentStage:
    | "gbif"
    | "wikipedia"
    | "inaturalist"
    | "library"
    | "discovery"
    | null;
  stageResults: Array<{
    entityName: string;
    stages: Array<{
      name: string;
      status: "waiting" | "active" | "complete" | "error";
      data?: any;
    }>;
  }>;
  discoveries: Array<{ entityName: string; mechanism: string }>; // accumulated
}
```

- `enrichEntity` is refactored to accept an `onStageChange` callback:
  ```typescript
  enrichEntity(entityId: string, onStage?: (stage: string) => void)
  ```
- Each API call (GBIF, Wiki, iNat, library, discovery) calls `onStage('gbif')` etc. before starting.
- The `DeepResearchLoader` component (E5) subscribes to `store.researchProgress` and renders the multi-stage UI.

#### H1d. Completion → Discovery Reveal

- When all entities complete, `researchProgress.isActive` goes to `false`.
- Show a summary modal: "🧬 Researched 8 species. 5 discoveries unlocked."
- Each discovery shows the one-liner `mechanism` text.
- Tap any discovery → opens that entity's Specimen Placard.
- Discoveries also injected into the Wonder Feed (A3).

#### H1e. Enrichment Status Lifecycle

```
none → (accession) → queued → (deep research triggered) → pending → enriched
                                                            ↓
                                                          failed → (retry) → pending
```

- `none`: Legacy entities or entities created before queue system.
- `queued`: Waiting for user to trigger deep research.
- `pending`: Actively being enriched right now.
- `complete` (renamed from `enriched`): All sources queried, data stored.
- `failed`: One or more sources failed. Retry available.

#### H1f. Smart Skip Logic

- If an entity already has `enrichment_status: 'complete'`, skip it in the queue.
- If an entity was just photo-ID'd and the library already has full data for that species, do a "fast enrich" (library-only, skip external APIs) in <100ms. Show a different animation: "✨ Recognized from your library — instant enrichment."
- Re-research button available for force-refresh.

### H2. Enrichment Data Surface Mapping

- **What**: Connect all the enrichment data stored in `entity.overflow` to UI components.
- **Current Gap**: `enrichEntity` stores data in `overflow.taxonomy`, `overflow.details`, `overflow.discovery`, `overflow.images` — but `EntityDetailModal` doesn't read any of it.
- **Mapping**:
  - `overflow.taxonomy` → Taxonomy Ribbon (B2)
  - `overflow.discovery` → Discovery Secrets (B3)
  - `overflow.details.narrativeHtml` → Rich Narrative (B5)
  - `overflow.details.distributionMap` → Origin Map (B4)
  - `overflow.images` → Hero Image (B1) + Entity Card thumbnail (G2)

### H3. Observation History for Habitats

- **What**: Currently observations are stored per-entity. Need habitat-level observation aggregation.
- **Implementation**: When `LOG_OBSERVATION` commits with a `targetHabitatId`, store the params in a habitat-level observations array too. Or compute on-the-fly by scanning events.

### H4. Entity `details` Field Population

- **What**: The `Entity.details` interface has `description`, `origin`, `notes`, `maintenance` — these should be populated during enrichment.
- **Current**: `enrichEntity` stores most data in `overflow` but doesn't populate the first-class `details` field.
- **Fix**: During enrichment merge, copy the best description to `entity.details.description`, origin to `entity.details.origin`, etc.

### H5. Plant Library Search on Accession

- **What**: When accessioning a plant, auto-search `plantService.searchMany(name)` and pre-populate traits from the library match.
- **Current**: Library search only happens during chat context injection.
- **Implementation**: In `commitPendingAction` ACCESSION flow, if the entity is PHOTOSYNTHETIC, search the library and merge traits.

### H6. Observation Types Expansion

- **What**: Currently observation logger has: growth, parameter, note. Need more types:
  - `molting` — for invertebrates
  - `blooming` — for plants
  - `water_change` — for habitats
  - `feeding` — for organisms
  - `death` / `removal` — sad but necessary
- **Data Source**: Extend observation `type` enum in `types.ts`.

### H7. Image Storage Pipeline

- **What**: Currently no images are stored persistently. Photos from camera ID are base64 in memory only.
- **Implementation**: Upload to Firebase Storage on accession/observation, store URL in entity/event.

### H8. Export / Sharing

- **What**: Export a Specimen Placard as a shareable image or PDF. Export collection as JSON/CSV.
- **Use Case**: Share a beautiful species card on social media or print for physical display.

---

## 📱 I. NAVIGATION & UX

### I1. Three-Tab Navigation

- **What**: Current: Feed | Collection. Desired: **Discover** | **Collection** | **Habitats**.
- **Discover**: Wonder Feed + Featured Specimen + Daily TIL.
- **Collection**: Taxonomy-browseable entity grid.
- **Habitats**: Grid of habitat cards, each opening to Diorama view.

### I2. Search / Filter Bar

- **What**: Global search across entities, events, and plant library.
- **Current**: No search bar on the Collection view.
- **Implementation**: Filter `entities` by name, scientific name, aliases, type, habitat, traits.

### I3. Pull-to-Refresh

- **What**: On mobile, pull down to refresh sync and rotate featured specimen.

### I4. Swipe Navigation

- **What**: Swipe between entity placards when viewing a list. Tinder-style horizontal swipe through specimens.

### I5. Breadcrumb Context

- **What**: When drilling into Habitat → Entity, show breadcrumb: "The Shallows > Cardinal Tetra".
- **Visual**: Subtle path indicator at top of modals.

### I6. Onboarding Flow

- **What**: First-time user experience. Guided tour of voice, camera, and collection features.
- **Steps**: "Welcome to The Conservatory" → "Speak to add your first habitat" → "Point your camera to identify a species" → "Visit the Discovery tab to learn about your collection."

---

## 🧪 J. TESTING & RELIABILITY

### J1. E2E Test for Vision-to-Store Flow

- **What**: Playwright test: Mock `identifyPhoto` → trigger `createActionFromVision` → verify `PendingAction` in CONFIRMING state.

### J2. E2E Test for Enrichment

- **What**: Mock GBIF/Wiki/iNat responses → trigger `enrichEntity` → verify `overflow` fields populated.

### J3. E2E Test for Wonder Feed

- **What**: After enrichment, verify that the Wonder Feed renders the discovery secret.

### J4. Offline Mode Testing

- **What**: Verify all features work with `MockFirestoreService`. Accession, observe, enrich, view placards.

---

## 📊 K. METRICS & ANALYTICS

### K1. Collection Health Dashboard

- **What**: Overview metrics: Species count by kingdom, Total observations logged, Average observation frequency, Enrichment coverage (% of entities with full discovery data).

### K2. "Completeness" Score per Entity

- **What**: How "complete" is this entity's record? Has image? Has discovery? Has taxonomy? Has observations?
- **Visual**: Progress ring on entity card. 5 segments = 5 data sources filled.

### K3. Observation Gaps Alert

- **What**: "You haven't logged observations for The Shallows in 14 days."
- **Trigger**: No `LOG_OBSERVATION` events for a habitat in N days.

---

_Total: 60+ features across 11 categories. Each item references the exact data source or component it touches. Prioritize B (Specimen Placard), E1 (Discovery Toasts), A3 (Wonder Feed), and H1 (Auto-Enrichment) for maximum impact per effort._
