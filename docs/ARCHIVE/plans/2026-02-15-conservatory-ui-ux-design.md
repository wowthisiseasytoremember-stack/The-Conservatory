# The Conservatory: UI/UX Design Specification

**Date**: 2026-02-15
**Status**: PROPOSED DESIGN (Review & Approval Required Before Implementation)
**Design Lead**: Claude Code
**Scope**: MVP Phase 1 (Beautiful App Experience)

---

## Executive Summary

The Conservatory transforms from a utility app into a **living field guide crossed with a nature documentary about your own ecosystem**. Users open the app to discover, learn, and feel pride in what they steward — not to perform maintenance.

**Core Experience:**
1. Open app → Habitat illustration sketches itself in real-time → Text fills in → Land on beautiful Nat Geo-style spread
2. Click any species name, plant, parameter → Smooth animation transition → Deep dive into that organism's placard
3. Navigate between related species, habitats, and discoveries through natural, intuitive clicking
4. All interactions feel right — buttons do what you expect (original iOS design philosophy)

**Design Philosophy:**
- **Not a maintenance tool** — that's what the voice button is for
- **Not an AI playground** — curation over complexity
- **Not iNaturalist or Kew Gardens** — this is *your* ecosystem, beautifully presented
- **Museum + Documentary + Field Journal** — evoke awe, knowledge, pride

---

## 1. INFORMATION ARCHITECTURE

### 1.1 Core Entities

The app manages three levels of content:

1. **Habitats** (containers)
   - Aquariums (freshwater, saltwater, brackish)
   - Terrariums (closed, open, paludarium)
   - Vivariums
   - Single potted plants
   - Any ecosystem your user curates

2. **Organisms** (living things)
   - Fish, invertebrates, plants, fungi, anything alive
   - Belong to a habitat
   - Have enriched data (discovery secrets, traits, images)

3. **Observations** (user events)
   - Accessions (added something new)
   - Measurements (growth, pH, temp, behavior)
   - Notes (qualitative observations)
   - Enrichment completions (discoveries unlocked)

### 1.2 Navigation Model

**Deep Linking Principle**: Everything that's clickable goes somewhere.

```
HOME (Featured Habitat Spread)
  ↓ Click species name
  SPECIES PLACARD (Individual organism)
    ↓ Click related species / tankmate
    → OTHER SPECIES PLACARD (smooth transition)
    ↓ Click "In Your Conservatory"
    → HABITAT SPREAD (return to habitat)
  ↓ Click plant name
  SPECIES PLACARD (for that plant)
  ↓ Click parameter (pH, temp)
  PARAMETER DETAIL (observation history, trend)
  ↓ Swipe back
  → Previous spread (with reverse animation)
```

**No dead ends.** Every clickable element is a portal to related content.

---

## 2. SCREEN DESIGNS

### 2.1 HOME SCREEN / FEATURED HABITAT SPREAD

**What the user sees when opening the app:**

**Phase 1: Splash Animation (2-3 seconds)**
- Featured habitat illustration *draws itself* in real-time
- "Invisible hands" sketch the ecosystem (plants, water, organisms)
- Scientific labels and species names appear as the drawing completes
- Text/narrative fills in around the illustration
- Subtle ambient sound (optional: gentle water sounds, nature ambience)
- No interaction required — user watches and absorbs

**Phase 2: Lands on Full Spread (Interactive)**
- Beautiful Nat Geo magazine spread
- Layout (mobile-first):
  - **Header**: Habitat name + type badge (Freshwater/Terrarium/Paludarium/etc)
  - **Illustration**: Full watercolor ecosystem illustration (clickable)
  - **Narrative**: Field journal text in serif italic ("Field Journal" label)
  - **Species callouts**: Each organism labeled with common + scientific name
  - **Quick stats**: Residents count, thriving plants, dominant water parameters

