# PASS 3: Gap Analysis (Pragmatic - Works Today)

This document compares the current implementation to the ideal architecture from PASS 2, with a **pragmatic focus on making core workflows work perfectly TODAY**. Security, rate limiting, and multi-user concerns are deferred.

**Context**: Single-user bespoke app that needs to work now, not production-ready yet.

---

## Executive Summary

### Current State
- ✅ Core workflows functional (voice, camera, enrichment)
- ⚠️ Monolithic store mixing concerns
- ⚠️ Vision calls directly to Gemini (no abstraction)
- ⚠️ Enrichment works but not optimized
- ⚠️ No species library caching
- ❌ Security rules allow all access (OK for single-user for now)

### Target State (Today)
- ✅ Core workflows work perfectly
- ✅ Vision service abstraction ready for your shared service
- ✅ Species library caching working
- ✅ Enrichment optimized for speed
- ✅ Non-blocking UX everywhere
- ⏸️ Security deferred (single-user, local use)

### Deferred (Not Today)
- Rate limiting
- Prompt injection protection
- Multi-user isolation
- Cost tracking
- Advanced observability

---

## 0. Detailed Audit Findings (Incorporated)

This section incorporates findings from a comprehensive read-only architectural audit, maintaining pragmatic focus on "works today" while acknowledging deeper issues.

### 0.1 Architecture Verdict

**Current State**: **Application-centric** (prototype phase)
- Core business logic, inference orchestration, and persistence tightly interwoven
- Strong product thesis and rich domain model ✅
- Meaningful AI schema discipline ✅
- But: System needs architectural segmentation for production

**Target State**: **Platform-centric** (production-ready)
- BFF + workflow engine + provider router + security hardening
- Separated concerns, testable, evolvable

**For Now**: Keep application-centric approach, but make it work perfectly. Refactor to platform-centric when needed.

---

### 0.2 Dual Proxy Implementation

**Current**: Two proxy implementations doing the same thing:
- `api/proxy.ts` - Vercel serverless function
- `functions/src/index.ts` - Firebase Cloud Function

**Issue**: Indicates uncertainty about hosting strategy

**Status**: **DEFER** - Pick one and stick with it, but not urgent

**Quick Fix** (when you decide):
1. If using Vercel: Delete `functions/` directory
2. If using Firebase: Delete `api/proxy.ts`
3. Update `geminiService.ts` to use chosen proxy

**Recommendation**: Use Firebase Functions (already configured, secrets management built-in)

---

### 0.3 Custom Workflow Engine

**Current**: In-app workflow engine for ambiguity/strategy loops in store

**Ideal**: Use standard tooling (Temporal, Inngest, Trigger.dev)

**Status**: **DEFER** - Works for now, but reinventing the wheel

**When to Fix**: When workflow complexity grows or you need:
- Retry policies
- Timeouts
- Idempotency
- Background job queues
- Workflow observability

**For Now**: Keep custom implementation, but acknowledge it's a technical debt item

---

### 0.4 Security Gaps (Acknowledged, Deferred)

**Current**:
- Firestore rules: `allow read, write: if true` (wide open)
- CORS: `Access-Control-Allow-Origin: '*'` (wide open)
- Default Firebase config in client (API keys exposed)

**Status**: **OK FOR NOW** - Single-user, local use, not public

**When to Fix**: Before:
- Sharing with others
- Deploying publicly
- Accepting user-generated content

**Quick Fix** (when needed):
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}

