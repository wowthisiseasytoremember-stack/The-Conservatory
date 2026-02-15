import { IVisionService } from './IVisionService';
import { GeminiVisionService } from './GeminiVisionService';
import { SharedVisionService } from './SharedVisionService';

/**
 * Vision Service Factory
 * 
 * Creates the appropriate vision service implementation based on environment variables.
 * 
 * To use your shared vision service:
 * 1. Set VITE_SHARED_VISION_SERVICE_URL in your .env file
 * 2. Set VITE_SHARED_VISION_SERVICE_KEY in your .env file
 * 3. The factory will automatically use your service if both are set
 * 
 * Otherwise, falls back to Gemini (current implementation).
 */
export class VisionServiceFactory {
  private static instance: IVisionService | null = null;
  
  static create(): IVisionService {
    // Return cached instance if already created
    if (this.instance) {
      return this.instance;
    }
    
    // Check for shared service URL in env
    const sharedServiceUrl = import.meta.env.VITE_SHARED_VISION_SERVICE_URL;
    const sharedServiceKey = import.meta.env.VITE_SHARED_VISION_SERVICE_KEY;
    
    if (sharedServiceUrl && sharedServiceKey) {
      console.log('[Vision] Using shared vision service:', sharedServiceUrl);
      this.instance = new SharedVisionService(sharedServiceUrl, sharedServiceKey);
      return this.instance;
    }
    
    // Fallback to Gemini (current)
    console.log('[Vision] Using Gemini vision service');
    this.instance = new GeminiVisionService();
    return this.instance;
  }
  
  /**
   * Reset the cached instance (useful for testing or switching services)
   */
  static reset(): void {
    this.instance = null;
  }
}