**Clickable Elements**:
- Any species name → Sketch animation → Species placard
- Plant/organism illustration → Same as above
- Water parameter callout (pH, temp) → Parameter detail view
- "View all residents" link → List of all organisms (all clickable)
- "Tankmates" or "Residents" section → Species directory for this habitat

**Animation on Hover/Tap** (device-dependent, optional):
- Click a plant → Fronds wave gently in water/air
- Click a fish → Swims across briefly
- Click an invertebrate → Moves, claws clack, antennae twitch
- (Only if device can handle it; graceful fallback to static illustration on older devices)

**Design Notes**:
- No forms on this screen
- No "add" or "edit" buttons in the primary view (voice button lives here, subtle)
- Everything is about discovery, not data entry

---

### 2.2 SPECIES PLACARD (Individual Organism Detail)

**User lands here by clicking a species name from any habitat spread.**

**Opening Animation**:
- Organism illustration draws in as you land
- Text fills in as you scroll
- Smooth transition from previous spread

**Layout** (mobile-first, scroll-based):

#### Header
```
[Organism illustration - draws in]
Scientific name ribbon: "Phylum Chordata · Family Characidae · Genus Hyphessobrycon"
Common name + variant: "Neon Tetra (Cardinal variant)"
```

#### Discovery Secrets (The "Why")
```
🔬 MECHANISM
"Neon tetras owe their iridescent stripe to guanine crystals in their skin,
not pigment. Light refracts through the crystals, creating the electric blue glow.
This coloration helps them signal to schoolmates in the murky Amazon waterways."

🌍 EVOLUTIONARY ADVANTAGE
"In the wild, this coloration serves multiple purposes: species recognition
in dense vegetation, dominance signaling within schools, and predator confusion
(the stripe makes their outline harder to track when they move together)."

🤝 SYNERGY
"In your aquarium, Neon Tetras school tightly with cardinal tetras and other
small cyprinids. They occupy the mid-water column, which reduces competition
with your bottom-dwelling shrimp and plants that need the substrate."
```

#### Traits Dashboard
Visual grid showing:
- **For fish**: Water params (pH range, temp, salinity), diet, behavior, swimming level
- **For plants**: Light req, CO2 needs, growth rate, placement, difficulty
- **For invertebrates**: Diet, molting cycle, social structure, habitat req

Each trait has an icon + visual indicator (no forms, just info display).

#### Personal History Timeline
Vertical timeline of this organism's life in your conservatory:
```
Feb 15 — Added to The Shallows (x12)
Feb 18 — First spawning observed
Feb 20 — 3 fry surviving
Mar 1 — Growth +2.3cm (avg)
```

#### In Your Conservatory
Footer section:
```
"Lives in THE SHALLOWS with 7 tankmates:
Cardinal Tetra (x8) | Amano Shrimp (x4) | Java Fern (x2)"
```
All names are clickable → Navigate to their placard.

#### Voice Button + Observation Logger
Floating FAB: "Voice" button (always accessible)
Tap → Log observation or new info about this organism (non-blocking)

**Clickable Elements**:
- Any organism name in traits/synergy → Species placard for that organism
- Habitat name → Back to habitat spread
- Related species → Navigate with sketch animation
- Swipe/back gesture → Return to previous spread

**Design Notes**:
- Everything scrollable, nothing cut off
- Serif typography for narratives (evokes field journal)
- Emerald accents for plant-related content, cyan for aquatic, amber for invertebrates
- On older devices, illustrations are static; on newer devices, subtle hover animations

---

### 2.3 PARAMETER DETAIL VIEW (Observation History)

**User lands here by clicking a water parameter (pH, temp, etc.) from a habitat spread.**

**What shows**:
- Parameter name + current value
- Sparkline graph of history over last 30 days
- Trend indicator (↑ rising, ↓ falling, → stable)
- Optimal range for organisms in this habitat
- Related observations (notes, events)
- "Log new observation" button (voice)

**Design**:
- Same Nat Geo aesthetic, but more clinical/scientific focus
- Smaller layout, fits in a modal or sidebar
- Quick reference, not deep dive

---

