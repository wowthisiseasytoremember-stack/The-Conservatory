# PASS 1: Summary & Interpretation

This document explains what the technical analysis means for The Conservatory project, including inferred goals, architectural patterns, key findings, and implications.

---

## Executive Summary

**The Conservatory** is a biological collection management system for aquarists, terrarium keepers, and botanical enthusiasts. The application enables users to track habitats (tanks, terrariums), organisms (plants, animals), and environmental observations through multimodal AI-powered interfaces (voice commands, photo identification, chat).

**Core Intent**: Create a "digital twin" of biological collections with rich taxonomic data, automated enrichment from external sources, and conversational interfaces that reduce data entry friction.

**Implicit Goals**:
- Minimize manual data entry through AI interpretation
- Connect to authoritative sources (scraped plant DB, Kew, iNaturalist, GBIF) for wonder and discovery
- Enable rapid spatial extraction via camera (rack layouts, container detection)
- Create educational value through biological discovery narratives
- **Core Philosophy**: This is about **WONDER** and **DISCOVERY**, not maintenance. "What does CONSERVATORY mean?" - a place of wonder, preservation, and revelation of biological mechanisms.

---

## 6. Inferred Goals and Implicit Requirements

### 6.1 Explicit Goals (from WORKFLOWS.md)

1. **Voice-First Data Entry**: Minimize typing through natural language processing
2. **Spatial Extraction via Camera**: Photo identification is primarily for extracting spatial/structural information - taking a photo of a rack of tanks, extracting rectangles (containers), guessing sizes, creating habitat containers. This helps users fill in the "skeleton" of their room layout. Rough species identification is possible but species-level accuracy is not the primary goal.
3. **Wonder and Discovery**: This is NOT about maintenance - it's about WONDER. The system connects to authoritative sources (scraped aquatic plant database, Kew Gardens, iNaturalist, GBIF) to reveal fascinating biological mechanisms. "What does CONSERVATORY mean?" - return to this concept when uncertain. It's a place of wonder, preservation, and revelation.
4. **Educational Enrichment**: Biological discovery narratives, ecosystem analysis, and revealing the "how" and "why" behind biological traits
5. **Plant Database Availability**: Offline capability is primarily to ensure the scraped plant database is always available. General offline functionality is a nice-to-have but not critical.


### 6.2 Implicit Goals (inferred from code)

1. **Rapid Development**: Thought development would be easy, so built for quick iteration
2. **Data Portability**: Cloud backup is standard - localStorage + Firestore dual persistence
3. **User-Editable Accuracy**: Validation is guidance, not enforcement - user can always edit/correct. System aims to be right but prioritizes user control.
4. **User Control**: Confirmation cards, slot editing, and manual enrichment triggers prioritize user agency - YES
5. **Enrichment Timing**: Manual habitat enrichment (not auto) prevents running ecosystem analysis 22 times while user is adding their first inventory. Auto-enrichment for individual species creates species library. Manual enrichment for holistic habitat analysis runs when user is ready.
6. **Multi-User Ready**: Firebase auth exists but multi-user not necessary - collaboration possible but not required

### 6.3 Domain-Specific Patterns

**Biological Trait System**:
- **Mix-and-Match Traits**: Entities can have multiple traits (AQUATIC + PHOTOSYNTHETIC + INVERTEBRATE)
- **Parameterized Traits**: Each trait type has specific parameters (pH, temp, salinity, etc.)
- **Type Inference**: Entity type inferred from traits (PHOTOSYNTHETIC → PLANT, COLONY → COLONY)

**Habitat-Centric Model**:
- All entities belong to a habitat (`habitat_id`)
- Habitats have environmental parameters (traits)
- Active habitat concept for context-aware operations

**Event Sourcing Pattern**:
- All changes create `DomainEvent` objects
- Events stored in `events` collection
- Entities derived from events (though current implementation stores entities directly)

**Enrichment Pipeline**:
- Multi-source data aggregation (local library, GBIF, Wikipedia, iNaturalist, AI)
- Priority-based merging (local > GBIF > external)
- Staged progress tracking for UX

### 6.4 Critical User Journeys (CUJ)

