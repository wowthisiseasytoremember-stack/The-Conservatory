# PASS 7: Evolution Gate (When to Move from Pragmatic to Platform-Centric)

This document defines objective triggers for when to evolve from the current pragmatic, application-centric architecture to a platform-centric, production-ready system.

**Current Phase**: Pragmatic (works today, technical debt acknowledged)
**Target Phase**: Platform-centric (production-ready, scalable, maintainable)

---

## Evolution Gate Concept

**Evolution Gates** are hard, objective triggers that indicate it's time to refactor. They prevent premature optimization while ensuring we evolve when needed.

**Principle**: Don't refactor until a gate triggers. Once triggered, refactoring becomes necessary, not optional.

---

## Trigger A: Team/Usage Growth

**Condition**: 
- >1 active maintainer OR
- >1 regular user profile

**Current Status**: 
- 1 maintainer (you)
- 1 user (you)
- **Status**: Gate NOT triggered

**When Triggered**:
- Start extracting use cases (AccessionUseCase, EnrichmentUseCase)
- Extract repositories (EntityRepository, EventRepository)
- Add user-scoped data isolation
- Implement proper authentication/authorization

**Why This Matters**:
- Monolithic store works for single-user but becomes painful with multiple users
- Need user isolation and proper access control
- Need testability for multiple developers

**Action Plan When Triggered**:
1. Extract use cases from store (Week 1)
2. Extract repositories (Week 1)
3. Add user-scoped queries (Week 2)
4. Update Firestore security rules (Week 2)
5. Add user isolation tests (Week 3)

**Estimated Effort**: 2-3 weeks

---

## Trigger B: AI-Provider Complexity

**Condition**: 
- Need fallback routing OR
- Multiple model vendors OR
- Provider-specific optimizations needed

**Current Status**: 
- Single provider (Gemini)
- Vision abstraction ready (can swap)
- **Status**: Gate NOT triggered (but ready)

**When Triggered**:
- Implement formal provider router
- Add prompt template registry
- Implement fallback chains
- Add provider-specific optimizations

**Why This Matters**:
- Current factory pattern works for simple swaps
- Need routing logic when multiple providers active
- Need prompt management when prompts become complex

**Action Plan When Triggered**:
1. Create provider router with routing logic (Week 1)
2. Extract prompts to template system (Week 1)
3. Implement fallback chains (Week 2)
4. Add provider-specific optimizations (Week 2)

**Estimated Effort**: 2 weeks

---

## Trigger C: Reliability Pain

**Condition**: 
- Recurrent workflow failures OR
- Hard-to-debug incidents OR
- >5% error rate on core workflows

**Current Status**: 
- Works reliably
- Errors are handled gracefully
- **Status**: Gate NOT triggered

**When Triggered**:
- Add structured logging (Winston/Pino)
- Implement retry taxonomy
- Add error tracking (Sentry)
- Add performance monitoring

**Why This Matters**:
- Console.* logging insufficient for production debugging
- Need error tracking to catch issues early
- Need retry policies for transient failures

**Action Plan When Triggered**:
1. Add structured logging (Week 1)
2. Integrate error tracking (Week 1)
3. Add retry policies (Week 2)
4. Add performance monitoring (Week 2)

**Estimated Effort**: 2 weeks

---

## Trigger D: External Exposure

**Condition**: 
- Public deploy OR
- Shared access OR
- Accepting user-generated content

**Current Status**: 
- Single-user, local use
- Not publicly deployed
- **Status**: Gate NOT triggered

**When Triggered**:
- Security hardening becomes BLOCKING
- Fix Firestore security rules
- Fix CORS
- Add rate limiting
- Add input validation
- Add prompt injection protection

**Why This Matters**:
- Current security is acceptable for single-user
- Public exposure requires proper security
- User-generated content needs validation

**Action Plan When Triggered**:
1. Fix Firestore security rules (Day 1)
2. Fix CORS (Day 1)
3. Add rate limiting (Week 1)
4. Add input validation (Week 1)
5. Add prompt injection protection (Week 1)
6. Security audit (Week 2)

**Estimated Effort**: 2 weeks (blocking)

---

## Trigger E: Feature Velocity Drop

**Condition**: 
- Changes in store take >2x longer than before OR
- Changes break unrelated flows OR
- Adding features requires touching >5 files

**Current Status**: 
- Rapid iteration still possible
- Changes are straightforward
- **Status**: Gate NOT triggered

**When Triggered**:
- Split monolith store into app/domain/infra layers
- Extract use cases
- Extract repositories
- Add dependency injection
- Move to Zustand for UI state

