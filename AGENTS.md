> ⚠️ STOP. Before reading further:
> 1. Use the Brain MCP tool to read: claude-portable/ORIENTATION.md
> 2. Familiarize yourself with the full system — who Justin is, what's running, core rules, key paths.
> 3. Then return here and continue reading.
>
> If no Brain MCP tool is available, note it as a gap and proceed — but flag it at the end of the session.
> ⚠️ STOP. Before reading further:
> 1. Use the Brain MCP tool to read: claude-portable/ORIENTATION.md
> 2. Familiarize yourself with the full system — who Justin is, what's running, core rules, key paths.
> 3. Then return here and continue reading.
>
> If no Brain MCP tool is available, note it as a gap and proceed — but flag it at the end of the session.
# CLAUDE.md - The Digital Conservatory

> **Purpose**: A high-fidelity, digital archive for aquatic curators.
> **Philosophy**: Stewardship over Maintenance. Artifacts over Assets. Awe over Utility.

---

## 🎨 Design System: "The Modern Museum"
*   **Typography**: `Playfair Display` (Headings/Specimen Names) & `Source Sans 3` (Body/Data).
*   **Palette**: "Museum Ivory" (`--background: 40 30% 96%`) and "Botanical Green" (`--primary: 152 45% 22%`).
*   **Interaction**: Fluid transitions via `framer-motion`. High-fidelity "Living Placards" for every specimen.

## 🧬 Core Architecture: "Muscle + Soul"
*   **Soul**: Research synthesis engine using multi-source scraping (Wikipedia, Aquasabi, Flowgrow, Tropica).
*   **Muscle**: Firebase Firestore (Offline-first persistence), Capacitor 8 (Cross-platform native), and Gemini 2.0 Flash (AI orchestration).

---

## 🛠️ Development Commands

```bash
# Development
npm run dev                 # Start Vite dev server

# Firebase Functions
cd functions
npm run build               # Build functions
firebase emulators:start    # Local testing
npm run deploy              # Deploy to production

# Native Builds
npm run build:android       # Sync web build to Capacitor Android
```

---

## 📜 Coding Standards

### 1. The "Unveiling" Workflow
*   Never use generic AI photo IDs for identification.
*   Prioritize user-provided cultivar strings (e.g., "Anubias nana Pinto").
*   Trigger the `/api/enrich` function for deep research synthesis.

### 2. Stewardship Documentation
*   Every observation logged must be eligible for a "Curator's Note" enrichment.
*   The `EntityDetailModal` is the primary "Placard" and should never be broken into sterile forms.

### 3. State Management
*   Use the modularized Zustand store (`useConservatoryStore.ts`).
*   Use TanStack Query for server-side fetching and background enrichment polling.

### 4. Style Protocols
*   Use `Playfair Display` italic for scientific names.
*   Use `Source Sans 3` for all technical and descriptive prose.
*   Maintain the "Museum Ivory" theme even in dark mode variants.

---

## 📂 Primary Documentation
*   `VISION_MANDATE.md`: The North Star for all UX decisions.
*   `TECHNICAL_BLUEPRINT.md`: The technical map of the unified infrastructure.
*   `README.md`: The project entry point and high-level feature list.
*   `docs/ARCHIVE/`: Legacy materials.
