
import { Entity, EntityType } from '../types';
import { ECOSYSTEM_THRESHOLDS, TIME } from '../src/constants';

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
 */
export function calculateHabitatHealth(habitat: Entity, inhabitants: Entity[]): HealthReport {
  if (habitat.type !== EntityType.HABITAT) {
    return { score: 0, factors: { stability: 0, biodiversity: 0, recency: 0 }, details: ["Not a habitat"] };
  }

  // 1. Biodiversity Bonus
  const uniqueSpecies = new Set(inhabitants.map(e => e.scientificName || e.name)).size;
  const biodiversityScore = Math.min(
    ECOSYSTEM_THRESHOLDS.BIODIVERSITY_BONUS_MAX, 
    uniqueSpecies * ECOSYSTEM_THRESHOLDS.BIODIVERSITY_SPECIES_VALUE
  );

  // 2. Stability Score
  let stabilityScore = ECOSYSTEM_THRESHOLDS.PH_STABILITY_MAX * 0.75; // Starting base
  const details: string[] = [];

  const aquaticTrait = habitat.traits.find(t => t.type === 'AQUATIC');
  const targetPH = (aquaticTrait?.type === 'AQUATIC' ? aquaticTrait.parameters.pH : null) || 7.0;
  
  const observations = habitat.observations || [];
  const latestPHObs = observations
    .filter(o => o.label === 'pH')
    .sort((a, b) => b.timestamp - a.timestamp)[0];

  if (latestPHObs) {
    const phDiff = Math.abs(latestPHObs.value - targetPH);
    const phPenalty = phDiff * ECOSYSTEM_THRESHOLDS.PH_PENALTY_MULTIPLIER;
    stabilityScore = Math.max(0, ECOSYSTEM_THRESHOLDS.PH_STABILITY_MAX - phPenalty);
    details.push(`pH stability: ${stabilityScore}/${ECOSYSTEM_THRESHOLDS.PH_STABILITY_MAX} (diff: ${phDiff.toFixed(1)})`);
  } else {
    details.push("No pH data available for stability check.");
  }

  // 3. Recency Score
  const lastUpdate = habitat.updated_at || habitat.created_at;
  const daysSinceUpdate = (Date.now() - lastUpdate) / TIME.MS_IN_DAY;
  
  let recencyScore = 0;
  const { RECENCY_PENALTY_DAYS, HEALTH_RECENCY_SCORE } = ECOSYSTEM_THRESHOLDS;
  
  if (daysSinceUpdate < RECENCY_PENALTY_DAYS.FULL) recencyScore = HEALTH_RECENCY_SCORE.NEW;
  else if (daysSinceUpdate < RECENCY_PENALTY_DAYS.HIGH) recencyScore = HEALTH_RECENCY_SCORE.RECENT;
  else if (daysSinceUpdate < RECENCY_PENALTY_DAYS.MEDIUM) recencyScore = HEALTH_RECENCY_SCORE.STALE;
  else recencyScore = HEALTH_RECENCY_SCORE.OLD;
  
  details.push(`Activity recency: ${recencyScore}/${HEALTH_RECENCY_SCORE.NEW} (${Math.floor(daysSinceUpdate)} days since last update)`);

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
  const getParams = (e: Entity) => {
    const aquaticTrait = e.traits.find(t => t.type === 'AQUATIC');
    const params = aquaticTrait?.type === 'AQUATIC' ? aquaticTrait.parameters : null;
    return {
      pH: params?.pH,
      temp: params?.temp
    };
  };

  const pA = getParams(entityA);
  const pB = getParams(entityB);

  if (!pA.pH || !pB.pH) return { compatible: true, reason: "Insufficient data for detailed check" };

  const phDiff = Math.abs(pA.pH - pB.pH);
  if (phDiff > ECOSYSTEM_THRESHOLDS.PH_COMPATIBILITY_THRESHOLD) {
    return { compatible: false, reason: `pH requirements differ too much (${pA.pH} vs ${pB.pH})` };
  }

  if (pA.temp && pB.temp) {
    const tempDiff = Math.abs(pA.temp - pB.temp);
    if (tempDiff > ECOSYSTEM_THRESHOLDS.TEMP_COMPATIBILITY_THRESHOLD) {
      return { compatible: false, reason: `Temperature requirements differ too much (${pA.temp}°F vs ${pB.temp}°F)` };
    }
  }

  return { compatible: true, reason: "Environmental parameters align" };
}

/**
 * Analyzes the trend of a parameter based on historical observations.
 */
export function calculateParameterTrend(observations: any[], parameter: string): 'increasing' | 'decreasing' | 'stable' | 'unknown' {
  const relevant = observations
    .filter(o => o.label === parameter)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  if (relevant.length < 2) return 'unknown';

  const values = relevant.map(o => o.value).reverse();
  const first = values[0];
  const last = values[values.length - 1];
  
  const diff = last - first;
  let threshold = ECOSYSTEM_THRESHOLDS.TREND_DEFAULT_STABILITY;
  if (parameter === 'pH') threshold = ECOSYSTEM_THRESHOLDS.TREND_PH_STABILITY;
  else if (parameter === 'temp') threshold = ECOSYSTEM_THRESHOLDS.TREND_TEMP_STABILITY;

  if (Math.abs(diff) < threshold) return 'stable';
  return diff > 0 ? 'increasing' : 'decreasing';
}

/**
 * Finds compatible species from the library for a given entity.
 */
export async function findCompatibleTankmates(entity: Entity, libraryRecords: any[]): Promise<any[]> {
  const aquaticTrait = entity.traits.find(t => t.type === 'AQUATIC');
  const aquatic = aquaticTrait?.type === 'AQUATIC' ? aquaticTrait.parameters : null;
  if (!aquatic || !aquatic.pH) return [];

  return libraryRecords.filter(record => {
    // Support both flattened (legacy) and structured traits
    let libPH, libTemp;
    
    if (record.traits?.AQUATIC) {
        libPH = record.traits.AQUATIC.pH;
        libTemp = record.traits.AQUATIC.temp;
    } else if (Array.isArray(record.traits)) {
        const found = record.traits.find((t: any) => t.type === 'AQUATIC');
        libPH = found?.parameters?.pH;
        libTemp = found?.parameters?.temp;
    }

    if (!libPH) return false;

    const phMatch = Math.abs(libPH - aquatic.pH!) <= 1.0;
    const tempMatch = !libTemp || !aquatic.temp || Math.abs(libTemp - aquatic.temp) <= 8;

    return phMatch && tempMatch && record.name !== entity.name;
  }).slice(0, 5);
}