// api/proxy.ts or functions/src/index.ts
res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'http://localhost:5173');
```

---

### 0.5 Missing Observability

**Current**: `console.*` and ad hoc warnings, no structured telemetry

**Ideal**: OpenTelemetry + structured logger

**Status**: **DEFER** - Single-user, manual debugging OK

**When to Fix**: When:
- Debugging becomes painful
- Going multi-user
- Need production monitoring

**Quick Win** (if needed): Add simple structured logging:
```typescript
// services/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${message}`, meta);
    // Could send to Firestore 'logs' collection
  },
  error: (message: string, error?: Error, meta?: any) => {
    console.error(`[ERROR] ${message}`, error, meta);
    // Could send to Firestore 'errors' collection
  }
};
```

---

### 0.6 Test Mode via Window Globals

**Current**: `window.setTestUser` and `window.processVoiceInput` in production store class

**Issue**: DIY test mode toggles via window globals

**Status**: **OK FOR NOW** - Works for E2E tests, but not ideal

**When to Fix**: When refactoring store, extract test utilities to separate module

**For Now**: Keep as-is, works for testing

---

### 0.7 Subsystem Gap Analysis (From Audit)

| Subsystem | Current State | Gap | Priority (Today) |
|-----------|--------------|-----|------------------|
| **Authentication** | Google auth via Firebase; test bypass | Moderate Refactor | ⏸️ DEFER |
| **Image handling** | Browser capture → base64 → model calls | Moderate Refactor | ✅ FIX (vision abstraction) |
| **AI inference** | Prompt strings in code; Gemini-coupled | Significant Refactor | ⏸️ DEFER |
| **Output validation** | Good Zod schemas | Very Close | ✅ KEEP |
| **State management** | Monolithic mutable store | Structural Rebuild | ⏸️ DEFER |
| **Logging/observability** | console.* only | Significant Refactor | ⏸️ DEFER |
| **Error handling** | Try/catch exists; no typed taxonomy | Moderate Refactor | ⏸️ DEFER |
| **Rate limiting** | None | Structural Rebuild | ⏸️ DEFER |
| **Caching** | LocalStorage + Firestore; no server cache | Significant Refactor | ✅ FIX (species library) |
| **Database access** | Firestore snapshots; coupled to store | Moderate Refactor | ⏸️ DEFER |
| **Security boundaries** | Wide open | Structural Rebuild | ⏸️ DEFER |

**Key Insight**: Most gaps are "DEFER" for single-user app. Focus on the two "FIX" items that improve core workflows today.

---

### 0.8 Reinvented Wheels (Acknowledged)

**Custom Implementations That Could Use Standard Tooling**:

1. **Workflow Engine** → Temporal/Inngest/Trigger.dev
   - **Status**: DEFER - Works for now
   - **When**: If workflow complexity grows

2. **Test Mode Toggles** → Proper test utilities
   - **Status**: DEFER - Works for E2E tests
   - **When**: When refactoring store

3. **Offline/Test Mode** → Standard patterns
   - **Status**: DEFER - Works for development
   - **When**: When going production

**For Now**: Acknowledge these are technical debt, but not blockers for "works today"

---

### 0.9 Overengineered vs Underengineered

**Overengineered** (sophistication exceeds infrastructure):
- Complex narrative/strategy model prompting ✅ (good for UX)
- Deep research stage UX sophistication ✅ (good for UX)
- But: Lacks equivalent investment in infra boundaries and governance ⚠️

**Underengineered** (fragile areas):
- Security model ❌ (OK for single-user, fix before production)
- Multi-runtime drift (Vercel vs Firebase) ⚠️ (pick one)
- Missing infra: rate limiting, retries, idempotency, queues ⚠️ (OK for now)

**For Now**: Keep sophisticated UX features, acknowledge infra gaps, fix when needed

---

### 0.10 Bottom-Line Verdict (From Audit)

> "You have a strong product thesis and rich domain model, plus meaningful AI schema discipline. But the system is currently application-centric instead of platform-centric: core business logic, inference orchestration, and persistence are tightly interwoven. The right next step is not feature additions—it's architectural segmentation (BFF + workflow engine + provider router + security hardening). That would convert this from a powerful prototype into a production-safe, evolvable system."

**Pragmatic Interpretation**:
- ✅ Strong foundation (product thesis, domain model, AI discipline)
- ⚠️ Architecture needs segmentation (but works for single-user)
- ✅ Right next step: Make core workflows perfect (today), then architectural segmentation (later)

**Action**: Focus on quick wins today, plan architectural refactoring for when needed

---

## 1. Core Workflow Gaps & Fixes

### 1.1 Voice Accession Flow

**Current**: Works, but could be faster and more reliable

**Issues**:
1. Uses `gemini-flash-lite-latest` (good for speed) ✅
2. No caching of parsed intents (re-parses same commands)
3. Store directly calls geminiService (tight coupling)
4. No retry logic on failures

**Fix Priority**: **MEDIUM** (works, but optimize)

**Quick Wins**:
```typescript
// services/geminiService.ts - Add simple caching
const intentCache = new Map<string, ParsedIntent>();

