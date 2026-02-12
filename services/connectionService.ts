
import { db, getDoc, doc } from './firebase';
import { User } from 'firebase/auth';

export type ConnectionStatus = 'unknown' | 'connected' | 'error' | 'api_disabled' | 'offline' | 'permission_denied' | 'auth_required';

export const connectionService = {
  async testConnection(user: User | null): Promise<{ success: boolean; error?: string; code?: ConnectionStatus }> {
    if (!user) {
      return { success: false, error: "Authentication required", code: 'auth_required' };
    }

    try {
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error("Connection Timed Out")), 5000));
      await Promise.race([
          getDoc(doc(db, 'events', 'init')),
          timeout
      ]);
      return { success: true, code: 'connected' };
    } catch (e: any) {
      const errorMsg = e.message || "Unknown Connection Error";
      const code = e.code;
      
      if (code === 'permission-denied' || errorMsg.includes("permission-denied")) {
        return { success: false, error: "Permission Denied", code: 'permission_denied' };
      }
      if (errorMsg.includes("Connection Timed Out") || code === 'unavailable') {
        return { success: false, error: "Offline", code: 'offline' };
      }
      if (code === 'failed-precondition') {
        return { success: false, error: "API Disabled", code: 'api_disabled' };
      }
      
      return { success: false, error: errorMsg, code: 'error' };
    }
  }
};
