# 🏛️ THE CONSERVATORY: Master Handoff & Interior Design Brief

**To:** Research & Sourcing Agent (and subsequent Development Agents)
**From:** Lead Designer / "The Interior Designer"
**Date:** February 15, 2026
**Subject:** Sourcing the "Soul" of the Application & Implementation Handoff

---

## 🛑 DESIGNER’S MANIFESTO: The "Natural" Standard

**Our Opinion:** A digital interface is successful only when the user forgets they are looking at a screen. We are building a "Museum in a Box."
*   **Tactile over Digital:** Use paper textures and ink-bleed effects to anchor the app in the physical world.
*   **Frictionless Awe:** The first 3 seconds of the app (the "Genesis" sketch) are more important than the settings menu.
*   **The "Invisibility" Rule:** If a feature requires a tutorial, the design has failed. The interaction should follow the thumb’s natural gravity.

---

## 🔎 PART 1: THE SOURCING MATRIX (With Designer Recommendations)

I want the agent to research these, but here is my **strongly held opinion** on the "Winning Path" for the MVP.

| Category | The "Winning Path" (Recommendation) | WHY? |
| :--- | :--- | :--- |
| **Illustrations** | **AI-Generated Hybrid (Midjourney/Flux)** | *Scalability.* We can’t hire 100 artists, but we can tune a model to produce 1,000 "Naturalist" watercolors that feel identical in style. |
| **Motion** | **SVG Stroke + CSS Shaders** | *Performance.* Lottie is great, but code-based SVG drawing feels more "integral" to the UI and works on low-end devices. |
| **Typography** | **Crimson Pro (Serif) + Montserrat (Labels)** | *The Balance.* Crimson Pro provides the "19th-century journal" weight; Montserrat provides the "Nat Geo" scientific clarity. |
| **Audio** | **Generative Ambient (Tone.js)** | *Living Space.* Static loops get annoying. Generative audio that shifts with the "health" of the habitat provides a constant, subtle feedback loop. |

---

## 🔮 PART 2: THE "UNSPOKEN" LAYER (Designer’s Delighters)

*These are not in the spec, but they are essential for "Awe." Focus your research here.*

1.  **The "Living" Clock (Sync):**
    *   **The Idea:** The paper texture shouldn't just dim at night; it should shift from "Cream" (Day) to "Blue-Grey Stationery" (Dusk) to "Deep Charcoal" (Night).
    *   **The Research:** CSS `mix-blend-mode` overlays that respond to local sunset times.
2.  **The "Glow" (Bioluminescence):**
    *   **The Idea:** At "Night Mode," certain organisms (jellyfish, neon tetras, certain mosses) should gain a subtle CSS `drop-shadow` glow.
3.  **The "Specimen Loupe":**
    *   **The Idea:** Dragging a finger over an organism doesn't just "click" it—it brings up a circular magnifying loupe that shows the high-res "Ink Linework" of that species.

---

## 🧠 PART 3: THE UX "NATURALISM" AUDIT (Strong Opinions)

*Challenge the existing spec. Here is where the "Natural" philosophy must win:*

*   **Opinion 1: Kill the "Back" Button.** 
    *   *The Fix:* Navigation should be **Pinch-to-Close** or **Natural Swipe Down**. It should feel like "setting a book down" or "stepping back from a museum display."
*   **Opinion 2: The "Floating" Voice Button is a Distraction.** 
    *   *The Fix:* The voice button should be integrated into the "Field Journal" ribbon at the bottom, or triggered by a **long-press on the habitat background**. It shouldn't look like a "social media FAB."
*   **Opinion 3: Data is a Narrative, not a Table.** 
    *   *The Fix:* pH and Temp shouldn't be in a grid. They should be written as margin notes: *"The waters remain a stable 6.8..."* clicking them reveals the graph.

---

## ⚠️ PART 4: THE "BLIND SPOTS" (What we haven't touched)

*The following areas have NOT been researched and represent the biggest risks to the "Awe" factor:*

1.  **Offline Asset Persistence:** If the user is in a "Dead Zone," does the awe disappear? We need a strategy for caching the "Genesis" sketch SVG paths.
2.  **Image-to-Vector Pipeline:** How do we convert an AI-generated watercolor into an SVG path that `Vivus.js` can actually "draw"? This is a major technical hurdle.
3.  **Accessibility vs. Aesthetic:** How does a "Watercolor Journal" look to a color-blind user or someone using a screen reader? We need an "Alternative Text" narrative style.
4.  **Energy Impact:** Shaders and generative audio kill batteries. We need a "Power Save" mode that doesn't feel like "Low Quality" mode.

---

## 🚀 PART 5: THE HANDOFF ROADMAP (Next Steps)

1.  **Stage 1 (Research):** Use this brief to find the tools. Deliver the "Shopping List."
2.  **Stage 2 (Proof of Concept):** Create one "Living Sketch" of a Neon Tetra. If we can't make *one* look amazing, we can't make the app.
3.  **Stage 3 (Asset Engine):** Build the Midjourney/Flux prompt library to ensure we can generate 50+ species in the *exact* same watercolor style.
4.  **Stage 5 (The "Thumb" Prototype):** A clickable wireframe focused *only* on the "Natural" gestures (Pinch, Swipe, Long-press). No buttons allowed yet.

---

**FINAL VERDICT:** The goal is to make the user feel like they are holding a piece of living history. If it feels like "Software," we have lost.
