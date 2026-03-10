# PASS 8: Portable Executive Brief

One-page document suitable for handoff to another IDE agent, senior developer, or contractor.

**Last Updated**: [Current Date]
**Status**: Single-user bespoke app, core workflows optimized

---

## Project Purpose

**The Conservatory** is a voice-first, multimodal biological collection management system for aquarists, terrarium keepers, and botanical enthusiasts. Users track habitats (tanks, terrariums), organisms (plants, animals), and environmental observations through AI-powered interfaces (voice commands, photo identification).

**Core Philosophy**: This is about **WONDER** and **DISCOVERY**, not maintenance. Users open the app to be WOWED and AWED by their collection and the majesty of the world. The system provides biological discovery narratives, ecosystem analysis, and reveals the "how" and "why" behind biological traits.

**Key Principle**: **Save all data, ask user to confirm, but NEVER BLOCKING**. Missing data is saved as placeholders (---), user can fill in later. System never says "you must tell me X" - always progressive, never blocking.

---

## Current Tech Stack

**Frontend**:
- React 19 + Vite
- TypeScript
- Tailwind CSS
- React DOM

**Backend**:
- Firebase Functions (Gen 2) - AI proxy
- Vercel serverless functions (alternative proxy, pick one)

**Database**:
- Firestore (with IndexedDB persistence)
- localStorage (offline backup)

**AI Provider**:
- Google Gemini (via proxy)
- Vision service abstraction ready for shared service

**Major Libraries**:
- `@google/genai` - Gemini AI SDK
- `firebase` - Firebase SDK
- `zod` - Schema validation
- `uuid` - ID generation
- `lucide-react` - Icons

**Testing**:
- Playwright (E2E tests)
- Vitest (unit tests, if added)

---

## Current Architecture Overview

**Logical Flow**:
```
User Input (Voice/Photo/Text)
    ↓
AI Parsing (geminiService) [with intent cache]
    ↓
Confirmation Card (Mad-Libs style, always editable)
    ↓
Commit → Store → Firestore + localStorage
    ↓
Enrichment (if new species) [with species library cache]
    ↓
Display enriched data with discovery narratives
```

**Where Inference Occurs**:
- `services/geminiService.ts` - All AI calls (voice parsing, vision, discovery)
- `services/vision/VisionServiceFactory.ts` - Routes to Gemini or shared vision service
- AI calls go through `/api/proxy` (Vercel) or Firebase Functions proxy

**Where Validation Occurs**:
- `src/schemas.ts` - Zod schemas for all AI responses
- Validation happens in `geminiService.ts` after AI calls
- Store validates before committing

**State Management**:
- `services/store.ts` - Monolithic store (ConservatoryStore class)
- Handles: state, business logic, persistence, AI orchestration, eventing
- Uses React hooks pattern (`useConservatory()`)

**Secrets**:
- API keys in environment variables
- Firebase config in client (public keys, security via rules)
- Proxy pattern hides Gemini API key

**Caching**:
- Intent parsing cache (in-memory Map)
- Species library cache (memory + Firestore)
- Firestore local cache (IndexedDB)

---

## Known Weaknesses

**Fragility**:
- Monolithic store has high change blast radius
- Tight coupling between UI, business logic, and persistence
- Custom workflow engine (could use Temporal/Inngest)

**Security**:
- Firestore rules allow all read/write (`allow read, write: if true`)
- CORS wide open (`Access-Control-Allow-Origin: '*'`)
- API keys visible in client bundle
- **Status**: OK for single-user, fix before production

**Scalability**:
- No pagination (works for small collections)
- No rate limiting (not needed for single-user)
- No conflict resolution (last-write-wins, OK for single-user)

**Observability**:
- Only `console.*` logging
- No error tracking (Sentry)
- No performance monitoring
- **Status**: OK for single-user debugging

---

## Distance from Ideal Architecture

**Ideal Architecture** (from PASS 2):
- Layered: Presentation → Application → Domain → Infrastructure
- Use cases extracted
- Repositories abstracted
- Dependency injection
- Provider-agnostic AI routing
- Standard tooling (Zustand, React Query, etc.)

**Current Architecture**:
- Application-centric (prototype phase)
- Monolithic store
- Direct service calls
- Custom implementations

**Gap Assessment**:
- **Very Close**: Output validation (Zod), schema enforcement
- **Moderate Refactor**: Image handling (vision abstraction done), authentication
- **Significant Refactor**: AI inference (provider routing), logging, error handling
- **Structural Rebuild**: State management, database access patterns

**Alignment**: ~40% aligned with ideal

**Migration Path**: See PASS 7 (Evolution Gates) - refactor when triggers activate

