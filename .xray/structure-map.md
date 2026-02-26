# Structure Map — The Conservatory (RE-AUDIT)

**Generated**: 2026-02-25 (Re-audit post 82-file git pull)
**Previous Audit**: 2026-02-25 (initial)
**Project Type**: React PWA + Capacitor Mobile (Android/iOS)
**Entry Point**: `index.tsx` → `App.tsx`
**Build Tool**: Vite 6 + TypeScript 5.8
**Backend**: Firebase Firestore + Firebase Functions (Cloud)
**State Management**: Split — TanStack Query (server state) + Zustand (UI/local state) + Legacy custom store (transitioning)

---

## Annotated Directory Tree

```
The Conservatory/
├── App.tsx                         # Root React component — REWRITTEN: now uses useConservatoryStore + useEntities/useEvents hooks
├── index.tsx                       # Vite entry: wraps with QueryClientProvider (TanStack Query) + BrowserRouter
├── index.html                      # HTML shell
├── types.ts                        # Domain type definitions (Entity, Habitat, Specimen, HabitatOutline — new type)
├── themes.css                      # Design system / theme tokens
│
├── components/                     # React UI components
│   ├── screens/                    # Full-screen views
│   │   ├── HomeScreen.tsx          # Main dashboard
│   │   ├── HabitatDiorama.tsx      # Habitat visualization
│   │   ├── SpeciesPlacard.tsx      # Specimen detail / museum-card view
│   │   ├── ParameterDetail.tsx     # Habitat parameter charts
│   │   ├── SettingsScreen.tsx      # User settings
│   │   ├── BlueprintScreen.tsx     # NEW: rack/habitat blueprint map with parallax Echo overlays
│   │   └── PlaygroundScreen.tsx    # NEW: dev playground — voice tester, enrichment debugger, seed DB
│   ├── ui/                         # NEW: Radix UI component library (shadcn/ui pattern)
│   │   ├── badge.tsx               # Badge primitive
│   │   ├── button.tsx              # Button primitive (class-variance-authority variants)
│   │   ├── card.tsx                # Card / CardHeader / CardContent primitives
│   │   ├── dialog.tsx              # Dialog primitive (Radix)
│   │   ├── input.tsx               # Input primitive
│   │   ├── separator.tsx           # Separator primitive
│   │   └── tabs.tsx                # Tabs primitive (Radix)
│   ├── AIChatBot.tsx               # AI chat interface
│   ├── AssignHabitatModal.tsx      # NEW: modal to assign habitat to blueprint outline
│   ├── ConfirmationCard.tsx        # Pending-action confirm UI
│   ├── CuratorsCard.tsx            # NEW: shareable museum-card component for organisms
│   ├── DeepResearchLoader.tsx      # Enrichment progress indicator
│   ├── DevTools.tsx                # Dev-only debug overlay
│   ├── DiscoveryHighlight.tsx      # MOVED: was src/components/, now root components/
│   ├── EntityDetailModal.tsx       # Entity detail pop-over
│   ├── EntityList.tsx              # Habitat entity list view
│   ├── EventFeed.tsx               # Activity/event stream
│   ├── FeaturedSpecimenCard.tsx    # Dashboard hero card
│   ├── FirebaseConfigModal.tsx     # Runtime Firebase config UI
│   ├── GrowthChart.tsx             # Specimen growth chart
│   ├── HabitatNarrative.tsx        # MOVED: was src/components/, now root components/
│   ├── HeroSection.tsx             # NEW: landing hero with animated tagline and feature badges
│   ├── LoginView.tsx               # Google auth sign-in screen
│   ├── MainLayout.tsx              # App shell / nav scaffold
│   ├── PhotoIdentify.tsx           # Photo capture + AI identification
│   ├── PlantAutocomplete.tsx       # MOVED: was src/components/, now root components/
│   ├── RackReviewModal.tsx         # Rack scan review modal
│   ├── ShareCuratorsCardModal.tsx  # NEW: share dialog for Curator's Card
│   ├── Toast.tsx                   # Toast notification system
│   ├── VoiceButton.tsx             # Voice input button + transcript
│   ├── WireframePlaceholder.tsx    # Placeholder / skeleton component
│   └── WonderFeedHelpers.tsx       # Wonder-feed rendering helpers
│
├── services/                       # Business logic + infrastructure
│   ├── store/                      # NEW DIRECTORY: decomposed store (major refactor)
│   │   ├── index.ts                # Re-exports all store modules
│   │   ├── rootStore.ts            # Legacy ConservatoryStore class (1023 lines, trimmed from 1538)
│   │   ├── storeState.ts           # NEW: ConservatoryState class — local persistence logic extracted
│   │   ├── useConservatoryStore.ts # NEW: Zustand slice — UI state (pendingAction, voice, research, enrichment)
│   │   ├── queryHooks.ts           # NEW: TanStack Query hooks (useEntities, useEvents, useUpdateEntity)
│   │   ├── repositories/           # NEW: Repository pattern for Firestore
│   │   │   ├── EntityRepository.ts # CRUD + subscription for entities collection
│   │   │   ├── EventRepository.ts  # CRUD + subscription for events collection
│   │   │   └── HabitatRepository.ts # Habitat-specific Firestore queries
│   │   └── useCases/               # NEW: Use case layer
│   │       └── ActionCommittalUseCase.ts  # Extracted from store: atomic commit logic
│   ├── vision/                     # Vision AI abstraction layer (Phase 4.1, unchanged)
│   │   ├── IVisionService.ts
│   │   ├── GeminiVisionService.ts
│   │   ├── SharedVisionService.ts
│   │   └── VisionServiceFactory.ts
│   ├── ArtifactGenerator.tsx       # NEW: generates Curator's Card image via html2canvas
│   ├── BlueprintService.ts         # NEW: rack scanning service (placeholder/simulated)
│   ├── EchoEngine.ts               # NEW: generates stylized organism wireframes (placeholder/simulated)
│   ├── costTracker.test.ts         # Unit tests — cost tracker
│   ├── costTracker.ts              # AI cost tracking + Firestore logs
│   ├── ecosystem.test.ts           # Unit tests — ecosystem health score
│   ├── ecosystem.ts                # Habitat health scoring engine
│   ├── enrichmentService.ts        # AI enrichment pipeline
│   ├── errorService.ts             # Centralized error handling
│   ├── firebase.ts                 # Firebase init + auth exports (still has HARDCODED KEYS)
│   ├── geminiService.ts            # LLM orchestration (740 lines, unchanged)
│   ├── imageService.ts             # Image upload/storage helpers
│   ├── logger.ts                   # Pino logger wrapper
│   ├── MockFirestoreService.ts     # Test-mode mock Firestore
│   ├── plantService.ts             # Plant library data access
│   ├── speciesLibrary.test.ts      # Unit tests — species library
│   ├── speciesLibrary.ts           # Firestore species caching layer
│   ├── taxonomy.ts                 # Taxonomy + classification helpers
│   └── connectionService.ts       # Online/offline detection
│
├── src/                            # Secondary source directory (naming gap — still present)
│   ├── constants.ts
│   ├── schemas.ts
│   ├── index.css
│   ├── vite-env.d.ts
│   └── utils/storage.ts
│
├── utils/                          # Root-level utilities (LRUCache, retry, zIndex)
│
├── tests/                          # E2E and integration tests
│   ├── e2e/
│   │   ├── backend-verification.spec.ts
│   │   └── living_placard.spec.ts  # NEW: Playwright E2E for the new Living Placard + unified store
│   ├── integration/
│   │   ├── enrichment-integration.spec.ts
│   │   └── master-workflow.test.ts
│   ├── workflow.spec.ts
│   ├── vision_accession.spec.ts
│   └── deep_research.spec.ts
│
├── functions/                      # Firebase Cloud Functions (unchanged)
├── scripts/                        # One-off data scripts (HARDCODED API KEY still at line 45)
├── docs/                           # Project documentation (extensive, unchanged)
├── public/                         # Static assets
│   └── assets/debug/               # AI-generated debug images (still present)
│
├── android/                        # Capacitor Android project
├── ios/                            # Capacitor iOS project
│
├── .env                            # COMMITTED SECRETS (unchanged — still present)
├── conservatory-admin-key.json     # COMMITTED SERVICE ACCOUNT KEY (unchanged — still present)
├── firestore.rules                 # Firestore security rules (unchanged)
├── storage.rules                   # Firebase Storage security rules
├── firebase.json                   # Firebase project config
├── package.json                    # Root — added TanStack Query, Radix UI, framer-motion, html2canvas, lru-cache
├── package-lock.json               # Lock file (present)
├── vite.config.ts                  # Vite build config
├── vitest.config.ts                # Vitest unit test config
├── playwright.config.ts            # Playwright E2E config
├── tailwind.config.js              # Tailwind CSS config
├── tsconfig.json                   # TypeScript config
├── capacitor.config.ts             # Capacitor mobile config
└── CLAUDE.md                       # AI assistant guidance doc
```

