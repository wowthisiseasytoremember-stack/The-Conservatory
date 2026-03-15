# SOUL.md — The Conservatory

> _"A living archive. A quiet intelligence. A place where things are known, remembered, and cared for."_

---

## What It Does

A nature companion for people who keep living things. Fish. Plants. Corals. Invertebrates. Mosses.

You organise them into habitats — tanks, terrariums, paludariums. You speak to the app or photograph your specimens. It identifies them, logs them, researches them, and then tells you something _wonderful_ about them.

Not data. _Wonder._ The biology. The evolutionary story. The fact you'll repeat to someone else later that day.

**The design principle is: wonder over maintenance.**

---

## The Feeling

This app should feel like stepping into a natural history museum at night. After hours. Just you and the specimens and the low light.

It is calm. It is dark. It is _alive_.

It does not rush you. It does not demand things from you. It surfaces beauty quietly, the way a good exhibit does — you lean in, you read, something clicks.

The emotional register: **curious, cared-for, a little awestruck.**

---

## The Aesthetics

Pick a direction commit to it fully:

- **Botanical Conservatory** — think Changi Jewel, Gardens by the Bay, the great Victorian glasshouses. Lush and architectural at once. Deep greens and near-blacks, warm ambient light, tropical density. Glass and steel holding something alive inside it. Premium, calm, breathing.

Whatever direction you choose: dark backgrounds, never harsh black. Off-whites, never pure white. Light is information, not decoration.

Typography should mix: a characterful **serif** for specimen names and discovery text (something with personality — Cormorant, Playfair, EB Garamond), paired with a clean **sans-serif** for UI elements (Inter, Manrope, Geist).

Icons: one set, one stroke weight, consistent throughout.

---

## The Interactions

### The Wonder Feed

The home screen is not a log. It is a _feed of meaning_. Every event has biological context woven in. Adding a fish is not a database entry — it is a small celebration. A discovery completing is a moment. Make it feel like one.

Events should have distinct visual personalities. An accession feels celebratory. An observation feels precise and clinical. A discovery feels _magical_.

### The Specimen Placard

When you open an individual specimen it should feel like reading a museum placard. Full image at the top. Taxonomy ribbon below (Kingdom · Family · Genus in small caps). Then three sections of biological prose: how it works, why it evolved that way, how it interacts with other things in your collection.

This is the centrepiece of the app. Make it feel like it deserves that.

### The Habitat Diorama

Each habitat is its own world. When you enter a habitat view, the app should shift — the colour palette, the mood, the UI. A blackwater tank feels different from a marine reef feels different from a mossy paludarium. The app knows what it's looking at. Let it _show_ that.

### Discovery Moments

When the AI finishes researching a specimen, it is not a notification. It is a _reveal_. Something that was unknown is now known. That transition should be visible, felt. A shimmer. A bloom. Something that says: _we found something._

The enrichment research process itself should be transparent and beautiful — stages shown one by one, each resolving with its own small confirmation. Not a spinner. A journey.

### The Ambient Ticker

A quiet strip that rotates biological facts about things in your collection. Unasked for. Just there, like a docent whispering beside you. _"Your Anubias is an epiphyte — it doesn't need soil."_ It should feel like the app is thinking, even when you're not asking it anything.

---

## The Transitions

Nothing should snap. Nothing should pop.

- Views unfold, they don't switch
- Cards settle into place — staggered, one after another, like specimens being laid out
- Details zoom in from their origin point, not from nowhere
- Lists don't load — they _assemble_
- Removing something should feel considered, not instant

Use easing. Use stagger. Use weight. Make every state change feel like it has mass.

---

## The Voice

The app speaks in the register of a knowledgeable, warm curator. Short sentences. No filler. No hedging.

_"Identified. Cyphotilapia frontosa. Burundi six-banded variant."_

Not: _"It looks like this might be a Cyphotilapia frontosa! We think it's the Burundi six-banded variant 🎉"_

No emojis in results or body text. No exclamation marks. Space and weight carry the emotion, not punctuation.

---

## What Success Looks Like

Someone opens the app. It's quiet. Something beautiful on the screen — a specimen they added, a fact they didn't know, a subtle animation in the background.

They tap into a habitat. The mood shifts. They open a placard. They read something about a creature they've owned for two years that they never knew.

They put the phone down and look at their tank differently.

_That_ is The Conservatory.

---

## Reference: The Specimen Placard (Inspiration)

These are screenshots of a strong implementation of an item detail card — good information hierarchy, good structure, right instincts. Use them as inspiration, not a blueprint. The vibe coder should find their own way to present this information in a way that fits the aesthetic they've chosen.

What's worth noting about this approach:

### Tab 1 — Care Guide

The primary tab. Trait dashboard at the top (Difficulty, Light, Growth, CO₂ as a 4-column icon grid), then water parameters (Temperature, pH, Max Height), then prose fields (Substrate, Placement, Trimming, Propagation), then Pro Tips.

![Care Guide tab showing trait dashboard and care parameters](C:\Users\wowth.gemini\antigravity\brain\88b3a31a-b415-4d66-b37b-205d19bcd3e4\placard_care_guide.png)

![Care Guide tab — alternate view](C:\Users\wowth.gemini\antigravity\brain\88b3a31a-b415-4d66-b37b-205d19bcd3e4\placard_care_guide_2.png)

### Tab 2 — Taxonomy

A visual hierarchy tree: Kingdom → Phylum → Class → Order → Family → Genus → Species → Subspecies → Cultivar. Each level indented, with a small indicator dot. Ecological Role paragraph at the bottom.

![Taxonomy tab showing the full classification tree](C:\Users\wowth.gemini\antigravity\brain\88b3a31a-b415-4d66-b37b-205d19bcd3e4\placard_taxonomy.png)

### Tab 3 — Trade Info

Availability and Popularity as a 2-column stat block. Then key-value rows (Origin, Habitat, Price Range, Trade Names as chips).

![Trade Info tab showing availability, origin, and trade data](C:\Users\wowth.gemini\antigravity\brain\88b3a31a-b415-4d66-b37b-205d19bcd3e4\placard_trade_info.png)

### Below the Tabs — Did You Know?

A quiet discovery section below all tabs. A small icon, a heading, then 3–5 bullet facts about the specimen. This is where the wonder lives. Make it feel earned — like a museum exhibit's closing placard.

---

_This document is a north star. Trust your instincts on the specifics — the goal is the feeling, not the implementation._
