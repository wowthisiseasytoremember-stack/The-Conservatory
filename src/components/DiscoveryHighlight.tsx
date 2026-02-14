
import React, { useState } from 'react';
import { geminiService } from '../../services/geminiService';

interface DiscoveryHighlightProps {
    speciesName: string;
    label?: string; // The specific trait or term being highlighted
    initialData?: {
        mechanism: string;
        evolutionaryAdvantage: string;
        synergyNote: string;
    };
    children: React.ReactNode;
    className?: string;
}

export const DiscoveryHighlight: React.FC<DiscoveryHighlightProps> = ({ 
    speciesName, 
    label,
    initialData, 
    children,
    className = "" 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState(initialData || null);
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setIsOpen(!isOpen);
        if (!data && !loading && speciesName) {
            setLoading(true);
            try {
                const result = await geminiService.getBiologicalDiscovery(speciesName);
                setData(result);
            } catch (err) {
                console.error("Discovery failed:", err);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className={`relative inline-block ${className}`}>
            <div 
                onClick={handleClick}
                className="cursor-help relative group"
            >
                {/* Subtle Pulse Effect */}
                <div className="absolute -inset-1 bg-emerald-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                
                <div className="relative border-b border-dotted border-emerald-500/40 group-hover:border-emerald-400 transition-colors">
                    {children}
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-[100] mt-2 w-72 p-4 rounded-xl bg-slate-900/95 border border-slate-700/50 backdrop-blur-md shadow-2xl animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                            Discovery Insight {label ? `• ${label}` : ''}
                        </span>
                        <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white text-xs">✕</button>
                    </div>

                    {loading ? (
                        <div className="space-y-2 animate-pulse">
                            <div className="h-3 bg-slate-800 rounded w-full"></div>
                            <div className="h-3 bg-slate-800 rounded w-2/3"></div>
                        </div>
                    ) : data ? (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-bold text-slate-300 mb-1 uppercase tracking-tight">Biological Mechanism</h4>
                                <p className="text-sm text-slate-100 leading-relaxed font-light">{data.mechanism}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-300 mb-1 uppercase tracking-tight">Evolutionary Advantage</h4>
                                <p className="text-sm text-slate-100 leading-relaxed font-light italic">"{data.evolutionaryAdvantage}"</p>
                            </div>
                            {data.synergyNote && (
                                <div className="pt-2 border-t border-slate-800">
                                    <h4 className="text-xs font-bold text-emerald-400/80 mb-1 uppercase tracking-tight">Ecological Synergy</h4>
                                    <p className="text-xs text-emerald-100/70 leading-relaxed tracking-wide">{data.synergyNote}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 italic">No further data available.</p>
                    )}
                </div>
            )}
        </div>
    );
};