## 3. VISUAL LANGUAGE & DESIGN SYSTEM

### 3.1 Core Aesthetic: Nat Geo Magazine × Darwin's Field Journal

**Inspiration**:
- National Geographic magazine spreads (watercolor illustrations, elegant typography, scientific accuracy)
- Darwin's field journals (detailed naturalist observations, beautiful handwriting)
- BBC Planet Earth title sequences (cinematic, respectful, awe-inspiring)
- Monterey Bay Aquarium's graphics (clean, educational, beautiful)

**NOT**:
- Photorealism with AI hallucinations
- Cluttered data dashboards
- Generic app UI
- Janky animations (Windows screensaver energy)

### 3.2 Illustration Style

**Universal Approach**: One cohesive watercolor + linework aesthetic, themed by habitat type.

**Execution**:
- Watercolor wash backgrounds + clean ink linework
- Muted, scientific color palettes (no neon or oversaturated)
- Anatomically intentional (intentional artistic choices, not AI mistakes)
- Species labeled clearly
- Ecosystem relationships shown (food chains, spatial layering)

**Habitat-Specific Theming** (color palette shifts, not illustration style):

| Habitat Type | Primary Colors | Mood |
|---|---|---|
| Aquatic (Freshwater) | Slate, muted greens, cool blues, cream | Serene, cool, underwater |
| Aquatic (Saltwater) | Deep blues, teals, warm sand, cream | Rich, tropical, clear |
| Terrarium | Earth browns, moss greens, warm grays | Intimate, earthy, warm |
| Paludarium | Blend of aquatic + terrestrial | Liminal, transitional |
| Single Plant | Botanical green, warm cream, natural tones | Intimate, focused, botanical |

**Typography**:
- **Headers**: Serif (Georgia, Didot, Crimson Text) in emerald or slate
- **Narratives**: Serif italic for field journal passages
- **Labels**: Small caps, slate-400, elegant and clear
- **Data**: Readable sans-serif for measurements and timestamps

**Color Palette**:
- **Primary accent**: Emerald-500 (life, growth, discovery)
- **Secondary accent**: Slate-600 (science, structure, observation)
- **Tertiary accents**:
  - Cyan-500 (aquatic features, water parameters)
  - Amber-500 (invertebrates, special organisms)
  - Moss-600 (plants, photosynthesis)
