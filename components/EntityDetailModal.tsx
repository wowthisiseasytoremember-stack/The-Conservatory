
import React, { useState, useEffect } from 'react';
import { Entity, EntityGroup } from '../types';
import { X, Tag, Plus, Trash2, FolderOpen, Globe2, CheckCircle2, AlertTriangle, Loader2, TrendingUp, Sparkles } from 'lucide-react';
import { GrowthChart } from './GrowthChart';

interface EntityDetailModalProps {
  entity: Entity;
  groups: EntityGroup[];
  onClose: () => void;
  onUpdate: (updates: Partial<Entity>) => void;
  // Adjusted to be async to match the store's implementation
  onAddGroup: (name: string) => Promise<EntityGroup>;
}

interface GbifData {
  scientificName: string;
  kingdom: string;
  phylum?: string;
  class?: string;
  order?: string;
  family: string;
  genus?: string;
  matchType: string;
  status: string;
}

export const EntityDetailModal: React.FC<EntityDetailModalProps> = ({ 
  entity, groups, onClose, onUpdate, onAddGroup 
}) => {
  const [newAlias, setNewAlias] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  // GBIF State
  const [gbifData, setGbifData] = useState<GbifData | null>(null);
  const [loadingGbif, setLoadingGbif] = useState(false);

  // Observation logging state
  const [obsLabel, setObsLabel] = useState('growth');
  const [obsValue, setObsValue] = useState('');
  const [obsUnit, setObsUnit] = useState('cm');

  // Chart selection state
  const [activeMetric, setActiveMetric] = useState<string | null>(null);

  // Load GBIF Data on Mount
  useEffect(() => {
    const fetchGbif = async () => {
      setLoadingGbif(true);
      try {
        // Use scientific name if available, otherwise common name
        const query = entity.scientificName || entity.name;
        const res = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        if (data.matchType !== 'NONE') {
          setGbifData({
            scientificName: data.scientificName,
            kingdom: data.kingdom,
            phylum: data.phylum,
            class: data.class,
            order: data.order,
            family: data.family,
            genus: data.genus,
            matchType: data.matchType,
            status: data.status
          });
          // Auto-enrich if missing scientific name
          if (!entity.scientificName && data.scientificName) {
            onUpdate({ scientificName: data.scientificName });
          }
        }
      } catch (e) {
        console.error("GBIF Error", e);
      } finally {
        setLoadingGbif(false);
      }
    };

    if (entity.type === 'ORGANISM' || entity.type === 'PLANT') {
      fetchGbif();
    }
  }, [entity.id]); // Only run on entity switch

  const addAlias = () => {
    if (newAlias.trim() && !entity.aliases.includes(newAlias.trim())) {
      onUpdate({ aliases: [...entity.aliases, newAlias.trim()] });
      setNewAlias('');
    }
  };

  const removeAlias = (alias: string) => {
    onUpdate({ aliases: entity.aliases.filter(a => a !== alias) });
  };

  const setGroup = (groupId: string | undefined) => {
    onUpdate({ group_id: groupId });
  };

  const handleCreateGroup = async () => {
    if (newGroupName.trim()) {
      // Use await since the prop is now async
      const g = await onAddGroup(newGroupName.trim());
      setGroup(g.id);
      setNewGroupName('');
      setIsCreatingGroup(false);
    }
  };

  const logObservation = () => {
    const numVal = parseFloat(obsValue);
    if (isNaN(numVal)) return;
    const existing = entity.observations || [];
    const newObs = {
      timestamp: Date.now(),
      type: obsLabel as 'growth' | 'parameter' | 'note',
      label: obsLabel,
      value: numVal,
      unit: obsUnit || undefined,
    };
    onUpdate({ observations: [...existing, newObs] });
    setObsValue('');
  };

  const observations = entity.observations || [];
  
  // Group observations by label for the metric selector
  const metrics = Array.from(new Set(observations.map(o => o.label)));
  
  // Default to first metric or 'growth' if none active
  useEffect(() => {
    if (!activeMetric && metrics.length > 0) {
      setActiveMetric(metrics[0]);
    } else if (!activeMetric && !metrics.length) {
      setActiveMetric('growth');
    }
  }, [metrics, activeMetric]);

  const chartData = observations
    .filter(o => o.label === activeMetric)
    .map(o => ({
      timestamp: o.timestamp,
      value: o.value,
      label: o.label,
      unit: o.unit,
    }));

  const renderTraitGauges = () => {
    return (
      <div className="flex flex-wrap gap-2">
        {entity.traits.map((trait, i) => {
          const params: any = (trait as any).parameters || {};
          return (
            <React.Fragment key={i}>
              {/* Aquatic Params */}
              {trait.type === 'AQUATIC' && (
                <>
                  {params.pH && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-2 py-1 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span className="text-[10px] font-bold text-blue-400">pH {params.pH}</span>
                    </div>
                  )}
                  {params.temp && (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-2 py-1 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      <span className="text-[10px] font-bold text-orange-400">{params.temp}°</span>
                    </div>
                  )}
                  {params.salinity && (
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-2 py-1">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-tighter">{params.salinity}</span>
                    </div>
                  )}
                </>
              )}
              {/* Photosynthetic / Plant Params */}
              {trait.type === 'PHOTOSYNTHETIC' && (
                <>
                  {params.difficulty && (
                    <div className={`border rounded-lg px-2 py-1 flex items-center gap-1.5 ${
                      params.difficulty === 'easy' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                      params.difficulty === 'hard' || params.difficulty === 'very_hard' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                      'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    }`}>
                      <span className="text-[10px] font-bold uppercase tracking-tight">{params.difficulty}</span>
                    </div>
                  )}
                  {params.lightReq && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-2 py-1">
                      <span className="text-[10px] font-bold text-yellow-500 uppercase">Light: {params.lightReq}</span>
                    </div>
                  )}
                </>
              )}
              {/* Invertebrate Params */}
              {trait.type === 'INVERTEBRATE' && (
                <>
                  {params.molting && (
                    <div className="bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-lg px-2 py-1 animate-pulse">
                      <span className="text-[10px] font-bold text-fuchsia-400 uppercase">Molting Mode</span>
                    </div>
                  )}
                </>
              )}
              {/* Terrestrial Params */}
              {trait.type === 'TERRESTRIAL' && (
                <>
                  {params.humidity && (
                    <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg px-2 py-1 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <span className="text-[10px] font-bold text-indigo-400">{params.humidity}% RH</span>
                    </div>
                  )}
                </>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 70 }}>
      <div className="bg-slate-900 w-full max-w-md border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[85vh]">
        
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-black/20">
          <div>
            <h2 className="text-xl font-serif font-bold text-white">{entity.name}</h2>
            <div className="flex items-center gap-2">
              <p className="text-xs text-emerald-500 font-mono uppercase tracking-wider">{entity.type}</p>
              {entity.quantity && (
                 <span className="text-xs bg-slate-800 px-2 rounded-full text-slate-300">x{entity.quantity}</span>
              )}
            </div>
            {entity.delightfulSummary && (
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">{entity.delightfulSummary}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Taxonomy Ribbon (B2) */}
        {gbifData && (entity.type === 'ORGANISM' || entity.type === 'PLANT') && (
          <div className="bg-black/40 px-6 py-2 border-b border-slate-800/50 overflow-x-auto no-scrollbar whitespace-nowrap">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-medium text-slate-500">
              <span className="text-emerald-500/70">Kingdom</span> {gbifData.kingdom}
              {gbifData.phylum && <><span className="text-slate-700 mx-1">·</span> <span className="text-emerald-500/70">Phylum</span> {gbifData.phylum}</>}
              {gbifData.family && <><span className="text-slate-700 mx-1">·</span> <span className="text-emerald-500/70">Family</span> {gbifData.family}</>}
            </div>
          </div>
        )}

        <div className="p-6 space-y-8 overflow-y-auto no-scrollbar flex-1">
          
          {/* GBIF Scientific Context Card */}
          {(entity.type === 'ORGANISM' || entity.type === 'PLANT') && (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2 opacity-10">
                 <Globe2 className="w-24 h-24" />
               </div>
               
               <div className="flex items-center gap-2 mb-3">
                 <Globe2 className="w-4 h-4 text-emerald-400" />
                 <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400">Scientific Context</h3>
               </div>

               {loadingGbif ? (
                 <div className="flex items-center gap-2 text-slate-500 text-sm">
                   <Loader2 className="w-4 h-4 animate-spin" /> Verifying with GBIF...
                 </div>
               ) : gbifData ? (
                 <div className="space-y-2 relative z-10">
                   <div className="flex justify-between items-start">
                      <div>
                        <div className="text-lg font-serif italic text-white">{gbifData.scientificName}</div>
                        <div className="text-xs text-slate-400">Family: {gbifData.family} • Kingdom: {gbifData.kingdom}</div>
                      </div>
                      {gbifData.matchType === 'EXACT' && (
                        <div className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded-full" title="Exact Scientific Match">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                      {gbifData.matchType === 'FUZZY' && (
                        <div className="bg-amber-500/20 text-amber-400 p-1.5 rounded-full" title="Fuzzy Match (Approximate)">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                      )}
                   </div>
                   <div className="text-[10px] text-slate-600 pt-2 border-t border-slate-700/50">
                     Source: Global Biodiversity Information Facility
                   </div>
                 </div>
               ) : (
                 <div className="text-sm text-slate-500 italic">No scientific match found in global database.</div>
               )}

               {/* Visual Gauges */}
               <div className="mt-4 pt-4 border-t border-slate-700/50">
                 {renderTraitGauges()}
               </div>
            </div>
          )}

          {entity.aweInspiringFacts && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Awe-Inspiring Facts</h3>
              </div>
              <div className="space-y-3">
                {entity.aweInspiringFacts.map((fact, index) => (
                  <div key={index} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                    <p className="text-sm text-slate-300 italic">"{fact.fact}"</p>
                    <p className="text-xs text-slate-500 text-right mt-2">- {fact.source}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Growth & Observations Section */}
          {(entity.type === 'ORGANISM' || entity.type === 'PLANT' || entity.type === 'COLONY') && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Vital Metrics</h3>
                </div>
                {metrics.length > 1 && (
                  <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-[200px]">
                    {metrics.map(m => (
                      <button
                        key={m}
                        onClick={() => setActiveMetric(m)}
                        className={`text-[9px] px-2 py-0.5 rounded-full border transition-all whitespace-nowrap ${
                          activeMetric === m 
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                            : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <GrowthChart 
                data={chartData} 
                title={activeMetric ? `${activeMetric} History` : 'No Data'} 
                accentColor={activeMetric === 'temp' ? '#f59e0b' : activeMetric === 'pH' ? '#3b82f6' : '#10b981'}
              />
              
              {/* Log Observation Mini-Form */}
              <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Log New Capture</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={obsLabel}
                        onChange={(e) => setObsLabel(e.target.value)}
                        placeholder="Label (pH, growth...)"
                        className="flex-1 bg-black/40 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                      />
                      <input
                        type="text"
                        value={obsUnit}
                        onChange={(e) => setObsUnit(e.target.value)}
                        placeholder="unit"
                        className="w-16 bg-black/40 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <input
                      type="number"
                      value={obsValue}
                      onChange={(e) => setObsValue(e.target.value)}
                      placeholder="Numerical Value"
                      className="w-full bg-black/40 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                      onKeyDown={(e) => e.key === 'Enter' && logObservation()}
                    />
                  </div>
                  <button
                    onClick={logObservation}
                    className="aspect-square w-12 flex items-center justify-center bg-emerald-600 rounded-2xl text-white hover:bg-emerald-500 transition-colors"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Observation Timeline (Vertical) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Timeline</h3>
                </div>
                <div className="relative pl-4 space-y-6 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {observations.slice().sort((a,b) => b.timestamp - a.timestamp).map((obs, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-900 border-2 border-slate-700" />
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-white capitalize">{obs.label}</p>
                          <p className="text-[10px] text-slate-500">{new Date(obs.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                          {obs.value}{obs.unit}
                        </div>
                      </div>
                    </div>
                  ))}
                  {observations.length === 0 && (
                    <p className="text-xs text-slate-600 italic">No timeline events yet.</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Alias Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Custom Aliases</h3>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {entity.aliases.map(a => (
                <span key={a} className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 border border-slate-700">
                  {a}
                  <button onClick={() => removeAlias(a)} className="hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {entity.aliases.length === 0 && <p className="text-xs text-slate-600 italic">No aliases set.</p>}
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                placeholder="Add new alias..."
                className="flex-1 bg-black/40 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                onKeyDown={(e) => e.key === 'Enter' && addAlias()}
              />
              <button 
                onClick={addAlias}
                className="p-2 bg-emerald-600 rounded-xl text-white hover:bg-emerald-500 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </section>

          {/* Group Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FolderOpen className="w-4 h-4 text-cyan-500" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Assign Group</h3>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => setGroup(undefined)}
                className={`p-3 rounded-xl text-left text-sm flex justify-between items-center border transition-all ${
                  !entity.group_id ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' : 'bg-slate-800/50 border-slate-800 text-slate-400'
                }`}
              >
                No Group
                {!entity.group_id && <div className="w-2 h-2 rounded-full bg-cyan-500" />}
              </button>
              
              {groups.map(g => (
                <button 
                  key={g.id}
                  onClick={() => setGroup(g.id)}
                  className={`p-3 rounded-xl text-left text-sm flex justify-between items-center border transition-all ${
                    entity.group_id === g.id ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' : 'bg-slate-800/50 border-slate-800 text-slate-400'
                  }`}
                >
                  {g.name}
                  {entity.group_id === g.id && <div className="w-2 h-2 rounded-full bg-cyan-500" />}
                </button>
              ))}

              {isCreatingGroup ? (
                <div className="mt-4 space-y-2">
                  <input 
                    autoFocus
                    type="text" 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Group name (e.g. 'Basement')"
                    className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setIsCreatingGroup(false)} className="flex-1 py-2 text-xs text-slate-500">Cancel</button>
                    <button onClick={handleCreateGroup} className="flex-1 py-2 bg-cyan-600 rounded-lg text-white text-xs font-bold">Create & Assign</button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setIsCreatingGroup(true)}
                  className="mt-2 p-3 rounded-xl border border-dashed border-slate-700 text-slate-500 text-sm flex items-center justify-center gap-2 hover:border-slate-500 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create New Group
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