**Why This Matters**:
- Monolithic store becomes bottleneck
- High change blast radius slows development
- Need clear boundaries for faster iteration

**Action Plan When Triggered**:
1. Extract use cases (Week 1)
2. Extract repositories (Week 1)
3. Add dependency injection (Week 2)
4. Move UI state to Zustand (Week 2)
5. Refactor store to thin orchestrator (Week 3)

**Estimated Effort**: 3 weeks

---

## Trigger F: Cost Concerns

**Condition**: 
- AI costs exceed budget OR
- Need cost tracking/control OR
- Need usage quotas

**Current Status**: 
- Single-user, manual monitoring
- Costs acceptable
- **Status**: Gate NOT triggered

**When Triggered**:
- Add cost tracking
- Implement usage quotas
- Add cost alerts
- Optimize AI calls (caching, batching)

**Why This Matters**:
- Need visibility into costs
- Need control over spending
- Need optimization when costs grow

**Action Plan When Triggered**:
1. Add cost tracking (Week 1)
2. Implement quotas (Week 1)
3. Add cost alerts (Week 1)
4. Optimize AI calls (Week 2)

**Estimated Effort**: 2 weeks

---

## Trigger G: Scale Requirements

**Condition**: 
- >1000 entities OR
- >100 species in library OR
- Performance degradation

**Current Status**: 
- Small collection size
- Performance is good
- **Status**: Gate NOT triggered

**When Triggered**:
- Optimize queries
- Add pagination
- Add indexing
- Optimize cache strategies

**Why This Matters**:
- Current implementation works for small scale
- Need optimization for larger collections
- Need efficient data access patterns

**Action Plan When Triggered**:
1. Add pagination (Week 1)
2. Optimize Firestore queries (Week 1)
3. Add indexes (Week 1)
4. Optimize cache (Week 2)

**Estimated Effort**: 2 weeks

---

## Evolution Roadmap

### Current State: Pragmatic Phase ✅
- ✅ Core workflows work perfectly
- ✅ Caching improves performance
- ✅ Error handling is good
- ⏸️ Technical debt acknowledged and tracked

### Next Evolution: Platform-Centric Phase
**Triggered by**: Any of Triggers A-G

**Key Changes**:
1. Extract use cases and repositories
2. Add proper security
3. Add observability
4. Add rate limiting
5. Add dependency injection
6. Split monolith store

**Estimated Effort**: 4-6 weeks (depending on triggers)

---

## Decision Framework

**When to Evolve**:
- ✅ Any evolution gate triggers
- ✅ Multiple gates trigger simultaneously
- ✅ User explicitly requests evolution

**When NOT to Evolve**:
- ❌ No gates triggered
- ❌ "Just in case" refactoring
- ❌ Premature optimization

**How to Evolve**:
1. Review triggered gates
2. Prioritize based on severity
3. Create migration plan
4. Execute incrementally
5. Verify no regressions

---

## Gate Status Dashboard

| Gate | Condition | Current Status | Triggered? |
|------|-----------|----------------|------------|
| A: Team/Usage Growth | >1 maintainer OR >1 user | 1 maintainer, 1 user | ❌ No |
| B: AI-Provider Complexity | Multiple providers OR fallback needed | Single provider | ❌ No |
| C: Reliability Pain | Recurrent failures OR >5% error rate | Works reliably | ❌ No |
| D: External Exposure | Public deploy OR shared access | Single-user, local | ❌ No |
| E: Feature Velocity Drop | Changes take >2x longer | Rapid iteration | ❌ No |
| F: Cost Concerns | Costs exceed budget | Acceptable | ❌ No |
| G: Scale Requirements | >1000 entities OR performance issues | Small scale | ❌ No |

**Overall Status**: All gates clear, stay in pragmatic phase

---

## Monitoring Gates

**How to Monitor**:
- Monthly review of gate conditions
- Track metrics (error rate, feature velocity, costs)
- Review when making architectural decisions

**When to Check**:
- Before major feature additions
- When considering refactoring
- Monthly status review
- When user requests evolution

---

## Final Framing

**Current Approach**: 
"Phases 4–7 intentionally optimize for immediate workflow reliability and future swap-ability, while explicitly tracking deferred platform debt with objective triggers for when to execute architectural segmentation."

**Evolution Philosophy**:
- Stay pragmatic until gates trigger
- Don't optimize prematurely
- Make evolution decisions objective, not subjective
- Track technical debt explicitly
- Evolve when needed, not "just in case"

---

**End of PASS 7: Evolution Gate**
