
import React from 'react';
import { Entity, EntityType, EntityGroup } from '../types';
import { Waves, Flower2, Bug, Package, ChevronRight, Settings2, Search } from 'lucide-react';
import { useConservatory } from '../services/store';

interface EntityListProps {
  entities: Entity[];
  groups: EntityGroup[];
  activeHabitatId: string | null;
  onSetActiveHabitat: (id: string | null) => void;
  onEditEntity: (entity: Entity) => void;
}

export const EntityList: React.FC<EntityListProps> = ({ 
  entities, groups, activeHabitatId, onSetActiveHabitat, onEditEntity 
}) => {
  const { deepResearchHabitat } = useConservatory();
  const getIcon = (type: EntityType) => {
    switch (type) {
      case EntityType.HABITAT: return <Waves className="w-5 h-5 text-cyan-400" />;
      case EntityType.PLANT:
      case EntityType.PLANT_GROUP: return <Flower2 className="w-5 h-5 text-emerald-400" />;
      case EntityType.ORGANISM:
      case EntityType.COLONY: return <Bug className="w-5 h-5 text-amber-400" />;
      default: return <Package className="w-5 h-5 text-slate-400" />;
    }
  };

  const renderEntityCard = (e: Entity) => {
    const isActive = e.id === activeHabitatId;
    const isHabitat = e.type === EntityType.HABITAT;

    return (
      <button 
        key={e.id} 
        onClick={() => {
          if (isHabitat) {
            onSetActiveHabitat(isActive ? null : e.id);
          } else {
            onEditEntity(e);
          }
        }}
        className={`
          border p-3 rounded-xl transition-all text-left relative group
          ${isActive 
            ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/50' 
            : 'bg-slate-900/40 border-slate-800 hover:bg-slate-900'}
        `}
      >
        <div className="flex justify-between items-start mb-2">
          {getIcon(e.type)}
          <div className="flex gap-1">
            {isHabitat && isActive && (
               <div className="flex gap-1 items-center">
                 <div className="bg-cyan-500 text-[8px] font-bold text-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter animate-pulse">
                   Active
                 </div>
                 {entities.some(ent => ent.habitat_id === e.id && ent.enrichment_status === 'queued') && (
                   <button
                     onClick={(evt) => {
                       evt.stopPropagation();
                       deepResearchHabitat(e.id);
                     }}
                     className="bg-emerald-600 hover:bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase flex items-center gap-0.5 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                     title="Research new residents"
                     data-testid="research-habitat-btn"
                   >
                     <Search className="w-2 h-2" /> Research
                   </button>
                 )}
               </div>
            )}
            {e.quantity !== undefined && (
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">
                x{e.quantity}
              </span>
            )}
            <Settings2 className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <h4 className="text-sm font-medium text-slate-200 truncate pr-4">{e.name}</h4>
        <div className="flex items-center gap-1 mt-1">
          <p className="text-[10px] text-slate-500 truncate flex-1">
            {e.type === EntityType.HABITAT 
              ? (entities.filter(ent => ent.habitat_id === e.id).length + " residents") 
              : (entities.find(h => h.id === e.habitat_id)?.name || "Roaming")}
          </p>
          {e.aliases.length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" title="Has custom aliases" />
          )}
        </div>
      </button>
    );
  };

  // Group entities by their group_id
  const entitiesByGroup = groups.reduce((acc, g) => {
    acc[g.id] = entities.filter(e => e.group_id === g.id);
    return acc;
  }, {} as Record<string, Entity[]>);

  const ungroupedEntities = entities.filter(e => !e.group_id);

  return (
    <div className="space-y-10 pb-20">
      {/* Grouped View */}
      {groups.map(g => (
        entitiesByGroup[g.id]?.length > 0 && (
          <div key={`${g.id}-${entitiesByGroup[g.id].length}`} className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-500/80">{g.name}</h3>
              <div className="flex-1 h-px bg-cyan-500/10" />
              <span className="text-[10px] font-mono text-slate-600">{entitiesByGroup[g.id].length}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {entitiesByGroup[g.id].map(renderEntityCard)}
            </div>
          </div>
        )
      ))}

      {/* Ungrouped View */}
      {ungroupedEntities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-600">Ungrouped</h3>
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[10px] font-mono text-slate-600">{ungroupedEntities.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {ungroupedEntities.map(renderEntityCard)}
          </div>
        </div>
      )}

      {entities.length === 0 && (
        <div className="py-20 text-center text-slate-600 italic">
          Collection is empty. Record your first organism.
        </div>
      )}
    </div>
  );
};
