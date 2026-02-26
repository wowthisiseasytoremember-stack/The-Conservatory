<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# The Conservatory

A voice-native, AI-powered habitat and specimen management system for aquatic and plant enthusiasts. Track tanks, terrariums, fish, plants, and invertebrates using hands-free voice commands, photo identification, and AI-driven species enrichment.

**Status**: Phase 4 Complete — Verification Testing (PASS 5)

---

## What It Does

- **Voice-native habitat management** — Create habitats, log specimens, and record observations using natural speech
- **Photo identification** — Capture a photo and Gemini Vision identifies the species
- **Deep research / enrichment** — AI generates discovery secrets, synergy notes, care narratives, and taxonomic data for each specimen
- **Ecosystem health scoring** — Automated habitat health analysis based on biodiversity, water parameters, and observation recency
- **Mobile-ready PWA** — Runs as a Progressive Web App and compiles to native Android via Capacitor

---

## Quick Start

**Prerequisites**: Node.js 20+, a Firebase project, a Gemini API key.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env.local
# Edit .env.local and fill in:
#   VITE_FIREBASE_API_KEY
#   VITE_FIREBASE_AUTH_DOMAIN
#   VITE_FIREBASE_PROJECT_ID
#   VITE_FIREBASE_STORAGE_BUCKET
#   VITE_FIREBASE_MESSAGING_SENDER_ID
#   VITE_FIREBASE_APP_ID
#   GEMINI_API_KEY

# 3. Start the development server
npm run dev
# App runs at http://localhost:5173
```

---

## Development Commands

```bash
npm run dev              # Start Vite dev server (port 5173)
npm run build            # Production build → build_output/
npm run preview          # Preview production build locally

npm test                 # Run Vitest unit tests
npm run test:ui          # Vitest with browser UI
npm run test:e2e         # Run Playwright E2E tests
npm run test:integration # Run Playwright integration tests

npm run build:android    # Build web + sync to Capacitor Android
npm run open:android     # Open project in Android Studio
```

---

## Architecture

```
The Conservatory
├── Presentation Layer
│   ├── components/          React components (voice button, modals, screens)
│   └── App.tsx              Root component + router + auth guard
│
├── Application Layer
│   └── services/store.ts    Monolithic Zustand-style store (auth, state, sync)
│
├── Domain Layer
│   ├── types.ts             Entity, Habitat, Specimen, Trait, Event types
│   ├── src/schemas.ts       Zod validation schemas for AI responses
│   └── services/ecosystem.ts Habitat health scoring engine
│
└── Infrastructure Layer
    ├── services/firebase.ts  Firebase init (Firestore, Auth, Storage)
    ├── services/geminiService.ts  LLM orchestration (voice, vision, enrichment)
    ├── services/vision/      IVisionService abstraction + Gemini implementation
    ├── services/speciesLibrary.ts  Firestore-backed species data cache
    └── functions/src/index.ts     Firebase Cloud Function: Gemini AI proxy
```

**Key Technology Choices**:
- **React 19** + **TypeScript 5.8** + **Vite 6** for the frontend
- **Firebase Firestore** for persistence with offline support
- **Google Gemini** (via `@google/genai`) for all AI features
- **Capacitor 8** for Android/iOS packaging
- **Tailwind CSS 4** for styling
- **Vitest** for unit tests, **Playwright** for E2E

---

## Testing

```bash
# Unit tests (Vitest)
npm test

# E2E tests (Playwright — requires dev server running)
npm run test:e2e

# Integration tests
npm run test:integration
```

Current test coverage targets: `services/costTracker.ts`, `services/ecosystem.ts`, `services/speciesLibrary.ts`, `utils/LRUCache.ts`, `utils/retry.ts`.

---

## Firebase Setup

This app requires a Firebase project with:
- **Firestore** (database ID: `theconservatory`)
- **Firebase Auth** (Google provider enabled)
- **Firebase Storage**
- **Firebase Functions** (for the Gemini AI proxy)

Deploy the backend proxy:
```bash
cd functions
npm install
npm run deploy
```

---

## Project Documentation

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | AI assistant guide — architecture, evolution gates, phase roadmap |
| `docs/FEATURE_MANIFEST.md` | Complete feature vision |
| `docs/WORKFLOWS.md` | User journeys and workflows |
| `docs/tabula-rasa/PASS1_WORKFLOWS_AND_CUJS.md` | Detailed user journey analysis |
| `docs/tabula-rasa/PASS3_GAP_ANALYSIS_PRAGMATIC.md` | Known gaps and workarounds |
| `docs/tabula-rasa/PASS6_DEFERRED_RISK_REGISTER.md` | Technical debt register with triggers |
| `docs/tabula-rasa/PASS7_EVOLUTION_GATE.md` | Objective refactor triggers |
| `docs/PROJECT_STATUS.md` | Current deployment status |

---

## Security Notice

Before deploying publicly, complete the security checklist:
- [ ] Rotate any previously committed API keys
- [ ] Move all credentials to environment variables (never commit `.env`)
- [ ] Update Firestore rules to enforce per-user ownership (`isOwner`)
- [ ] Configure CORS for your production domain
- [ ] Remove service account key files from the repository

---

## License

Private repository. All rights reserved.
