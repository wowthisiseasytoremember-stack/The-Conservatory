# PASS 6: Deferred-Risk Register (Explicitly Accepted Debt)

This document explicitly tracks technical debt and deferred improvements, with clear triggers for when to address them.

**Purpose**: Make deferrals intentional and trackable, not hidden.

**Last Updated**: 2026-02-15
**Status**: All risks documented and tracked
**Recent Updates**:
- ✅ Firebase hosting decision made (delete `api/proxy.ts`, use Firebase Functions only)
- ✅ Feature Manifest items identified (18 items for dashboard redesign in NEXT_STEPS_AND_TODOS.md)
- ✅ Holistic review findings integrated (see HOLISTIC_REVIEW.md)

---

## Risk Register Template

Each risk follows this format:
- **Risk**: Clear description
- **Why accepted now**: Justification for deferral
- **Trigger to fix**: Objective condition that activates fix
- **Owner**: Who is responsible (TBD for now)
- **Latest review date**: When last reviewed
- **Severity**: Low/Medium/High
- **Impact**: What happens if not fixed

---

## Security Risks

### Risk 1: Open Firestore Rules

**Risk**: Firestore security rules allow all read/write (`allow read, write: if true`)

**Why accepted now**: 
- Single-user app, local use
- Not publicly deployed
- No shared access

**Trigger to fix**: 
- Before sharing with others
- Before deploying publicly
- Before accepting user-generated content

**Owner**: TBD

**Latest review date**: [Current date]

**Severity**: High (for production), Low (for single-user)

**Impact if not fixed**: 
- Anyone with Firebase config can access all data
- No user isolation
- Security vulnerability if exposed

