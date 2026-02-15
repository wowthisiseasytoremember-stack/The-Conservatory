import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateCost, trackCost, getCostSummary } from './costTracker';
import { collection, addDoc, getDocs, query, orderBy } from './firebase';

// Mock Firebase
vi.mock('./firebase', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn((q) => q),
  orderBy: vi.fn((field, dir) => ({ field, dir })),
  serverTimestamp: vi.fn(() => new Date()),
  db: {},
}));

// Mock logger
vi.mock('./logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('costTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock environment
    vi.stubEnv('VITE_ENABLE_COST_TRACKING', 'true');
  });

  describe('calculateCost', () => {
    it('should calculate cost for gemini-flash-lite-latest', () => {
      const cost = calculateCost('gemini-flash-lite-latest', 1000, 500);
      // Input: 1000 tokens * $0.075 / 1M = $0.000075
      // Output: 500 tokens * $0.30 / 1M = $0.00015
      // Total: $0.000225
      expect(cost).toBeCloseTo(0.000225, 10);
    });

    it('should calculate cost for gemini-pro-latest', () => {
      const cost = calculateCost('gemini-pro-latest', 1000, 500);
      // Input: 1000 tokens * $0.50 / 1M = $0.0005
      // Output: 500 tokens * $1.50 / 1M = $0.00075
      // Total: $0.00125
      expect(cost).toBeCloseTo(0.00125, 10);
    });

    it('should calculate cost for gemini-1.5-pro-latest', () => {
      const cost = calculateCost('gemini-1.5-pro-latest', 1000, 500);
      // Input: 1000 tokens * $1.25 / 1M = $0.00125
      // Output: 500 tokens * $5.00 / 1M = $0.0025
      // Total: $0.00375
      expect(cost).toBeCloseTo(0.00375, 10);
    });

    it('should handle zero tokens', () => {
      const cost = calculateCost('gemini-pro-latest', 0, 0);
      expect(cost).toBe(0);
    });

    it('should handle missing input tokens', () => {
      const cost = calculateCost('gemini-pro-latest', undefined, 1000);
      // Only output cost
      expect(cost).toBeCloseTo(0.0015, 10);
    });

    it('should handle missing output tokens', () => {
      const cost = calculateCost('gemini-pro-latest', 1000, undefined);
      // Only input cost
      expect(cost).toBeCloseTo(0.0005, 10);
    });

    it('should fallback to gemini-pro-latest for unknown models', () => {
      const cost = calculateCost('unknown-model', 1000, 500);
      expect(cost).toBeCloseTo(0.00125, 10);
    });
  });

  describe('trackCost', () => {
    it('should skip tracking in dev mode by default', async () => {
      vi.stubEnv('VITE_ENABLE_COST_TRACKING', 'false');
      vi.stubEnv('DEV', 'true');
      
      await trackCost({
        model: 'gemini-pro-latest',
        operation: 'test',
        estimatedCost: 0.01,
        success: true,
      });
      
      expect(addDoc).not.toHaveBeenCalled();
    });

    it('should track costs when enabled in dev', async () => {
      const mockAddDoc = vi.mocked(addDoc).mockResolvedValue({ id: 'test-id' } as any);
      vi.mocked(collection).mockReturnValue({} as any);
      vi.stubEnv('DEV', 'true');
      vi.stubEnv('VITE_ENABLE_COST_TRACKING', 'true');
      
      await trackCost({
        model: 'gemini-pro-latest',
        operation: 'test',
        estimatedCost: 0.01,
        success: true,
      });
      
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should track successful calls', async () => {
      const mockAddDoc = vi.mocked(addDoc).mockResolvedValue({ id: 'test-id' } as any);
      vi.mocked(collection).mockReturnValue({} as any);
      
      await trackCost({
        model: 'gemini-pro-latest',
        operation: 'parse_voice_command',
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        estimatedCost: 0.001,
        duration: 500,
        success: true,
      });
      
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          model: 'gemini-pro-latest',
          operation: 'parse_voice_command',
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150,
          estimatedCost: 0.001,
          duration: 500,
          success: true,
        })
      );
    });

    it('should track failed calls', async () => {
      const mockAddDoc = vi.mocked(addDoc).mockResolvedValue({ id: 'test-id' } as any);
      vi.mocked(collection).mockReturnValue({} as any);
      
      await trackCost({
        model: 'gemini-pro-latest',
        operation: 'test',
        estimatedCost: 0,
        duration: 100,
        success: false,
        error: 'Network error',
      });
      
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          success: false,
          error: 'Network error',
        })
      );
    });

    it('should not throw on Firestore errors', async () => {
      vi.mocked(addDoc).mockRejectedValue(new Error('Firestore error'));
      vi.mocked(collection).mockReturnValue({} as any);
      
      // Should not throw
      await expect(trackCost({
        model: 'gemini-pro-latest',
        operation: 'test',
        estimatedCost: 0.01,
        success: true,
      })).resolves.not.toThrow();
    });
  });

  describe('getCostSummary', () => {
    it('should calculate cost summary correctly', async () => {
      const mockDocs = [
        {
          id: '1',
          data: () => ({
            timestamp: { toDate: () => new Date('2025-01-01T12:00:00.000Z') },
            model: 'gemini-pro-latest',
            operation: 'parse_voice_command',
            estimatedCost: 0.001,
            success: true,
          }),
        },
        {
          id: '2',
          data: () => ({
            timestamp: { toDate: () => new Date('2025-01-02T12:00:00.000Z') },
            model: 'gemini-pro-latest',
            operation: 'identify_photo',
            estimatedCost: 0.002,
            success: true,
          }),
        },
        {
          id: '3',
          data: () => ({
            timestamp: { toDate: () => new Date('2025-01-03T12:00:00.000Z') },
            model: 'gemini-flash-lite-latest',
            operation: 'parse_voice_command',
            estimatedCost: 0.0005,
            success: true,
          }),
        },
      ];
      
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        forEach: (callback: any) => mockDocs.forEach(callback),
      } as any);
      
      const summary = await getCostSummary(
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-01-31T23:59:59Z')
      );

      expect(summary.totalCost).toBeCloseTo(0.0035, 10);
      expect(summary.totalCalls).toBe(3);
      expect(summary.byModel['gemini-pro-latest'].cost).toBeCloseTo(0.003, 10);
      expect(summary.byModel['gemini-pro-latest'].calls).toBe(2);
      expect(summary.byModel['gemini-flash-lite-latest'].cost).toBeCloseTo(0.0005, 10);
      expect(summary.byModel['gemini-flash-lite-latest'].calls).toBe(1);
      expect(summary.byOperation['parse_voice_command'].cost).toBeCloseTo(0.0015, 10);
      expect(summary.byOperation['parse_voice_command'].calls).toBe(2);
      expect(summary.byOperation['identify_photo'].cost).toBeCloseTo(0.002, 10);
      expect(summary.byOperation['identify_photo'].calls).toBe(1);
    });
  });
});
