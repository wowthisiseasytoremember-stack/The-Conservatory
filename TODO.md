# the-conservatory — Master Decomposed Roadmap & Empirical Task List

**Ethos:** Museum Stewardship, Living Placards, 4-Source Data Scraping, & Ecosystem Health  
**Canonical Tracker:** `AGENTS.md`  
**Current Phase:** Phase 5 (Expand & Enhance) — Functional Web/Mobile Prototype

---

## 1. Quantitative DONE Contract & Ground Truth Metrics

| Dimension | Target Metric | Verified Status | Status |
|---|---|---|---|
| **Parallel Web Scraper** | 4 sources (Wikipedia, Aquasabi, Flowgrow, Tropica) | Cloud function operational in `functions/src/` | ✅ DONE |
| **Ecosystem Health Math** | Multi-variable score calculation | `healthScore.ts` algorithms verified | ✅ DONE |
| **Living Placards** | Museum-style species card components | React 19 / Radix UI components built | ✅ DONE |
| **Capacitor Mobile Build** | Capacitor 8 iOS & Android targets | `capacitor.config.ts` configured | ✅ DONE |
| **Testing Suite** | Vitest + Playwright E2E coverage | `vitest` and `playwright` configured | ✅ DONE |

---

## 2. Reusable Tools & Cross-Project Export Pipeline

- [x] **4-Source Scraper Port:** Scraper logic in `functions/src/` available for extraction to `fish-atlas-scraper` or `BioTrackCore`.
- [x] **Ecosystem Health Math Port:** Math formula in `src/services/healthScore.ts` available for AquaTrack calculator engines.
- [x] **Museum Design Tokens:** CSS color palette (`#FBF9F5` / `#1F4A38`) available as design reference for BioTrack web views.