**CUJ 1: Voice Accession**
1. User holds voice button
2. Speaks: "I just added 12 Neon Tetras to The Shallows"
3. AI parses intent, extracts species, quantity, habitat
4. Confirmation card appears with editable slots
5. User corrects if needed, confirms
6. Entity created, event logged

**CUJ 2: Photo Identification**
1. User taps camera icon
2. Captures photo of plant/fish
3. AI identifies species with confidence
4. User taps "Accession"
5. Confirmation card appears (bypasses voice)
6. User confirms, entity created

**CUJ 3: Rack Discovery**
1. User taps layers icon (rack mode)
2. Captures photo of entire rack
3. AI identifies multiple containers, positions, species
4. Rack review modal shows list
5. User toggles selections, confirms
6. Multiple habitats created in parallel

**CUJ 4: Deep Research**
1. User selects habitat or entity
2. Triggers "Deep Research" action
3. System enriches from 5 sources sequentially
4. Progress shown per stage (library → GBIF → Wiki → iNat → Discovery)
5. Entity updated with merged data
6. Discovery narrative revealed

**CUJ 5: Observation Logging (Flexible Catch-All)**
- Less important but serves as catch-all for anything without a dedicated field
- Examples: "I fed the tadpoles extra today", "The anubias is blooming", "I noticed the water level in the top tank is low"
- If AI isn't sure which habitat/entity: Observation sits in feed unlinked
- User clicks observation → Gets editable confirmation card → Can link to habitat/entity
- System saves linkage and adds to entity's aliases/context for future AI understanding
- This builds context over time - flexible system that doesn't fail when uncertain

### 6.5 Technical Requirements (Implicit)

1. **Low Latency**: Fast AI models (flash-lite) for voice parsing, timeout handling - YES
2. **Offline Resilience**: Primarily for plant database availability - localStorage fallback ensures plant DB is always accessible
3. **Data Integrity**: Zod validation is guidance, not enforcement - always user-editable
4. **Species Library Pattern**: 
   - **Auto-enrichment for individual species**: When user adds first Cherry Shrimp, system auto-enriches and stores in shared species library in Firebase
   - **Species library caching**: If user adds more Cherry Shrimp, system uses cached library data (no model call)
   - **Manual enrichment for habitats**: Holistic ecosystem analysis is manual - prevents running 22 times while user adds 4 fish, 4 shrimp, 2 snails, 9 plants to a single tank one-by-one
   - **Habitat enrichment prompt**: Sends complete habitat info (size, specs, inhabitants, plants) to model asking "Tell me about this mini ecosystem" (not "tell me about this fish")
5. **Developer Experience**: Test mode, mock services, hot-reload support
6. **Cross-Platform**: React web app (not iOS native yet, but iOS considerations in planning)

---

## 7. Architecture Patterns Identified

### 7.1 Current Architecture Style

**Monolithic Store Pattern**:
- Single `ConservatoryStore` class handles all concerns
- No clear separation of layers
- Tight coupling between UI, business logic, and data access

**Service Layer Pattern** (Partial):
- `geminiService`, `enrichmentService`, `plantService` exist as separate modules
- But store directly calls services (no dependency injection)
- Services are stateless functions (good)

**Repository Pattern** (Partial):
- Firestore access abstracted through Firebase SDK
- But write logic mixed with business logic in store
- No repository abstraction layer

**Event Sourcing** (Partial):
- Domain events created and stored
- But entities also stored directly (not derived from events)
- Dual storage pattern (events + entities)

### 7.2 Data Flow Patterns

**Unidirectional Flow** (React-like):
```
User Action → Component → Store Method → Service Call → API → Response → Store Update → UI Re-render
```

**Optimistic Updates**:
- Local state updated immediately
- Firestore write happens asynchronously
- Cloud sync overwrites local on snapshot

**Dual Persistence**:
- localStorage for offline/backup
- Firestore for cloud sync
- No conflict resolution

### 7.3 Error Handling Patterns

**Try/Catch at Service Level**:
- Services catch errors, return null or throw
- Store catches service errors, sets error state
- UI displays error in ConfirmationCard

**Status-Based Error States**:
- `PendingAction.status = 'ERROR'`
- `AppEvent.status = EventStatus.ERROR`
- `Entity.enrichment_status = 'failed'`

**No Global Error Boundary**: Errors handled per-operation, no React error boundary

