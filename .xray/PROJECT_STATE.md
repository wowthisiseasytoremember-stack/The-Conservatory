# PROJECT_STATE.md - The Conservatory (RE-AUDIT)

**Current Phase:** Phase 5 (Store Decomposition + Feature Expansion) — In Progress
**Overall Health:** Needs Work (5.40/10) — architectural improvements underway, security backlog unaddressed, new auth bypass introduced
**Last Audit Date:** 2026-02-25 (Re-audit post 82-file git pull)
**Previous Score:** 5.20/10

---

## Executive Summary

The Conservatory is an ambitious, voice-first AI application for managing aquatic and terrestrial habitats. The 82-file pull made meaningful architectural progress — store decomposition, TanStack Query integration, Radix UI primitives, new feature screens (Blueprint, Playground), and new services (Echo Engine, Curator's Card). However, the migration is incomplete (dual-store split-brain), a new critical auth bypass was introduced, and all three previously identified P0 security vulnerabilities remain unresolved.

---

## Architecture Assessment (Post-Pull)

- **Front-end:** React 19 + TypeScript + Split State (Zustand for UI, TanStack Query for server state, legacy ConservatoryStore still active)
- **Back-end:** Firebase (Firestore custom DB 'theconservatory', Functions, Hosting)
- **AI Services:** Gemini 1.5 (Pro and Flash) via Cloud Function proxy + @google/genai SDK
- **Persistence:** Hybrid (Firestore + IndexedDB persistent cache + localStorage)
- **UI Library:** Radix UI primitives (components/ui/) + Tailwind CSS 4
- **Mobile:** Capacitor (Android + iOS)

---

## Active P0 Blockers (4 — All Must Be Resolved Before Any Deploy)

1. **GCP Service Account Key committed** — `conservatory-admin-key.json` is a live RSA private key in source control. REVOKE IMMEDIATELY.
2. **Live API Keys in .env** — GEMINI_API_KEY and VITE_FIREBASE_API_KEY committed. ROTATE AND UNTRACK.
3. **Hardcoded API Key in source** — `scripts/run_enrichment.ts` line 45. ROTATE AND REMOVE.
4. **NEW: Auth Bypass** — `App.tsx` line 41 initializes user with `{ uid: 'dev-user' }`, bypassing Firebase Auth. ANY VISITOR IS TREATED AS AUTHENTICATED. REVERT BEFORE DEPLOY.

---

## P1 Critical Debt

- **Dual-store split-brain**: rootStore.ConservatoryStore and useConservatoryStore both active simultaneously with overlapping logic. Needs resolution.
- **require() in ESM module**: rootStore.ts lines 131-132 — latent runtime crash on user login.
- **rootStore.ts still 1023 lines**: God file partially addressed, further decomposition needed.
- **Tests not in CI**: android_build.yml runs no tests.
- **Firestore rules no ownership enforcement**: Combined with auth bypass, this means open database.

---

## What's Working Well

- Store decomposition is headed in the right direction (repository pattern, use cases, Zustand/Query split)
- ActionCommittalUseCase is the best-structured new code — clean, testable, atomic
- Radix UI primitive library is the right long-term choice for the component system
- CuratorsCard, HeroSection, BlueprintScreen implement the Feature Manifest vision accurately
- One new E2E spec (living_placard.spec.ts) correctly tests the new store architecture

---

## Strategic Roadmap (Updated)

1. **Security (Immediate — Next Session)**: Revoke all exposed credentials. Fix auth bypass. Remove hardcoded fallbacks in firebase.ts. Apply Firestore ownership rules.
2. **Architecture Stabilization (This Sprint)**: Resolve dual-store by completing the migration to Zustand + TanStack Query. Fix require() ESLint/runtime issue. Gate stub services behind feature flags.
3. **CI Hardening (This Sprint)**: Add vitest to CI. Add type-check and lint scripts. These would have caught issues from this pull.
4. **Test Coverage (Next Sprint)**: Unit tests for new store modules (useConservatoryStore, repositories, ActionCommittalUseCase).
5. **Feature Completion (After Stabilization)**: Implement real Recraft API for EchoEngine. Real vision model for BlueprintService. Complete Curator's Card sharing flow.

---

*Updated by Project X-Ray Re-Audit on 2026-02-25*
