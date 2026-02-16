
import { db, collection, addDoc, serverTimestamp } from './firebase';

/**
 * ERROR SERVICE
 * 
 * Centralized error handling and telemetry.
 * Logs critical errors to Firestore for remote debugging.
 */

export const errorService = {
  /**
   * Logs an error to the 'system_logs' collection.
   */
  async logError(error: any, context: Record<string, any> = {}) {
    console.error('[ErrorService]', error, context);
    
    try {
      const errorData = {
        message: error.message || String(error),
        stack: error.stack || null,
        timestamp: serverTimestamp(),
        context: {
          ...context,
          url: window.location.href,
          userAgent: navigator.userAgent
        },
        type: 'error'
      };
      
      // Use the (default) database for system logs unless specified otherwise
      // System logs are small, so the default DB is fine.
      await addDoc(collection(db, 'system_logs'), errorData);
    } catch (e) {
      // Fail silently to avoid infinite error loops
      console.warn('[ErrorService] Failed to log error to Firestore:', e);
    }
  },

  /**
   * Initializes global error listeners.
   */
  init() {
    window.addEventListener('error', (event) => {
      this.logError(event.error, { source: 'window_error', message: event.message });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logError(event.reason, { source: 'unhandled_rejection' });
    });
    
    console.log('🛡️ Error Telemetry Initialized');
  }
};
