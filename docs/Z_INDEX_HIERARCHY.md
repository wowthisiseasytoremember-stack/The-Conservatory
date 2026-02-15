# Z-Index Hierarchy

This document defines the z-index hierarchy used throughout The Conservatory app to prevent stacking conflicts.

## Hierarchy Levels

| Layer | Z-Index | Usage | Components |
|-------|---------|-------|------------|
| **Base Content** | 0-10 | Normal page content | Main content, headers, navigation |
| **Modals** | 50-70 | User-facing dialogs | ConfirmationCard (55), EntityDetailModal (70) |
| **Overlays** | 80-90 | Progress/loading overlays | DeepResearchLoader (80), RackReviewModal (80) |
| **Toast** | 100 | Notifications | ToastContainer (100) |
| **System** | 100+ | Critical system modals | FirebaseConfigModal (100) |

## Usage

Import the z-index utility:

```typescript
import { Z_INDEX, getZIndexClass } from '../utils/zIndex';

// Use in className
<div className={`fixed inset-0 ${getZIndexClass('MODAL_DETAIL')} ...`}>

// Or use inline style
<div style={{ zIndex: Z_INDEX.MODAL_DETAIL }}>
```

## Rules

1. **One modal per layer**: Only one modal should be active at a time per layer
2. **Toast always on top**: Toast notifications (100) should always be above modals
3. **System modals highest**: Critical system modals (FirebaseConfig) use 100+
4. **No conflicts**: Each component should use a defined z-index value, not arbitrary numbers

## Current Assignments

- `ConfirmationCard`: 55 (MODAL_CONFIRMATION)
- `EntityDetailModal`: 70 (MODAL_DETAIL)
- `DeepResearchLoader`: 80 (OVERLAY_RESEARCH)
- `RackReviewModal`: 80 (OVERLAY_RACK)
- `ToastContainer`: 100 (TOAST)
- `FirebaseConfigModal`: 100 (SYSTEM)
- `MainLayout liveTranscript`: 60 (between modals and overlays)

## Future Enhancements

If we need a modal stack system (multiple modals), we can:
1. Create a `ModalProvider` context
2. Track modal stack in state
3. Dynamically assign z-index based on stack position

For now, the simple hierarchy works since modals are mutually exclusive.
