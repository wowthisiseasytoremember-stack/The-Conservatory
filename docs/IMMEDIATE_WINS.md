# Top 10 High-Impact Immediate Wins (No UI Decisions)

Based on the current architecture and roadmap, these are the highest-value backend/data tasks we can execute immediately. They require **zero UI design** but significantly improve the app's intelligence and stability.

## 1. 🕷️ Run Scraper & Seed Species Library

**Impact**: Instantly populates the app with 1,000+ valid plants.
**Task**:

- Run the existing `scrape_aquasabi.ts` (it's robust but saves to JSON).
- Create a `seed_library.ts` script to batch-upload that JSON to Firestore (`species_library` collection).
- **Result**: `speciesLibrary.get()` actually works, saving huge AI costs and time.

## 2. 🧱 "Queue-on-Accession" State Machine

**Impact**: Solves the "20 API calls at once" problem.
**Task**:

- Update `store.ts` to set `enrichment_status: 'queued'` (instead of `none`) when adding a new entity.
- This creates the backend state needed for the "Deep Research" feature later.

## 3. 🚦 Serial Enrichment Processor

**Impact**: Prevents API rate-limiting and crashes.
**Task**:

- Implement `store.deepResearch(ids: string[])`.
- Logic: Iterate through IDs `for (const id of ids) { await enrichEntity(id); }`.
- This replaces the current theoretical "blast everything" approach.

## 4. 🧮 Habitat Health Engine

**Impact**: Adds "magic" numbers to the future dashboard.
**Task**:

- Create `services/ecosystem.ts` with `calculateHealth(habitatId)`.
- Logic: `(100 - (abs(pH_diff) * 10)) + biodiversity_bonus`. Pure math.

## 5. 🤝 Synergy/Compatibility Logic

**Impact**: Tells you _why_ your tank works (or doesn't).
**Task**:

- Implement `checkCompatibility(entityA, entityB)`.
- Logic: Check pH range overlap, Temp overlap, and Predator/Prey tags.
- Returns: `{ compatible: boolean, reason: string }`.

## 6. 📸 Image Persistence Pipeline

**Impact**: Real photo history instead of temporary base64 strings.
**Task**:

- Create `services/imageService.ts`.
- Implement `uploadToStorage(base64, path)` using Firebase Storage SDK.
- Wire this into `commitPendingAction` so photos are saved forever.

## 7. 🛡️ Global Error Telemetry

**Impact**: We know when it breaks before you tell us.
**Task**:

- Create `services/errorService.ts`.
- Implement `logErrorToFirestore(error, context)`.
- Catch unhandled promise rejections and log them to a `system_logs` collection.

## 8. 🧹 Taxonomy Normalizer

**Impact**: No more duplicate "Neon Tetra" and "Paracheirodon innesi" entries.
**Task**:

- Create a normalization helper that checks new entities against the `species_library` (from step 1).
- If "Cardinal Tetra" is added, auto-link it to the existing `Paracheirodon axelrodi` ID.

## 9. 🧬 Habitat-Level Observation Aggregation

**Impact**: Fast charts.
**Task**:

- When an entity observation is logged (`pH 6.8`), assume it applies to the whole habitat.
- Duplicate that data point to a `habitat_observations` sub-collection for easier querying.

## 10. 🧪 Backend "Simulation" Test

**Impact**: Verify ecosystem logic without clicking buttons.
**Task**:

- Create proper unit test file `services/ecosystem.test.ts`.
- Simulate a tank over 30 "days" (loops) to verify that `calculateHealth` drops if you don't log observations.

---

**Recommendation**: Start with **#1 (Scraper & Seeding)**. It gives us the data to test everything else.
