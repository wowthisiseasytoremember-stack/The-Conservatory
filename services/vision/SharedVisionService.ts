import { IVisionService } from './IVisionService';
import { IdentifyResult, RackContainer } from '../../types';

/**
 * Shared Vision Service Implementation
 * 
 * Connects to your shared server-side vision service.
 * This will be used when your vision service is ready.
 */
export class SharedVisionService implements IVisionService {
  constructor(
    private apiUrl: string,
    private apiKey: string
  ) {}
  
  async identifySpecies(imageData: string): Promise<IdentifyResult> {
    const response = await fetch(`${this.apiUrl}/vision/identify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ image: imageData })
    });
    
    if (!response.ok) {
      throw new Error(`Vision service failed: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  async analyzeRackScene(imageData: string): Promise<{ containers: RackContainer[] }> {
    const response = await fetch(`${this.apiUrl}/vision/rack-analysis`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ image: imageData })
    });
    
    if (!response.ok) {
      throw new Error(`Vision service failed: ${response.statusText}`);
    }
    
    return await response.json();
  }
}
