
import { AppEvent, Entity } from '../types';

/**
 * Helper functions for enriching events with biological context and meaning.
 */

export interface EnrichedEvent {
  event: AppEvent;
  enrichedText: string;
  emoji: string;
  visualStyle: 'celebratory' | 'clinical' | 'magical' | 'neutral';
  discoveryFact?: string;
  trend?: {
    metric: string;
    direction: 'up' | 'down' | 'stable';
    delta: number;
    period: string;
  };
}

/**
 * Computes trend for a metric from observation history.
 * Returns trend direction and delta over the specified period.
 */
export function computeTrend(
  events: AppEvent[],
  metric: string,
  habitatId: string | undefined,
  days: number = 14
): { direction: 'up' | 'down' | 'stable'; delta: number; period: string } | null {
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  
  const relevantEvents = events
    .filter(e => 
      e.domain_event?.type === 'LOG_OBSERVATION' &&
      e.domain_event?.payload?.targetHabitatId === habitatId &&
      e.domain_event?.payload?.observationParams?.[metric] !== undefined &&
      e.timestamp >= cutoff
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  if (relevantEvents.length < 2) return null;

  const first = relevantEvents[0].domain_event?.payload?.observationParams?.[metric];
  const last = relevantEvents[relevantEvents.length - 1].domain_event?.payload?.observationParams?.[metric];

  if (typeof first !== 'number' || typeof last !== 'number') return null;

  const delta = last - first;
  const absDelta = Math.abs(delta);
  
  // Consider stable if change is less than 0.1 (for pH) or 1 (for temp)
  const threshold = metric === 'pH' ? 0.1 : 1;
  const direction = absDelta < threshold ? 'stable' : (delta > 0 ? 'up' : 'down');

  return {
    direction,
    delta: Math.abs(delta),
    period: `${days} days`
  };
}

/**
 * Enriches an event with biological context and meaning.
 */
export function enrichEvent(
  event: AppEvent,
  entities: Entity[],
  allEvents: AppEvent[]
): EnrichedEvent | null {
  if (!event.domain_event) return null;

  const { type, payload } = event.domain_event;

  // ACCESSION_ENTITY - Celebratory with discovery facts
  if (type === 'ACCESSION_ENTITY' && payload.candidates) {
    const candidates = payload.candidates as Array<{ commonName: string; quantity?: number }>;
    const habitatName = payload.targetHabitatName || 'your habitat';
    
    // Find entities matching accessioned species to get discovery facts
    const matchedEntities = entities.filter(e => 
      candidates.some(c => 
        e.name.toLowerCase() === c.commonName.toLowerCase() ||
        e.aliases.some(a => a.toLowerCase() === c.commonName.toLowerCase())
      )
    );

    // Get discovery fact from first enriched entity
    const enrichedEntity = matchedEntities.find(e => 
      e.enrichment_status === 'complete' && e.overflow?.discovery?.mechanism
    );

    const discoveryFact = enrichedEntity?.overflow?.discovery?.mechanism?.split('.')[0];
    
    const speciesText = candidates.length === 1
      ? `${candidates[0].quantity || 1} ${candidates[0].commonName}${candidates[0].quantity && candidates[0].quantity > 1 ? 's' : ''}`
      : `${candidates.length} species`;

    let enrichedText = `🐟 ${speciesText} joined ${habitatName}.`;
    
    if (discoveryFact) {
      enrichedText += ` _Did you know? ${discoveryFact}._`;
    }

    return {
      event,
      enrichedText,
      emoji: '🐟',
      visualStyle: 'celebratory',
      discoveryFact
    };
  }

  // LOG_OBSERVATION - Clinical with trend analysis
  if (type === 'LOG_OBSERVATION' && payload.observationParams) {
    const habitatId = payload.targetHabitatId;
    const params = payload.observationParams as Record<string, any>;
    const habitatName = payload.targetHabitatName || 'your habitat';

    // Check for pH trend
    if (params.pH !== undefined) {
      const trend = computeTrend(allEvents, 'pH', habitatId, 14);
      const trendText = trend 
        ? trend.direction === 'stable' 
          ? `stable within your ${trend.period} trend`
          : `trending ${trend.direction === 'up' ? '↑' : '↓'} ${trend.delta.toFixed(1)} over ${trend.period}`
        : '';

      return {
        event,
        enrichedText: `💧 pH logged at ${params.pH} in ${habitatName}${trendText ? ` — ${trendText}` : '.'}`,
        emoji: '💧',
        visualStyle: 'clinical',
        trend: trend ? { metric: 'pH', ...trend } : undefined
      };
    }

    // Check for temperature trend
    if (params.temp !== undefined) {
      const trend = computeTrend(allEvents, 'temp', habitatId, 14);
      const trendText = trend 
        ? trend.direction === 'stable' 
          ? `stable within your ${trend.period} trend`
          : `trending ${trend.direction === 'up' ? '↑' : '↓'} ${trend.delta.toFixed(1)}° over ${trend.period}`
        : '';

      return {
        event,
        enrichedText: `🌡️ Temperature logged at ${params.temp}° in ${habitatName}${trendText ? ` — ${trendText}` : '.'}`,
        emoji: '🌡️',
        visualStyle: 'clinical',
        trend: trend ? { metric: 'temp', ...trend } : undefined
      };
    }

    // Generic observation
    const metricKeys = Object.keys(params).filter(k => params[k] !== null && params[k] !== undefined);
    if (metricKeys.length > 0) {
      const metrics = metricKeys.map(k => `${k}: ${params[k]}`).join(', ');
      return {
        event,
        enrichedText: `📊 Observation logged in ${habitatName}: ${metrics}`,
        emoji: '📊',
        visualStyle: 'clinical'
      };
    }
  }

  // Discovery events (when enrichment completes)
  // This would be triggered by enrichment_status changes, but for now we'll check if
  // an entity was recently enriched and show a discovery event
  if (type === 'ACCESSION_ENTITY') {
    // Check if any entities were enriched after this event
    const relatedEntities = entities.filter(e => 
      e.enrichment_status === 'complete' && 
      e.overflow?.discovery?.mechanism &&
      e.created_at >= event.timestamp &&
      e.created_at <= event.timestamp + 60000 // Within 1 minute
    );

    if (relatedEntities.length > 0) {
      const entity = relatedEntities[0];
      const mechanism = entity.overflow?.discovery?.mechanism?.split('.')[0];
      
      if (mechanism) {
        return {
          event,
          enrichedText: `🧬 **New Discovery**: ${entity.name} — ${mechanism}`,
          emoji: '🧬',
          visualStyle: 'magical',
          discoveryFact: mechanism
        };
      }
    }
  }

  // Fallback: return null to use default rendering
  return null;
}