---

## Immediate High-Leverage Improvements

**Completed (Phase 4)**:
1. ✅ Vision service abstraction (ready for shared service)
2. ✅ Species library caching (prevents re-enrichment)
3. ✅ Intent parsing cache (faster repeated commands)
4. ✅ Toast notification system (consistent error handling)

**Remaining Quick Wins**:
1. **Dual Proxy Consolidation** (1 hour) - Pick one (Vercel or Firebase), delete other
2. **Background Enrichment** (2 hours) - Move to Web Worker, don't block UI
3. **Cache Eviction** (1 hour) - Add LRU to intent cache, TTL to species library
4. **Error Retry Logic** (2 hours) - Add retry for transient failures
5. **Progress Indicators** (1 hour) - Enhance enrichment progress display

**Total Remaining**: ~7 hours of quick wins

---

## Rewrite vs Refactor Assessment

**Recommendation**: **Refactor, not rewrite**

**Rationale**:
- Core workflows work well
- Domain model is sound
- Services are well-separated
- Main issue is monolithic store

**Refactor Approach**:
1. Extract use cases incrementally
2. Extract repositories incrementally
3. Move UI state to Zustand
4. Keep store as thin orchestrator
5. Add dependency injection gradually

**Estimated Effort**: 3-4 weeks for full refactor

**When to Refactor**: See PASS 7 (Evolution Gates) - wait for triggers

**When NOT to Refactor**: 
- No evolution gates triggered
- Current architecture works
- Rapid iteration still possible

---

## Key Files Reference

**Core Services**:
- `services/store.ts` - Main store (monolithic, handles everything)
- `services/geminiService.ts` - AI calls (voice, vision, discovery)
- `services/enrichmentService.ts` - External APIs (GBIF, Wikipedia, iNaturalist)
- `services/vision/VisionServiceFactory.ts` - Vision service abstraction
- `services/speciesLibrary.ts` - Species caching

**Core Components**:
- `components/VoiceButton.tsx` - Voice input
- `components/PhotoIdentify.tsx` - Photo identification
- `components/ConfirmationCard.tsx` - Mad-Libs confirmation UI
- `components/DeepResearchLoader.tsx` - Enrichment progress
- `components/Toast.tsx` - Toast notifications

**Schemas**:
- `src/schemas.ts` - Zod schemas for validation
- `types.ts` - TypeScript types

**Configuration**:
- `firestore.rules` - Security rules (currently wide open)
- `api/proxy.ts` - Vercel proxy
- `functions/src/index.ts` - Firebase Functions proxy

---

## Critical Context

**Single-User App**: 
- Not production-ready
- Security deferred (OK for single-user)
- Rate limiting not needed
- Multi-user support not needed

**Technical Debt**:
- Explicitly tracked in PASS 6 (Deferred-Risk Register)
- Evolution gates defined in PASS 7
- Refactor when gates trigger, not before

**Vision Service**:
- Abstraction ready for shared service
- Set `VITE_SHARED_VISION_SERVICE_URL` and `VITE_SHARED_VISION_SERVICE_KEY`
- Factory automatically uses shared service if env vars set

**Caching**:
- Intent parsing: In-memory Map (no eviction yet)
- Species library: Memory + Firestore (no TTL yet)
- Both work well for single-user

---

## Next Steps for New Developer

1. **Read This Brief** - Understand project purpose and architecture
2. **Review PASS 1** - Understand workflows and user journeys
3. **Review PASS 3** - Understand gaps and pragmatic approach
4. **Review PASS 6** - Understand deferred risks
5. **Review PASS 7** - Understand evolution gates
6. **Start with Quick Wins** - See "Remaining Quick Wins" above
7. **Don't Refactor Prematurely** - Wait for evolution gates

---

## Support Resources

**Documentation**:
- `docs/tabula-rasa/PASS1_WORKFLOWS_AND_CUJS.md` - User workflows
- `docs/tabula-rasa/PASS2_IDEAL_ARCHITECTURE.md` - Target architecture
- `docs/tabula-rasa/PASS3_GAP_ANALYSIS_PRAGMATIC.md` - Gap analysis
- `docs/tabula-rasa/PASS4_IMPLEMENTATION_BLUEPRINT.md` - Implementation phases
- `docs/tabula-rasa/PASS6_DEFERRED_RISK_REGISTER.md` - Technical debt
- `docs/tabula-rasa/PASS7_EVOLUTION_GATE.md` - Evolution triggers

**Code**:
- Start with `App.tsx` - Entry point
- `services/store.ts` - Main logic
- `components/` - UI components

---

**End of PASS 8: Portable Executive Brief**
