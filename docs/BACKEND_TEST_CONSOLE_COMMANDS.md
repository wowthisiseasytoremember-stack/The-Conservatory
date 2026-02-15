# Backend Test Console Commands

**Quick Alternative**: If DevTools Backend tab isn't showing, use these console commands directly.

## Setup (Run Once)

```javascript
// Get the store instance (if exposed)
const store = window.__store || (() => {
  // Import and get store
  const { store } = require('./services/store');
  return store;
})();

// Or use React DevTools to inspect the component
// Or add this to App.tsx temporarily:
// window.__testStore = store;
```

## Test Commands

### 1. Entity Relationships
```javascript
// Get entities from React component or window
const entities = window.__entities || []; // You may need to expose this
const habitats = entities.filter(e => e.type === 'HABITAT');
const organisms = entities.filter(e => e.type !== 'HABITAT');

// Test
const habitat = habitats[0];
if (habitat) {
  const inhabitants = store.getHabitatInhabitants(habitat.id);
  console.log('Inhabitants:', inhabitants);
  
  if (inhabitants.length > 0) {
    const related = store.getRelatedEntities(inhabitants[0].id);
    console.log('Related:', related);
    
    const entityHabitat = store.getEntityHabitat(inhabitants[0].id);
    console.log('Entity Habitat:', entityHabitat);
  }
}
```

### 2. Growth Tracking
```javascript
const entity = organisms.find(e => e.observations?.length > 0);
if (entity) {
  const rate = store.calculateGrowthRate(entity.id, 'growth');
  console.log('Growth Rate:', rate);
  
  const timeline = store.getGrowthTimeline(entity.id, 'growth');
  console.log('Timeline:', timeline);
}
```

### 3. Synergy Computation
```javascript
const habitat = habitats[0];
if (habitat) {
  const synergies = store.computeHabitatSynergies(habitat.id);
  console.log('Synergies:', synergies);
}
```

### 4. Feature Manifest
```javascript
const featured = store.getFeaturedSpecimen();
console.log('Featured:', featured);

const habitat = habitats[0];
if (habitat) {
  const health = store.getHabitatHealth(habitat.id);
  console.log('Health:', health);
}

const facts = store.getEcosystemFacts(5);
console.log('Facts:', facts);
```

## Quick Fix for DevTools Cache

1. **Hard Refresh**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear Cache**: DevTools → Application → Clear Storage → Clear site data
3. **Restart Dev Server**: Stop and restart `npm run dev`
