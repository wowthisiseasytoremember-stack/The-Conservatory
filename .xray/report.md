# Project X-Ray Report — The Conservatory (RE-AUDIT)

**Generated**: 2026-02-25
**Analyzer**: Claude Code (claude-sonnet-4-6)
**Audit Type**: Re-audit post 82-file git pull
**Project**: The Conservatory — voice-native AI habitat management PWA

---

## Overall Health Score

| Score | Delta | Label | Interpretation |
|-------|-------|-------|----------------|
| **5.40 / 10** | **+0.20 from 5.20** | **Needs Work** | The pull brought meaningful architectural progress — store decomposition, TanStack Query integration, Radix UI primitives, new screens and features — but introduced one new critical P0 (auth bypass) and one significant P1 (dual-store split-brain). All three previously identified P0 security vulnerabilities remain unresolved. The net health improvement is real but modest. |

### Dimension Breakdown

| Dimension | Previous | Current | Delta | Weight | Contribution |
|-----------|----------|---------|-------|--------|-------------|
| Test Coverage | 4.0 | 4.0 | 0 | 0.25 | 1.00 |
| Dependency Health | 6.0 | 6.0 | 0 | 0.20 | 1.20 |
| Code Organization | 5.0 | 6.0 | **+1.0** | 0.20 | 1.20 |
| Documentation | 8.0 | 8.0 | 0 | 0.15 | 1.20 |
| Security Posture | 1.0 | 1.0 | 0 | 0.10 | 0.10 |
| Build & CI Health | 7.0 | 7.0 | 0 | 0.10 | 0.70 |
| **Overall** | **5.20** | **5.40** | **+0.20** | | **5.40** |

---

## What's New in This Pull (82 Files Changed)

This pull represents a substantial feature and architectural push. The top changes:

### 1. Store Decomposition — Good Progress, Incomplete
The 1538-line monolithic `services/store.ts` has been restructured into a directory:
- `services/store/rootStore.ts` — trimmed to 1023 lines
- `services/store/storeState.ts` — local persistence extracted (64 lines)
- `services/store/useConservatoryStore.ts` — Zustand slice for UI/action state (188 lines)
- `services/store/queryHooks.ts` — TanStack Query hooks for server state (46 lines)
- `services/store/repositories/` — EntityRepository, EventRepository, HabitatRepository
- `services/store/useCases/ActionCommittalUseCase.ts` — atomic commit logic extracted

**Assessment**: The direction is correct and the repository pattern is cleanly implemented. TanStack Query is the right tool for server-state management. However, the migration is incomplete — both the old ConservatoryStore and the new Zustand store exist simultaneously with overlapping logic, creating a split-brain state architecture.

### 2. New Feature Screens
- `BlueprintScreen.tsx` — habitat rack map with parallax Echo wireframe overlays
- `PlaygroundScreen.tsx` — dev harness for voice testing, enrichment debugging, DB seeding

### 3. New UI Component Library
Seven Radix UI primitives added to `components/ui/` (badge, button, card, dialog, input, separator, tabs) following the shadcn/ui pattern. This is a strong long-term foundation for consistent UI.

### 4. New Services (Stubs)
- `EchoEngine.ts` — stylized organism wireframe generator (simulated — returns picsum URLs)
- `BlueprintService.ts` — rack scanning service (simulated — returns hardcoded coordinates)
- `ArtifactGenerator.tsx` — Curator's Card image generator via html2canvas

### 5. New Components
CuratorsCard, AssignHabitatModal, HeroSection, ShareCuratorsCardModal — all part of the museum-card / wonder feature push described in FEATURE_MANIFEST.md.

### 6. App.tsx Rewritten
App.tsx has been significantly rewritten to use the new split-store pattern. It now consumes both `useConservatoryStore` (Zustand) and `useEntities`/`useEvents` (TanStack Query). **Critical issue**: a hardcoded dev user bypasses authentication entirely (see P0 issues below).

---

## Critical Issues List

### P0 — Blockers (4 total: 3 unresolved + 1 new)

| ID | Issue | Status |
|----|-------|--------|
| ISSUE-001 | GCP service account private key (conservatory-admin-key.json) committed | UNRESOLVED |
| ISSUE-002 | .env with live GEMINI_API_KEY and VITE_FIREBASE_API_KEY committed | UNRESOLVED |
| ISSUE-003 | Gemini API key hardcoded in scripts/run_enrichment.ts line 45 | UNRESOLVED |
| **ISSUE-004** | **Auth bypass: App.tsx line 41 hardcodes a dev user, Firebase Auth never checked** | **NEW — this pull** |

**ISSUE-004 Detail**: App.tsx line 41 reads:
```typescript
const [user, setUser] = useState<any>({ uid: 'dev-user' });
```
The login guard (`if (!user)`) is always false. Firebase Auth is never consulted. The `LoginView` is never rendered. Combined with the broad Firestore rules (ISSUE-009), any visitor to a deployed instance has effective read/write database access.

### P1 — Critical Debt (8 total: 6 unresolved + 2 new)

