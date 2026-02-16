
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
   */
  async compressImage(base64: string, maxWidth: number = 1024): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context failed'));
        
        ctx.drawImage(img, 0, 0, width, height);
        // 0.8 quality = 80% compression
        resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
      };
      img.onerror = reject;
    });
  },

  /**
   * Uploads a base64 encoded image to Firebase Storage.
   * 
   * @param base64 The base64 string (with or without data: prefix)
   * @param folder The folder path (e.g., 'habitats' or 'organisms')
   * @returns The public download URL
   */
  async uploadImage(base64: string, folder: string = 'observations'): Promise<string> {
    const id = uuidv4();
    const storageRef = ref(storage, `${folder}/${id}.jpg`);
    
    try {
      // Win #5: Smart Compression
      const compressedData = await this.compressImage(base64);
      
      await uploadString(storageRef, compressedData, 'base64', {
        contentType: 'image/jpeg'
      });
      
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error('[ImageService] Upload failed:', error);
      throw error;
    }
  }
};