**Fix when triggered**:
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
```

---

### Risk 2: Wide-Open CORS

**Risk**: API proxy has `Access-Control-Allow-Origin: '*'` (allows all origins)

**Why accepted now**: 
- Single-user, local development
- Not publicly exposed
- Development convenience

**Trigger to fix**: 
- Before deploying publicly
- Before sharing API endpoints

**Owner**: TBD

**Latest review date**: [Current date]

**Severity**: Medium (for production), Low (for single-user)

**Impact if not fixed**: 
- Any website could call your API
- CSRF vulnerability
- Unauthorized API usage

**Fix when triggered**:
```typescript
// api/proxy.ts or functions/src/index.ts
res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'http://localhost:5173');
```

---

### Risk 3: API Keys in Client Code

**Risk**: Firebase config and API keys visible in client bundle

**Why accepted now**: 
- Single-user app
- Firebase keys are meant to be public (with security rules)
- Development convenience

**Trigger to fix**: 
- Before deploying publicly
- If security rules are not sufficient

**Owner**: TBD

**Latest review date**: [Current date]

**Severity**: Medium (for production), Low (for single-user)

**Impact if not fixed**: 
- API keys exposed in source
- Potential abuse if keys are misused
- Cost risk if keys are stolen

**Fix when triggered**: 
- Move sensitive keys to environment variables
- Use Firebase Functions for all API calls
- Implement proper secret management

---

## Architecture Risks

### Risk 4: Dual Proxy Implementation

**Risk**: Two proxy implementations exist (`api/proxy.ts` for Vercel, `functions/src/index.ts` for Firebase)

**Why accepted now**: 
- Uncertainty about hosting strategy
- Both work for current needs
- No immediate conflict

**Trigger to fix**: 
- When deciding final hosting platform
- When one becomes clearly preferred
- Before production deployment

**Owner**: TBD

**Latest review date**: [Current date]

**Severity**: Low

**Impact if not fixed**: 
- Code duplication
- Maintenance burden
- Confusion about which to use

**Fix when triggered**: 
- Delete unused proxy
- Update `geminiService.ts` to use chosen proxy
- Document hosting decision

---

### Risk 5: Monolithic Store Coupling

**Risk**: `ConservatoryStore` handles everything (state, business logic, persistence, AI orchestration)

**Why accepted now**: 
- Works for single-user
- Rapid iteration possible
- No immediate pain points

**Trigger to fix**: 
- When adding features becomes painful
- When changes break unrelated flows
- Before going multi-user
- When testability becomes important

**Owner**: TBD

**Latest review date**: [Current date]

**Severity**: Medium

**Impact if not fixed**: 
- High change blast radius
- Difficult to test
- Hard to swap implementations
- Technical debt accumulation

**Fix when triggered**: 
- Extract use cases (AccessionUseCase, EnrichmentUseCase)
- Extract repositories (EntityRepository, EventRepository)
- Move UI state to Zustand
- Keep store as thin orchestrator

---

### Risk 6: Custom Workflow Engine

**Risk**: In-app workflow engine for ambiguity/strategy loops instead of standard tooling (Temporal/Inngest/Trigger.dev)

**Why accepted now**: 
- Works for current needs
- Simple and understandable
- No need for complex retry/timeout policies yet

**Trigger to fix**: 
- When workflow complexity grows
- When need retry/timeout policies
- When need workflow observability
- When need background job queues

**Owner**: TBD

**Latest review date**: [Current date]

**Severity**: Low

**Impact if not fixed**: 
- Reinventing the wheel
- Missing features (retries, timeouts, observability)
- Maintenance burden

**Fix when triggered**: 
- Migrate to Temporal or Inngest
- Use standard workflow patterns
- Get retry/timeout/observability for free

---

## Testing Risks

### Risk 7: Window-Based Test Hooks in Prod Store

**Risk**: `window.setTestUser` and `window.processVoiceInput` in production store class

**Why accepted now**: 
- Enables E2E testing
- Works for current testing needs
- No security risk for single-user

**Trigger to fix**: 
- When refactoring store
- When going production
- When test utilities become important

**Owner**: TBD

**Latest review date**: [Current date]

**Severity**: Low

**Impact if not fixed**: 
- Test code in production
- Not ideal separation of concerns
- Could be confusing

**Fix when triggered**: 
- Extract test utilities to separate module
- Use dependency injection for test mode
- Remove window globals

---

## Observability Risks

### Risk 8: No Structured Logging

**Risk**: Only `console.*` logging, no structured telemetry

**Why accepted now**: 
- Single-user, manual debugging sufficient
- No need for production monitoring yet
- Development convenience

**Trigger to fix**: 
- When debugging becomes painful
- When going multi-user
- When need production monitoring
- When need error tracking

**Owner**: TBD

**Latest review date**: [Current date]

**Severity**: Low

**Impact if not fixed**: 
- Hard to debug production issues
- No error tracking
- No performance monitoring
- No audit trail

**Fix when triggered**: 
- Add structured logging (Winston/Pino)
- Integrate error tracking (Sentry)
- Add performance monitoring
- Use OpenTelemetry

---

## Performance Risks

### Risk 9: No Rate Limiting

**Risk**: No explicit rate limiting on AI API calls

**Why accepted now**: 
- Single-user, not needed
- Manual cost monitoring sufficient
- No abuse vectors

**Trigger to fix**: 
- If hit API limits
- Before going multi-user
- Before production deployment
- If costs become concern

**Owner**: TBD

**Latest review date**: [Current date]

**Severity**: Low (for single-user), Medium (for production)

**Impact if not fixed**: 
- Cost overruns possible
- API rate limit errors
- No protection against abuse

**Fix when triggered**: 
- Add rate limiting middleware
- Track usage per user
- Implement quotas
- Add cost alerts

---

### Risk 10: No Cache Eviction Policy

**Risk**: Intent cache and species library cache have no eviction/TTL

**Why accepted now**: 
- Single-user, memory not a concern
- Cache size is small
- Works for current needs

**Trigger to fix**: 
- If memory becomes issue
- If cache size grows too large
- If stale data becomes problem

**Owner**: TBD

**Latest review date**: [Current date]

**Severity**: Low

**Impact if not fixed**: 
- Memory growth over time
- Stale cached data
- No invalidation strategy

**Fix when triggered**: 
- Add LRU eviction to intent cache
- Add TTL to species library
- Add cache versioning
- Implement cache invalidation

---

## Data Risks

### Risk 11: No Conflict Resolution

**Risk**: Last-write-wins for concurrent edits, no merge strategies

**Why accepted now**: 
- Single-user, no concurrent edits
- Works for current needs
- Simple and predictable

**Trigger to fix**: 
- When going multi-user
- When concurrent edits become issue
- When need collaborative features

**Owner**: TBD

**Latest review date**: [Current date]

**Severity**: Low (for single-user), High (for multi-user)

**Impact if not fixed**: 
- Data loss on concurrent edits
- No merge strategies
- User confusion

**Fix when triggered**: 
- Implement operational transforms
- Add conflict resolution UI
- Use CRDTs for collaborative data
- Add merge strategies

---

### Risk 12: No Data Retention Policy

**Risk**: No automatic cleanup of old events or unused data

**Why accepted now**: 
- Single-user, data volume small
- Want to keep all history
- Storage is cheap

**Trigger to fix**: 
- If storage becomes issue
- If performance degrades
- If need compliance (GDPR)

**Owner**: TBD

**Latest review date**: [Current date]

**Severity**: Low

**Impact if not fixed**: 
- Storage growth over time
- Potential performance issues
- No data lifecycle management

**Fix when triggered**: 
- Add retention policies
- Archive old events
- Clean up unused data
- Implement data lifecycle

---

## Summary Table

| Risk | Severity | Impact | Trigger | Status |
|------|----------|--------|--------|--------|
| Open Firestore Rules | High (prod) | Security vulnerability | Before sharing/public | Deferred |
| Wide-Open CORS | Medium (prod) | CSRF vulnerability | Before public deploy | Deferred |
| API Keys in Client | Medium (prod) | Key exposure | Before public deploy | Deferred |
| Dual Proxy | Low | Code duplication | When deciding hosting | Deferred |
| Monolithic Store | Medium | High change blast radius | When adding features becomes painful | Deferred |
| Custom Workflow Engine | Low | Reinventing wheel | When complexity grows | Deferred |
| Window Test Hooks | Low | Test code in prod | When refactoring store | Deferred |
| No Structured Logging | Low | Hard to debug | When debugging painful | Deferred |
| No Rate Limiting | Low (single-user) | Cost/abuse risk | If hit limits | Deferred |
| No Cache Eviction | Low | Memory growth | If memory issue | Deferred |
| No Conflict Resolution | Low (single-user) | Data loss | When multi-user | Deferred |
| No Data Retention | Low | Storage growth | If storage issue | Deferred |

---

## Review Schedule

**Monthly Review**: Review all risks, update status, check triggers

**Before Production**: Review all High/Medium severity risks

**When Triggered**: Immediately address triggered risks

---

**End of PASS 6: Deferred-Risk Register**
