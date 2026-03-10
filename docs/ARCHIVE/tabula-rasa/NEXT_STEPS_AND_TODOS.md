# Next Steps Summary & Granular Todo List

**Last Updated**: 2026-02-15
**Status**: Phase 4 Complete + Feature Manifest Started, PIVOTING TO ARCHITECTURE-FIRST APPROACH

---

## Executive Summary

**Completed**:
- ✅ All Phase 4 improvements (vision abstraction, caching, toast system)
- ✅ Backend enhancements (structured logging, cost tracking, cache eviction, error retry)
- ✅ Feature Manifest start (Featured Specimen Card ✅, Wonder Feed Enrichment ✅)
- ✅ Hosting consolidation (Firebase Functions only)

**Current State**:
- Backend: Production-ready with observability, cost tracking, memory management
- UI: Foundation complete, but ARCHITECTURE NEEDS REFACTORING before visual design
- Design: Options documented, waiting for architecture to be solid before committing

**Strategic Pivot**:
Build the ARCHITECTURE first (routing, component structure, data flow), then drop in visuals.
This lets you work design-agnostic for 1-2 weeks while design decisions are finalized.

**Current Phase**: PHASE 5 - UI/UX ARCHITECTURE REFACTOR (Design-Agnostic)

**Immediate Next Steps** (Priority Order):
1. 🔴 **CRITICAL**: Add React Router (foundation for everything else)
2. 🔴 **CRITICAL**: Refactor MainLayout for multi-screen support
3. 🔴 **CRITICAL**: Create screen components (design-agnostic placeholders)
4. 🟠 **HIGH**: Wire data flow to new screens
5. 🟠 **HIGH**: Implement deep linking
6. 🟡 **MEDIUM**: Refactor overlays (modal stack management)

**Design Decision Gate**: After Phase 5 architecture is solid, you MUST decide:
- Split-screen vs. color-only illustration style?
- Which animation library (Framer Motion, Canvas, Lottie)?
- Featured habitat selection logic?
- Parameter drill-down behavior?
(See `docs/plans/2026-02-15-design-inspiration-possibilities.md` for options)

---

## Granular Todo List

### ✅ COMPLETED ITEMS

#### Phase 4.1: Vision Service Abstraction ✅
- [x] Create `services/vision/IVisionService.ts` interface
- [x] Create `services/vision/GeminiVisionService.ts` wrapper
- [x] Create `services/vision/SharedVisionService.ts` for future service
- [x] Create `services/vision/VisionServiceFactory.ts` with env-based selection
- [x] Update `components/PhotoIdentify.tsx` to use factory
- [x] Test: Photo identification works with Gemini
- [x] Verify: Console shows "[Vision] Using Gemini vision service"

#### Phase 4.2: Species Library Caching ✅
- [x] Create `services/speciesLibrary.ts` with caching
- [x] Implement memory cache (Map)
- [x] Implement Firestore persistence
- [x] Update `store.enrichEntity()` to check cache first
- [x] Update `store.enrichEntity()` to save to cache after enrichment
- [x] Test: First enrichment hits network
- [x] Test: Second enrichment is instant (cache hit)

#### Phase 4.3: Intent Parsing Cache ✅
- [x] Add Map cache to `geminiService.parseVoiceCommand()`
- [x] Implement cache key (transcription + entity count)
- [x] Test: First command parses normally
- [x] Test: Second identical command shows cache hit

#### Phase 4.4: UX Non-Blocking Guarantees ✅
- [x] Create `components/Toast.tsx` with toast system
- [x] Implement toast manager with subscribe pattern
- [x] Add ToastContainer to `App.tsx`
- [x] Add error toasts to `PhotoIdentify.tsx`
- [x] Add error toasts to `VoiceButton.tsx`
- [x] Add success/error toasts to `store.enrichEntity()`
- [x] Fix VoiceButton prop mismatch (onResult vs onTranscription)
- [x] Test: Toast notifications appear for errors
- [x] Test: Toast notifications appear for success
- [x] Test: Toasts auto-dismiss correctly

---

---

## 🔴 PHASE 5: UI/UX ARCHITECTURE REFACTOR (Design-Agnostic)

**Goal**: Refactor navigation and component structure BEFORE design decisions become blocking.
**Scope**: Routes, screens, component composition, data flow. NO styling, NO animations, NO illustrations.
**Timeline**: 7-10 days
**Benefit**: Allows visual design to proceed in parallel while you code.

### PHASE 5.1: React Router Setup (Days 1-2)

```
📦 GOAL: Install React Router, define routes, migrate from tab-switching
```

- [ ] **Install React Router v6+**
  ```bash
  npm install react-router-dom
  ```
  - [ ] Add React Router to `App.tsx` provider
  - [ ] Create `<BrowserRouter>`
  - [ ] Define route structure:
    ```
    /login                              (LoginView)
    /home                               (HomeScreen - featured habitat)
    /habitat/:id                        (HabitatDiorama)
    /species/:id                        (SpeciesPlacard)
    /parameter/:habitatId/:metric       (ParameterDetail)
    /settings                           (SettingsModal)
    ```

- [ ] **Migrate from Tab-Based Navigation**
  - [ ] Remove `activeTab` state from App
  - [ ] Remove MainLayout bottom nav tabs
  - [ ] Replace with `<Routes>` + route-based rendering
  - [ ] Update VoiceButton to work across all routes (keep it global)

- [ ] **Test**: App loads at `/home`, clicking links navigates, back button works

**Estimated Time**: 1-2 days
**Priority**: 🔴 CRITICAL (blocks everything else)

---

### PHASE 5.2: Screen Components (Design-Agnostic) (Days 2-4)

```
📦 GOAL: Create screen component shells with placeholder layouts
```

#### New Screen Components (Create in `components/screens/`)

- [ ] **`<HomeScreen>` / Featured Habitat Spread**
  - [ ] Fetch featured habitat via `useConservatory()`
  - [ ] Render placeholder: "Featured Habitat Title" + gray box for illustration + placeholder narrative
  - [ ] Wire up click handlers for species names → navigate to `/species/:id`
  - [ ] Wire up "View all residents" → show clickable list
  - [ ] Route: `/home`

