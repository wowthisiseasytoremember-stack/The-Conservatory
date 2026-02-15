# PASS 5: Verification Matrix (How to Prove Each Phase Works)

This document provides a comprehensive verification matrix to ensure all workflows function correctly after the Phase 4 improvements.

**Status**: Ready for verification testing

---

## 5.1 Must-Pass Workflow Checks

### Voice Habitat Create → Confirm → Entity List Reflects Change

**Test Steps**:
1. Open app, ensure logged in
2. Use voice button: "Create a 20 gallon freshwater tank called The Shallows"
3. Verify confirmation card appears with editable fields
4. Confirm the action
5. Check entity list - should show new habitat "The Shallows"

**Expected Results**:
- ✅ Confirmation card shows correct habitat name, size, type
- ✅ Entity list updates immediately (optimistic update)
- ✅ Habitat appears in list with correct details
- ✅ No errors in console

**Status**: ✅ Should work (no changes to this flow)

---

### Voice Accession → Queued Enrichment Status Set

**Test Steps**:
1. Ensure a habitat exists (e.g., "The Shallows")
2. Use voice button: "I just added 12 Neon Tetras to The Shallows"
3. Verify confirmation card appears
4. Confirm the action
5. Check entity detail for the new organism

**Expected Results**:
- ✅ Confirmation card shows species, quantity, habitat
- ✅ Entity created with `enrichment_status: 'queued'` (not 'none' or 'pending')
- ✅ Organism appears in entity list
- ✅ Intent parsing cache works (say same command twice, second should be instant)

**Status**: ✅ Should work (intent cache added)

**Verification Points**:
- Intent parsing cache: Say same command twice, check console for "[IntentCache] Cache hit"
- Species library: Add same species again, second enrichment should be instant

---

### Photo Identify → Pending Action Created (No Voice Detour)

**Test Steps**:
1. Open camera (single species mode)
2. Take photo of a plant or fish
3. Wait for identification
4. Tap "Accession" button
5. Verify confirmation card appears

**Expected Results**:
- ✅ Photo identification works (using vision service factory)
- ✅ Confirmation card appears directly (bypasses voice parsing)
- ✅ Entity created with correct species information
- ✅ Toast notification on success (if implemented)
- ✅ Error toast on failure (if photo fails)

**Status**: ✅ Should work (vision abstraction added)

**Verification Points**:
- Vision service: Check console for "[Vision] Using Gemini vision service" or shared service
- Error handling: If photo fails, should see error toast

---

### Rack Scan → Multi-Habitat Action Path Still Functions

**Test Steps**:
1. Open camera (rack scan mode)
2. Take photo of multiple tanks/containers
3. Review detected containers in modal
4. Select containers to create
5. Confirm

**Expected Results**:
- ✅ Rack analysis detects multiple containers
- ✅ Review modal shows all detected containers
- ✅ Can toggle selection per container
- ✅ Multiple habitats created on confirm
- ✅ Each habitat has correct position, size estimates, species

**Status**: ✅ Should work (vision abstraction added)

**Verification Points**:
- Vision service abstraction: Should use same factory as single photo
- Error handling: If rack scan fails, should see error toast

---

### Deep Research Completes and Discovery Surface Still Renders

**Test Steps**:
1. Create/select a habitat with multiple organisms
2. Trigger "Deep Research" for the habitat
3. Watch progress loader
4. Wait for completion
5. Check discovery feed/wonder feed

**Expected Results**:
- ✅ Deep research progress loader shows stages
- ✅ Progress updates per entity and per stage
- ✅ Completion modal shows discoveries
- ✅ Discoveries appear in wonder feed
- ✅ Species library cache used (if species already enriched)

**Status**: ✅ Should work (species library caching added)

**Verification Points**:
- Species library: If species already enriched, should see "[SpeciesLibrary] Cache hit" in console
- Progress tracking: Should see stage-by-stage progress in DeepResearchLoader

---

## 5.2 Regression Focus

### Strategy Fallback Still Triggers on Ambiguous Intents

**Test Steps**:
1. Use voice button with ambiguous command: "Add something to somewhere"
2. Verify strategy fallback triggers
3. Check confirmation card shows strategy advice

**Expected Results**:
- ✅ Ambiguous intents trigger `STRATEGY_REQUIRED` status
- ✅ Confirmation card shows friendly advice
- ✅ Suggested command is provided
- ✅ User can accept suggestion or provide more details

**Status**: ✅ Should work (no changes to this flow)

---

### Zod Validation Remains Hard Gate for Malformed AI Payloads

