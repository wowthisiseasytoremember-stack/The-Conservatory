
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
// SUB-COMPONENT: Trait Editor
// ----------------------------------------------------------------------
const TraitList: React.FC<{ traits: EntityTrait[], onChange: (traits: EntityTrait[]) => void }> = ({ traits, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const allTypes = ['AQUATIC', 'TERRESTRIAL', 'PHOTOSYNTHETIC', 'INVERTEBRATE', 'VERTEBRATE', 'COLONY'];
  
  const toggleTrait = (type: string) => {
    const exists = traits.find(t => t.type === type);
    if (exists) {
      onChange(traits.filter(t => t.type !== type));
    } else {
      // Add with default params
      onChange([...traits, { type: type as any, parameters: {} }]);
    }
  };

  if (isOpen) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
          <h4 className="text-white font-serif font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Edit Traits (DNA)
          </h4>
          <div className="flex flex-wrap gap-2 mb-6">
            {allTypes.map(type => {
              const isSelected = traits.some(t => t.type === type);
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
      {traits.length === 0 ? <span className="text-amber-500 font-bold italic text-sm px-1">No Traits</span> : null}
      {traits.map((t, i) => (
        <span key={i} className="text-cyan-400 font-bold text-sm bg-cyan-950/40 px-1.5 rounded border border-cyan-500/20 shadow-sm">
          {t.type}
        </span>
      ))}
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
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) : e.target.value)}
        onBlur={() => setIsEditing(false)}
        onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
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

  // RENDER: PHASE 2 - REVIEW / MAD LIBS FORM
  return (
    <div className="fixed inset-x-4 top-24 z-[55] animate-in slide-in-from-top duration-500 max-w-2xl mx-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
        
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
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {/* INTENT: ACCESSION (New Entities) */}
          {action.intent === 'ACCESSION_ENTITY' && (
             <div className="text-xl leading-relaxed text-slate-300 font-serif">
                I am adding
                {action.candidates.map((candidate, i) => (
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
                          traits={candidate.traits} 
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