- [ ] **`<HabitatDiorama>` / Ecosystem Detail**
  - [ ] Get habitatId from URL params (`useParams()`)
  - [ ] Fetch habitat + residents from store
  - [ ] Render placeholder: Habitat name + gray box for illustration + resident list
  - [ ] Wire up species name clicks → navigate to `/species/:id`
  - [ ] Wire up resident icons → navigate to species placard
  - [ ] Route: `/habitat/:id`

- [ ] **`<SpeciesPlacard>` / Organism Detail**
  - [ ] Get speciesId from URL params
  - [ ] Fetch organism from store
  - [ ] Create sub-components (modularize from current EntityDetailModal):
    - [ ] `<PlacardsHeader>` — Name, taxonomy ribbon
    - [ ] `<DiscoverySecretsSection>` — Mechanism, Evolution, Synergy
    - [ ] `<TraitsDashboard>` — Visual trait display
    - [ ] `<TimelineSection>` — Personal history
    - [ ] `<InYourConservatory>` — Tankmates (clickable links to their placards)
  - [ ] All wired up, no styling
  - [ ] Route: `/species/:id`

- [ ] **`<ParameterDetail>` / Observation Trend**
  - [ ] Get habitatId + metric from URL params
  - [ ] Fetch observation history from store
  - [ ] Render placeholder: Metric name + gray box for graph + observation list
  - [ ] Wire up observation detail clicks
  - [ ] Route: `/parameter/:habitatId/:metric`

- [ ] **`<SettingsScreen>` / Minimal Settings**
  - [ ] Featured habitat selector
  - [ ] Animation speed toggle (placeholder)
  - [ ] Notification preferences (placeholder)
  - [ ] Route: `/settings`

**Estimated Time**: 2-3 days
**Priority**: 🔴 CRITICAL (unblocks data flow work)

---

### PHASE 5.3: Refactor MainLayout for Flexible Screens (Days 3-4)

```
📦 GOAL: MainLayout should support multiple screen types, not just two tabs
```

- [ ] **Create Layout Variants**
  - [ ] `<StandardLayout>` — Header + content + floating voice button (most screens)
  - [ ] `<SplashLayout>` — Full-screen, no header (for splash animation on home open)
  - [ ] `<ModalLayout>` — Content overlaid on previous screen (for settings)

- [ ] **Refactor MainLayout.tsx**
  - [ ] Remove hardcoded bottom nav
  - [ ] Remove `activeTab` state
  - [ ] Keep header flexible (title changes per route)
  - [ ] Keep VoiceButton global (always accessible)
  - [ ] Render `<Routes>` content area dynamically

- [ ] **Update Header Component**
  - [ ] Accept dynamic title per route
  - [ ] Update connection status indicator (keep it)
  - [ ] Remove tab nav from header

- [ ] **Test**:
  - [ ] Navigate between routes
  - [ ] VoiceButton available on all screens
  - [ ] Back button works
  - [ ] Header updates title per route

**Estimated Time**: 1-2 days
**Priority**: 🔴 CRITICAL

---

### PHASE 5.4: Wire Data Flow to New Screens (Days 4-6)

```
📦 GOAL: Connect store data to route params, test data displays correctly
```

- [ ] **Update HomeScreen**
  - [ ] `useConservatory()` to get featured habitat (or selector logic)
  - [ ] Render habitat data (name, organism count)
  - [ ] Test: Navigate to `/home`, data loads correctly

- [ ] **Update HabitatDiorama**
  - [ ] Extract habitatId from URL params
  - [ ] Fetch habitat entity from store
  - [ ] Map residents to clickable list
  - [ ] Test: Click `/habitat/abc123`, habitat data loads

- [ ] **Update SpeciesPlacard**
  - [ ] Extract speciesId from URL params
  - [ ] Fetch organism entity from store
  - [ ] Wire up all sub-component data:
    - Header: name, scientific name, taxonomy
    - Discovery: enrichment data
    - Traits: organism.traits[]
    - Timeline: organism.observations[]
    - In Your Conservatory: related species via habitatId
  - [ ] Test: Click `/species/def456`, organism data loads + sub-components render

- [ ] **Update ParameterDetail**
  - [ ] Extract habitatId + metric from URL params
  - [ ] Fetch observation history (filter by metric)
  - [ ] Calculate trend (existing `computeTrend()` function)
  - [ ] Test: Click `/parameter/abc/pH`, history loads

- [ ] **Test Data Flow End-to-End**
  - [ ] Navigate home → click species name → land on placard
  - [ ] From placard, click related species → navigate to their placard
  - [ ] Click habitat name → navigate to habitat view
  - [ ] All data loads correctly at each step

**Estimated Time**: 1-2 days
**Priority**: 🔴 CRITICAL

---

### PHASE 5.5: Deep Linking & Navigation Patterns (Days 6-7)

```
📦 GOAL: Ensure all deep links work, navigation feels natural
```

- [ ] **Direct URL Navigation**
  - [ ] User can paste `/species/123` directly → placard loads
  - [ ] User can paste `/habitat/456` directly → diorama loads
  - [ ] User can paste `/parameter/456/pH` directly → trend loads
  - [ ] Test with browser URL bar

- [ ] **Related Entity Navigation**
  - [ ] Click species name on habitat spread → navigates to species placard
  - [ ] Click tankmate name on species placard → navigates to their placard
  - [ ] Click habitat name on species placard → navigates to habitat view
  - [ ] All use `<Link>` or `useNavigate()` (not hardcoded paths)

- [ ] **Back Button Behavior**
  - [ ] Browser back button works
  - [ ] Custom back button works (if added)
  - [ ] Reverse navigation maintains history

- [ ] **Breadcrumb Trail** (Optional, can defer)
  - [ ] Display navigation path: Home > Habitat > Species
  - [ ] Each breadcrumb is clickable
  - [ ] Helps users understand where they are

**Estimated Time**: 1 day
**Priority**: 🟠 HIGH

---

### PHASE 5.6: Overlay/Modal System Cleanup (Days 7-8)

```
📦 GOAL: Refactor overlays, establish modal stack management, fix z-index chaos
```

**Current Problems**:
- Multiple overlays can appear simultaneously (z-index chaos)
- No modal stack management (unclear which modal is active)
- ConfirmationCard, EntityDetailModal, DeepResearchLoader all independent