- **Backgrounds**: Cream (#F5F3F0), soft white, watercolor wash overlays
- **Text**: Slate-800 on cream, white on dark overlays

**Decorative Elements**:
- Ornamental dividers (inspired by Nat Geo mastheads)
- Watercolor frames around illustrations
- Small NG-style badge/seal for enrichment status
- Film grain overlay (subtle, 2-5% opacity) for texture

### 3.3 Motion & Animation

**Philosophy**: Intentional delight, not distraction. Device-aware.

**Core Animations**:

1. **App Open → Habitat Illustration Sketching**
   - Duration: 2-3 seconds
   - Effect: SVG animation or Lottie file of hands drawing the ecosystem
   - Text fills in around the edges as drawing completes
   - Smooth ease-out curve
   - Quality: High-fidelity, not janky

2. **Navigation Transitions**
   - Click species name → Organism sketches in, text appears
   - Habitat → Species: Smooth fade + draw animation
   - Species → Habitat: Reverse animation, back feels right
   - Duration: 0.8-1.2 seconds

3. **On-Click Interactions** (only if device can handle)
   - Click plant → Fronds wave gently (0.6s duration)
   - Click fish → Swims across (0.8s duration)
   - Click invertebrate → Moves, claws clack (0.6s duration)
   - Only trigger on explicit tap, not hover on mobile
   - Graceful fallback: Static illustration on older devices

4. **Scroll Animations**
   - As user scrolls species placard, sections fade in
   - Illustrations appear/draw as they enter viewport
   - Subtle, supporting the content flow

**Device Strategy**:
- **High-end devices** (iPhone 14+, newer Android): Full animations
- **Mid-range devices**: Simplified animations, longer duration, lower frame rate
- **Low-end devices**: Static illustrations, minimal motion
- **Feature detection**: Detect device capability, serve appropriate animation tier

**No**:
- Constant looping animations (screensaver effect)
- Parallax scrolling (too playful for this aesthetic)
- Micro-interactions that distract from content
- Sound effects (ambient sound on open is optional; interaction sounds are muted by default)

---

## 4. INTERACTION MODEL

### 4.1 Primary Interactions

| Interaction | Trigger | Result |
|---|---|---|
| Tap species name | Anywhere (spread or modal) | Navigate to species placard with sketch animation |
| Tap plant illustration | On habitat spread | Navigate to plant placard |
| Tap parameter (pH, temp) | On habitat spread | Show parameter detail (history, trend, observations) |
| Click "View all residents" | On habitat spread | Show clickable list of all organisms in habitat |
| Tap organism name in synergy | On species placard | Navigate to that organism's placard |
| Swipe back / Back button | On any detail view | Return to previous spread with reverse animation |
| Tap voice button (FAB) | Always visible | Voice input without leaving current view |
| Tap habitat name | On species placard footer | Return to that habitat's spread |

### 4.2 Settings & Customization

**Minimal settings menu** (accessible from home, not cluttering primary view):
- **Featured Habitat**: Choose which habitat shows on app open (default: most recently updated)
- **Animation Speed**: Slow / Normal / Fast (accommodate user preference + device)
- **Theme**: Light mode (only for MVP; dark mode is Phase 2 if needed)
- **Notifications**: Turn on/off for new observations, enrichment complete, etc.
- **About**: Habitat/organism count, last enrichment, data version

**Not in settings**:
- Editing organisms (that's voice button + confirmation flow)
- Editing traits/parameters (view-only in placard; edit via voice)
- Complex configuration

---

## 5. MOBILE-FIRST DESIGN

### 5.1 Layout Strategy

- **Vertical stacking**: All content flows top-to-bottom
- **Full-width illustrations**: Illustration should dominate viewport
- **Readable text**: 16-18px body, emerald headers, ample line-height
- **Touch targets**: All buttons, names, clickable elements >44px tall
- **Safe areas**: Respect notch, home indicator, safe padding
- **No horizontal scroll**: Everything fits vertically

### 5.2 Responsive Breakpoints

- **Mobile** (<600px): Single column, full-width spreads
- **Tablet** (600-1024px): Two-column layout (illustration left, text right) if space allows
- **Desktop** (>1024px): Magazine spread (literal two-page spread aesthetic)

### 5.3 Voice Button Placement

- **Mobile**: Fixed bottom-right corner (emerald FAB, 56px diameter)
- **Tablet/Desktop**: Same, or integrated into header
- **Always accessible**, never scrolls out of view
- **Icon**: Microphone (with emerald emerald-500 color)
- **No label needed** — affordance is clear

---

## 6. PHASE 1 MVP SCOPE

**What's included in Phase 1:**
- ✅ Featured habitat spread with sketch animation
- ✅ Species placard view with deep linking
- ✅ Navigation between related organisms
- ✅ Parameter detail view (optional Phase 1.5)
- ✅ Beautiful Nat Geo visual language
- ✅ Voice button integration (non-blocking)
- ✅ On-click animations (device-dependent)
- ✅ Mobile-first responsive design

**What's Phase 2+ (NOT MVP):**
- ❌ Export to PDF
- ❌ Share functionality
- ❌ Print-on-demand cards / compendium
- ❌ Dark mode
- ❌ Advanced filtering/search
- ❌ Analytics dashboard
- ❌ Habitat diorama (3D visualization)

---

## 7. DATA FLOW & CONTENT SOURCING

### 7.1 Where Illustration Comes From

**Options** (to be decided):
1. **Pre-generated by AI + stored**: User uploads tank photo → generates illustration → stored in `habitat.overflow.illustration` or `organism.overflow.images[0]`
2. **On-demand generation**: First time user opens a habitat → generates illustration → caches it
3. **Hybrid**: AI for new habitats, hand-drawn/curated for popular species

**Data model**:
```typescript
habitat: {
  id: string;
  name: string;
  type: 'aquatic' | 'terrarium' | 'paludarium' | 'vivarium';
  overflow?: {
    illustration?: string; // URL to Nat Geo-style watercolor illustration
    narrative?: string;     // Field journal text
    theme?: 'aquatic-fresh' | 'aquatic-salt' | 'terrarium' | 'paludarium';
  };
}

organism: {
  id: string;
  commonName: string;
  scientificName: string;
  overflow?: {
    images?: string[]; // High-quality illustrations
    discovery?: {
      mechanism: string;
      evolutionaryAdvantage: string;
      synergy: string;
    };
    traits: Trait[];
  };
}
```

### 7.2 Content Source

- **Images/Illustrations**: Generated via Gemini image generation (or API calls to AI image model)
- **Narrative text**: Generated via Gemini text (enrichment pipeline)
- **Traits & scientific data**: From GBIF, local plant/fish libraries, Wikipedia, Wikispecies
- **User observations**: From voice input → stored as events
- **Synergy data**: Computed from habitat composition + enriched species data

---

## 8. ACCESSIBILITY & INCLUSIVE DESIGN

### 8.1 Accessibility Features

- **Alt text**: Every illustration has descriptive alt text for screen readers
- **Color contrast**: All text meets WCAG AA standards (4.5:1 minimum)
- **Touch targets**: All buttons >44px, proper spacing
- **Keyboard navigation**: All interactions accessible via keyboard (for desktop users)
- **Haptic feedback**: Optional vibration on interactions (settings toggle)
- **Text sizing**: User can increase font size via system settings

### 8.2 Inclusive Language

- Avoid gendered language (e.g., "steward" not "owner")
- Scientific + common names for all species
- Explain biological concepts simply, avoid jargon where possible

---

## 9. ERROR HANDLING & EDGE CASES

### 9.1 Empty States

- **No habitats yet**: Show onboarding illustration + voice button with text "Say 'Create a new tank called...'"
- **Habitat has no organisms**: Show illustrated empty tank + "Add your first organism via voice"
- **Organism not enriched**: Show greyed-out placard + "Researching..." with spinner

### 9.2 Load States

- Illustration drawing: Show skeleton screen or fade-in while generating
- Text fetching: Show placeholder text areas while loading narrative
- Image missing: Fall back to placeholder illustration + "Generating your illustration..."

### 9.3 Network Errors

- Toast notification (non-blocking): "Couldn't fetch illustration. Showing cached version."
- Voice button always works offline
- Data syncs when connection restored

---

## 10. DESIGN DECISIONS & RATIONALE

### Why This Approach?

| Decision | Rationale |
|---|---|
| **Nat Geo spread aesthetic** | Creates emotional impact (awe, discovery) that maintenance apps lack. Premium, collectible feel. |
| **Animation on app open** | First 3 seconds set the tone: this is not a utility, it's an experience. Delight before data. |
| **Deep linking everywhere** | Original iOS design philosophy: button does what you expect. Reduces cognitive load. |
| **Device-aware animations** | Quality > quantity. Better to have clean static illustrations than janky animations. |
| **Voice-first for logging** | Logging is effort; voice is frictionless. Keeps primary view clean. |
| **Color theming by habitat** | Unifies aesthetic while respecting user's unique ecosystem type. |
| **Serif typography** | Academic, timeless, evokes field journal + museum placard. Establishes tone immediately. |
| **No forms in primary view** | Forms interrupt the discovery experience. Editing happens via voice or collapsed sections. |
| **Scroll-based placard** | Accommodates varying content depth (shallow discovery for casual users, deep dives for enthusiasts). |

---

## 11. OPEN QUESTIONS & DECISIONS NEEDED BEFORE IMPLEMENTATION

1. **Illustration generation**: Do we generate illustrations on-demand, pre-generate them, or hybrid?
   - [ ] User decision needed

2. **Animation library**: Lottie (JSON-based) vs. SVG animations vs. Canvas?
   - [ ] Developer/tech lead decision needed

3. **Featured habitat selection**: Always the most recently updated? User-selectable? Random daily?
   - [ ] User decision needed

4. **Narrative sourcing**: AI-generated (Gemini) for all, or curated text for popular species?
   - [ ] User decision needed

5. **Parameter drill-down**: Should clicking pH/temp open a modal or navigate to full detail view?
   - [ ] UX decision needed

6. **Swipe vs. back button**: Support both? Only back button on mobile?
   - [ ] Developer/UX decision needed

7. **Print card monetization**: When/if compendium export launches, what's the business model?
   - [ ] Business decision for Phase 2

---

## 12. SUCCESS CRITERIA

**Phase 1 MVP is successful if:**

- [ ] Users say: "This is beautiful. I don't want to close it."
- [ ] Users learn something new every time they open the app
- [ ] Users feel pride in what they steward (not just maintenance)
- [ ] Animations feel intentional, not janky (device-appropriate)
- [ ] Deep linking works intuitively (users discover navigation naturally)
- [ ] Voice button is used regularly (logging feels frictionless)
- [ ] No forms clutter the primary view (discovery-first)
- [ ] Typography and colors feel premium (not generic)

---

## 13. NEXT STEPS

**If this design is approved:**

1. ✅ Finalize open questions (Section 11)
2. Create implementation plan (will be separate document)
3. Build image generation prompts for Nanobanana/Midjourney
4. Design Figma component library (optional: for designer collaboration)
5. Begin Phase 1 implementation

**Before implementation:**
- [ ] User approval of this design
- [ ] Answers to open questions (Section 11)
- [ ] Agreement on illustration strategy
- [ ] Agreement on animation library choice

---

## APPENDIX A: Visual Language Examples

### Example 1: Featured Habitat Spread (Freshwater Aquarium)

```
HEADER
┌────────────────────────────────────────────┐
│ The Shallows                 [Freshwater]  │
└────────────────────────────────────────────┘

ILLUSTRATION (Draws in over 2-3 seconds)
┌────────────────────────────────────────────┐
│                                            │
│  [Nat Geo watercolor aquarium scene]      │
│  [Plants on left, fish swimming]          │
│  [Labels: Vallisneria spiralis]           │
│  [Labels: Neon Tetra]                     │
│  [Labels: Amano Shrimp]                   │
│                                            │
└────────────────────────────────────────────┘

NARRATIVE (Fills in as drawing completes)
"The Shallows is a thriving freshwater
ecosystem, teeming with activity. Your
pH has been stable at 6.8 for 14 days,
and your 12 residents are thriving."

QUICK STATS
8 residents | 3 plants | pH 6.8 ↓0.2

VIEW ALL [clickable]
```

### Example 2: Species Placard (Neon Tetra)

```
HEADER + ILLUSTRATION
[Neon tetra illustration draws in]
Neon Tetra
Hyphessobrycon innesi
Phylum Chordata · Family Characidae

DISCOVERY SECRETS
🔬 MECHANISM
"Neon tetras owe their iridescent stripe
to guanine crystals, not pigment..."

🌍 EVOLUTIONARY ADVANTAGE
"In the wild, this coloration signals..."

🤝 SYNERGY
"In your aquarium, they school with..."

TRAITS
[Icon grid: pH range, temp, diet, behavior]

PERSONAL HISTORY
Feb 15 — Added to The Shallows (x12)
Feb 18 — First spawning observed
...

IN YOUR CONSERVATORY
"Lives in THE SHALLOWS with 7 tankmates:
Cardinal Tetra | Amano Shrimp | Java Fern"
[All clickable]
```

---

**END OF DESIGN SPECIFICATION**

**Status**: Awaiting user review and approval.
**Next phase**: Implementation planning (separate document).

