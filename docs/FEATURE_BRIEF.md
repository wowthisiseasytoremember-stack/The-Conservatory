# The Conservatory — Feature Brief

> A condensed version of the full Feature Manifest. Prioritised for a first build. Details only where they help.

---

## The Four Screens

### 1. Home — The Wonder Feed

The home screen is not a log. It's a _feed of meaning_.

Every event is enriched with biological context:

- Adding a fish → _"12 Cardinal Tetras joined The Shallows. Their iridescent stripe is structural coloration from guanine crystals."_
- A pH log → _"pH at 6.8 in The Shallows — stable within your 2-week trend."_
- A discovery completing → _"New Discovery: Java Fern reproduces via adventitious plantlets — tiny clones that grow on leaf margins."_

**Also on this screen:**

- A **Featured Specimen** hero card at the top — one organism from your collection, rotated daily. Full-bleed image, common name, scientific name, one discovery line. Tap → opens its Placard.
- A **Quick Stats bar** — total species, total habitats, pending research, last observation.
- An **Ambient Ticker** — a quiet strip rotating biological facts from your collection. Unasked for. Just there.

---

### 2. The Specimen Placard — Item Detail

The centrepiece. When you tap a specimen, this is what opens.

**Sections (in order):**

1. **Hero image** — full width, dark gradient overlay, specimen name in large type over the top
2. **Taxonomy ribbon** — `Kingdom · Family · Genus` in small caps
3. **Discovery Secrets** — three paragraphs of biological prose:
   - _Mechanism_ — how this species works biologically
   - _Evolutionary Advantage_ — why this trait exists in the wild
   - _Synergy_ — how it interacts with other things in your collection
4. **Trait dashboard** — visual display of care parameters (light, CO₂, pH, temp, growth rate, difficulty). Icons, not forms.
5. **Personal history** — a timeline of this specimen's life in your collection (when added, observations, growth logs)
6. **In Your Conservatory** — _"Lives in The Shallows with 3 tankmates: Cardinal Tetra, Amano Shrimp, Java Fern."_ Each name is tappable.
7. **Enrichment status pill** — `Researching...` / `Verified` / `Retry` — small, subtle

**Edit mode:** a pencil icon toggles between the placard view and an edit form. The placard is the default. Editing is secondary.

---

### 3. Habitats — The Diorama

Each habitat (tank, terrarium, paludarium) gets its own immersive page. When you enter it, the app shifts — colour palette, mood, UI — to match the habitat type.

**Sections:**

- **Header** — habitat name, type badge, size
- **AI-generated illustration** — a botanical/aquatic illustration of this specific habitat, generated once and cached
- **Ecosystem Narrative** — three-part biological story of this habitat: Web of Life, Biomic Story, Evolutionary Tension. Beautiful prose. Collapsible.
- **Residents grid** — all specimens in this habitat as mini cards. Tap → opens their Placard.
- **Chemistry timeline** — pH, temperature, and other parameters as stacked sparklines over time
- **Health score** — a 0–100 circular gauge based on parameter stability and biodiversity

---

### 4. The Deep Research Flow

When the app researches a specimen, it's not a spinner. It's a journey.

Show stages one by one as they resolve:

- `Querying taxonomy database...` → ✓
- `Searching natural history sources...` → ✓
- `Checking species library...` → ✓
- `Synthesising discoveries...` → ✓

When it finishes: a summary moment. _"8 species researched. 3 new discoveries unlocked."_ Each discovery is tappable → opens that specimen's Placard.

**Trigger points:**

- Per habitat: _"Research all specimens in this habitat"_ button
- Per specimen: _"Research this species"_ on the Placard
- Global: _"12 species awaiting research"_ prompt on the home screen

---

## Key Interactions to Get Right

**The Discovery Toast** — when enrichment completes for a single specimen, a beautiful notification slides up from the bottom. Glassmorphism background. The discovery one-liner. Auto-dismisses after ~8 seconds.

**Adding a specimen** — voice (_"I added 12 Cardinal Tetras to The Shallows"_) or camera (point, identify, confirm). After identification, a confirmation card appears — Mad Libs style. The user taps to confirm or correct inline. Not a form.

**The Confidence Bar** — when the AI identifies a specimen, show a confidence score as a gradient bar (green → amber). If inferred from genus-level knowledge, say so clearly.

**Empty states** — never just blank. Always: a subtle illustration + an encouraging line + a clear action. _"Your conservatory awaits its first specimen."_

---

## Things That Should Feel Special

- **Biome theming** — the app's colour palette shifts based on which habitat you're looking at. Blackwater tanks feel warm and dark. Marine reefs feel cool and deep. Paludariums feel green and lush.
- **Card images** — every specimen card should show a thumbnail of the organism, not just an icon and text.
- **Staggered entrance animations** — items in lists should settle in one by one, not all at once.
- **The taxonomy tree** — on the Taxonomy tab, the classification hierarchy (Kingdom → Cultivar) should be rendered as a visual indented tree with small indicator dots at each level, growing more specific and italic as it goes deeper.
- **Trade names as chips** — render trade names as small pill chips, not plain text.

---

## What's Not in Scope (Yet)


---

_Full technical specification: `docs/FEATURE_MANIFEST.md`_
