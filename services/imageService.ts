
import { storage, ref, uploadString, getDownloadURL } from './firebase';
import { v4 as uuidv4 } from 'uuid';

/**
 * IMAGE SERVICE
 * 
 * Handles uploading images to Firebase Storage and retrieving public URLs.
 */

export const imageService = {
  /**
   * Resizes and compresses an image before upload.
   * Hardened for Capacitor/Native: Uses canvas only if in browser,
   * otherwise returns original base64 (Capacitor Camera plugin usually handles compression).
   */
  async compressImage(base64: string, maxWidth: number = 1024): Promise<string> {
    // If not in a browser environment with a DOM, skip compression
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return base64.includes(',') ? base64.split(',')[1] : base64;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          const ratio = maxWidth / width;
          height = ratio * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context failed'));
        
        ctx.drawImage(img, 0, 0, width, height);
        // 0.7 quality for better mobile performance
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl.split(',')[1]);
      };

      img.onerror = () => {
        // Fallback: if compression fails, just return the original base64
        resolve(base64.includes(',') ? base64.split(',')[1] : base64);
      };
    });
  },

  /**
   * Uploads a base64 encoded image to Firebase Storage.
   */
  async uploadImage(base64: string, folder: string = 'observations'): Promise<string> {
    // Basic sanitization
    if (!base64 || base64.length < 10) throw new Error('Invalid image data');

    const id = uuidv4();
    const storageRef = ref(storage, `${folder}/${id}.jpg`);
    
    try {
      // Logic: If the device is offline, Firebase uploadString will eventually timeout.
      // We wrap it to provide a better error for the UI.
      const compressedData = await this.compressImage(base64);
      
      const uploadPromise = uploadString(storageRef, compressedData, 'base64', {
        contentType: 'image/jpeg',
        customMetadata: {
          uploadedVia: (window as any).Capacitor?.isNativePlatform() ? 'mobile' : 'web',
          originalTimestamp: new Date().toISOString()
        }
      });

      // 30 second timeout for uploads
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Upload timed out. Check your internet connection.')), 30000)
      );

      await Promise.race([uploadPromise, timeoutPromise]);

      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error: any) {
      console.error('[ImageService] Upload failed:', error);
      // Friendly error for the UI
      if (error.message?.includes('network')) {
        throw new Error('Network error: Could not reach Firebase. Are you offline?');
      }
      throw error;
    }
  }
};