---

## 8. Key Findings Summary

### 8.1 Strengths

1. **Clear Domain Model**: Trait system, habitat-centric design, event sourcing concepts
2. **Validation Layers**: Zod + TypeScript + Google GenAI schemas provide defense in depth
3. **Offline Support**: localStorage + mock services enable offline development and usage
4. **User Control**: Confirmation cards, manual enrichment, editable slots prioritize user agency
5. **Multimodal Input**: Voice + camera + chat provide multiple entry points

### 8.2 Weaknesses

1. **Mixed Responsibilities**: Store does too much (state + business logic + data access)
2. **Tight Coupling**: UI directly depends on store, services directly depend on Firebase
3. **No Dependency Injection**: Hard to test, hard to swap implementations
4. **Race Conditions**: Optimistic updates + cloud sync can conflict
5. **Schema Duplication**: Google GenAI schemas + Zod schemas + TypeScript types (3 places)
6. **No Conflict Resolution**: Last-write-wins for concurrent edits
7. **Reinvented Wheels**: Custom state management, timeout utility, entity resolution

### 8.3 Architectural Debt

1. **Monolithic Store**: Should be split into state management + domain service + repository
2. **AI Logic Coupling**: Prompt construction embedded in service layer, hard to test/modify
3. **Dual API Proxy**: Both Vercel and Firebase functions exist (uncertain hosting strategy)
4. **No Caching Layer**: Every AI call hits API, no memoization or caching
5. **No Rate Limiting**: No protection against API abuse or cost overruns
6. **Security Gaps**: Firestore rules allow all read/write (critical issue)

### 8.4 Implicit Requirements Not Yet Met

1. **Multi-User Support**: Auth exists but no user-scoped data isolation
2. **Conflict Resolution**: No merge strategies for concurrent edits
3. **Image Storage**: Photos are base64 in memory only, not persisted
4. **Export/Sharing**: No export functionality mentioned in code
5. **Search/Filter**: No global search across entities mentioned
6. **Historical Charts**: GrowthChart component exists but not wired to observation history

---

## 9. Next Steps for Review

This Pass 1 analysis should be reviewed and validated before proceeding to Pass 2 (Ideal Architecture). Key questions for alignment:

1. **Goals Validation**: Are the inferred goals accurate? Any missing goals?
2. **CUJ Validation**: Are the critical user journeys correct? Any missing workflows?
3. **Architecture Intent**: Is the monolithic store pattern intentional, or should it be refactored?
4. **Hosting Strategy**: Why both Vercel and Firebase functions? Which is primary?
5. **Multi-User**: Is multi-user support planned? If so, when?
6. **Conflict Resolution**: Is last-write-wins acceptable, or need merge strategies?

Once aligned, Pass 2 will design the ideal architecture ignoring current implementation constraints.

---

## What This Means

### For Development

The codebase shows a **functional but tightly coupled architecture**. The monolithic store pattern works for rapid development but creates technical debt. The system prioritizes **user experience** (optimistic updates, confirmation cards) and **offline resilience** (localStorage, mock services) over architectural purity.

### For Production

**Critical blockers** exist:
- Firestore security rules allow all read/write (anyone can access any data)
- No rate limiting on AI calls (cost risk)
- No conflict resolution (data loss risk in multi-user scenarios)

**Medium-risk issues**:
- Race conditions between optimistic updates and cloud sync
- Schema duplication across 3 systems (maintenance burden)
- Dual API proxy implementation (uncertain hosting strategy)

### For Refactoring

The system is **"Tangled but Salvageable"**:
- Core domain logic is sound (trait system, enrichment pipeline)
- Services are well-separated (geminiService, enrichmentService)
- Main issue is the monolithic store mixing concerns
- Refactoring would involve splitting store into: state management + domain service + repository

**Estimated effort**: 2-3 weeks for structural refactor, 1 week for security fixes, 1 week for conflict resolution.

### For Architecture Evolution

The current architecture suggests:
- **Rapid prototyping phase**: Test mode, mock services, optimistic updates
- **Production readiness phase needed**: Security, conflict resolution, caching, rate limiting
- **Multi-user phase planned**: Auth exists but not user-scoped data

The system is at a **transition point** between prototype and production-ready application.
