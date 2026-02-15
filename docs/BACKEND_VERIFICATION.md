# Backend Verification Checklist

**Date**: 2026-02-15
**Status**: Ready for Verification

## ✅ Entity Relationships

### Test Steps:
1. Create a habitat via voice: "Create a 20 gallon tank called Test Habitat"
2. Add 3 organisms: "Add Neon Tetra to Test Habitat", "Add Cherry Shrimp to Test Habitat", "Add Java Fern to Test Habitat"
3. In DevTools console, test:
   ```javascript
   const store = window.__store || useConservatory();
   const habitat = entities.find(e => e.name === 'Test Habitat');
   const inhabitants = store.getHabitatInhabitants(habitat.id);
   console.log('Inhabitants:', inhabitants); // Should show 3 entities
   
   const firstEntity = inhabitants[0];
   const related = store.getRelatedEntities(firstEntity.id);
   console.log('Related:', related); // Should show habitat + 2 tankmates
   
   const habitatForEntity = store.getEntityHabitat(firstEntity.id);
   console.log('Habitat:', habitatForEntity); // Should return Test Habitat
   ```

### Expected Results:
- [ ] `getHabitatInhabitants` returns all 3 organisms
- [ ] `getRelatedEntities` shows habitat + 2 tankmates
- [ ] `getEntityHabitat` returns correct habitat

---

## ✅ Growth Tracking

### Test Steps:
1. Select an organism with observations
2. In DevTools console:
   ```javascript
   const entity = entities.find(e => e.type === 'ORGANISM' && e.observations?.length > 0);
   if (entity) {
     const rate = store.calculateGrowthRate(entity.id, 'growth');
     console.log('Growth Rate:', rate); // Should show rate, trend, dataPoints
     
     const timeline = store.getGrowthTimeline(entity.id, 'growth');
     console.log('Timeline:', timeline); // Should be sorted by timestamp
   }
   ```

### Expected Results:
- [ ] `calculateGrowthRate` returns object with `rate`, `trend`, `dataPoints`
- [ ] `getGrowthTimeline` returns sorted array (earliest first)
- [ ] Timeline has correct timestamps and values

---

## ✅ Synergy Computation

### Test Steps:
1. Ensure you have a habitat with 3+ enriched organisms (run Deep Research first)
2. In DevTools console:
   ```javascript
   const habitat = entities.find(e => e.type === 'HABITAT');
   if (habitat) {
     const synergies = store.computeHabitatSynergies(habitat.id);
     console.log('Synergies:', synergies); // Should return array of synergy objects
   }
   ```

### Expected Results:
- [ ] `computeHabitatSynergies` returns array
- [ ] Each synergy has `entityId`, `entityName`, `synergyNote`
- [ ] No errors for habitats with <3 organisms (returns empty array)

---

## ✅ Voice Observation Logging

### Test Steps:
1. Voice command: "Log pH of 6.8 in The Shallows" (or your habitat name)
2. Check ConfirmationCard appears
3. Confirm & Save
4. In DevTools console:
   ```javascript
   const habitat = entities.find(e => e.name === 'The Shallows');
   const inhabitants = store.getHabitatInhabitants(habitat.id);
   inhabitants.forEach(e => {
     console.log(`${e.name} observations:`, e.observations);
   });
   ```

### Expected Results:
- [ ] Pending action created with LOG_OBSERVATION intent
- [ ] After confirm, observations appended to entity.observations[]
- [ ] Observations have `timestamp`, `type: 'parameter'`, `label: 'pH'`, `value: 6.8`

---

## ✅ Feature Manifest Backend

### Test Steps:
1. In DevTools console:
   ```javascript
   const featured = store.getFeaturedSpecimen();
   console.log('Featured Specimen:', featured); // Should rotate daily
   
   const habitat = entities.find(e => e.type === 'HABITAT');
   if (habitat) {
     const health = store.getHabitatHealth(habitat.id);
     console.log('Habitat Health:', health); // Should return { score, factors }
   }
   
   const facts = store.getEcosystemFacts(5);
   console.log('Ecosystem Facts:', facts); // Should return array of 5 facts
   ```

### Expected Results:
- [ ] `getFeaturedSpecimen` returns entity or null
- [ ] `getHabitatHealth` returns `{ score: 0-100, factors: {...} }`
- [ ] `getEcosystemFacts` returns array of fact strings
- [ ] All methods available via `useConservatory()` hook

---

## Quick Test Commands

Copy-paste into browser console:

```javascript
// Get store instance
const { useConservatory } = await import('./services/store');
// Or use window.__store if exposed

// Test relationships
const habitat = entities.find(e => e.type === 'HABITAT');
if (habitat) {
  console.log('Inhabitants:', store.getHabitatInhabitants(habitat.id));
}

// Test growth
const entity = entities.find(e => e.observations?.length > 0);
if (entity) {
  console.log('Growth Rate:', store.calculateGrowthRate(entity.id));
  console.log('Timeline:', store.getGrowthTimeline(entity.id));
}

// Test synergies
if (habitat) {
  console.log('Synergies:', store.computeHabitatSynergies(habitat.id));
}

// Test feature manifest
console.log('Featured:', store.getFeaturedSpecimen());
if (habitat) {
  console.log('Health:', store.getHabitatHealth(habitat.id));
}
console.log('Facts:', store.getEcosystemFacts(5));
```