async parseVoiceCommand(transcription: string, entities: Entity[]): Promise<any> {
  // Simple cache key (transcription + entity count)
  const cacheKey = `${transcription}:${entities.length}`;
  if (intentCache.has(cacheKey)) {
    return intentCache.get(cacheKey);
  }
  
  const result = await this.parseIntentInternal(transcription, entities);
  intentCache.set(cacheKey, result);
  return result;
}
```

**Better Fix** (when refactoring):
- Extract to `AccessionUseCase`
- Add retry logic with exponential backoff
- Cache at use case level, not service level

---

### 1.2 Photo Identification Flow

**Current**: Direct calls to `geminiService.identifyPhoto()` and `analyzeRackScene()`

**Issues**:
1. **CRITICAL**: No abstraction - can't swap in your shared vision service
2. Tightly coupled to Gemini
3. No fallback if Gemini fails

**Fix Priority**: **HIGH** (needed for your shared vision service)

**Solution**: Create vision service abstraction

```typescript
// services/vision/IVisionService.ts
export interface IVisionService {
  /**
   * Identify a single species from an image
   */
  identifySpecies(imageData: string): Promise<IdentifyResult>;
  
  /**
   * Analyze a rack scene for multiple containers and species
   */
  analyzeRackScene(imageData: string): Promise<{ containers: RackContainer[] }>;
}

// services/vision/GeminiVisionService.ts (current implementation)
export class GeminiVisionService implements IVisionService {
  constructor(private geminiService: typeof geminiService) {}
  
  async identifySpecies(imageData: string): Promise<IdentifyResult> {
    return await this.geminiService.identifyPhoto(imageData);
  }
  
  async analyzeRackScene(imageData: string): Promise<{ containers: RackContainer[] }> {
    return await this.geminiService.analyzeRackScene(imageData);
  }
}

// services/vision/SharedVisionService.ts (your future service)
export class SharedVisionService implements IVisionService {
  constructor(private apiUrl: string, private apiKey: string) {}
  
