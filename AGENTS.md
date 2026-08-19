---
schema: agents-md/v1
project: the-conservatory
initiative: monetization
family: apps
what: >-
  Capacitor 8 + React 19 web/mobile aquarium and vivarium manager utilizing a museum stewardship aesthetic,
  parallel 4-source web scraper (Wikipedia, Aquasabi, Flowgrow, Tropica), Gemini synthesis, and multi-variable ecosystem health scoring.
goal: >-
  Maintain web/mobile prototype and port parallel 4-source scraper architecture & health scoring math to AquaTrack / FloraTrack.
status: active
stack: [react, typescript, vite, capacitor, firebase, tailwind]
entrypoints:
  - App.tsx
  - functions/src/index.ts

modules:
  - name: Parallel 4-Source Research Scraper
    path: functions/src/index.ts
    does: Scrapes Wikipedia, Aquasabi, Flowgrow, and Tropica in parallel and synthesizes via Gemini 2.5 Flash.
    status: shipped
  - name: Museum Living Placard UI & Curator Cards
    path: src/components/
    does: Museum-style species cards, care criteria display, and exportable Curator Cards via Capacitor Share.
    status: shipped
  - name: Ecosystem Health Scoring Engine
    path: src/services/healthScore.ts
    does: Multi-variable mathematical model calculating biodiversity index, parameter stability, and cross-species overlap.
    status: shipped
  - name: Voice Command NLP & Photo AI ID
    path: src/services/ai.ts
    does: Voice intent parsing and Gemini photo species identification with confidence scoring.
    status: shipped

depends_on: []
feeds: [AquaTrack, FloraTrack, BioTrackCore]
updated: 2026-08-10 11:18 UTC
---

# the-conservatory — AGENTS.md

**Initiative:** `monetization` — see ~/plans/initiatives.yml
**Project Root:** `/home/ichabod/Projects/the-conservatory/`
**State:** Functional Web & Mobile Prototype App (Vite 6, React 19, Capacitor 8, Firebase Functions v2)

## Role & Relationship to BioTrack Ecosystem

`the-conservatory` is the web and Capacitor mobile prototype for aquarium and vivarium stewardship. It serves as a **shared primitive and reference architecture** for the native iOS apps (`AquaTrack` and `FloraTrack`).

### Reusable Tools & Features Supplied to AquaTrack / FloraTrack:
1. **Parallel 4-Source Web Scraper:** Cloud Function scraping Wikipedia, Aquasabi, Flowgrow, and Tropica simultaneously to generate structured species dossiers without LLM hallucination.
2. **Ecosystem Health Scoring Formula:** Mathematical formula evaluating biodiversity, temperature/pH stability, observation recency, and cross-species parameter compatibility.
3. **Museum "Living Placard" Aesthetic:** Design layout and card architecture treating organisms as specimens rather than inventory.
