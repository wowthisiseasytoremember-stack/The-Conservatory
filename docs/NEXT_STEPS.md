# Next Steps: Interior Design & Polish

With the backend stabilized and deployed, the focus shifts to **usability, aesthetics, and user delight**.

## 1. 🎨 Phase 6: Interior Design (Immediate)

_Ref: `docs/plans/RESEARCH_BRIEF_INTERIOR_DESIGN.md`_

- **Objective**: Transform the utilitarian "dev" UI into a lush, botanical experience.
- **Key Tasks**:
  - [ ] **Typography Upgrade**: Implement a proper serif font (e.g., _Playfair Display_, _Cormorant_) for scientific names and headers.
  - [ ] **Visual Hierarchy**: Refine the "Specimen Placard" to look like a museum label (Taxonomy -> Discovery -> Care).
  - [ ] **Zero-State Delight**: Replace empty lists with botanical illustrations or encouraging prompts.
  - [ ] **Glassmorphism**: Apply subtle transparency and blur to modals and cards to evoke the feeling of looking through aquarium glass.

## 2. 🧪 Test Infrastructure Refinement

- **Objective**: Re-enable the skipped Voice E2E tests.
- **Approach**:
  - Investigate `page.exposeFunction` in Playwright to synchronously trigger voice events from the test context, rather than relying on `window.dispatchEvent` race conditions.
  - Implement a "Test Mode" flag in the app that forces `processVoiceInput` to return a Promise that the test can `await`.

## 3. 🌊 Feature Expansion (Backlog)

_Ref: `docs/FEATURE_MANIFEST.md`_

- **Habitat Diorama**: Create a dedicated view for habitats that aggregates residents, water parameters, and health scores.
- **Taxonomy Browser**: Implement the horizontal "Netflix-style" lanes for browsing species by category (Epiphytes, Shoalers, etc.).
- **Photo History**: Persist images to Firebase Storage so the "Photo Identification" feature builds a visual history of the collection.
