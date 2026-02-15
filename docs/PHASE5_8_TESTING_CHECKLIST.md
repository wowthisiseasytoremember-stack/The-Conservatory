# Phase 5.8: Testing & QA Checklist

**Date**: 2026-02-15  
**Status**: In Progress

---

## ✅ Navigation Testing

### Route Loading
- [ ] `/` redirects to `/home`
- [ ] `/home` loads HomeScreen
- [ ] `/habitat/:id` loads HabitatDiorama with correct habitat
- [ ] `/species/:id` loads SpeciesPlacard with correct entity
- [ ] `/parameter/:habitatId/:metric` loads ParameterDetail
- [ ] `/settings` loads SettingsScreen
- [ ] `/feed` loads EventFeed (legacy route)
- [ ] `/entities` loads EntityList (legacy route)

### Deep Linking
- [ ] Click species name → navigates to `/species/:id`
- [ ] Click habitat name → navigates to `/habitat/:id`
- [ ] Click parameter → navigates to `/parameter/:habitatId/:metric`
- [ ] Direct URL paste works (e.g., `/species/abc123`)
- [ ] Browser back button works
- [ ] Browser forward button works

### Navigation Flow
- [ ] Home → Species → Back → Home
- [ ] Home → Habitat → Species → Back → Habitat → Back → Home
- [ ] Species → Related Species → Back → Original Species
- [ ] No console errors during navigation

---

## ✅ Data Flow Testing

### HomeScreen
- [ ] Featured habitat displays correctly
- [ ] Habitat data loads (name, organism count)
- [ ] Click habitat → navigates correctly
- [ ] No data fetch loops

### HabitatDiorama
- [ ] Habitat entity loads from URL param
- [ ] Inhabitants list displays correctly
- [ ] Click inhabitant → navigates to species placard
- [ ] Related entities resolve correctly

### SpeciesPlacard
- [ ] Entity loads from URL param
- [ ] Name, scientific name display
- [ ] Enrichment data displays (images, descriptions)
- [ ] Traits display correctly
- [ ] Observations timeline displays
- [ ] Related entities (habitat, tankmates) resolve
- [ ] Click related entity → navigates correctly

### ParameterDetail
- [ ] Habitat and metric load from URL params
- [ ] Observation history filters by metric
- [ ] Trend calculation works
- [ ] Chart/graph displays (if implemented)

---

## ✅ Modal Stack Testing

### Modal Behavior
- [ ] One modal active at a time
- [ ] Modal dismisses cleanly (ESC key, backdrop click)
- [ ] Modal z-index correct (no overlap issues)
- [ ] Voice works inside modals
- [ ] Toast appears with modal without conflicts

### Modal Types
- [ ] EntityDetailModal works
- [ ] ConfirmationCard works
- [ ] DeepResearchLoader works
- [ ] RackReviewModal works
- [ ] FirebaseConfigModal works
- [ ] Settings modal works

### Z-Index Hierarchy
- [ ] Base content: z-index 0-10
- [ ] Modals: z-index 55-70
- [ ] Voice overlay: z-index 60
- [ ] Research overlay: z-index 80
- [ ] Toast: z-index 100

---

## ✅ Voice Integration Testing

### Voice on All Screens
- [ ] Voice button available on `/home`
- [ ] Voice button available on `/habitat/:id`
- [ ] Voice button available on `/species/:id`
- [ ] Voice button available on `/parameter/:habitatId/:metric`
- [ ] Voice button available on `/settings`
- [ ] Voice works inside modals

### Voice Workflow
- [ ] Voice command creates pending action
- [ ] ConfirmationCard appears
- [ ] Commit action works
- [ ] Navigation after voice action works
- [ ] No blocking during voice processing

---

## ✅ Mobile Testing

### Responsive Design
- [ ] All screens responsive (mobile, tablet, desktop)
- [ ] Touch targets > 44px
- [ ] No horizontal scroll
- [ ] Voice button accessible on small screens
- [ ] Modals fit on mobile screens
- [ ] Navigation works on mobile

### Mobile-Specific
- [ ] Swipe gestures work (if implemented)
- [ ] Pull-to-refresh works (if implemented)
- [ ] Keyboard doesn't cover inputs
- [ ] Safe area respected (notch, home indicator)

---

## ✅ Error Handling

### Error States
- [ ] Invalid route shows 404 or redirects
- [ ] Missing entity shows error message
- [ ] Network errors handled gracefully
- [ ] Toast notifications for errors
- [ ] No crashes on malformed data

### Edge Cases
- [ ] Empty state (no habitats, no entities)
- [ ] Entity with no enrichment data
- [ ] Entity with no observations
- [ ] Habitat with no inhabitants
- [ ] Very long names/descriptions

---

## ✅ Performance

### Loading
- [ ] Routes load quickly (< 100ms)
- [ ] Data fetches don't block UI
- [ ] Images load progressively
- [ ] No unnecessary re-renders

### Memory
- [ ] No memory leaks on navigation
- [ ] Modals clean up on unmount
- [ ] Event listeners removed

---

## 🐛 Known Issues

_Add any issues found during testing here_

---

## ✅ Test Results Summary

**Date Completed**: _TBD_  
**Tester**: _TBD_  
**Overall Status**: _In Progress_

**Pass**: _/_  
**Fail**: _/_  
**Blocked**: _/_

---

## Next Steps After Testing

1. Fix any critical issues found
2. Document any known limitations
3. Sign off on Phase 5 architecture
4. Proceed to design phase (Phase 6)