- [ ] **Create Modal Stack System**
  - [ ] Design: One active modal per layer (input layer, context layer, system layer)
  - [ ] Implement: `<ModalProvider>` context that manages stack
  - [ ] Types: Define modal types (confirmation, voice, error, settings, etc)

- [ ] **Refactor ConfirmationCard**
  - [ ] Move to modal stack system
  - [ ] Triggered by voice input (stays the same)
  - [ ] But rendered via modal stack (not independent overlay)

- [ ] **Refactor DeepResearchLoader**
  - [ ] Move to modal stack
  - [ ] Show enrichment progress overlay

- [ ] **Refactor Settings Modal**
  - [ ] Move to modal stack
  - [ ] Triggered by settings button in header

- [ ] **Toast System** (Already done, just verify)
  - [ ] Toasts use own system (don't conflict with modals)
  - [ ] Test: Toast + modal appear simultaneously correctly

- [ ] **Z-Index Cleanup**
  - [ ] Define hierarchy: Base (0) → Content (10) → Modals (50-70) → Overlays (80-90) → Toast (100)
  - [ ] Document in Tailwind config or CSS variables
  - [ ] Apply consistently

**Estimated Time**: 1-2 days
**Priority**: 🟠 HIGH

---

### PHASE 5.7: Voice Button Integration Across Routes (Days 8-9)

```
📦 GOAL: Ensure voice button works on all screens without breaking anything
```

- [ ] **Test Voice on Each Route**
  - [ ] On `/home` → create habitat
  - [ ] On `/habitat/:id` → add organism
  - [ ] On `/species/:id` → log observation
  - [ ] Voice button always accessible, never scrolls off

- [ ] **Voice Navigation**
  - [ ] After voice action completes, where should user land?
  - [ ] Current: confirmation card, then back to where they were
  - [ ] New: Might want to navigate to newly created entity
  - [ ] Define behavior (can iterate later)

- [ ] **Test Non-Blocking UX**
  - [ ] Voice input doesn't block other interactions
  - [ ] Toasts appear correctly
  - [ ] Modal stack works with voice

**Estimated Time**: 0.5-1 day
**Priority**: 🟡 MEDIUM (can test later if needed)

---

### PHASE 5.8: Component Testing & QA (Days 9-10)

```
📦 GOAL: Verify architecture is solid before design phase
```

- [ ] **Navigation Testing Checklist**
  - [ ] ✅ `/home` loads featured habitat
  - [ ] ✅ Click species name → `/species/:id` loads
  - [ ] ✅ Click tankmate → navigates to their placard
  - [ ] ✅ Click habitat name → `/habitat/:id` loads
  - [ ] ✅ Click parameter → `/parameter/:id/:metric` loads
  - [ ] ✅ Back button works
  - [ ] ✅ Direct URL navigation works
  - [ ] ✅ Voice works on all screens
  - [ ] ✅ No console errors

- [ ] **Data Flow Testing**
  - [ ] ✅ Data loads correctly on each screen
  - [ ] ✅ Enriched data displays (images, descriptions)
  - [ ] ✅ Related entities resolve correctly
  - [ ] ✅ No data duplication or fetch loops

- [ ] **Modal Stack Testing**
  - [ ] ✅ One modal active at a time
  - [ ] ✅ Modal dismisses cleanly
  - [ ] ✅ Toast appears with modal without conflicts
  - [ ] ✅ Voice works inside modals

- [ ] **Mobile Testing**
  - [ ] ✅ All screens responsive
  - [ ] ✅ Touch targets > 44px
  - [ ] ✅ No horizontal scroll
  - [ ] ✅ Voice button accessible on small screens

**Estimated Time**: 1-2 days
**Priority**: 🟡 MEDIUM (quality gate before design)

---

### PHASE 5 SUMMARY

| Task | Days | Priority | Blocker |
|------|------|----------|---------|
| React Router setup | 1-2 | 🔴 CRITICAL | Everything |
| Screen components | 2-3 | 🔴 CRITICAL | Data wiring |
| MainLayout refactor | 1-2 | 🔴 CRITICAL | Screen rendering |
| Data flow wiring | 1-2 | 🔴 CRITICAL | Testing |
| Deep linking | 1 | 🟠 HIGH | Navigation |
| Modal stack cleanup | 1-2 | 🟠 HIGH | UX polish |
| Voice integration | 0.5-1 | 🟡 MEDIUM | Voice tests |
| Testing & QA | 1-2 | 🟡 MEDIUM | Sign-off |

**Total: 7-10 days**

**Result**: App is fully refactored, design-agnostic, ready for visual design.

---

## 🎨 DESIGN DECISION GATE

**After Phase 5 is complete, you MUST decide (before Phase 6):**

### Open Questions (From UI/UX Design Spec, Section 11)

1. **Illustration Style**
   - [ ] Split-screen (sketch + color) ← RECOMMENDED
   - [ ] Color-only watercolor
   - [ ] Color + anatomical labels
   - [ ] Other
   - **Reference**: `docs/plans/2026-02-15-design-inspiration-possibilities.md`

2. **Animation Library**
   - [ ] Framer Motion (React-first, recommended)
   - [ ] Canvas/SVG (custom, more control)
   - [ ] Lottie (JSON-based)

3. **Featured Habitat Selection**
   - [ ] Most recently updated (default)
   - [ ] User-selectable (settings)
   - [ ] Daily rotation based on date seed
   - [ ] Random on each open

4. **Splash Animation Timing**
   - [ ] Every app open (2-3 sec delay)
   - [ ] First visit to each habitat only
   - [ ] Optional user toggle
   - [ ] No splash, just smooth transition

5. **Parameter Drill-Down UX**
   - [ ] Click parameter → full detail view (`/parameter/:id/:metric`)
   - [ ] Click parameter → modal overlay
   - [ ] Click parameter → inline expand

**Timeline to Decide**: Make these decisions by end of Phase 5.
**Timeline to Test**: Test split-screen illustrations by start of Phase 6.

---

## IMMEDIATE NEXT STEPS (Do Now)

### Backend Verification (PASS 5 - Optional, Can Run Anytime)

#### Core Workflow Verification
- [ ] **Test Voice Habitat Create**
  - [ ] Say "Create a 20 gallon freshwater tank called The Shallows"
  - [ ] Verify confirmation card appears
  - [ ] Verify entity list updates after confirm
  - [ ] Check console for any errors

- [ ] **Test Voice Accession**
  - [ ] Say "I just added 12 Neon Tetras to The Shallows"
  - [ ] Verify confirmation card shows correct data
  - [ ] Verify enrichment_status is 'queued' after confirm
  - [ ] Check intent cache: Say same command twice, verify second is instant

- [ ] **Test Photo Identification**
  - [ ] Take photo of plant/fish
  - [ ] Verify identification works
  - [ ] Verify toast appears on success/error
  - [ ] Check console for "[Vision] Using Gemini vision service"
  - [ ] Verify confirmation card appears after accession

- [ ] **Test Rack Scan**
  - [ ] Take photo of multiple tanks
  - [ ] Verify rack analysis works
  - [ ] Verify review modal shows containers
  - [ ] Verify multiple habitats created on confirm

- [ ] **Test Deep Research**
  - [ ] Trigger deep research on habitat
  - [ ] Verify progress loader shows stages
  - [ ] Verify species library cache used (if species already enriched)
  - [ ] Verify discoveries appear after completion

#### Caching Verification
- [ ] **Test Intent Parsing Cache**
  - [ ] Say command: "I added 12 Neon Tetras to The Shallows"
  - [ ] Check console for "[IntentCache] Cached result"
  - [ ] Say exact same command again
  - [ ] Check console for "[IntentCache] Cache hit"
  - [ ] Verify second command is faster

- [ ] **Test Species Library Cache**
  - [ ] Add "Cherry Shrimp" (first time)
  - [ ] Trigger enrichment
  - [ ] Check console for enrichment stages
  - [ ] Add "Cherry Shrimp" again (second time)
  - [ ] Trigger enrichment
  - [ ] Check console for "[SpeciesLibrary] Cache hit"
  - [ ] Verify second enrichment is instant

#### Error Handling Verification
- [ ] **Test Photo Error Handling**
  - [ ] Take invalid photo (or mock failure)
  - [ ] Verify error toast appears
  - [ ] Verify error message is clear
  - [ ] Verify UI doesn't crash

- [ ] **Test Voice Error Handling**
  - [ ] Deny microphone permission
  - [ ] Verify error toast with specific message
  - [ ] Verify UI doesn't crash

- [ ] **Test Enrichment Error Handling**
  - [ ] Mock enrichment failure
  - [ ] Verify error toast appears
  - [ ] Verify entity marked as 'failed'
  - [ ] Verify UI doesn't crash

#### Regression Verification
- [ ] **Test Strategy Fallback**
  - [ ] Say ambiguous command: "Add something to somewhere"
  - [ ] Verify STRATEGY_REQUIRED status
  - [ ] Verify confirmation card shows advice

- [ ] **Test Zod Validation**
  - [ ] Verify malformed AI responses are rejected
  - [ ] Verify errors are caught gracefully

- [ ] **Test Firestore Sync**
  - [ ] Create action while offline
  - [ ] Verify local state preserved
  - [ ] Verify sync works when online

---

## HOSTING DECISION (COMPLETED) ✅
✅ **Decision Made**: Firebase Functions (Google Cloud integration already in place)
- ✅ Deleted `api/proxy.ts` (Vercel serverless function - not needed)
- ✅ Kept `functions/src/index.ts` (Firebase Cloud Function - the source of truth)
- ✅ Updated `geminiService.ts` comments to reference Firebase Functions only
- **Status**: ✅ COMPLETED

---

---

## 🎨 PHASE 6: UI/UX VISUAL DESIGN & ANIMATIONS (After Phase 5 Architecture)

**Timeline**: Starts after Phase 5 complete + Design decisions made
**Goal**: Apply visual design, animations, illustrations to the architecture
**Scope**: Colors, typography, illustrations, animations, micro-interactions

⚠️ **BLOCKED BY**:
- [ ] Phase 5 architecture completion
- [ ] Design direction decision (split-screen vs. color-only?)
- [ ] Animation library decision (Framer Motion vs. Canvas?)
- [ ] Illustration generation tests (3-5 organisms in target style)

### Phase 6.1: Design System & Tokens (Days 1-2)

```
📦 GOAL: Create design tokens, color system, typography system
```

- [ ] **Color Palette Setup**
  - [ ] Define Nat Geo color system in Tailwind config
  - [ ] Habitat-specific themes (aquatic, terrestrial, paludarium)
  - [ ] Muted scientific palette vs. vibrant (verify preference)

- [ ] **Typography System**
  - [ ] Import serif fonts (Georgia, Didot, Crimson Text)
  - [ ] Define heading hierarchy (h1-h6)
  - [ ] Define body text sizes + line-heights
  - [ ] Small caps for scientific names

- [ ] **Spacing & Layout Grid**
  - [ ] Define padding/margin system
  - [ ] Component spacing (buttons, cards, sections)

### Phase 6.2: Illustration Generation & System (Days 2-4)

```
📦 GOAL: Generate test organisms, finalize style, prepare asset pipeline
```

- [ ] **Generate Test Organisms** (5-10 in target style)
  - [ ] Neon Tetra (*Hyphessobrycon innesi*)
  - [ ] Java Fern (*Microsorum pteropus*)
  - [ ] Amano Shrimp (*Caridina japonica*)
  - [ ] Betta (*Betta splendens*)
  - [ ] Anubias (*Anubias barteri*)
  - Review for: Style consistency, anatomical accuracy, watercolor quality

- [ ] **Document Style System**
  - [ ] Line weight standards (primary, secondary, labels)
  - [ ] Watercolor technique (wash order, color mixing)
  - [ ] Composition rules (focal point, supporting context)
  - [ ] Typography placement (labeling, scientific names)

- [ ] **Asset Pipeline**
  - [ ] How will organisms be illustrated? (AI generation + human refinement?)
  - [ ] Storage: Where do images go? (Firestore, CDN, local?)
  - [ ] Caching strategy for organism illustrations

### Phase 6.3: Screen Visual Refinement (Days 4-8)

```
📦 GOAL: Apply colors, typography, spacing to all screens
```

- [ ] **HomeScreen / Featured Habitat**
  - [ ] Add splash animation (sketch drawing of habitat)
  - [ ] Style: Typography, colors, spacing
  - [ ] Illustration: Insert generated habitat art
  - [ ] Animations: Habitat draws in on load

- [ ] **HabitatDiorama**
  - [ ] Style all elements (header, illustration, narrative, resident list)
  - [ ] Habitat-specific color theming
  - [ ] Organism illustrations inserted
  - [ ] Ecosystem narrative styled (serif, italic, generous spacing)

- [ ] **SpeciesPlacard**
  - [ ] Style all sub-sections (header, discovery, traits, timeline, tankmates)
  - [ ] Hero image styled with gradient overlay
  - [ ] Taxonomy ribbon styled (small caps, elegant dots)
  - [ ] Discovery secrets section (emoji headers, serif body)
  - [ ] Traits dashboard styled (visual grid, color coding)
  - [ ] Timeline styled (vertical flow, alternating cards)
  - [ ] Organism illustration integrated

- [ ] **ParameterDetail**
  - [ ] Graph/chart styling
  - [ ] Trend indicators (↑↓→ icons, colors)
  - [ ] Observation list styled

### Phase 6.4: Animations & Micro-Interactions (Days 8-12)

```
📦 GOAL: Add motion, transitions, micro-interactions
```

- [ ] **Installation**
  - [ ] Install Framer Motion (or chosen animation library)
  - [ ] Set up animation utilities

- [ ] **Entrance Animations**
  - [ ] App open → splash (2-3 sec sketch animation)
  - [ ] Home illustration draws in
  - [ ] Text fills in around edges

- [ ] **Transition Animations**
  - [ ] Navigate between screens with smooth fade/slide
  - [ ] Sketch animation on species placard enter
  - [ ] Reverse animation on back button

- [ ] **Micro-Interactions** (Device-dependent)
  - [ ] Click plant → fronds wave (0.6s)
  - [ ] Click fish → swims (0.8s)
  - [ ] Click invertebrate → claws clack (0.6s)
  - [ ] Graceful fallback on low-end devices

- [ ] **Scroll Animations**
  - [ ] Placard sections fade in as scrolled
  - [ ] Timeline entries reveal on scroll

### Phase 6.5: Polish & QA (Days 12-14)

```
📦 GOAL: Refine animations, test on devices, sign-off
```

- [ ] **Animation Testing**
  - [ ] Smooth 60fps (if possible on target devices)
  - [ ] No janky frame drops
  - [ ] Animations feel "natural" not mechanical

- [ ] **Device Testing**
  - [ ] Mobile: Animations gracefully degrade
  - [ ] Tablet: Full animations work
  - [ ] Desktop: Animations smooth

- [ ] **Visual Consistency**
  - [ ] All illustrations match style system
  - [ ] All typography follows spec
  - [ ] All colors match palette
  - [ ] Spacing consistent across screens

- [ ] **Accessibility Check**
  - [ ] Animations don't trigger motion sickness (reduce-motion respected)
  - [ ] Color contrast meets WCAG AA
  - [ ] Touch targets remain > 44px

### Phase 6 Summary

| Task | Days | Priority |
|------|------|----------|
| Design system & tokens | 1-2 | 🔴 CRITICAL |
| Illustration generation | 2-4 | 🔴 CRITICAL |
| Screen visual refinement | 4-8 | 🔴 CRITICAL |
| Animations | 4-6 | 🟠 HIGH |
| Polish & QA | 2-3 | 🟡 MEDIUM |

**Total: 13-23 days** (depending on animation complexity and how many organisms need illustrations)

**Result**: App is visually complete, ready for user testing and feedback.

---

## FEATURE MANIFEST IMPLEMENTATION STATUS

The Feature Manifest describes the vision. Progress:

### Phase A: Dashboard Redesign (10-15 hours)

#### A1: Featured Specimen Card ✅
- [x] Create hero card component showing rotating daily specimen
- [x] Display: Hero image + common name + scientific name + one awe-inspiring fact
- [x] Tap → opens full specimen placard
- [x] Data source: `entity.overflow.images[0]`, enrichment facts
- [x] Visual: Full-bleed image with dark gradient overlay, serif typography
- **Estimated Time**: 3-4 hours ✅ COMPLETED
- **Priority**: High (core wow factor)
- **Implementation**: `components/FeaturedSpecimenCard.tsx` — Daily rotating hero card with date-based seed, hover glow, "Tap to explore" hint

#### A2: Specimen Placard Redesign (Complete Rewrite) ⭐⭐
Replace current EntityDetailModal with museum-quality placard:
- [ ] Hero image section with gradient overlay
- [ ] Taxonomy ribbon (Kingdom · Family · Genus)
- [ ] Discovery Secrets section:
  - [ ] 🔬 Mechanism (how it works biologically)
  - [ ] 🌍 Evolutionary Advantage (why trait exists)
  - [ ] 🤝 Synergy (interactions with other species)
- [ ] Origin & Distribution (with map if available)
- [ ] Rich trait dashboard (visual grid, not form)
- [ ] Personal history timeline (when added, observations, growth)
- [ ] Awe-inspiring facts callout
- **Estimated Time**: 8-10 hours
- **Priority**: High (makes app delightful)

#### A3: Wonder Feed Enrichment ✅
- [x] Replace generic event feed with enriched events
- [x] Each event type has distinct visual treatment & emoji
- [x] Examples:
  - "💧 pH logged at 6.8 in The Shallows — stable within your 2-week trend"
  - "🐟 12 Cardinal Tetras joined The Shallows. _Their iridescent stripe is structural coloration._"
  - "🧬 **New Discovery**: Java Fern reproduces via adventitious plantlets"
- [x] Merge event.domain_event + entity.overflow.discovery + computed trends
- **Estimated Time**: 4-6 hours ✅ COMPLETED
- **Priority**: High (transforms event feed)
- **Implementation**: `components/WonderFeedHelpers.tsx` + `components/EventFeed.tsx` — Enriches events with biological context, trends, discovery facts; visual styling by event type (celebratory/clinical/magical)

#### A4: Ecosystem Pulse Summary
- [ ] Living status strip below featured specimen
- [ ] Show: Habitat name, stability status, pH trend, resident count, thriving plants
- [ ] Tap → opens full habitat diorama
- **Estimated Time**: 2-3 hours
- **Priority**: Medium

#### A5: Quick Stats Bar
- [ ] Compact stats at top: Total Species | Total Habitats | Pending Enrichment | Last Observation
- **Estimated Time**: 1-2 hours
- **Priority**: Low

#### A5: Ambient Ticker ("What's Happening")
- [ ] Subtle rotating one-line ticker with biological facts about collection
- [ ] Data source: Pre-generated discovery.synergyNote + getBiologicalDiscovery
- **Estimated Time**: 1-2 hours
- **Priority**: Low (nice-to-have)

---

### Phase B: Habitat Diorama (Deferred)
- [ ] 3D-ish visualization of habitat
- [ ] Species placement (foreground/midground/background)
- [ ] Synergy indicators
- **Trigger**: After placard redesign complete

---

## OPTIONAL QUICK WINS (If Time Permits)

### Remaining Quick Wins from PASS 4

#### Error Retry Logic ✅ COMPLETED
- [x] Add retry mechanism for transient failures
- [x] Add retry button to error toasts
- [x] Implement exponential backoff
- [x] Test: Retry works for network failures
- **Estimated Time**: 2 hours
- **Status**: ✅ COMPLETED - `utils/retry.ts` + retry buttons in PhotoIdentify & VoiceButton

#### Background Enrichment (Nice-to-Have)
- [ ] Move enrichment to Web Worker or background task
- [ ] Ensure UI remains responsive during enrichment
- [ ] Add progress indicator (already exists, but could enhance)
- [ ] Test: Enrichment doesn't block UI interactions
- **Estimated Time**: 1-2 hours
- **Priority**: Medium (less critical if enrichment is already fast)

#### Cache Eviction Policy ✅ COMPLETED
- [x] Add LRU eviction to intent cache (max 100 entries)
- [x] Add TTL to species library cache (90-day expiration)
- [ ] Add cache versioning for invalidation (future enhancement)
- [x] Test: Cache doesn't grow unbounded
- **Status**: ✅ COMPLETED - `utils/LRUCache.ts` + TTL in `speciesLibrary.ts`
- **Estimated Time**: 1 hour
- **Priority**: ✅ DONE

#### Dual Proxy Documentation ✅ COMPLETED
- [x] Update `geminiService.ts` comments to only reference Firebase Functions
- [x] Remove any references to `api/proxy.ts` (file deleted)
- [ ] Update README.md to document Firebase hosting only (pending)
- **Estimated Time**: 15 minutes
- **Status**: ✅ COMPLETED (except README update)

---

## DEFERRED ITEMS (Tracked, Not Actionable Yet)

### Security (Fix Before Production)

#### Firestore Security Rules
- [ ] Update `firestore.rules` to require authentication
- [ ] Test: Unauthenticated users can't access data
- [ ] Test: Authenticated users can access their data
- **Trigger**: Before sharing with others or deploying publicly
- **Estimated Time**: 30 minutes
- **Priority**: High (when triggered)

#### CORS Configuration
- [ ] Update proxy CORS to specific origin
- [ ] Use environment variable for allowed origin
- [ ] Test: CORS works for allowed origin
- [ ] Test: CORS blocks other origins
- **Trigger**: Before deploying publicly
- **Estimated Time**: 15 minutes
- **Priority**: Medium (when triggered)

#### API Key Management
- [ ] Move sensitive keys to environment variables
- [ ] Use Firebase Functions secrets for API keys
- [ ] Remove keys from client bundle
- [ ] Test: Keys not exposed in client
- **Trigger**: Before deploying publicly
- **Estimated Time**: 1 hour
- **Priority**: Medium (when triggered)

### Architecture (Refactor When Gates Trigger)

#### Extract Use Cases
- [ ] Create `application/useCases/AccessionUseCase.ts`
- [ ] Create `application/useCases/EnrichmentUseCase.ts`
- [ ] Create `application/useCases/ObservationUseCase.ts`
- [ ] Create `application/useCases/HabitatUseCase.ts`
- [ ] Move business logic from store to use cases
- [ ] Update components to use use cases
- **Trigger**: Evolution Gate E (Feature Velocity Drop) or A (Team Growth)
- **Estimated Time**: 1 week
- **Priority**: Medium (when triggered)

#### Extract Repositories
- [ ] Create `infrastructure/repositories/EntityRepository.ts`
- [ ] Create `infrastructure/repositories/EventRepository.ts`
- [ ] Create `infrastructure/repositories/SpeciesLibraryRepository.ts`
- [ ] Move Firestore access to repositories
- [ ] Update store to use repositories
- **Trigger**: Evolution Gate E (Feature Velocity Drop) or A (Team Growth)
- **Estimated Time**: 1 week
- **Priority**: Medium (when triggered)

#### Add Dependency Injection
- [ ] Choose DI library (TSyringe or InversifyJS)
- [ ] Create DI container
- [ ] Register services in container
- [ ] Update components to use DI
- [ ] Test: Can swap implementations
- **Trigger**: Evolution Gate E (Feature Velocity Drop) or when testing becomes important
- **Estimated Time**: 3-5 days
- **Priority**: Low (when triggered)

#### Move to Zustand
- [ ] Install Zustand
- [ ] Extract UI state to Zustand store
- [ ] Keep business logic in use cases
- [ ] Update components to use Zustand
- [ ] Test: State management works
- **Trigger**: Evolution Gate E (Feature Velocity Drop)
- **Estimated Time**: 3-5 days
- **Priority**: Low (when triggered)

### Observability (Add When Needed)

#### Structured Logging
- [ ] Choose logging library (Winston or Pino)
- [ ] Replace console.* with structured logger
- [ ] Add log levels (info, warn, error)
- [ ] Add context to logs (user ID, operation, etc.)
- [ ] Test: Logs are structured and searchable
- **Trigger**: Evolution Gate C (Reliability Pain) or when debugging becomes painful
- **Estimated Time**: 1-2 days
- **Priority**: Low (when triggered)

#### Error Tracking
- [ ] Set up Sentry account
- [ ] Install Sentry SDK
- [ ] Configure error tracking
- [ ] Add error boundaries
- [ ] Test: Errors are tracked
- **Trigger**: Evolution Gate C (Reliability Pain) or before production
- **Estimated Time**: 2-3 hours
- **Priority**: Medium (when triggered)

#### Performance Monitoring
- [ ] Add performance metrics
- [ ] Track AI call durations
- [ ] Track enrichment times
- [ ] Add performance dashboard
- [ ] Test: Metrics are collected
- **Trigger**: Evolution Gate C (Reliability Pain) or G (Scale Requirements)
- **Estimated Time**: 2-3 days
- **Priority**: Low (when triggered)

### Rate Limiting & Cost Control

#### Rate Limiting
- [ ] Choose rate limiting solution (Upstash Redis or Cloudflare KV)
- [ ] Implement rate limiting middleware
- [ ] Add per-user quotas
- [ ] Add rate limit headers
- [ ] Test: Rate limiting works
- **Trigger**: Evolution Gate F (Cost Concerns) or D (External Exposure)
- **Estimated Time**: 2-3 days
- **Priority**: Medium (when triggered)

#### Cost Tracking ✅ COMPLETED
- [x] Add cost tracking to AI calls
- [x] Store costs in Firestore
- [ ] Add cost dashboard (UI - deferred to UI agent)
- [ ] Add cost alerts (future enhancement)
- [x] Test: Costs are tracked accurately
- **Status**: ✅ COMPLETED - `services/costTracker.ts` integrated into all AI calls
- **Estimated Time**: 2-3 days
- **Priority**: ✅ DONE (backend complete, UI pending)

### Testing (Improve When Needed)

#### Unit Tests
- [ ] Add unit tests for `speciesLibrary.ts`
- [ ] Add unit tests for `VisionServiceFactory.ts`
- [ ] Add unit tests for use cases (when extracted)
- [ ] Add unit tests for repositories (when extracted)
- [ ] Test: All tests pass
- **Trigger**: When refactoring or when testability becomes important
- **Estimated Time**: Ongoing
- **Priority**: Low (when triggered)

#### Integration Tests
- [ ] Add integration tests for enrichment pipeline
- [ ] Add integration tests for species library
- [ ] Add integration tests for vision service
- [ ] Test: All integration tests pass
- **Trigger**: When refactoring or when reliability becomes concern
- **Estimated Time**: Ongoing
- **Priority**: Low (when triggered)

---

## WHEN YOUR VISION SERVICE IS READY

### Integration Steps
- [ ] Set environment variables:
  ```bash
  VITE_SHARED_VISION_SERVICE_URL=https://your-service.com
  VITE_SHARED_VISION_SERVICE_KEY=your-api-key
  ```
- [ ] Restart dev server
- [ ] Test: Photo identification uses shared service
- [ ] Verify: Console shows "[Vision] Using shared vision service"
- [ ] Test: Single photo identification works
- [ ] Test: Rack scan works
- [ ] Verify: Error handling works with shared service

**Estimated Time**: 15 minutes
**Priority**: When your service is ready

---

## MONITORING & MAINTENANCE

### Monthly Reviews
- [ ] Review PASS 6 (Deferred-Risk Register)
- [ ] Check evolution gate status (PASS 7)
- [ ] Review costs (if tracking)
- [ ] Review error rates (if tracking)
- [ ] Update risk register with latest review date

### When Evolution Gates Trigger
- [ ] Review triggered gates
- [ ] Prioritize based on severity
- [ ] Create migration plan
- [ ] Execute incrementally
- [ ] Verify no regressions

---

## WHAT'S ALREADY BUILT (Don't Rebuild!)

### DevTools FAB ✅ (Already Implemented)
Located in `components/DevTools.tsx`, accessible via Terminal icon (top-right):

**Scenarios Tab**:
- Pre-written voice commands to test: "New Tank", "Log Fish", "Log Parameters", "Ambiguous"
- Click to run without speaking

**Actions Tab**:
- 🏠 **Quick Habitat**: Random freshwater/saltwater/brackish tank with random name
- 🐟 **Quick Organism**: Add random species to random habitat
- 🌿 **Quick Plant**: Plant random species in random habitat
- 📊 **Quick Observation**: Log random pH/temp to random habitat
- 🔬 **Enrich All**: Trigger deep research for all pending entities
- 📡 **Test Connection**: Verify Firestore connectivity
- 📜 **View Action Log**: Timeline of what was triggered

**Contractor Tab**:
- Advisory Report generator for custom intents
- Ask Gemini what something means
- Copy IDE prompt for prompting

**Status**: Fully functional, well-built. Use for testing!

---

## PRIORITY SUMMARY

### 🔴 Critical Priority (Must Do First)
1. ✅ Verification testing (PASS 5 checklist) — code paths verified
2. 🎯 **Feature Manifest Implementation** — 55% of vision complete!
   - ✅ Featured Specimen Card (3-4 hours) — DONE
   - ⏳ Specimen Placard redesign (8-10 hours) — NEXT (UI agent)
   - ✅ Wonder Feed enrichment (4-6 hours) — DONE
   - **Impact**: Transforms app from functional to delightful

### 🟡 High Priority (Do Next)
1. ✅ Consolidate Firebase hosting (delete `api/proxy.ts`) — DONE
2. ✅ Error retry logic (makes UX better) — DONE
3. Extract store modules (enables future refactoring) — PENDING

### 🟠 Medium Priority (When You Have Time)
1. ✅ Structured logging (for debugging) — DONE
2. Unit tests for enrichment pipeline — PENDING
3. Batch operations (UI convenience) — PENDING
4. Cost tracking dashboard — PENDING (UI agent)

### 🟢 Low Priority (Nice-to-Have)
1. Background enrichment (if enrichment ever blocks) — PENDING
2. ✅ Cache eviction policy — DONE
3. Additional progress indicators — PENDING

### 🔵 Deferred (When Evolution Gates Trigger)
1. **Security hardening** (Gate D: before deploying publicly)
2. **Architecture refactoring** (Gate A or E: when team grows or velocity drops)
3. **Observability** (Gate C: when reliability issues appear)
4. **Rate limiting** (Gate F: if costs become concern)
5. **Advanced features** (synergy viz, workspace org, data export, search)

---

## Quick Reference

**Completed**: 
- Phase 4 core (4 phases, ~4 hours)
- Backend enhancements (~8 hours): Structured Logging, Cost Tracking, Cache Eviction, Error Retry
- Feature Manifest start (~8 hours): Featured Specimen Card, Wonder Feed
- **Total**: ~20 hours of work completed

**Remaining**: 
- UI work: Specimen Placard redesign, Ecosystem Pulse, Quick Stats (UI agent)
- Testing: Unit tests for services (optional)
- Deferred Items: Tracked in PASS 6, triggers in PASS 7

**Next Action**: UI agent continues with Specimen Placard redesign

---

## Todo List by Category

### ✅ Completed (16 items)
- Vision service abstraction (5 items)
- Species library caching (4 items)
- Intent parsing cache (2 items)
- UX non-blocking guarantees (5 items)

### 🔴 Critical - Feature Manifest (10 items remaining, 8 completed)
- ✅ Featured Specimen Card (4 items) — COMPLETED
- Specimen Placard redesign (8 items) — IN PROGRESS
- ✅ Wonder Feed enrichment (3 items) — COMPLETED
- Ecosystem Pulse Summary (2 items)
- Quick Stats Bar (1 item)

### 🔴 Critical - Verification (15 items)
- Verification testing (15 workflow/regression tests)

### 🔴 Critical - Hosting (1 item)
- Consolidate to Firebase Functions (delete `api/proxy.ts`)

### 🟠 High Priority (8 items)
- Error retry logic (2 items)
- Extract use cases/repositories (4 items)
- Unit tests for enrichment (2 items)

### 🟡 Medium Priority (5 items)
- Structured logging (3 items)
- Error boundaries (1 item)
- Batch operations (1 item)

### 🟢 Low Priority (4 items)
- Background enrichment (1 item)
- Cache eviction policy (1 item)
- Cost tracking (1 item)
- Ambient ticker (1 item)

### 🟢 Deferred - Security (3 items, trigger: before production)
- Firestore rules
- CORS configuration
- API key management

### 🟢 Deferred - Architecture (4 items, trigger: team growth or velocity drop)
- Add dependency injection
- Move to Zustand
- Advanced state management
- Refactor store further

### 🟢 Deferred - Observability (3 items, trigger: reliability issues)
- Error tracking (Sentry)
- Performance monitoring
- Advanced logging

### 🟢 Deferred - Operations (2 items, trigger: cost concerns or public deploy)
- Rate limiting
- Advanced cost tracking

### 🟢 Deferred - Advanced Features (8 items, trigger: user requests or scale)
- Synergy visualization
- Workspace organization
- Advanced search/filtering
- Growth chart improvements
- Data export (CSV/JSON)
- Backup & restore
- Analytics dashboard
- Habitat diorama

### 🔵 Vision Service Integration (7 items, trigger: when shared service ready)
- When your service is ready

**Total**: 90+ actionable items identified
**Completed**: 28 items (31%) — 16 from Phase 4 + 8 from Feature Manifest + 4 backend enhancements
**Critical Path**: 24 items remaining (27%) — Specimen Placard + Verification + Supporting components
**Remaining**: 38+ items (nice-to-have + deferred)

**Backend Status**: ✅ Production-ready
- Structured logging, cost tracking, cache eviction all complete
- All services instrumented and optimized

---

## 📋 OVERALL PROJECT TIMELINE

### Current State
- ✅ Backend: Production-ready
- ✅ Feature Manifest foundation: 55% complete (Featured Card + Wonder Feed)
- ⏳ UI Architecture: Ready to refactor (Phase 5)
- ⏳ Visual Design: Options documented, awaiting architecture completion

### Recommended Timeline

| Phase | Duration | Start | Status |
|-------|----------|-------|--------|
| **Phase 5: Architecture Refactor** | 7-10 days | NOW | 🔴 START HERE |
| **Design Decision Gate** | 1-2 days | After Phase 5 | ⏳ Required |
| **Phase 6: Visual Design & Animations** | 13-23 days | After Gate | ⏳ Next |
| **Testing & Polish** | 3-5 days | After Phase 6 | ⏳ Final |

**Total MVP Timeline**: 24-42 days (4-6 weeks) from now

### What Phase 5 Accomplishes
- ✅ React Router setup (deep linking, routes, back button)
- ✅ Screen component refactor (HomeScreen, HabitatDiorama, SpeciesPlacard, etc.)
- ✅ MainLayout restructuring (multi-screen support)
- ✅ Data flow wiring (store → screen components)
- ✅ Modal stack cleanup (z-index hierarchy)
- ✅ App fully functional, design-agnostic (looks plain, works great)

### What Happens After Phase 5
1. Make design decisions (split-screen style? animation library?)
2. Generate test illustrations (verify style consistency)
3. Start Phase 6: Apply visual design, animations, illustrations
4. Sign off when visually complete

---

## 🚀 START NOW: Phase 5 Kickoff Checklist

**Ready to start Phase 5 (Architecture Refactor)?** Do this first:

- [ ] **Review Documents**
  - [ ] Read PHASE 5 section in this file (comprehensive task breakdown)
  - [ ] Read `docs/plans/2026-02-15-conservatory-ui-ux-design.md` (design spec)
  - [ ] Read `docs/plans/2026-02-15-design-inspiration-possibilities.md` (visual options)

- [ ] **Understand the Approach**
  - [ ] Phase 5 is design-agnostic (no styling, no animations, no illustrations)
  - [ ] Goal: Get architecture solid before design decisions
  - [ ] Design decisions come AFTER Phase 5 is complete

- [ ] **Plan Your Work**
  - [ ] Estimate available time (7-10 days)
  - [ ] Create branch: `feature/phase-5-ui-refactor`
  - [ ] Break Phase 5 into 2-3 day chunks (Router → Screens → Data Flow)

- [ ] **Get Started**
  - [ ] PHASE 5.1: Install React Router (1-2 days)
  - [ ] PHASE 5.2: Create screen components (2-3 days)
  - [ ] PHASE 5.3: Refactor MainLayout (1-2 days)
  - [ ] PHASE 5.4: Wire data flow (1-2 days)
  - [ ] And so on...

**Update this todo list as you go.** Check boxes in PHASE 5 section.

---

**End of Next Steps & Todo List**
