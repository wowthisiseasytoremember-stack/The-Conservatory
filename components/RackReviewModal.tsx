
import React, { useState } from 'react';
import { RackContainer, EntityType } from '../types';
import { X, Check, Layers, ArrowRight } from 'lucide-react';

interface RackReviewModalProps {
  containers: RackContainer[];
  onConfirm: (finalContainers: RackContainer[]) => void;
  onClose: () => void;
}

export const RackReviewModal: React.FC<RackReviewModalProps> = ({ containers, onConfirm, onClose }) => {
  const [items, setItems] = useState(containers.map(c => ({ ...c, selected: true })));

  const toggleItem = (index: number) => {
    const newItems = [...items];
    newItems[index].selected = !newItems[index].selected;
    setItems(newItems);
  };

  const handleUpdate = (index: number, updates: Partial<RackContainer>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    setItems(newItems);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-md flex flex-col p-6 overflow-y-auto" style={{ zIndex: 80 }}>
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h2 className="text-2xl font-serif font-bold text-white">Rack Detected</h2>
          <p className="text-slate-400 text-sm">Review detected habitats before logging.</p>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4 mb-24">
        {items.map((item, i) => (
          <div 
            key={i}
            className={`bg-slate-900 border transition-all rounded-2xl p-4 ${
              item.selected ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-800 opacity-60'
            }`}
          >
            <div className="flex gap-4">
              <button 
                onClick={() => toggleItem(i)}
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                  item.selected ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-700 text-slate-700'
                }`}
              >
                {item.selected && <Check className="w-5 h-5" />}
              </button>
              
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-start">
                  <input 
                    className="bg-transparent border-b border-transparent focus:border-emerald-500/50 text-white font-medium outline-none text-lg w-full"
                    defaultValue={`${item.size_estimate} ${item.shelf_level} ${item.horizontal_position}`}
                    onChange={(e) => handleUpdate(i, { size_estimate: e.target.value })}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] bg-slate-800 px-2 py-1 rounded-md text-slate-400 uppercase tracking-tighter">
                    {item.shelf_level} shelf
                  </span>
                  <span className="text-[10px] bg-slate-800 px-2 py-1 rounded-md text-slate-400 uppercase tracking-tighter">
                    {item.horizontal_position}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Layers className="w-3 h-3" />
                  <span>{item.primary_species.map(s => s.common_name).join(', ') || 'Unknown species'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-8 left-6 right-6 flex gap-4 max-w-2xl mx-auto">
        <button 
          onClick={onClose}
          className="flex-1 py-4 bg-slate-800 rounded-2xl text-slate-300 font-bold"
        >
          Discard All
        </button>
        <button 
          onClick={() => onConfirm(items.filter(i => i.selected))}
          className="flex-2 py-4 bg-emerald-500 rounded-2xl text-white font-bold flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20"
        >
          Confirm & Log Events <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
