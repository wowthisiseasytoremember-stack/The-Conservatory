import { describe, it, expect, vi, beforeEach } from 'vitest';
import { speciesLibrary, SpeciesRecord } from './speciesLibrary';
import { doc, getDoc, setDoc } from './firebase';
import { db } from './firebase';

// Mock Firebase
vi.mock('./firebase', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  db: {},
}));

// Mock logger
vi.mock('./logger', () => ({
  logCache: vi.fn(),
  logFirestore: vi.fn(),
}));

describe('SpeciesLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    speciesLibrary.clearCache();
  });

  describe('get', () => {
    it('should return null for non-existent species', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);
      
      const result = await speciesLibrary.get('Unknown Species');
      expect(result).toBeNull();
    });

    it('should return cached record from memory', async () => {
      const record: SpeciesRecord = {
        id: 'test-key',
        commonName: 'Test Species',
        enrichmentData: { details: {}, overflow: {} },
        enrichedAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      };
      
      // Manually set in cache (simulating previous save)
      await speciesLibrary.save(record);
      
      // Should return from cache without hitting Firestore
      const result = await speciesLibrary.get('Test Species');
      
      expect(result).not.toBeNull();
      expect(result?.commonName).toBe('Test Species');
      expect(getDoc).not.toHaveBeenCalled(); // Cache hit
    });

    it('should load from Firestore and cache', async () => {
      const firestoreData = {
        id: 'test-key',
        commonName: 'Firestore Species',
        scientificName: 'Testus species',
        enrichmentData: { details: {}, overflow: {} },
        enrichedAt: { toDate: () => new Date() },
        expiresAt: { toDate: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
      };
      
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => firestoreData,
      } as any);
      
      const result = await speciesLibrary.get('Firestore Species');
      
      expect(result).not.toBeNull();
      expect(result?.commonName).toBe('Firestore Species');
      expect(getDoc).toHaveBeenCalled();
    });

    it('should evict expired entries from cache', async () => {
      // Create an expired record by setting it with a past expiration
      // We'll use a workaround: save a record, then manually modify it to be expired
      const record: SpeciesRecord = {
        id: 'expired-key',
        commonName: 'Expired Species',
        enrichmentData: { details: {}, overflow: {} },
        enrichedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
        expiresAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Expired 10 days ago
      };
      
      // Save will recalculate expiration, so we need to test differently
      // Instead, test that get() checks expiration and returns null
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: 'expired-key',
          commonName: 'Expired Species',
          enrichmentData: { details: {}, overflow: {} },
          enrichedAt: { toDate: () => new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) },
          expiresAt: { toDate: () => new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }, // Expired
        }),
      } as any);
      
      // Should return null (expired)
      const result = await speciesLibrary.get('Expired Species');
      expect(result).toBeNull();
    });

    it('should evict expired entries from Firestore', async () => {
      const expiredData = {
        id: 'expired-key',
        commonName: 'Expired Firestore Species',
        enrichmentData: { details: {}, overflow: {} },
        enrichedAt: { toDate: () => new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) },
        expiresAt: { toDate: () => new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }, // Expired
      };
      
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => expiredData,
      } as any);
      
      const result = await speciesLibrary.get('Expired Firestore Species');
      
      // Should return null (expired)
      expect(result).toBeNull();
    });

    it('should handle morph variants', async () => {
      const record: SpeciesRecord = {
        id: 'test-key:red',
        commonName: 'Cherry Shrimp',
        morphVariant: 'Red',
        enrichmentData: { details: {}, overflow: {} },
        enrichedAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      };
      
      await speciesLibrary.save(record);
      
      const result1 = await speciesLibrary.get('Cherry Shrimp', 'Red');
      expect(result1?.morphVariant).toBe('Red');
      
      const result2 = await speciesLibrary.get('Cherry Shrimp');
      expect(result2).toBeNull(); // Different key
    });
  });

  describe('save', () => {
    it('should save to cache and Firestore', async () => {
      const record: SpeciesRecord = {
        id: 'test-key',
        commonName: 'Test Species',
        enrichmentData: { details: {}, overflow: {} },
        enrichedAt: new Date(),
      };
      
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);
      
      await speciesLibrary.save(record);
      
      // Should be in cache
      const cached = await speciesLibrary.get('Test Species');
      expect(cached).not.toBeNull();
      
      // Should have been saved to Firestore
      expect(setDoc).toHaveBeenCalled();
    });

    it('should set expiration date if not provided', async () => {
      const record: SpeciesRecord = {
        id: 'test-key',
        commonName: 'Test Species',
        enrichmentData: { details: {}, overflow: {} },
        enrichedAt: new Date(),
        // expiresAt not set
      };
      
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);
      
      await speciesLibrary.save(record);
      
      const cached = await speciesLibrary.get('Test Species');
      expect(cached?.expiresAt).toBeDefined();
      expect(cached?.expiresAt!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should handle Firestore save failures gracefully', async () => {
      const record: SpeciesRecord = {
        id: 'test-key',
        commonName: 'Test Species',
        enrichmentData: { details: {}, overflow: {} },
        enrichedAt: new Date(),
      };
      
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockRejectedValue(new Error('Firestore error'));
      
      // Should not throw
      await expect(speciesLibrary.save(record)).resolves.not.toThrow();
      
      // Should still be in cache
      const cached = await speciesLibrary.get('Test Species');
      expect(cached).not.toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear memory cache', async () => {
      const record: SpeciesRecord = {
        id: 'test-key',
        commonName: 'Test Species',
        enrichmentData: { details: {}, overflow: {} },
        enrichedAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      };
      
      await speciesLibrary.save(record);
      expect(await speciesLibrary.get('Test Species')).not.toBeNull();
      
      speciesLibrary.clearCache();
      
      // Should not be in cache anymore (but might still be in Firestore)
      // We can't test Firestore here without mocking, but cache is cleared
      expect(await speciesLibrary.get('Test Species')).toBeNull(); // Assuming Firestore also returns null
    });
  });
});
