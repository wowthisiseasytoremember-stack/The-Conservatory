import React from 'react';
import { Habitat } from '../types';
import { X } from 'lucide-react';

interface AssignHabitatModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitats: Habitat[];
  onAssign: (habitatId: string) => void;
}

export const AssignHabitatModal: React.FC<AssignHabitatModalProps> = ({
  isOpen, onClose, habitats, onAssign
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 w-full max-w-md border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-black/20">
          <h2 className="text-xl font-serif font-bold text-white">Assign Habitat</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 space-y-2 overflow-y-auto flex-1">
          {habitats.length === 0 ? (
            <p className="text-slate-400">No habitats found. Create one first!</p>
          ) : (
            habitats.map(habitat => (
              <button
                key={habitat.id}
                onClick={() => onAssign(habitat.id)}
                className="w-full text-left p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-colors text-white"
              >
                {habitat.name}
              </button>
            ))
          )}
        </div>
        <div className="p-4 border-t border-slate-800 bg-black/20">
          <button onClick={onClose} className="w-full py-2 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