**Test Steps**:
1. Mock a malformed AI response (in test mode)
2. Attempt to parse with Zod schema
3. Verify validation rejects invalid data

**Expected Results**:
- ✅ Zod schemas reject malformed data
- ✅ Errors are caught and handled gracefully
- ✅ User sees error message (not crash)
- ✅ System recovers from validation errors

**Status**: ✅ Should work (Zod validation unchanged)

**Verification Points**:
- Check that `PendingActionSchema.parse()` throws on invalid data
- Check that `IdentifyResultSchema.parse()` throws on invalid data

---

### Firestore Sync Still Merges Local Pending + Cloud Events Correctly

**Test Steps**:
1. Create action while offline (or with slow connection)
2. Verify local state shows pending action
3. Wait for sync
4. Check that cloud events merge correctly

**Expected Results**:
- ✅ Local pending events preserved
- ✅ Cloud events merge without duplicates
- ✅ Event feed shows correct order
- ✅ No data loss on sync

**Status**: ✅ Should work (no changes to sync logic)

---

## 5.3 Practical Acceptance Threshold

### No Workflow Takes More Clicks Than Current

**Measurement**:
- Voice accession: 1 click (hold button) → confirm → 1 click
- Photo identification: 1 click (camera) → 1 click (capture) → 1 click (accession) → confirm
- Deep research: 1 click (trigger) → wait → dismiss

**Expected Results**:
- ✅ All workflows maintain same click count
- ✅ No additional confirmation steps added
- ✅ Toast notifications don't require clicks (auto-dismiss)

**Status**: ✅ Maintained (toasts auto-dismiss)

---

### No New Blocking UI States

**Test Steps**:
1. Trigger enrichment while using app
2. Trigger photo identification
3. Trigger voice command
4. Verify UI remains responsive

**Expected Results**:
- ✅ Enrichment doesn't block UI (runs async)
- ✅ Photo identification shows loading but doesn't block
- ✅ Voice commands don't block UI
- ✅ Toast notifications appear but don't block
- ✅ Can still navigate while operations run

**Status**: ✅ Maintained (all operations async)

**Verification Points**:
- Try navigating while enrichment runs
- Try taking multiple photos quickly
- Verify UI remains responsive

---

### No Increase in Manual Retries for Core Flows

**Test Steps**:
1. Run through all core workflows
2. Count any manual retries needed
3. Compare to baseline (before Phase 4)

**Expected Results**:
- ✅ Same or fewer retries needed
- ✅ Error messages are clearer (should reduce retries)
- ✅ Caching reduces need for retries (instant results)

**Status**: ✅ Should improve (caching + better errors)

**Verification Points**:
- Intent cache: Repeated commands should work instantly
- Species library: Second enrichment should be instant
- Error toasts: Clear messages should reduce confusion

---

## 5.4 Phase 4 Specific Verifications

### Vision Service Abstraction (Phase 4.1)

**Verification**:
- [ ] Console shows "[Vision] Using Gemini vision service" (or shared service if env vars set)
- [ ] Photo identification works exactly as before
- [ ] Rack scan works exactly as before
- [ ] Can swap to shared service by setting env vars (when ready)

**Test**: Set `VITE_SHARED_VISION_SERVICE_URL` and verify factory switches

---

### Species Library Caching (Phase 4.2)

**Verification**:
- [ ] First enrichment of species hits network (check console)
- [ ] Second enrichment of same species is instant (check console for "[SpeciesLibrary] Cache hit")
- [ ] Species data persists in Firestore `species_library` collection
- [ ] Cache works across page refreshes

**Test**: 
1. Add "Cherry Shrimp" - should see enrichment stages
2. Add "Cherry Shrimp" again - should see "[SpeciesLibrary] Cache hit" and instant enrichment

---

### Intent Parsing Cache (Phase 4.3)

**Verification**:
- [ ] First voice command parses normally
- [ ] Second identical command shows "[IntentCache] Cache hit" in console
- [ ] Cache works for same transcription + entity count
- [ ] No functional regression (parsing still accurate)

**Test**:
1. Say "I added 12 Neon Tetras to The Shallows"
2. Say exact same command again
3. Check console for cache hit message

---

### UX Non-Blocking Guarantees (Phase 4.4)

**Verification**:
- [ ] Toast notifications appear for errors
- [ ] Toast notifications appear for enrichment success
- [ ] Toast notifications auto-dismiss (except loading)
- [ ] Error messages are clear and actionable
- [ ] UI remains responsive during all operations

**Test**:
1. Trigger enrichment - should see success toast
2. Take invalid photo - should see error toast
3. Voice recognition error - should see specific error toast
4. Verify toasts don't block UI

