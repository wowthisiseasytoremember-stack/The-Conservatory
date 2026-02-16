import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, limit } from './firebase';
import { db } from './firebase';
import { logCache, logFirestore } from './logger';

/**
 * Species Record stored in the library
 */
export interface SpeciesRecord {
  id: string; // Composite key: commonName + morphVariant
  commonName: string;
  scientificName?: string;
  morphVariant?: string;
  aliases?: string[];
  enrichmentData: {
    details?: any;
    overflow?: any;
  };
  enrichedAt: Date;
  expiresAt?: Date; // Optional TTL expiration
}

/**
 * Default TTL for species library cache: 90 days
 * After this, data is considered stale and should be re-enriched
 */
const SPECIES_CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

/**
 * Species Library Service
 * 
 * Caches enrichment data to prevent re-enriching the same species.
 * Uses in-memory cache for speed, with Firestore as persistent storage.
 * 
 * When a species is enriched for the first time, it's saved here.
 * Subsequent accessions of the same species use cached data instead of re-calling APIs.
 */
class SpeciesLibrary {
  private cache = new Map<string, SpeciesRecord>();
  
  /**
   * Get species record from cache or Firestore
   * Checks TTL and evicts expired entries
   */
  async get(speciesName: string, morphVariant?: string): Promise<SpeciesRecord | null> {
    const key = this.getKey(speciesName, morphVariant);
    
    // Check memory cache first (fastest)
    if (this.cache.has(key)) {
      const record = this.cache.get(key)!;
      
      // Check TTL
      if (this.isExpired(record)) {
        logCache('debug', `Species library cache entry expired`, { key });
        this.cache.delete(key);
        // Fall through to Firestore check
      } else {
        logCache('debug', `Species library cache hit`, { key, hit: true });
        return record;
      }
    }
    
    // Check Firestore
    try {
      const docRef = doc(db, 'species_library', key);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const record = this.mapDocToRecord(data);
        
        // Check TTL before returning
        if (this.isExpired(record)) {
          logCache('info', `Species library Firestore entry expired`, { key });
          return null; // Treat as cache miss, will trigger re-enrichment
        }
        
        // Cache in memory for next time
        this.cache.set(key, record);
        logCache('info', `Species library Firestore hit`, { key, hit: true });
        return record;
      }
    } catch (error) {
      logFirestore('error', `Species library Firestore load error`, { error, key });
    }
    
    return null;
  }

  /**
   * Find a species by various name fields (case-insensitive where possible)
   */
  async findByName(name: string): Promise<SpeciesRecord | null> {
    const normalized = name.toLowerCase().trim();
    
    // 1. Try exact key match first
    const exact = await this.get(normalized);
    if (exact) return exact;

    try {
      const colRef = collection(db, 'species_library');
      
      // 2. Search by commonName
      const q1 = query(colRef, where('commonName', '==', name), limit(1));
      const s1 = await getDocs(q1);
      if (!s1.empty) return this.mapDocToRecord(s1.docs[0].data());

      // 3. Search by scientificName
      const q2 = query(colRef, where('scientificName', '==', name), limit(1));
      const s2 = await getDocs(q2);
      if (!s2.empty) return this.mapDocToRecord(s2.docs[0].data());

      // 4. Search in aliases array (Note: array-contains is for exact matches)
      const q3 = query(colRef, where('aliases', 'array-contains', name), limit(1));
      const s3 = await getDocs(q3);
      if (!s3.empty) return this.mapDocToRecord(s3.docs[0].data());

    } catch (error) {
      logFirestore('error', `Species library search error`, { error, name });
    }

    return null;
  }

  private mapDocToRecord(data: any): SpeciesRecord {
    const enrichedAt = data.enrichedAt?.toDate() || new Date();
    return {
      id: data.id,
      commonName: data.commonName,
      scientificName: data.scientificName,
      morphVariant: data.morphVariant,
      aliases: data.aliases,
      enrichmentData: data.enrichmentData,
      enrichedAt,
      expiresAt: data.expiresAt?.toDate() || this.calculateExpiration(enrichedAt)
    };
  }
  
  /**
   * Check if a record has expired based on TTL
   */
  private isExpired(record: SpeciesRecord): boolean {
    if (!record.expiresAt) {
      return false; // No TTL set, never expires
    }
    return new Date() > record.expiresAt;
  }
  
  /**
   * Calculate expiration date from enrichedAt timestamp
   */
  private calculateExpiration(enrichedAt: Date): Date {
    return new Date(enrichedAt.getTime() + SPECIES_CACHE_TTL_MS);
  }
  
  /**
   * Save species record to cache and Firestore
   */
  async save(record: SpeciesRecord): Promise<void> {
    const key = this.getKey(record.commonName, record.morphVariant);
    
    // Set expiration if not already set
    const enrichedAt = record.enrichedAt || new Date();
    const recordWithTTL: SpeciesRecord = {
      ...record,
      enrichedAt,
      expiresAt: record.expiresAt || this.calculateExpiration(enrichedAt)
    };
    
    // Update memory cache immediately
    this.cache.set(key, recordWithTTL);
    logCache('info', `Species library cached`, { key, expiresAt: recordWithTTL.expiresAt });
    
    // Save to Firestore (async, don't block)
    // Firestore doesn't allow undefined values, so we need to filter them out
    try {
      const docRef = doc(db, 'species_library', key);
      const firestoreData: any = {
        id: recordWithTTL.id,
        commonName: recordWithTTL.commonName,
        enrichmentData: recordWithTTL.enrichmentData,
        enrichedAt: serverTimestamp(),
        expiresAt: recordWithTTL.expiresAt
      };
      
      // Only include optional fields if they're defined
      if (recordWithTTL.scientificName !== undefined) {
        firestoreData.scientificName = recordWithTTL.scientificName;
      }
      if (recordWithTTL.morphVariant !== undefined && recordWithTTL.morphVariant !== null) {
        firestoreData.morphVariant = recordWithTTL.morphVariant;
      }
      if (recordWithTTL.aliases !== undefined) {
        firestoreData.aliases = recordWithTTL.aliases;
      }
      
      await setDoc(docRef, firestoreData, { merge: true });
      logFirestore('info', `Species library saved to Firestore`, { key });
    } catch (error) {
      logFirestore('error', `Species library Firestore save failed`, { error, key });
      // Non-fatal - cache is still updated
    }
  }
  
  /**
   * Generate cache key from species name and morph variant
   */
  private getKey(name: string, morph?: string): string {
    const normalizedName = name.toLowerCase().trim();
    const normalizedMorph = morph?.toLowerCase().trim() || '';
    return normalizedMorph 
      ? `${normalizedName}:${normalizedMorph}`
      : normalizedName;
  }
  
  /**
   * Clear memory cache (useful for testing or memory management)
   */
  clearCache(): void {
    this.cache.clear();
    logCache('info', 'Species library cache cleared');
  }
}

// Export singleton instance
export const speciesLibrary = new SpeciesLibrary();
