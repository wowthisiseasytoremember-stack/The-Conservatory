# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with The Conservatory codebase.

---

# The Conservatory: Development Guide

> **Purpose**: A voice-native, AI-powered habitat and specimen management system for aquatic/plant enthusiasts.
> **Status**: Phase 4 Implementation COMPLETE, ready for Verification Testing

---

## Quick Context

**The Conservatory** is a single-user PWA for tracking aquatic habitats and specimens with:
- 🎤 Voice-native UI for hands-free habitat management
- 📸 Photo identification via Gemini Vision AI
- 🧬 Automated enrichment (species discovery, traits, synergies)
- 🗣️ Natural language intent parsing for quick actions
- 💾 Firebase backend with rich domain model

**What's Done**: Vision service abstraction, species library caching, intent parsing cache, toast system
**What's Next**: Verification testing → Optional quick wins → Deferred items (with triggers)

---

## Current Status: Verification Testing Phase

**You are here**: PASS 5 (Verification Matrix)
**Document**: `docs/tabula-rasa/PASS5_VERIFICATION_MATRIX.md`

### Immediate Next Steps

1. **Test Core Workflows** (must-pass checks)
   - Voice habitat creation
   - Voice accession (adding specimens)
   - Photo identification
   - Rack scanning
   - Deep research/enrichment

2. **Test Caching Improvements** (Phase 4 work)
   - Intent parsing cache (2nd command is instant)
   - Species library cache (2nd enrichment is instant)

3. **Test Error Handling** (toast notifications)
   - Photo errors show clear messages
   - Voice errors don't crash app
   - Enrichment failures handled gracefully

4. **Test Regression Areas**
   - Strategy fallback (ambiguous commands)
   - Zod validation (malformed AI responses)
   - Firestore sync (offline → online)

See `docs/tabula-rasa/NEXT_STEPS_AND_TODOS.md` for detailed test checklist.

---

## Development Commands

```bash
# Development
npm run dev                 # Start Vite dev server

# Testing
npm run test              # Run Playwright tests
npm run test:ui           # Run tests with UI

# Building
npm build                 # Build for production
npm preview               # Preview production build

# Code Quality
npm run lint              # Run ESLint (if configured)
npm run type-check        # TypeScript type checking
```

---

## Architecture Overview

### Current Implementation (Pragmatic Phase)

**Layered approach** (not fully decomposed yet, by design):
- **Presentation**: React components + modals
- **Application**: Zustand store (monolithic, works for single-user)
- **Domain**: Rich models (Habitat, Specimen, Trait, Event)
- **Infrastructure**: Firebase Firestore + Gemini AI

### Key Services

| Service | Purpose | Status |
|---------|---------|--------|
| `VisionOrchestrator.ts` | AI image analysis (3-stream) | ✅ Works |
| `LibrarianService.ts` | Persistence & staging | ✅ Works |
| `SkuMatchingService.ts` | Heuristic matching | ✅ Works |
| `geminiService.ts` | LLM orchestration | ✅ Works |
| `IVisionService.ts` | Vision abstraction | ✅ Phase 4.1 DONE |
| `speciesLibrary.ts` | Caching layer | ✅ Phase 4.2 DONE |
| `Toast.tsx` | Error/success notifications | ✅ Phase 4.4 DONE |

### Data Model Highlights

- **Habitats**: Tanks/terrariums with pH, temp, light metadata
- **Specimens**: Fish, plants, invertebrates with traits
- **Traits**: Domain-specific parameters (light, CO2, temp range, etc.)
- **Events**: Accessions, observations, enrichment progress
- **Enrichment**: AI-generated discovery secrets, images, synergies

---

## Code Quality Standards

### From `apps/box-audit/CLAUDE.md` (Inherited)

These apply to all code in this project:

- **Error Handling**: Try/catch on async, user-facing error messages
- **Loading States**: Show spinner during enrichment
- **Empty States**: Handle no results gracefully
- **TypeScript**: Strict mode, proper types
- **Accessibility**: Semantic HTML, 44px touch targets
- **Documentation**: Explain WHY, not just WHAT
- **Performance**: No unnecessary re-renders, proper memo usage

### Voice & Intent-Specific

- All voice commands must be tested with multiple utterances
- Intent parsing caching keeps second-identical-command instant
- Non-blocking UX: save all data, never block user
- Toast notifications for errors, never silent failures

---

## Documentation Map

Start here based on what you need:

