
import { storage, ref, uploadString, getDownloadURL } from './firebase';
import { v4 as uuidv4 } from 'uuid';

/**
 * IMAGE SERVICE
 * 
 * Handles uploading images to Firebase Storage and retrieving public URLs.
 */

export const imageService = {
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
    
    // Strip data prefix if present
    const data = base64.includes('base64,') ? base64.split('base64,')[1] : base64;
    
    try {
      await uploadString(storageRef, data, 'base64', {
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
