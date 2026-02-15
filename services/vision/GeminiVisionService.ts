import { IVisionService } from './IVisionService';
import { IdentifyResult, RackContainer } from '../../types';
import { geminiService } from '../geminiService';

/**
 * Gemini Vision Service Implementation
 * 
 * Wraps the current Gemini service for vision operations.
 * This is the current implementation using Gemini directly.
 */
export class GeminiVisionService implements IVisionService {
  async identifySpecies(imageData: string): Promise<IdentifyResult> {
    return await geminiService.identifyPhoto(imageData);
  }
  
  async analyzeRackScene(imageData: string): Promise<{ containers: RackContainer[] }> {
    return await geminiService.analyzeRackScene(imageData);
  }
}
