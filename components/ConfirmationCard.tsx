
import React, { useState, useEffect, useRef } from 'react';
import { PendingAction, EntityTrait } from '../types';
import { X, Sparkles, Loader2, ArrowRight, Activity, Droplets, Thermometer, Wind } from 'lucide-react';

interface ConfirmationCardProps {
  action: PendingAction;
  onCommit: () => void;
  onDiscard: () => void;
  onUpdate: (path: string, value: any) => void;
}

// ----------------------------------------------------------------------
// Trait parameter definitions – what fields each trait type exposes
// ----------------------------------------------------------------------
const TRAIT_PARAM_DEFS: Record<string, Array<{ key: string; label: string; icon: string; type: 'number' | 'text' | 'select'; suffix?: string; options?: string[] }>> = {
  AQUATIC: [
    { key: 'pH', label: 'pH', icon: '💧', type: 'number' },
    { key: 'temp', label: 'Temp', icon: '🌡️', type: 'number', suffix: '°F' },
    { key: 'salinity', label: 'Salinity', icon: '🧂', type: 'select', options: ['fresh', 'brackish', 'marine'] },
    { key: 'ammonia', label: 'Ammonia', icon: '⚗️', type: 'number', suffix: 'ppm' },
    { key: 'nitrates', label: 'Nitrates', icon: '📊', type: 'number', suffix: 'ppm' },
  ],
  TERRESTRIAL: [
    { key: 'humidity', label: 'Humidity', icon: '💨', type: 'number', suffix: '%' },
    { key: 'substrate', label: 'Substrate', icon: '🪨', type: 'text' },
    { key: 'temp', label: 'Temp', icon: '🌡️', type: 'number', suffix: '°F' },
  ],
  PHOTOSYNTHETIC: [
    { key: 'lightReq', label: 'Light', icon: '☀️', type: 'select', options: ['low', 'med', 'high'] },
    { key: 'co2', label: 'CO₂', icon: '🫧', type: 'select', options: ['true', 'false'] },
    { key: 'growth_rate', label: 'Growth Rate', icon: '📈', type: 'select', options: ['slow', 'medium', 'fast'] },
    { key: 'difficulty', label: 'Difficulty', icon: '⭐', type: 'select', options: ['easy', 'medium', 'hard', 'very_hard'] },
    { key: 'placement', label: 'Placement', icon: '📍', type: 'select', options: ['foreground', 'midground', 'background', 'floating', 'epiphyte'] },
    { key: 'growth_height', label: 'Height', icon: '📏', type: 'number', suffix: 'cm' },
  ],
  INVERTEBRATE: [
    { key: 'molting', label: 'Molts', icon: '🦐', type: 'select', options: ['true', 'false'] },
    { key: 'colony', label: 'Colony', icon: '🐜', type: 'select', options: ['true', 'false'] },
  ],
  VERTEBRATE: [
    { key: 'diet', label: 'Diet', icon: '🍽️', type: 'select', options: ['carnivore', 'herbivore', 'omnivore'] },
  ],
  COLONY: [
    { key: 'estimatedCount', label: 'Count', icon: '🔢', type: 'number' },
    { key: 'stable', label: 'Stable', icon: '📊', type: 'select', options: ['true', 'false'] },
  ],
};