  async identifySpecies(imageData: string): Promise<IdentifyResult> {
    const response = await fetch(`${this.apiUrl}/vision/identify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ image: imageData })
    });
    
    if (!response.ok) throw new Error(`Vision service failed: ${response.statusText}`);
    return await response.json();
  }
  
  async analyzeRackScene(imageData: string): Promise<{ containers: RackContainer[] }> {
    const response = await fetch(`${this.apiUrl}/vision/rack-analysis`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ image: imageData })
    });
    
    if (!response.ok) throw new Error(`Vision service failed: ${response.statusText}`);
    return await response.json();
  }
}

// services/vision/VisionServiceFactory.ts
export class VisionServiceFactory {
  static create(): IVisionService {
    // Check for shared service URL in env
    const sharedServiceUrl = import.meta.env.VITE_SHARED_VISION_SERVICE_URL;
    const sharedServiceKey = import.meta.env.VITE_SHARED_VISION_SERVICE_KEY;
    
    if (sharedServiceUrl && sharedServiceKey) {
      console.log('[Vision] Using shared vision service');
      return new SharedVisionService(sharedServiceUrl, sharedServiceKey);
    }
    
    // Fallback to Gemini (current)
    console.log('[Vision] Using Gemini vision service');
    return new GeminiVisionService(geminiService);
  }
}

// Update PhotoIdentify.tsx to use factory
import { VisionServiceFactory } from '../services/vision/VisionServiceFactory';

const visionService = VisionServiceFactory.create();

// In capture():
  if (mode === 'single') {
    const result = await visionService.identifySpecies(base64);
    setIdResult(result);
  } else {
    const result = await visionService.analyzeRackScene(base64);
    setRackResult(result.containers);
  }
```

**Migration Path**:
1. ✅ Create `IVisionService` interface (5 min)
2. ✅ Create `GeminiVisionService` wrapper (10 min)
3. ✅ Create factory with env-based selection (10 min)
4. ✅ Update `PhotoIdentify.tsx` to use factory (5 min)
5. ⏸️ When your service is ready: Set env vars, done

**Total Time**: ~30 minutes to make it future-ready

---

### 1.3 Enrichment Pipeline

**Current**: Works, but not optimized

**Issues**:
1. ✅ Enrichment stages run sequentially (good for now)
2. ❌ No species library caching - re-enriches same species
3. ❌ No background queue - blocks UI during enrichment
4. ⚠️ Enrichment happens in store (mixed concerns)

**Fix Priority**: **HIGH** (core workflow, affects UX)

**Quick Win - Species Library Caching**:

```typescript
// services/speciesLibrary.ts (NEW)
interface SpeciesRecord {
  id: string; // composite: scientificName + morphVariant
  commonName: string;
  scientificName?: string;
  morphVariant?: string;
  enrichmentData: any;
  enrichedAt: Date;
}

class SpeciesLibrary {
  private cache = new Map<string, SpeciesRecord>();
  
  async get(speciesName: string, morphVariant?: string): Promise<SpeciesRecord | null> {
    const key = this.getKey(speciesName, morphVariant);
    
    // Check memory cache first
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    
    // Check Firestore
    const doc = await getDoc(doc(db, 'species_library', key));
    if (doc.exists()) {
      const record = doc.data() as SpeciesRecord;
      this.cache.set(key, record);
      return record;
    }
    
    return null;
  }
  
  async save(record: SpeciesRecord): Promise<void> {
    const key = this.getKey(record.commonName, record.morphVariant);
    this.cache.set(key, record);
    
    // Save to Firestore (async, don't block)
    setDoc(doc(db, 'species_library', key), {
      ...record,
      enrichedAt: serverTimestamp()
    }).catch(err => console.error('Failed to save species library', err));
  }
  
  private getKey(name: string, morph?: string): string {
    return `${name.toLowerCase()}:${morph?.toLowerCase() || ''}`;
  }
}

export const speciesLibrary = new SpeciesLibrary();

// Update store.ts enrichEntity()
async enrichEntity(entityId: string, onStage?: (stage: ResearchStage['name']) => void) {
  const entity = this.entities.find(e => e.id === entityId);
  if (!entity) return;
  
  // Check species library first
  const searchQuery = entity.scientificName || entity.name;
  const cached = await speciesLibrary.get(searchQuery, entity.morphVariant);
  
  if (cached) {
    console.log(`[Enrichment] Using cached data for ${searchQuery}`);
    this.updateEntity(entityId, {
      details: cached.enrichmentData.details,
      overflow: cached.enrichmentData.overflow,
      enrichment_status: 'complete'
    });
    return;
  }
  
  // Proceed with enrichment...
  // ... existing enrichment code ...
  
  // Save to library after enrichment
  await speciesLibrary.save({
    id: this.getKey(searchQuery, entity.morphVariant),
    commonName: entity.name,
    scientificName: entity.scientificName,
    morphVariant: entity.morphVariant,
    enrichmentData: { details: mergedDetails, overflow: currentOverflow },
    enrichedAt: new Date()
  });
}
```

**Better Fix** (background enrichment):
- Move enrichment to Web Worker or background task
- Don't block UI
- Show progress indicator

**Priority**: Implement caching first (quick win), background later (nice-to-have)

---

### 1.4 Non-Blocking UX

**Current**: Mostly works, but some edge cases

**Issues**:
1. ✅ Missing data saved as `---` (good)
2. ⚠️ Some validation might block (need to check)
3. ✅ Mad-Libs confirmation cards (good)

**Fix Priority**: **LOW** (mostly works)

**Quick Check**:
- Ensure all entity creation allows `---` for missing fields
- Ensure no `required` validation blocks creation
- Test edge cases: empty habitat name, missing quantity, etc.

---

## 2. Architecture Gaps (Deferred for Now)

### 2.1 Monolithic Store

**Current**: `ConservatoryStore` does everything

**Ideal**: Separate layers (Presentation → Application → Domain → Infrastructure)

**Status**: **DEFER** - Works for single-user, refactor later

**When to Fix**: When adding features becomes painful or when going multi-user

**Migration Path** (for future):
1. Extract use cases (AccessionUseCase, EnrichmentUseCase)
2. Extract repositories (EntityRepository, EventRepository)
3. Move UI state to Zustand
4. Keep store as thin orchestrator

---

### 2.2 Dependency Injection

**Current**: Direct instantiation everywhere

**Ideal**: DI container (TSyringe or manual)

**Status**: **DEFER** - Not needed for single-user

**When to Fix**: When testing becomes important or swapping implementations

**Quick Win**: Use factory pattern for vision service (already planned above)

---

### 2.3 State Management

**Current**: Custom store class

**Ideal**: Zustand or Jotai

**Status**: **DEFER** - Current store works

**When to Fix**: When state management becomes complex or when adding offline sync

---

## 3. Vision Service Integration Plan

### 3.1 Interface Design

Your shared vision service should implement this interface:

```typescript
// services/vision/IVisionService.ts
export interface IVisionService {
  /**
   * Identify a single species from an image
   * @param imageData Base64-encoded image data (without data: prefix)
   * @returns Species identification with confidence
   */
  identifySpecies(imageData: string): Promise<IdentifyResult>;
  
  /**
   * Analyze a rack scene for multiple containers and species
   * @param imageData Base64-encoded image data
   * @returns Array of detected containers with positions and species
   */
  analyzeRackScene(imageData: string): Promise<{ containers: RackContainer[] }>;
}

// Types that your service should return
export interface IdentifyResult {
  species: string;
  common_name: string;
  kingdom: string;
  confidence: number;
  reasoning?: string;
}

export interface RackContainer {
  position: {
    shelf_level: number;
    horizontal_position: number;
  };
  estimated_size?: number;
  estimated_size_unit?: string;
  habitat_type?: string;
  species_detections: Array<{
    species_name: string;
    confidence: number;
  }>;
  confidence: number;
}
```

### 3.2 Your Service Contract

**Expected API**:

```typescript
// POST /vision/identify
{
  "image": "base64_string_without_data_prefix"
}

// Response
{
  "species": "Epipremnum aureum",
  "common_name": "Pothos",
  "kingdom": "Plantae",
  "confidence": 0.95,
  "reasoning": "Heart-shaped leaves, trailing growth pattern..."
}

// POST /vision/rack-analysis
{
  "image": "base64_string_without_data_prefix"
}

// Response
{
  "containers": [
    {
      "position": { "shelf_level": 1, "horizontal_position": 0 },
      "estimated_size": 20,
      "estimated_size_unit": "gallons",
      "habitat_type": "freshwater",
      "species_detections": [
        { "species_name": "Neon Tetra", "confidence": 0.8 }
      ],
      "confidence": 0.75
    }
  ]
}
```

### 3.3 Integration Steps (When Your Service is Ready)

1. **Set Environment Variables**:
   ```bash
   VITE_SHARED_VISION_SERVICE_URL=https://your-service.com
   VITE_SHARED_VISION_SERVICE_KEY=your-api-key
   ```

2. **That's It!** The factory will automatically use your service if env vars are set.

3. **Fallback**: If your service is down, it falls back to Gemini (if you want, or throw error)

### 3.4 Testing Your Service

```typescript
// Test that your service matches the interface
const testService = new SharedVisionService(
  'https://your-service.com',
  'test-key'
);

const result = await testService.identifySpecies(testImageBase64);
console.assert(result.species !== undefined);
console.assert(result.common_name !== undefined);
console.assert(result.confidence >= 0 && result.confidence <= 1);
```

---

## 4. Quick Wins (Do Today)

### 4.1 Species Library Caching ⚡

**Time**: 30 minutes  
**Impact**: HIGH - Prevents re-enriching same species

**Steps**:
1. Create `services/speciesLibrary.ts` (copy code above)
2. Update `store.enrichEntity()` to check cache first
3. Save to cache after enrichment
4. Test: Add same species twice, second should be instant

---

### 4.2 Vision Service Abstraction ⚡

**Time**: 30 minutes  
**Impact**: HIGH - Enables your shared service

**Steps**:
1. Create `services/vision/` directory
2. Create `IVisionService.ts` interface
3. Create `GeminiVisionService.ts` wrapper
4. Create `VisionServiceFactory.ts`
5. Update `PhotoIdentify.tsx` to use factory
6. Test: Should work exactly as before

---

### 4.3 Intent Parsing Cache ⚡

**Time**: 15 minutes  
**Impact**: MEDIUM - Faster repeated commands

**Steps**:
1. Add simple Map cache to `geminiService.parseVoiceCommand()`
2. Cache key: `transcription:entityCount`
3. Test: Say same command twice, second should be instant

---

### 4.4 Background Enrichment (Nice-to-Have)

**Time**: 1-2 hours  
**Impact**: MEDIUM - Better UX during enrichment

**Steps**:
1. Move enrichment to async function
2. Show progress indicator
3. Don't block UI
4. Test: Enrichment should not freeze UI

---

## 5. Deferred Items (Not Today)

### 5.1 Security

**Current**: Firestore rules allow all read/write

**Status**: **OK FOR NOW** - Single-user, local use

**When to Fix**: Before sharing with others or deploying publicly

**Fix**:
```javascript
// firestore.rules (when needed)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

### 5.2 Rate Limiting

**Status**: **DEFER** - Single-user, not needed

**When to Fix**: If you hit API limits or before production

---

### 5.3 Prompt Injection Protection

**Status**: **DEFER** - Single-user, trusted input

**When to Fix**: Before accepting user-generated content or going public

---

### 5.4 Cost Tracking

**Status**: **DEFER** - Single-user, monitor manually

**When to Fix**: If costs become concern or before production

**Quick Monitor**: Check Gemini API dashboard manually

---

### 5.5 Multi-User Support

**Status**: **DEFER** - Single-user app

**When to Fix**: If you want to share with others

**Current**: Auth exists but data not user-scoped (fine for single-user)

---

## 6. Testing Gaps

### 6.1 Current Testing

**Status**: Some E2E tests exist (Playwright)

**Gaps**:
- No unit tests for services
- No integration tests for enrichment
- No tests for species library

**Priority**: **LOW** - Works for now, add tests when refactoring

---

## 7. Performance Gaps

### 7.1 Current Performance

**Good**:
- ✅ Fast model for intent parsing (flash-lite)
- ✅ Optimistic UI updates
- ✅ LocalStorage for offline

**Could Improve**:
- ⚠️ Enrichment blocks UI (fix with background task)
- ⚠️ No caching of species library (fix with quick win above)
- ⚠️ Re-parses same voice commands (fix with cache)

**Priority**: **MEDIUM** - Works, but optimizations improve UX

---

## 8. Migration Priority

### Phase 1: Make It Work Perfectly (Today)

1. ✅ **Species Library Caching** (30 min) - HIGH impact
2. ✅ **Vision Service Abstraction** (30 min) - HIGH impact, enables your service
3. ✅ **Intent Parsing Cache** (15 min) - MEDIUM impact
4. ⏸️ Background Enrichment (1-2 hours) - NICE-TO-HAVE

**Total Time**: ~1.5 hours for core improvements

---

### Phase 2: Refactor Architecture (Later)

1. Extract use cases
2. Extract repositories
3. Add dependency injection
4. Move to Zustand

**When**: When adding features becomes painful or before production

---

### Phase 3: Production Hardening (Before Production)

1. Security rules
2. Rate limiting
3. Cost tracking
4. Error tracking (Sentry)
5. Analytics

**When**: Before deploying publicly or sharing with others

---

## 9. Code Structure Recommendations

### 9.1 Current Structure (Keep for Now)

```
services/
  geminiService.ts      # AI calls
  enrichmentService.ts  # External APIs
  plantService.ts       # Local library
  store.ts              # Everything else
```

### 9.2 Add Vision Abstraction (Today)

```
services/
  vision/
    IVisionService.ts           # Interface
    GeminiVisionService.ts      # Current implementation
    SharedVisionService.ts      # Your future service
    VisionServiceFactory.ts     # Factory
  geminiService.ts
  enrichmentService.ts
  plantService.ts
  speciesLibrary.ts            # NEW - caching
  store.ts
```

### 9.3 Future Structure (When Refactoring)

```
application/
  useCases/
    AccessionUseCase.ts
    EnrichmentUseCase.ts
  queries/
    EntityQuery.ts
domain/
  entities/
    Entity.ts
    Habitat.ts
    Organism.ts
  events/
    DomainEvent.ts
infrastructure/
  ai/
    GeminiProvider.ts
    VisionService.ts
  repositories/
    EntityRepository.ts
  services/
    EnrichmentService.ts
services/
  store.ts  # Thin orchestrator
```

---

## 10. Action Plan

### Today (1-2 hours)

1. **Create vision service abstraction** (30 min)
   - Interface + Gemini wrapper + Factory
   - Update PhotoIdentify.tsx
   - Test: Should work as before

2. **Add species library caching** (30 min)
   - Create speciesLibrary.ts
   - Update store.enrichEntity()
   - Test: Second enrichment should be instant

3. **Add intent parsing cache** (15 min)
   - Simple Map cache in geminiService
   - Test: Repeated commands should be instant

4. **Test everything** (15 min)
   - Voice accession
   - Photo identification
   - Enrichment (first and second time)
   - Rack scan

### This Week (If Time)

1. **Background enrichment** (1-2 hours)
   - Move to async/background
   - Add progress indicator
   - Don't block UI

2. **Error handling improvements** (1 hour)
   - Better error messages
   - Retry logic for transient failures
   - Fallback strategies

### Later (When Needed)

1. Architecture refactoring
2. Security hardening
3. Production features

---

## 11. Success Criteria

### Core Workflows Work Perfectly ✅

- [x] Voice accession works
- [x] Photo identification works
- [x] Enrichment works
- [ ] Species library caching works (add today)
- [ ] Vision service abstraction ready (add today)
- [ ] Non-blocking UX everywhere

### Ready for Your Vision Service ✅

- [ ] Interface defined
- [ ] Factory pattern implemented
- [ ] Environment variable configuration
- [ ] Fallback to Gemini if service unavailable
- [ ] Easy to swap when your service is ready

### Deferred (Not Today) ✅

- [ ] Security rules (OK for single-user)
- [ ] Rate limiting (not needed)
- [ ] Cost tracking (monitor manually)
- [ ] Multi-user support (not needed)

---

## 12. Summary

### What to Do Today

1. **Vision Service Abstraction** (30 min) - Enables your shared service
2. **Species Library Caching** (30 min) - Prevents re-enrichment
3. **Intent Parsing Cache** (15 min) - Faster repeated commands

**Total**: ~1.5 hours to make core workflows perfect and ready for your vision service

### What to Defer

- Architecture refactoring (works for now, but acknowledged as technical debt)
- Security hardening (single-user, OK - but fix before production)
- Rate limiting (not needed for single-user)
- Cost tracking (monitor manually)
- Dual proxy consolidation (pick one when you decide hosting)
- Custom workflow engine → Temporal/Inngest (works for now)
- Observability (console.* OK for single-user)

### Audit Findings Incorporated

The detailed audit identified:
- ✅ Strong product thesis and domain model
- ✅ Good AI schema discipline
- ⚠️ Application-centric architecture (works for prototype, needs segmentation for production)
- ⚠️ Several "reinvented wheels" (acknowledged, deferred)
- ⚠️ Security gaps (OK for single-user, fix before production)

**Pragmatic Approach**: Keep what works, fix what blocks core workflows, acknowledge technical debt, plan refactoring for when needed.

### When Your Vision Service is Ready

1. Set environment variables:
   ```bash
   VITE_SHARED_VISION_SERVICE_URL=https://your-service.com
   VITE_SHARED_VISION_SERVICE_KEY=your-api-key
   ```
2. That's it! Factory automatically uses your service

### Architectural Evolution Path

**Today** (Phase 1): Make core workflows perfect
- Vision abstraction
- Species library caching
- Intent parsing cache

**Later** (Phase 2): Architectural segmentation
- Extract use cases
- Extract repositories
- Add workflow engine (Temporal/Inngest)
- Add provider router
- Security hardening

**Production** (Phase 3): Platform-centric system
- BFF pattern
- Observability
- Rate limiting
- Cost tracking
- Multi-user support

---

**End of PASS 3: Pragmatic Gap Analysis**
