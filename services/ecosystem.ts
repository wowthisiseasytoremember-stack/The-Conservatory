
import { Entity, EntityType } from '../types';

/**
 * ECOSYSTEM ENGINE
 * 
 * Pure logic for calculating habitat health, compatibility, and biological synergies.
 */

export interface HealthReport {
  score: number;
  factors: {
    stability: number;
    biodiversity: number;
    recency: number;
  };
  details: string[];
}

/**
 * Calculates the health of a habitat based on:
 * 1. Parameter stability (pH, temp)
 * 2. Biodiversity (number of unique species)
 * 3. Recency of observations
 * 
 * Logic: (100 - (abs(pH_diff) * 10)) + biodiversity_bonus
 */
export function calculateHabitatHealth(habitat: Entity, inhabitants: Entity[]): HealthReport {
  if (habitat.type !== EntityType.HABITAT) {
    return { score: 0, factors: { stability: 0, biodiversity: 0, recency: 0 }, details: ["Not a habitat"] };
  }

  // 1. Biodiversity Bonus (Max 40 points)
  const uniqueSpecies = new Set(inhabitants.map(e => e.scientificName || e.name)).size;
  const biodiversityScore = Math.min(40, uniqueSpecies * 5);

  // 2. Stability Score (Max 40 points)
  // Check most recent pH observation vs target
  let stabilityScore = 30; // Default base
  const details: string[] = [];

  const aquaticTrait = habitat.traits.find(t => t.type === 'AQUATIC');
  const targetPH = aquaticTrait?.parameters.pH || 7.0;
  
  // Get most recent observation for this habitat
  const observations = habitat.observations || [];
  const latestPHObs = observations
    .filter(o => o.label === 'pH')
    .sort((a, b) => b.timestamp - a.timestamp)[0];

  if (latestPHObs) {
    const phDiff = Math.abs(latestPHObs.value - targetPH);
    const phPenalty = phDiff * 10;
    stabilityScore = Math.max(0, 40 - phPenalty);
    details.push(`pH stability: ${stabilityScore}/40 (diff: ${phDiff.toFixed(1)})`);
  } else {
    details.push("No pH data available for stability check.");
  }

  // 3. Recency Score (Max 20 points)
  const lastUpdate = habitat.updated_at || habitat.created_at;
  const daysSinceUpdate = (Date.now() - lastUpdate) / (1000 * 60 * 60 * 24);
  
  let recencyScore = 0;
  if (daysSinceUpdate < 1) recencyScore = 20;
  else if (daysSinceUpdate < 7) recencyScore = 15;
  else if (daysSinceUpdate < 30) recencyScore = 10;
  else recencyScore = 5;
  
  details.push(`Activity recency: ${recencyScore}/20 (${Math.floor(daysSinceUpdate)} days since last update)`);

  const totalScore = Math.min(100, Math.round(biodiversityScore + stabilityScore + recencyScore));

  return {
    score: totalScore,
    factors: {
      stability: stabilityScore,
      biodiversity: biodiversityScore,
      recency: recencyScore
    },
    details
  };
}

/**
 * Checks compatibility between two entities based on their traits.
 */
export function checkCompatibility(entityA: Entity, entityB: Entity): { compatible: boolean; reason: string } {
  // Extract pH and Temp ranges from traits
  const getParams = (e: Entity) => {
    const aquatic = e.traits.find(t => t.type === 'AQUATIC')?.parameters;
    return {
      pH: aquatic?.pH,
      temp: aquatic?.temp
    };
  };

  const pA = getParams(entityA);
  const pB = getParams(entityB);

  // If one doesn't have params, assume compatible for now
  if (!pA.pH || !pB.pH) return { compatible: true, reason: "Insufficient data for detailed check" };

  // 1. pH Check: within 1.5
  const phDiff = Math.abs(pA.pH - pB.pH);
  if (phDiff > 1.5) {
    return { compatible: false, reason: `pH requirements differ too much (${pA.pH} vs ${pB.pH})` };
  }

  // 2. Temp Check: within 10 degrees
  if (pA.temp && pB.temp) {
    const tempDiff = Math.abs(pA.temp - pB.temp);
    if (tempDiff > 10) {
      return { compatible: false, reason: `Temperature requirements differ too much (${pA.temp}°F vs ${pB.temp}°F)` };
    }
  }

  return { compatible: true, reason: "Environmental parameters align" };
}