// ----------------------------------------------------------------------
// SUB-COMPONENT: Trait Editor (with nested parameters)
// ----------------------------------------------------------------------
const TraitList: React.FC<{ traits: EntityTrait[], onChange: (traits: EntityTrait[]) => void }> = ({ traits = [], onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Ensure traits is always an array
  const safeTraits = Array.isArray(traits) ? traits : [];
  
  const allTypes = ['AQUATIC', 'TERRESTRIAL', 'PHOTOSYNTHETIC', 'INVERTEBRATE', 'VERTEBRATE', 'COLONY'];
  
  const toggleTrait = (type: string) => {
    const exists = safeTraits.find(t => t.type === type);
    if (exists) {
      onChange(safeTraits.filter(t => t.type !== type));
    } else {
      onChange([...safeTraits, { type: type as any, parameters: {} }]);
    }
  };

  const updateParam = (traitType: string, paramKey: string, value: any) => {
    onChange(safeTraits.map(t => {
      if (t.type !== traitType) return t;
      // Ensure parameters exists
      const currentParams = t.parameters || {};
      return { ...t, parameters: { ...currentParams, [paramKey]: value } } as EntityTrait;
    }));
  };

  if (isOpen) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 max-w-sm w-full shadow-2xl max-h-[80vh] overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
          <h4 className="text-white font-serif font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Edit Traits (DNA)
          </h4>
          {/* Trait Toggle Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {allTypes.map(type => {
              const isSelected = safeTraits.some(t => t.type === type);
              return (
                <button
                  key={type}
                  onClick={() => toggleTrait(type)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                    isSelected 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                      : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>

          {/* Nested Parameter Editors for Selected Traits */}
          {safeTraits.map(trait => {
            const defs = TRAIT_PARAM_DEFS[trait.type];
            if (!defs || defs.length === 0) return null;
            return (
              <div key={trait.type} className="mb-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2">{trait.type} Parameters</div>
                <div className="grid grid-cols-2 gap-2">
                  {defs.map(def => (
                    <div key={def.key} className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 flex items-center gap-1">
                        <span>{def.icon}</span> {def.label}
                      </label>
                      {def.type === 'select' ? (
                        <select
                          value={((trait.parameters || {}) as any)?.[def.key] ?? ''}
                          onChange={(e) => {
                            let val: any = e.target.value;
                            if (val === 'true') val = true;
                            if (val === 'false') val = false;
                            if (val === '') val = undefined;
                            updateParam(trait.type, def.key, val);
                          }}
                          className="bg-black/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                        >
                          <option value="">—</option>
                          {def.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-1">
                          <input
                            type={def.type}
                            value={(trait.parameters as any)?.[def.key] ?? ''}
                            onChange={(e) => updateParam(trait.type, def.key, def.type === 'number' ? (e.target.value ? parseFloat(e.target.value) : undefined) : e.target.value)}
                            placeholder="—"
                            className="w-full bg-black/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                          />
                          {def.suffix && <span className="text-[10px] text-slate-500 whitespace-nowrap">{def.suffix}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <button 
            onClick={() => setIsOpen(false)}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-bold text-sm transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <span 
      onClick={() => setIsOpen(true)}
      className="inline-flex flex-wrap gap-1 mx-1 align-middle cursor-pointer hover:bg-slate-800/50 rounded px-1 transition-colors group"
    >
      <span className="text-slate-600 font-bold text-lg select-none group-hover:text-slate-400">[</span>
      {safeTraits.length === 0 ? <span className="text-amber-500 font-bold italic text-sm px-1">No Traits</span> : null}
      {safeTraits.map((t, i) => {
        const paramCount = Object.values(t.parameters || {}).filter(v => v !== undefined && v !== null).length;
        return (
          <span key={i} className="text-cyan-400 font-bold text-sm bg-cyan-950/40 px-1.5 rounded border border-cyan-500/20 shadow-sm">
            {t.type}{paramCount > 0 ? <span className="text-cyan-600 text-[10px] ml-0.5">({paramCount})</span> : ''}
          </span>
        );
      })}
      <span className="text-slate-600 font-bold text-lg select-none group-hover:text-slate-400">]</span>
    </span>
  );
};

// ----------------------------------------------------------------------
// SUB-COMPONENT: Interactive Slot
// ----------------------------------------------------------------------
const Slot: React.FC<{ value: any, placeholder: string, type?: 'text'|'number', suffix?: string, onChange: (v: any) => void }> = ({ 
  value, placeholder, type = 'text', suffix, onChange 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={value || ''}
        onChange={(e) => {
          const val = e.target.value;
          if (val === '') {
            onChange(undefined);
          } else {
            const parsed = parseFloat(val);
            if (!isNaN(parsed)) onChange(parsed);
          }
        }}
        onBlur={() => setIsEditing(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') setIsEditing(false);
          if (e.key === 'Escape') setIsEditing(false);
        }}
        className="bg-slate-800 text-emerald-400 font-bold rounded px-2 py-0.5 outline-none border border-emerald-500/50 min-w-[40px] inline-block align-middle mx-1"
        placeholder={placeholder}
      />
    );
  }

  return (
    <span 
      onClick={() => setIsEditing(true)}
      className={`
        inline-block mx-1 px-2 py-0.5 rounded-md cursor-pointer border-b-2 transition-all font-bold align-middle
        ${(value === undefined || value === null) 
          ? 'text-amber-500 border-amber-500/50 bg-amber-500/10' 
          : 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20'}
      `}
    >
      {value !== undefined && value !== null ? value : placeholder}
      {value && suffix && <span className="text-emerald-500/50 text-xs ml-0.5 font-normal">{suffix}</span>}
    </span>
  );
};

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------
export const ConfirmationCard: React.FC<ConfirmationCardProps> = ({ action, onCommit, onDiscard, onUpdate }) => {
  const isAnalyzing = action.status === 'ANALYZING';

  // RENDER: PHASE 1 - OPTIMISTIC ANALYSIS
  if (isAnalyzing) {
    return (
      <div className="fixed inset-x-4 top-24 z-[55] animate-in slide-in-from-top duration-300 max-w-2xl mx-auto">
        <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">Processing Intent...</span>
            </div>
            <p className="text-white font-serif text-xl leading-relaxed opacity-90">"{action.transcript}"</p>
            <div className="space-y-2 pt-2">
               <div className="h-4 bg-slate-800 rounded w-2/3 animate-pulse" />
               <div className="h-4 bg-slate-800 rounded w-1/2 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RENDER: STRATEGY FALLBACK
  if (action.status === 'STRATEGY_REQUIRED') {
    return (
      <div className="fixed inset-x-4 top-24 z-[55] animate-in slide-in-from-top duration-500 max-w-2xl mx-auto">
        <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="w-24 h-24 text-amber-500" />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/20 p-2 rounded-xl">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-500">Clarity Required</span>
            </div>

            <div className="space-y-2">
               <p className="text-slate-400 text-sm italic">"I heard: {action.transcript}"</p>
               <h2 className="text-xl font-serif text-white leading-relaxed">
                 {action.intentStrategy?.advice}
               </h2>
            </div>

            {action.intentStrategy?.suggestedCommand && (
              <div className="bg-black/30 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Suggested Action</div>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-emerald-400 font-mono text-sm">{action.intentStrategy.suggestedCommand}</p>
                  <button 
                    onClick={() => {
                      // @ts-ignore
                      if (window.processVoiceInput) {
                         // @ts-ignore
                         window.processVoiceInput(action.intentStrategy.suggestedCommand);
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                  >
                    Accept Suggestion
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={onDiscard}
                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold rounded-2xl text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RENDER: PHASE 2 - REVIEW / MAD LIBS FORM
  return (
    <div className="fixed inset-x-4 top-24 z-[55] animate-in slide-in-from-top duration-500 max-w-2xl mx-auto" style={{ maxHeight: 'calc(100vh - 8rem)', zIndex: 55 }}>
      <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
        
        {/* Header */}
        <div className="bg-black/40 p-4 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${action.isAmbiguous ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{action.intent?.replace('_', ' ')}</span>
          </div>
          <button onClick={onDiscard} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 16rem)', scrollbarWidth: 'thin' }}>
          
          {/* INTENT: ACCESSION (New Entities) */}
          {action.intent === 'ACCESSION_ENTITY' && (
             <div className="text-xl leading-relaxed text-slate-300 font-serif">
                I am adding
                {(action.candidates || []).map((candidate, i) => (
                  <div key={i} className="my-3 pl-4 border-l-2 border-emerald-500/30">
                     <div className="flex items-center flex-wrap">
                        <Slot 
                          value={candidate.quantity} 
                          placeholder="#" 
                          type="number" 
                          onChange={(v) => onUpdate(`candidates.${i}.quantity`, v)} 
                        />
                        <Slot 
                          value={candidate.commonName} 
                          placeholder="Species Name" 
                          onChange={(v) => onUpdate(`candidates.${i}.commonName`, v)} 
                        />
                        <span className="mx-1">which are</span>
                        <TraitList 
                          traits={candidate.traits || []} 
                          onChange={(v) => onUpdate(`candidates.${i}.traits`, v)} 
                        />
                     </div>
                  </div>
                ))}
                to 
                <Slot 
                   value={action.targetHabitatName} 
                   placeholder="Select Habitat..." 
                   onChange={(v) => onUpdate('targetHabitatName', v)}
                />.
             </div>
          )}

          {/* INTENT: LOG OBSERVATION (Metrics) */}
          {action.intent === 'LOG_OBSERVATION' && (
            <div className="space-y-6">
               <div className="text-xl leading-relaxed text-slate-300 font-serif">
                  <span className="text-slate-500 text-base italic block mb-2">"{action.observationNotes || action.transcript}"</span>
                  I observed 
                  <Slot 
                    value={action.targetHabitatName} 
                    placeholder="Select Habitat..." 
                    onChange={(v) => onUpdate('targetHabitatName', v)}
                  />
                  and recorded:
               </div>

               {/* Metrics Grid */}
               <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-2 mb-1 text-xs text-slate-400 uppercase tracking-wider">
                      <Droplets className="w-3 h-3 text-cyan-400" /> pH
                    </div>
                    <Slot value={action.observationParams?.pH} placeholder="--" type="number" onChange={(v) => onUpdate('observationParams.pH', v)} />
                  </div>
                  
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-2 mb-1 text-xs text-slate-400 uppercase tracking-wider">
                      <Thermometer className="w-3 h-3 text-red-400" /> Temp
                    </div>
                    <Slot value={action.observationParams?.temp} placeholder="--" type="number" suffix="°F" onChange={(v) => onUpdate('observationParams.temp', v)} />
                  </div>

                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-2 mb-1 text-xs text-slate-400 uppercase tracking-wider">
                      <Wind className="w-3 h-3 text-purple-400" /> Ammonia
                    </div>
                    <Slot value={action.observationParams?.ammonia} placeholder="--" type="number" suffix="ppm" onChange={(v) => onUpdate('observationParams.ammonia', v)} />
                  </div>

                   <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-2 mb-1 text-xs text-slate-400 uppercase tracking-wider">
                      <Activity className="w-3 h-3 text-emerald-400" /> Nitrates
                    </div>
                    <Slot value={action.observationParams?.nitrates} placeholder="--" type="number" suffix="ppm" onChange={(v) => onUpdate('observationParams.nitrates', v)} />
                  </div>

                  {/* Specialized Metric Slots */}
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-2 mb-1 text-xs text-slate-400 uppercase tracking-wider">
                      <Droplets className="w-3 h-3 text-blue-400" /> Humidity
                    </div>
                    <Slot value={action.observationParams?.humidity} placeholder="--" type="number" suffix="%" onChange={(v) => onUpdate('observationParams.humidity', v)} />
                  </div>

                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-2 mb-1 text-xs text-slate-400 uppercase tracking-wider">
                      <ArrowRight className="w-3 h-3 text-emerald-400" /> Growth
                    </div>
                    <Slot value={action.observationParams?.growth_cm} placeholder="--" type="number" suffix="cm" onChange={(v) => onUpdate('observationParams.growth_cm', v)} />
                  </div>

                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-2 mb-1 text-xs text-slate-400 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-purple-400" /> Molting
                    </div>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => onUpdate('observationParams.molting', true)}
                         className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border transition-all ${action.observationParams?.molting === true ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-400' : 'bg-slate-900 border-slate-800 text-slate-600'}`}
                       >
                         Yes
                       </button>
                       <button 
                         onClick={() => onUpdate('observationParams.molting', false)}
                         className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border transition-all ${action.observationParams?.molting === false ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-900 border-slate-800 text-slate-600'}`}
                       >
                         No
                       </button>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {/* INTENT: MODIFY HABITAT */}
          {action.intent === 'MODIFY_HABITAT' && (
            <div className="text-xl leading-relaxed text-slate-300 font-serif">
               Create a new
               <Slot value={action.habitatParams?.size} placeholder="#" type="number" onChange={(v) => onUpdate('habitatParams.size', v)} />
               <Slot value={action.habitatParams?.unit} placeholder="gal" onChange={(v) => onUpdate('habitatParams.unit', v)} />
               <Slot value={action.habitatParams?.type} placeholder="Type (Fresh/Salt)" onChange={(v) => onUpdate('habitatParams.type', v)} />
               habitat named
               <Slot value={action.habitatParams?.name} placeholder="Name" onChange={(v) => onUpdate('habitatParams.name', v)} />
               located in the
               <Slot value={action.habitatParams?.location} placeholder="Location" onChange={(v) => onUpdate('habitatParams.location', v)} />.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-black/40 border-t border-slate-800 flex gap-3">
          <button 
            onClick={onDiscard}
            className="px-6 py-4 rounded-xl text-slate-400 font-bold text-sm hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onCommit}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
          >
            Confirm & Save <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
