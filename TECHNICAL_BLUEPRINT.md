# TECHNICAL BLUEPRINT: The Digital Conservatory (Unified)

**Objective**: Merge the "Soul" of **Organism Atlas** (UI/UX, Scraping, Research Synthesis) with the "Muscle" of **The-Conservatory** (Firebase, Capacitor, Vision/Voice, Domain Logic).

---

## 🏗️ 1. Infrastructure Foundation (The-Conservatory)
*   **Hosting**: Firebase Hosting (Production).
*   **Database**: Firestore (Persistence) + LocalStorage (Offline Cache).
*   **Auth**: Firebase Auth (Google Provider).
*   **Storage**: Firebase Storage (User specimen photography).
*   **Native**: Capacitor 8 for Android/iOS builds.

## 🎨 2. Design System & UI (Organism Atlas Soul)
*   **Typography**:
    *   `Playfair Display` (Bold Serif for Headings and Specimen Names).
    *   `Source Sans 3` (Clean Sans for Data and Body prose).
*   **UI Components**:
    *   `PlacardGrid`: The "National Geographic" style dashboard.
    *   `LivingPlacard`: The reimagined detail view with Hero images, taxonomy ribbons, and high-fidelity descriptions.
*   **Animations**: `framer-motion` for fluid screen transitions and "The Unveiling" of specimens.

## 🧬 3. The Enrichment Pipeline
*   **Specific ID Trigger**: Instead of generic guessing, the user provides the **precise species or cultivar name** (e.g., *Anubias nana 'Pinto'*).
*   **Deep Research Scraper**:
    *   **Logic**: Port Atlas's multi-source scraper (Wikipedia, Aquasabi, Flowgrow, Tropica).
    *   **Deployment**: Deploy as a Firebase Cloud Function (`/functions/src/enrichEntity.ts`).
    *   **Output**: High-fidelity JSON synthesized into **Prose and Taxonomy** matching the specific cultivar's care and trade history.
*   **Visual Documentation**: The user's high-res photo serves as the "Hero" record for that specific specimen.

## 📓 4. The Enriched Journal
*   **Data Model**: 
    *   `Specimen` objects in Firestore will now link to a `Dossier` (Deep Research data).
    *   `Observations` (Events) will be enriched by a background AI job that adds a "Curator's Note" validating user progress.
*   **State Management**: Unified Zustand store (monolithic but modularized) + TanStack Query for background enrichment state.

## 🛠️ 5. Implementation Roadmap

### Phase 1: Visual Identity
1. Sync `tailwind.config.ts` across both repos.
2. Install necessary font families in The-Conservatory.
3. Import Atlas's `HeroSection` and `PlacardCard` components.

### Phase 2: The Scraper Migration
1. Port the `enrich-entity` Deno logic from Atlas to a Node.js Firebase Function in Conservatory.
2. Ensure secrets (API keys) are securely managed in Firebase.

### Phase 3: The "Unveiling" Detail View
1. Refactor `EntityDetailModal.tsx` in Conservatory using Atlas's placard logic.
2. Implement the "Taxonomy Ribbon" and "Discovery Secrets" sections.

### Phase 4: Journal & Dashboard
1. Update the Dashboard to show the "Stewardship Stats" and the "Featured Specimen."
2. Implement the "Curator's Note" enrichment for new observations.

---
*This blueprint is the source of truth for technical execution.*
