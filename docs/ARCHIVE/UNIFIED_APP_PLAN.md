# UNIFIED APP PLAN: The Living Placard + The Conservatory

**Objective**: Merge the high-fidelity UI/UX of **Organism Atlas** with the robust feature depth and infrastructure of **The-Conservatory** into a single, production-ready application.

## 🏗️ Core Strategy: "Muscle + Soul"

*   **Foundation (Muscle)**: Use **The-Conservatory** codebase as the base. It provides Firebase persistence, offline support, Capacitor mobile wrappers, and advanced Voice/Vision services.
*   **Interface (Soul)**: Port the **Organism Atlas** design system and research engine. The app will adopt the "Museum Placard" aesthetic, premium typography, and multi-source scraping logic.

---

## 🎨 Phase 1: Visual & UI Overhaul (The "Soul")
*   **Design System**: 
    *   Sync Tailwind configurations (colors, spacing, animations).
    *   Import fonts: `Playfair Display` (Headings) and `Source Sans 3` (Body).
    *   Install `framer-motion` for fluid Atlas-style transitions.
*   **Component Migration**:
    *   Port `PlacardCard.tsx` and `HeroSection.tsx` from Atlas to Conservatory.
    *   Refactor Conservatory's `EntityDetailModal.tsx` to match the Atlas "Placard" layout (Taxonomy ribbons, discovery secrets, care narratives).
*   **Navigation**: Create a unified hub that defaults to the "Discovery" view (Atlas style) but allows quick access to "My Habitats" (Conservatory style).

## 🧬 Phase 2: Feature Fusion (The "Muscle")
*   **Enrichment Engine**: 
    *   Migrate the `organism-atlas` Supabase scraper (Wikipedia, Aquasabi, Flowgrow, Tropica) into a **Firebase Cloud Function** within The-Conservatory.
    *   **Options**: Users can choose between "Quick AI Summary" (Gemini direct) or "Deep Research" (Multi-source Scraper).
*   **Voice & Vision**: 
    *   Retain Conservatory's Voice-native UI and Gemini Vision ID.
    *   When an organism is identified via photo/voice, display it using the high-fidelity Atlas Placard UI.
*   **Management Layer**: 
    *   Keep the Habitat, Specimen tracking, and Ecosystem health scoring from Conservatory.
    *   Add a "Research Mode" toggle for pure discovery without management overhead.

## 🛠️ Phase 3: Technical Execution Roadmap

1.  **Sync Themes**: Update `tailwind.config.ts` and `index.css` in Conservatory to include Atlas styles.
2.  **Move Scraper**: Translate the Deno/Supabase `enrich-entity` function to a Node.js/Firebase function.
3.  **UI Port**: Replace Conservatory's generic list views with Atlas's `PlacardCard` grid.
4.  **Data Bridge**: Ensure the Firestore data model supports both the "Quick ID" and "Deep Enriched" schemas.
5.  **Clean Up**: Archive redundant UI files while preserving core services.

---

## ✅ Success Criteria
- [ ] App looks and feels exactly like **Organism Atlas** on the frontend.
- [ ] App maintains all **The-Conservatory** features (Firebase, Voice, Vision, Mobile).
- [ ] "Deep Research" works via Firebase Functions using the multi-source scraper.
- [ ] No loss of existing habitat data or features.

*This plan is the source of truth for the unification of these two projects.*
