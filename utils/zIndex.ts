/**
 * Z-Index Hierarchy System
 * 
 * Defines consistent z-index values across the app to prevent stacking conflicts.
 * 
 * Hierarchy:
 * - Base Content: 0-10 (normal page content)
 * - Modals: 50-70 (user-facing modals)
 * - Overlays: 80-90 (progress, loading overlays)
 * - Toast: 100 (notifications)
 * - System: 100+ (critical system modals)
 */

export const Z_INDEX = {
  // Base content layers
  BASE: 0,
  CONTENT: 10,
  
  // Modal layers (user-facing dialogs)
  MODAL_BASE: 50,
  MODAL_CONFIRMATION: 55,  // ConfirmationCard
  MODAL_DETAIL: 70,        // EntityDetailModal
  
  // Overlay layers (progress, loading)
  OVERLAY_BASE: 80,
  OVERLAY_RESEARCH: 80,    // DeepResearchLoader
  OVERLAY_RACK: 80,        // RackReviewModal
  
  // Toast notifications
  TOAST: 100,
  
  // System modals (critical)
  SYSTEM: 100,             // FirebaseConfigModal
} as const;

/**
 * Get z-index value for a specific layer
 */
export function getZIndex(layer: keyof typeof Z_INDEX): number {
  return Z_INDEX[layer];
}

/**
 * Get z-index class name for Tailwind
 */
export function getZIndexClass(layer: keyof typeof Z_INDEX): string {
  return `z-[${Z_INDEX[layer]}]`;
}