| ID | Issue | Status |
|----|-------|--------|
| ISSUE-005 | Dual-store split-brain (rootStore + useConservatoryStore both active) | **NEW — this pull** |
| ISSUE-006 | require() in ESM module (rootStore.ts lines 131-132) — latent runtime crash | **NEW — this pull** |
| ISSUE-007 | rootStore.ts still 1023 lines (God file partially addressed) | PARTIALLY IMPROVED |
| ISSUE-008 | Hardcoded Firebase credentials in services/firebase.ts | UNRESOLVED |
| ISSUE-009 | Overly permissive Firestore rules (no ownership enforcement) | UNRESOLVED |
| ISSUE-010 | Tests not run in CI | UNRESOLVED |
| ISSUE-011 | Core logic untested (new store modules have zero unit tests) | PARTIALLY IMPROVED |

---

## Top 5 Next Steps (Prioritized by Impact and Urgency)

### Step 1 — Revoke All Exposed Credentials (5 minutes)
All three previously identified secrets remain live in the repository. The GCP service account key, the .env Gemini API key, and the hardcoded key in scripts/run_enrichment.ts must be revoked in the Google Cloud Console before any other work proceeds. Then: `git rm --cached conservatory-admin-key.json .env` and commit.

### Step 2 — Fix the Auth Bypass (15 minutes)
In `App.tsx`, change line 41 from `useState<any>({ uid: 'dev-user' })` to `useState<any>(null)` and add a `useEffect` subscribing to `onAuthStateChanged(auth, setUser)`. This single line change restores meaningful authentication to the application.

### Step 3 — Fix the require() Runtime Crash (10 minutes)
In `services/store/rootStore.ts`, lines 131-132 use CommonJS `require()` in an ESM file. Replace with `await import(...)`. Make `initFirestoreSync` async. This prevents a crash when a user logs in.

### Step 4 — Resolve the Dual-Store Split-Brain (2-4 hours)
The `rootStore.ConservatoryStore` and `useConservatoryStore` Zustand slice both implement `processVoiceInput`, `enrichEntity`, and `commitAction` with different logic. Consolidate: migrate the richer rootStore `processVoiceInput` (which includes strategy/ambiguity handling) into the Zustand store. Remove rootStore's manual Firestore subscriptions (redundant with queryHooks). Ensure App.tsx imports from one source only.

### Step 5 — Add Tests to CI (30 minutes)
Add the unit test job to `.github/workflows/android_build.yml`. The `npm test` script already runs vitest. This single CI change would have caught ISSUE-006 (TypeScript/ESLint violation) and ISSUE-005 (behavioral divergence) during the PR phase.

---

## What Is Working Well

**Architecture Direction**: The store decomposition is headed in exactly the right direction. Repository pattern, TanStack Query for server state, Zustand for UI state — this is the correct target architecture. The incomplete migration is expected; what matters is the direction is right.

**Component Library**: The Radix UI primitive addition (components/ui/) is a strong long-term choice. Consistent, accessible, composable.

**Feature Completeness**: CuratorsCard, HeroSection, BlueprintScreen, PlaygroundScreen all reflect the Feature Manifest vision accurately. The wonder-and-discovery ethos is coming through in the visual design.

**Test Signal**: The new `living_placard.spec.ts` correctly tests the new unified store pattern with proper mock injection at the window level. This shows good E2E testing instincts.

**ActionCommittalUseCase**: The extraction of atomic Firestore batch logic into a use case class is a clean, testable implementation. It's the best-structured new code in the pull.

---

## Areas of Concern

**The Auth Bypass (ISSUE-004)** is the most urgent new finding. This is a classic "I'll fix it before deploy" shortcut that got committed. Given that the Firestore rules have no ownership enforcement, this creates an open database for any visitor to a deployed instance.

**The Dual-Store Architecture (ISSUE-005)** is the most dangerous technical debt from this pull. Two `processVoiceInput` implementations, two `enrichEntity` implementations, two `commitAction` implementations — all behaving differently. App.tsx and PlaygroundScreen both import from both stores simultaneously. This will cause subtle, hard-to-diagnose bugs as the two stores diverge further.

**Security Debt Accumulation**: The P0 credentials have now persisted across two consecutive X-Ray audits (the initial and this re-audit) without being addressed. These must be treated as already-compromised and rotated immediately.

---

## Files Written This Re-Audit

| File | Description |
|------|-------------|
| `.xray/structure-map.md` | Updated annotated directory tree with delta table vs previous audit |
| `.xray/health-report.json` | Updated health scores with delta tracking and new file list |
| `.xray/issues.json` | 24 issues (4 P0, 7 P1, 8 P2, 5 P3) — 5 new issues from this pull |
| `.xray/fixes.json` | Concrete fixes for all P0 and P1 issues (12 entries) |
| `.xray/next-steps.json` | 13 ranked next steps with effort/impact ratings |
| `.xray/report.md` | This master report |

---

## Issue Count Summary

| Severity | Previous Audit | This Re-Audit | Delta |
|----------|---------------|---------------|-------|
| P0 Blockers | 3 | 4 | +1 (ISSUE-004: auth bypass) |
| P1 Critical Debt | 6 | 7 | +2 new, 1 partially resolved |
| P2 Quality Gaps | 7 | 8 | +1 (stub services), 1 partially resolved |
| P3 Hygiene | 5 | 5 | +1 new (console.log), 1 partially resolved |
| **Total** | **20** | **24** | **+4** |

The increase in issue count reflects the new code surface area from 82 changed files. The severity distribution is stable — this pull introduced features and architectural improvements without degrading the overall quality profile, but the security backlog remains fully open.

---

*Re-audit conducted 2026-02-25. Analyzer: Claude Code claude-sonnet-4-6. This report supersedes the initial report dated 2026-02-25.*
