import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConservatory } from '../../services/store';

/**
 * ParameterDetail / Observation Trend
 * 
 * Route: /parameter/:habitatId/:metric
 * 
 * Design-agnostic placeholder for parameter detail view.
 * Shows observation history and trends for a specific parameter.
 */
export const ParameterDetail: React.FC = () => {
  const { habitatId, metric } = useParams<{ habitatId: string; metric: string }>();
  const navigate = useNavigate();
  const { entities, events } = useConservatory();

  const habitat = entities.find(e => e.id === habitatId && e.type === 'HABITAT');
  
  // Filter observations for this habitat and metric
  const observations = events
    .filter(e => {
      const domainEvent = e.domain_event;
      if (!domainEvent) return false;
      
      // Check if observation is for this habitat
      const eventHabitatId = domainEvent.payload?.targetHabitatId || 
                            (domainEvent.payload?.targetHabitatName && 
                             entities.find(ent => ent.name === domainEvent.payload.targetHabitatName)?.id);
      
      // Check if observation has this metric
      const hasMetric = domainEvent.type === 'LOG_OBSERVATION' && 
                       domainEvent.payload?.observationParams?.[metric] !== undefined;
      
      return eventHabitatId === habitatId && hasMetric;
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  if (!habitat) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-serif mb-4">Habitat Not Found</h2>
        <button
          onClick={() => navigate('/home')}
          className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-emerald-400 hover:text-emerald-300"
      >
        ← Back
      </button>

      <h2 className="text-2xl font-serif mb-2">{metric.toUpperCase()}</h2>
      <p className="text-slate-400 mb-4">in {habitat.name}</p>

      {/* Placeholder for graph */}
      <div className="w-full h-48 bg-slate-800 rounded-lg mb-4 flex items-center justify-center text-slate-500">
        [Trend Graph Placeholder]
      </div>

      {/* Current value and trend */}
      {observations.length > 0 && (
        <div className="mb-4 p-3 bg-slate-800 rounded-lg">
          <div className="text-xs text-slate-400 mb-1">Current Value</div>
          <div className="text-2xl font-bold text-emerald-400">
            {observations[0].domain_event?.payload?.observationParams?.[metric]}
            {metric === 'pH' ? '' : metric === 'temp' ? '°F' : ''}
          </div>
          {observations.length > 1 && (
            <div className="text-xs text-slate-500 mt-2">
              {observations.length} observation{observations.length > 1 ? 's' : ''} recorded
            </div>
          )}
        </div>
      )}

      {/* Observation history */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold mb-2">Observation History</h3>
        {observations.length === 0 ? (
          <p className="text-slate-400">No observations yet.</p>
        ) : (
          observations.map((event, idx) => (
            <div key={idx} className="p-3 bg-slate-800 rounded">
              <div className="text-xs text-slate-400 mb-1">
                {new Date(event.timestamp).toLocaleDateString()} at {new Date(event.timestamp).toLocaleTimeString()}
              </div>
              <div className="text-slate-300 text-sm font-semibold">
                {metric.toUpperCase()}: {event.domain_event?.payload?.observationParams?.[metric]}
                {metric === 'pH' ? '' : metric === 'temp' ? '°F' : ''}
              </div>
              {event.domain_event?.payload?.observationNotes && (
                <div className="text-slate-400 text-xs italic mt-1">
                  "{event.domain_event.payload.observationNotes}"
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