**Understanding the Project**:
- `docs/FEATURE_MANIFEST.md` - Complete feature vision (dashboard, specimen placard, timelines)
- `docs/WORKFLOWS.md` - User workflows and journeys
- `docs/tabula-rasa/PASS1_WORKFLOWS_AND_CUJS.md` - Detailed user journeys

**Current Status**:
- `docs/tabula-rasa/AUDIT_COMPLETE_SUMMARY.md` - What's done, what's planned
- `docs/tabula-rasa/NEXT_STEPS_AND_TODOS.md` - Verification checklist + optional quick wins

**Technical Details**:
- `docs/tabula-rasa/PASS2_IDEAL_ARCHITECTURE.md` - Target architecture (reference)
- `docs/tabula-rasa/PASS3_GAP_ANALYSIS_PRAGMATIC.md` - Known gaps and workarounds
- `docs/tabula-rasa/PASS6_DEFERRED_RISK_REGISTER.md` - Technical debt with triggers

**Decision Tracking**:
- `docs/tabula-rasa/PASS7_EVOLUTION_GATE.md` - When to refactor (objective triggers)
- `docs/tabula-rasa/PASS8_PORTABLE_EXECUTIVE_BRIEF.md` - High-level summary

---

## Workflow: What to Do When

### I'm testing workflows
👉 **Read**: `docs/tabula-rasa/NEXT_STEPS_AND_TODOS.md` (Verification Testing section)

**Checklist**:
- [ ] Test Voice Habitat Create
- [ ] Test Voice Accession
- [ ] Test Photo Identification
- [ ] Test Rack Scan
- [ ] Test Deep Research
- [ ] Verify caching (intent + species library)
- [ ] Verify error toasts

