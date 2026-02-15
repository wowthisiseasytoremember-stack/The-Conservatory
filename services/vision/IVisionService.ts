import { IdentifyResult, RackContainer } from '../../types';

/**
 * Vision Service Interface
 * 
 * Abstraction for vision/photo identification services.
 * Allows swapping between Gemini (current) and shared vision service (future).
 */
export interface IVisionService {
  /**
   * Identify a single species from an image
   * @param imageData Base64-encoded image data (without data: prefix)
   * @returns Species identification with confidence
   */
  identifySpecies(imageData: string): Promise<IdentifyResult>;
  
  /**
   * Analyze a rack scene for multiple containers and species
   * @param imageData Base64-encoded image data
   * @returns Array of detected containers with positions and species
   */
  analyzeRackScene(imageData: string): Promise<{ containers: RackContainer[] }>;
}
