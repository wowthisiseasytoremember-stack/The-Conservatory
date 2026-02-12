# Handoff: Debugging & Future Considerations

This document provides a technical deep-dive into the fixes implemented for "The Conservatory" and outlines critical areas for future debugging and infrastructure improvements.

## 🛠️ Current Fixes & Stability Improvements

### 1. Firestore Data Integrity (The "Undefined" Problem)

**Status**: Fixed via recursive sanitization.

- **The Issue**: Firestore's `setDoc` rejects `undefined`. In our voice-first flow, fields like `scientificName` or `quantity` are often left out by the AI, resulting in `undefined` values that crashed the persistence layer.
- **The Fix**: Implemented `cleanDataObject` in `services/store.ts`. It recursively traverses any payload and strips keys with `undefined` values.
- **Future Improv**: Consider replacing this with **Zod** or another schema validation library to enforce default values (`null` or empty strings) at the type level before they ever hit the store.

### 2. E2E Test Reliability (Playwright)

**Status**: Stable for current CUJs.

- **The Fix**: Switched to robust locators (`getByLabel`, `getByPlaceholder`) and added a 3s buffer after confirmations to allow Firestore's IndexedDB persistence to materialize.
- **Known Pitfall**: **Port Conflicts**. Playwright's `webServer` (running `npm run dev`) often fails if a previous process is orphaned on port 3000. Use `taskkill /F /IM node.exe` if the server fails to start.

### 3. Duplicate Prevention

**Status**: Implemented for Habitat and Entity creation.

- **The Issue**: Voice repetition frequently caused duplicate document creation.
- **The Fix**: The `commitPendingAction` now performs a pre-flight check against the local `entities` state using normalized (trimmed, lowercase) name matching.

## 🔍 Future Debugging & Investigative Areas

### 1. Gemini AI Hallucinations

In the `ACCESSION_ENTITY` workflow, the AI might occasionally extract incorrect `scientificName` strings or misidentify `traits`.

- **Next Step**: Add a "Refine" loop to the `geminiService.ts` prompt that specifically cross-references extracted names against a known plant/fish taxonomy list.

### 2. Race Conditions in Test Verifications

Currently, we use `waitForTimeout(3000)` to wait for data to appear in the "Collection" view.

- **Next Step**: Refactor tests to wait for a specific state change in the `store` (e.g., observing the `events` array length) rather than a hard timeout.

### 3. Multi-Tab Sync Conflicts

The app uses `persistentMultipleTabManager()`. While great for local-first, it can lead to subtle UI lag if one tab is performing a heavy write while another is reading.

- **Investigate**: Check for "write-behind" latency in the `useConservatory` hook when high-frequency observations are logged.

### 4. Schema Evolution & Migration

As we add more complex traits (e.g., water chemistry curves), the "bespoke" flat structure in Firestore may become a bottleneck.

- **Consider**: Sub-collections for `observations` instead of embedding them within entity events if history grows significantly.

---

_Handed off with ❤️ by Antigravity AI_