### I'm adding a new feature
1. Check `docs/FEATURE_MANIFEST.md` - is it already planned?
2. Check evolution gates: `docs/tabula-rasa/PASS7_EVOLUTION_GATE.md`
   - If all gates clear → stay pragmatic (don't over-engineer)
   - If a gate triggers → architectural refactoring may be needed
3. Keep components under 300 lines
4. Use Zustand for state (unless adding new domain layer)
5. Document with the "Incompetent Successor" protocol

### I'm fixing a bug
1. Check `docs/tabula-rasa/PASS6_DEFERRED_RISK_REGISTER.md` for known risks
2. If it's a security issue → fix immediately
3. If it's architecture → check if Evolution Gate D triggered
4. Test thoroughly (use Playwright tests)

### I'm refactoring code
1. Check evolution gates: which ones are triggering?
2. If Gate A (Team Growth) or E (Feature Velocity) → extract use cases
3. If Gate C (Reliability) → add logging, structured error handling
4. Update `PASS6_DEFERRED_RISK_REGISTER.md` with changes

---

## Phase Roadmap

### ✅ COMPLETED: Phase 4 Implementation
- [x] Vision service abstraction (IVisionService)
- [x] Species library caching
- [x] Intent parsing cache
- [x] Toast notification system
- **Status**: All done, tested, working

### 🔄 CURRENT: Verification Testing (PASS 5)
- [ ] Run all test scenarios in `NEXT_STEPS_AND_TODOS.md`
- [ ] Verify no regressions
- [ ] Check error handling
- **Goal**: Sign off that Phase 4 works in production

### 📋 OPTIONAL: Quick Wins (After Verification)
- Background enrichment (Web Worker)
- Error retry logic with exponential backoff
- Cache eviction policy (LRU)
- Dual proxy consolidation
- **Time**: 1-2 hours each
- **Trigger**: Do these if you have time after verification

### 🚫 DEFERRED: Major Refactors (When Gates Trigger)

**Security (ASAP if needed)**:
- Firestore security rules (if sharing with others)
- CORS configuration (if deploying publicly)
- API key management (if going to production)

**Architecture (when Evolution Gates trigger)**:
- Extract use cases (Gate A: Team Growth, Gate E: Velocity Drop)
- Extract repositories (same gates)
- Add dependency injection (when testing becomes critical)

**See**: `docs/tabula-rasa/PASS6_DEFERRED_RISK_REGISTER.md` for full list with triggers

---

## Evolution Gates (Know These!)

These are **objective triggers** that tell you when to refactor. Stay pragmatic until one triggers:

| Gate | Trigger | Action |
|------|---------|--------|
| **A** | Team grows to 2+ people | Extract use cases, add DI |
| **B** | Using 3+ AI providers | Create provider router layer |
| **C** | >5 reliability complaints | Add logging, error tracking |
| **D** | Deploying publicly | Fix security (rules, CORS, keys) |
| **E** | Feature velocity drops | Extract repositories, use cases |
| **F** | AI costs spike unexpectedly | Add rate limiting, cost monitoring |
| **G** | Data approaches Firebase limits | Partition architecture |

**Current Status**: All gates clear, stay pragmatic.

See: `docs/tabula-rasa/PASS7_EVOLUTION_GATE.md`

---

## Known Technical Debt

Everything documented in `docs/tabula-rasa/PASS6_DEFERRED_RISK_REGISTER.md`:

**Don't fix these yet** (unless a gate triggers):
- Monolithic Zustand store (works fine for single user)
- No structured logging (Pino can wait)
- Dual proxy setup (decide later)
- Window globals in tests (works for now)
- No Sentry/error tracking (single user, can wait)

**Do fix before production**:
- Firestore security rules (add auth)
- CORS configuration
- API key exposure (move to env vars)

---

## Testing Strategy

### Unit Tests
- Use Playwright for E2E (already set up)
- Test critical workflows: voice, photo, enrichment
- Test error scenarios

### Mobile Testing
- Test on actual phone or Chrome DevTools device emulation
- Voice input works reliably
- Toasts display correctly
- No horizontal scrolling

### Verification Checklist
See `docs/tabula-rasa/PASS5_VERIFICATION_MATRIX.md` for exact test steps

---

## The Vision: What's Planned

See `docs/FEATURE_MANIFEST.md` for complete feature vision:

**Dashboard Reimagining**:
- Featured Specimen Card (daily rotating hero)
- Ecosystem Pulse Summary (habitat status)
- Wonder Feed (enriched event stream)
- Quick Stats Bar
- Ambient Ticker (biological facts)

**Specimen Placard Reimagining**:
- Hero Image with gradient overlay
- Taxonomy Ribbon
- Discovery Secrets (mechanism, evolution, synergy)
- Origin & Distribution map
- Rich Care Narrative
- Trait Dashboard
- Personal History Timeline

**Habitat Diorama** (location intelligence):
- 3D-ish visualization of habitat
- Species placement
- Synergy indicators

This is the "wonder and discovery" vision — making the app feel like a museum placard, not a utility.

---

## Before You Start Coding

1. ✅ **Understand current phase**: Verification Testing (PASS 5)
2. ✅ **Check evolution gates**: None triggered yet, stay pragmatic
3. ✅ **Read the audit docs**: Understand what's been done
4. ✅ **Run the test checklist**: Make sure Phase 4 works
5. ✅ **Reference FEATURE_MANIFEST.md**: Know the vision

---

## Quick Command Reference

```bash
# Development
npm run dev                  # Start dev server

# Testing & Verification
npm run test               # Run Playwright tests
npm run test:ui            # Run with UI

# Production
npm run build              # Build for deploy
npm preview                # Preview build locally

# Type Safety
npm run type-check         # Check TypeScript (if configured)
```

---

## Key Files to Know

| File | Purpose | Status |
|------|---------|--------|
| `App.tsx` | Root component | ✅ Main entry |
| `store.ts` | Zustand store (monolithic) | ✅ Application logic |
| `types.ts` | Domain types | ✅ Rich model |
| `services/geminiService.ts` | LLM orchestration | ✅ Completed |
| `services/vision/` | Vision abstraction | ✅ Phase 4.1 |
| `services/speciesLibrary.ts` | Caching layer | ✅ Phase 4.2 |
| `components/Toast.tsx` | Error notifications | ✅ Phase 4.4 |
| `functions/` | Cloud Functions (if used) | ⚠️ Check status |
| `docs/tabula-rasa/` | All documentation | ✅ Complete |

---

## Remember

- **Stay pragmatic**: Don't over-engineer until a gate triggers
- **Non-blocking UX**: Save all data, never block the user
- **Wonder over utility**: This is about discovery, not maintenance
- **Voice first**: All critical workflows must work via voice
- **Test thoroughly**: Verification phase is critical
- **Documentation lives**: Keep `PASS6_DEFERRED_RISK_REGISTER.md` updated

---

## When You're Done (Next Phase)

After verification testing completes:

1. **Optional Quick Wins** (1-2 hours each)
   - Background enrichment
   - Error retry logic
   - Cache eviction policy

2. **Decision Point**: Dual Proxy
   - Consolidate to either Vercel or Firebase Functions
   - Document decision

3. **Monitor Evolution Gates**
   - Track metrics
   - Update gate status in PASS7
   - Trigger refactoring if needed

See: `docs/tabula-rasa/NEXT_STEPS_AND_TODOS.md` for complete checklist