---

## 5.5 Performance Benchmarks

### Before Phase 4 (Baseline)
- Intent parsing: ~2-3 seconds per command
- Enrichment: ~10-15 seconds per species (first time)
- Photo identification: ~3-5 seconds

### After Phase 4 (Expected)
- Intent parsing: ~2-3 seconds (first), <100ms (cached)
- Enrichment: ~10-15 seconds (first), <100ms (cached)
- Photo identification: ~3-5 seconds (unchanged)

**Verification**: Measure actual times and compare

---

## 5.6 Error Scenarios

### Network Failures

**Test**: Disconnect network, attempt operations

**Expected**:
- ✅ Photo identification shows error toast
- ✅ Voice commands show error toast
- ✅ Enrichment shows error toast
- ✅ Local operations still work
- ✅ Clear error messages guide user

---

### API Failures

**Test**: Mock API failures, attempt operations

**Expected**:
- ✅ Gemini API failures show error toast
- ✅ Vision service failures show error toast
- ✅ Enrichment API failures show error toast
- ✅ System recovers gracefully
- ✅ User can retry operations

---

### Invalid Input

**Test**: Provide invalid inputs (malformed photos, garbled voice)

**Expected**:
- ✅ Zod validation catches malformed data
- ✅ Error toasts show clear messages
- ✅ System doesn't crash
- ✅ User can correct and retry

---

## 5.7 Verification Checklist

### Core Workflows
- [ ] Voice habitat create works
- [ ] Voice accession works
- [ ] Photo identification works
- [ ] Rack scan works
- [ ] Deep research works

### Caching
- [ ] Intent parsing cache works
- [ ] Species library cache works
- [ ] Cache persists across refreshes

### Error Handling
- [ ] Photo errors show toast
- [ ] Voice errors show toast
- [ ] Enrichment errors show toast
- [ ] Network errors handled gracefully

### Non-Blocking UX
- [ ] UI remains responsive during operations
- [ ] Progress indicators show for long operations
- [ ] Toast notifications don't block
- [ ] No new blocking states

### Regression
- [ ] Strategy fallback still works
- [ ] Zod validation still works
- [ ] Firestore sync still works
- [ ] No increase in click count
- [ ] No increase in retries

---

## 5.8 Automated Test Suggestions

### Unit Tests
```typescript
// Test intent cache
test('intent parsing cache works', async () => {
  const result1 = await geminiService.parseVoiceCommand('test', []);
  const result2 = await geminiService.parseVoiceCommand('test', []);
  // Second call should be from cache
});

// Test species library cache
test('species library cache works', async () => {
  await speciesLibrary.save(mockRecord);
  const cached = await speciesLibrary.get('test', 'variant');
  expect(cached).toBeDefined();
});
```

### Integration Tests
```typescript
// Test vision service factory
test('vision service factory switches based on env', () => {
  process.env.VITE_SHARED_VISION_SERVICE_URL = 'test';
  const service = VisionServiceFactory.create();
  expect(service).toBeInstanceOf(SharedVisionService);
});
```

### E2E Tests
```typescript
// Test full workflow with caching
test('voice accession with species cache', async ({ page }) => {
  // Add species first time
  await addSpeciesViaVoice(page, 'Cherry Shrimp');
  // Add same species second time - should be instant
  await addSpeciesViaVoice(page, 'Cherry Shrimp');
  // Verify cache was used
});
```

---

## 5.9 Known Issues / Edge Cases

### Intent Cache
- **Issue**: Cache key based on transcription + entity count
- **Edge Case**: If entities change between identical commands, cache might be stale
- **Mitigation**: Entity count in cache key prevents this
- **Status**: Acceptable for single-user

### Species Library
- **Issue**: No TTL/version invalidation
- **Edge Case**: If species data changes externally, cache might be stale
- **Mitigation**: Manual refresh available, acceptable for single-user
- **Status**: Deferred (nice-to-have)

### Toast System
- **Issue**: No queue limit
- **Edge Case**: Many rapid errors could flood screen
- **Mitigation**: Auto-dismiss prevents buildup
- **Status**: Acceptable for single-user

---

## 5.10 Verification Summary

**All Core Workflows**: ✅ Should work (no breaking changes)
**Caching Improvements**: ✅ Should improve performance
**Error Handling**: ✅ Should improve UX
**Non-Blocking UX**: ✅ Maintained/improved

**Next Steps**:
1. Run through verification checklist
2. Document any issues found
3. Fix any regressions
4. Proceed to PASS 6 (Deferred-Risk Register)

---

**End of PASS 5: Verification Matrix**