---

## Metrics Table

| Metric | Previous Audit | This Audit (Post-Pull) | Delta |
|--------|---------------|----------------------|-------|
| Total source files (excl. node_modules, dist, android, ios) | ~130 | ~155 | +25 |
| TypeScript / TSX files | ~83 | ~103 | +20 |
| New service modules | — | 6 (EchoEngine, BlueprintService, ArtifactGenerator, 3 repos, 1 use case) | +6 |
| New screen components | — | 2 (BlueprintScreen, PlaygroundScreen) | +2 |
| New UI primitives (Radix shadcn-style) | — | 7 (badge, button, card, dialog, input, separator, tabs) | +7 |
| New E2E test files | — | 1 (living_placard.spec.ts) | +1 |
| Test files total | 9 | 10 | +1 |
| State management modules | 1 (monolithic store.ts) | 5 (rootStore, storeState, useConservatoryStore, queryHooks, ActionCommittalUseCase) | split |
| Largest file | store.ts 1538 lines | rootStore.ts 1023 lines | -515 lines |
| Production deps | 17 | 22 | +5 (TanStack Query, Radix UI primitives, framer-motion, html2canvas, lru-cache) |
| Dev deps | 17 | 17 | 0 |
| Lock file present | Yes | Yes | — |

---

## Top-Level Folder Annotations (Post-Pull)

| Folder | Purpose | Delta Since Last Audit |
|--------|---------|----------------------|
| `components/` | React UI components; now has `ui/` sub-dir with Radix primitives | +9 new files |
| `services/store/` | **NEW**: Decomposed store with repositories, use cases, Zustand + Query hooks | New directory, major change |
| `services/` | Core business logic; added EchoEngine, BlueprintService, ArtifactGenerator | +3 new services |
| `src/` | Secondary source root; split still present, components partially migrated out | Minor cleanup |
| `utils/` | Root-level utilities; unchanged | No change |
| `tests/` | E2E + integration; added living_placard.spec.ts | +1 test |
| `functions/` | Firebase Cloud Functions; unchanged | No change |
| `scripts/` | One-off scripts; hardcoded API key still present | No change |
| `docs/` | Extensive documentation; unchanged | No change |
