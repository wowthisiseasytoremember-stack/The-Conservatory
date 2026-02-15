
import React, { useMemo } from 'react';
import { AppEvent, EventStatus, Entity } from '../types';
import { CheckCircle2, Clock, AlertCircle, Sparkles, Terminal, Activity, Droplets, Thermometer } from 'lucide-react';
import { FeaturedSpecimenCard } from './FeaturedSpecimenCard';
import { enrichEvent, EnrichedEvent } from './WonderFeedHelpers';

interface EventFeedProps {
  events: AppEvent[];
  entities?: Entity[];
  onEntityClick?: (entity: Entity) => void;
}

export const EventFeed: React.FC<EventFeedProps> = ({ events, entities = [], onEntityClick }) => {
  // Enrich events with biological context
  const enrichedEvents = useMemo(() => {
    return events.map(event => enrichEvent(event, entities, events)).filter((e): e is EnrichedEvent => e !== null);
  }, [events, entities]);

  const getStatusIcon = (status: EventStatus) => {
    switch (status) {
      case EventStatus.PENDING:
        return <Clock className="w-4 h-4 text-amber-500 animate-spin" />;
      case EventStatus.PARSED:
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case EventStatus.ERROR:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-500" />;
    }
  };

  const renderMetrics = (params: any) => {
    if (!params) return null;
    return (
      <div className="grid grid-cols-2 gap-2 mt-2">
        {Object.entries(params).map(([key, val]) => (
          (val !== null && val !== undefined) && (
            <div key={key} className="bg-slate-800/50 rounded px-2 py-1 text-xs flex items-center gap-2 border border-slate-700/50">
              {key === 'pH' && <Droplets className="w-3 h-3 text-cyan-400" />}
              {key === 'temp' && <Thermometer className="w-3 h-3 text-red-400" />}
              {key !== 'pH' && key !== 'temp' && <Activity className="w-3 h-3 text-slate-400" />}
              <span className="text-slate-400 uppercase text-[10px] tracking-wide">{key}</span>
              <span className="font-bold text-slate-200 ml-auto">{String(val)}</span>
            </div>
          )
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-32">
      {/* Featured Specimen Card */}
      {entities.length > 0 && onEntityClick && (
        <FeaturedSpecimenCard 
          entities={entities} 
          onEntityClick={onEntityClick}
        />
      )}

      <h2 className="text-xl font-serif font-bold text-emerald-400 mb-6 flex items-center gap-2">
        Wonder Feed
      </h2>
      {events.length === 0 && (
        <div className="py-12 text-center text-slate-500 italic">
          No records yet. Start by speaking to the system.
        </div>
      )}
      {events.map((event) => {
        // Try to find enriched version, fallback to null if not enriched
        const enriched = enrichedEvents.find(e => e.event.id === event.id) || null;
        
        // Use enriched rendering if available
        if (enriched) {
          return (
            <div 
              key={event.id} 
              className={`
                rounded-xl p-4 transition-all hover:scale-[1.01] border
                ${enriched.visualStyle === 'celebratory' 
                  ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15' 
                  : enriched.visualStyle === 'magical'
                  ? 'bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/15'
                  : enriched.visualStyle === 'clinical'
                  ? 'bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/15'
                  : 'bg-slate-900/50 border-slate-800 hover:bg-slate-900'
                }
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(event.status)}
                </div>
              </div>
              
              <p className="text-slate-200 text-sm leading-relaxed font-medium">
                {enriched.enrichedText}
              </p>

              {/* Trend indicator for clinical events */}
              {enriched.trend && enriched.trend.direction !== 'stable' && (
                <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                  <span className={`${enriched.trend.direction === 'up' ? 'text-red-400' : 'text-blue-400'}`}>
                    {enriched.trend.direction === 'up' ? '↑' : '↓'} {enriched.trend.delta.toFixed(1)}
                  </span>
                  <span className="text-slate-500">over {enriched.trend.period}</span>
                </div>
              )}
            </div>
          );
        }

        // Fallback to default rendering for non-enriched events
        return (
          <div 
            key={event.id} 
            className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 transition-all hover:bg-slate-900"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
              <div className="flex items-center gap-2">
                {getStatusIcon(event.status)}
              </div>
            </div>
            
            <p className="text-slate-200 text-sm mb-3 font-medium">"{event.raw_input}"</p>

          {/* Logic Anchor 3: Display Domain Event Payload */}
          {event.domain_event && (
            <div className="bg-black/30 rounded-lg p-3 border border-slate-800/50">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                  {event.domain_event.type}
                </span>
              </div>
              
              <div className="space-y-1">
                {event.domain_event.payload.targetHabitatName && (
                  <div className="text-xs text-slate-400 flex justify-between">
                    <span>Habitat</span>
                    <span className="text-slate-200">{event.domain_event.payload.targetHabitatName}</span>
                  </div>
                )}
                
                {/* Organisms List */}
                {event.domain_event.payload.candidates && event.domain_event.payload.candidates.length > 0 && (
                  <div className="text-xs text-slate-400 mt-2">
                     <span className="block mb-1 text-[10px] uppercase">Accessioned:</span>
                     {event.domain_event.payload.candidates.map((c: any, i: number) => (
                       <div key={i} className="flex justify-between pl-2 border-l border-emerald-500/30">
                          <span className="text-slate-300">{c.commonName}</span>
                          {c.quantity && <span className="text-emerald-500 font-mono">x{c.quantity}</span>}
                       </div>
                     ))}
                  </div>
                )}

                {/* Observation Metrics */}
                {event.domain_event.payload.observationParams && renderMetrics(event.domain_event.payload.observationParams)}

                 {event.domain_event.payload.observationNotes && (
                  <div className="text-xs text-slate-500 italic border-l-2 border-slate-700 pl-2 mt-2">
                    "{event.domain_event.payload.observationNotes}"
                  </div>
                )}
              </div>
            </div>
          )}

          {event.error_message && (
            <div className="mt-2 text-[10px] text-red-400 font-mono bg-red-900/10 p-2 rounded">
              Error: {event.error_message}
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
};
