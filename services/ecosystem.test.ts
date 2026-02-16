
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateHabitatHealth } from './ecosystem';
import { Entity, EntityType } from '../types';

describe('Ecosystem Engine Simulation', () => {
  const mockHabitat: Entity = {
    id: 'hab-1',
    name: 'Test Tank',
    type: EntityType.HABITAT,
    confidence: 1,
    traits: [
      { type: 'AQUATIC', parameters: { pH: 7.0, temp: 78 } }
    ],
    created_at: Date.now(),
    updated_at: Date.now(),
    aliases: [],
    enrichment_status: 'complete'
  };

  const mockInhabitants: Entity[] = [
    { id: 'fish-1', name: 'Neon Tetra', type: EntityType.ORGANISM, traits: [], confidence: 1, created_at: 0, updated_at: 0, aliases: [], enrichment_status: 'complete' },
    { id: 'fish-2', name: 'Cherry Shrimp', type: EntityType.ORGANISM, traits: [], confidence: 1, created_at: 0, updated_at: 0, aliases: [], enrichment_status: 'complete' }
  ];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should start with high health if recently updated', () => {
    const now = Date.now();
    const habitat = { ...mockHabitat, updated_at: now };
    const report = calculateHabitatHealth(habitat, mockInhabitants);
    
    // 10 biodiversity (2 species * 5)
    // 30 base stability (no pH data)
    // 20 recency (updated < 1 day ago)
    // Total: 60
    expect(report.score).toBe(60);
  });

  it('should drop health over time if no observations are logged (recency decay)', () => {
    const start = Date.now();
    let habitat = { ...mockHabitat, updated_at: start };
    
    // Day 0
    let report = calculateHabitatHealth(habitat, mockInhabitants);
    const initialScore = report.score;

    // Fast forward 31 days
    const thirtyOneDays = 31 * 24 * 60 * 60 * 1000;
    vi.setSystemTime(start + thirtyOneDays);
    
    // We don't update habitat.updated_at, simulating neglect
    report = calculateHabitatHealth(habitat, mockInhabitants);
    
    expect(report.score).toBeLessThan(initialScore);
    expect(report.factors.recency).toBe(5); // Minimum recency score
    
    vi.useRealTimers();
  });

  it('should calculate health correctly with pH stability penalty', () => {
    const now = Date.now();
    const habitatWithObs: Entity = {
      ...mockHabitat,
      updated_at: now,
      observations: [
        { timestamp: now, type: 'parameter', label: 'pH', value: 8.0 } // 1.0 diff from target 7.0
      ]
    };

    const report = calculateHabitatHealth(habitatWithObs, mockInhabitants);
    
    // 10 biodiversity
    // 30 stability (40 - (1.0 * 10))
    // 20 recency
    // Total: 60
    expect(report.factors.stability).toBe(30);
    expect(report.score).toBe(60);
  });

  it('should increase health with more biodiversity', () => {
    const now = Date.now();
    const manyInhabitants = [
      ...mockInhabitants,
      { id: 'plant-1', name: 'Java Fern', type: EntityType.PLANT, traits: [], confidence: 1, created_at: 0, updated_at: 0, aliases: [], enrichment_status: 'complete' },
      { id: 'plant-2', name: 'Anubias', type: EntityType.PLANT, traits: [], confidence: 1, created_at: 0, updated_at: 0, aliases: [], enrichment_status: 'complete' }
    ];

    const report = calculateHabitatHealth(mockHabitat, manyInhabitants);
    expect(report.factors.biodiversity).toBe(20); // 4 species * 5
  });

  describe('Compatibility Checks', () => {
    it('should mark species with similar pH as compatible', () => {
      const fishA: any = { traits: [{ type: 'AQUATIC', parameters: { pH: 7.0 } }] };
      const fishB: any = { traits: [{ type: 'AQUATIC', parameters: { pH: 7.5 } }] };
      const result = checkCompatibility(fishA, fishB);
      expect(result.compatible).toBe(true);
    });

    it('should mark species with wildly different pH as incompatible', () => {
      const fishA: any = { traits: [{ type: 'AQUATIC', parameters: { pH: 6.0 } }] };
      const fishB: any = { traits: [{ type: 'AQUATIC', parameters: { pH: 8.5 } }] };
      const result = checkCompatibility(fishA, fishB);
      expect(result.compatible).toBe(false);
      expect(result.reason).toContain('pH requirements differ');
    });
  });
});

import { checkCompatibility } from './ecosystem';
