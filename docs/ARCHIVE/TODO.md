# The Conservatory: Consolidated Development Plan

This plan integrates actionable insights from the `organism-atlas` codebase analysis and the `HOLISTIC_REVIEW.md` of `The-Conservatory`.

## Phase 1: Foundational Improvements & Immediate Impact

### 1. Extract Monolithic Store into Smaller Modules (Complete)
*   **Goal**: Decompose the 1115-line `services/store.ts` into focused, testable modules.
*   **Details**: `services/store/rootStore.ts` and `services/store/storeState.ts` created and integrated.

### 2. Add Structured Logging (Complete)
*   **Goal**: Replace all `console.*` calls with the existing `services/logger.ts` for better observability and debugging.
*   **Details**: All identified `console.*` calls in `rootStore.ts`, `DiscoveryHighlight.tsx`, and `HabitatNarrative.tsx` have been replaced with `logger.*`.

### 3. Consolidate Dual Proxy & Pick Hosting Strategy (Complete)
*   **Goal**: Eliminate redundancy and clarify the backend hosting strategy.
*   **Details**: Firebase Functions is the chosen strategy. `firebase.json` confirmed to have the rewrite rule for `/api/proxy` to the `proxy` Cloud Function. Lingering Vercel references removed.

### 4. Implement UI/UX Design System (from `organism-atlas` insights) (Complete)
*   **Goal**: Adopt a robust, consistent two-tier component model for UI/UX.
*   **Details**: `src/components/ui` directory created. `shadcn/ui` initialized, `Button` and `Card` components added. `DiscoveryHighlight.tsx`, `HabitatNarrative.tsx`, and `PlantAutocomplete.tsx` refactored to use `shadcn/ui` components.

## Phase 2: Feature & Data Improvements

### 5. Implement Feature Manifest (Dashboard Redesign) (Complete)
*   **Goal**: Bring the core product vision to life with engaging UI elements.
*   **Details**:
    *   **Featured Specimen Card**: Implemented the `FeaturedSpecimenCard.tsx` component to display a daily rotating hero card. (Complete)
    *   **Specimen Placard Redesign**: Refactored `EntityDetailModal.tsx` using `shadcn/ui` `Dialog`, `Card`, and other components to display rich entity details. (Complete)
    *   **Wonder Feed Enrichment**: Enhanced `WonderFeedHelpers.tsx` with synergy detection, growth milestones, and celebratory visual styles. (Complete)

### 6. Replicate Data Schema and Enrichment (from `organism-atlas` insights) (Complete)
*   **Goal**: Improve the data model and enrichment pipeline for scalability and granularity.
*   **Details**:
    *   Data model in `types.ts` already includes `EnrichedData`, `RawDataLake`, `Taxonomy`, and `TradeInfo`. (Complete)
    *   Enrichment pipeline integration displayed in the new `EntityDetailModal.tsx`. (Complete)

### 7. Replicate State Management (from `organism-atlas` insights) (In Progress)
*   **Goal**: Adopt modern state management practices for better separation of concerns.
*   **Details**:
    *   Installed `Zustand` and `TanStack Query`.
    *   Created `services/store/useConservatoryStore.ts` as a `Zustand` store for global state.
    *   **Next Steps**: Migrate all services to use TanStack Query for server state fetching.

## Phase 3: Developer Experience

### 8. Add Playground/DevTools UI (Complete)
*   **Goal**: Create a dedicated development tool UI for easier testing and debugging.
*   **Details**:
    *   Created `components/screens/PlaygroundScreen.tsx`.
    *   Registered `/playground` route in `App.tsx`.
    *   Included Voice Command Tester and System State Inspector.


## Implementation Roadmap

**Start with Phase 1 items in the order listed.**

---