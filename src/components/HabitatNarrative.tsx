
import React, { useState, useEffect } from 'react';
import { geminiService } from '../../services/geminiService';
import { DiscoveryHighlight } from './DiscoveryHighlight';

interface HabitatNarrativeProps {
    habitatId: string;
    store: any; // ConservatoryStore instance
    className?: string;
}

interface NarrativeData {
    webOfLife: string;
    biomicStory: string;
    evolutionaryTension: string;
}

export const HabitatNarrative: React.FC<HabitatNarrativeProps> = ({ habitatId, store, className = "" }) => {
    const [narrative, setNarrative] = useState<NarrativeData | null>(null);
    const [loading, setLoading] = useState(false);
    const [inhabitants, setInhabitants] = useState<any[]>([]);

    useEffect(() => {
        if (!habitatId) return;
        const controller = new AbortController();

        const loadNarrative = async () => {
            setLoading(true);
            try {
                const snapshot = await store.generateHabitatSnapshot(habitatId);
                if (snapshot && !controller.signal.aborted) {
                    setInhabitants(snapshot.inhabitants);
                    const data = await geminiService.getEcosystemNarrative(snapshot);
                    if (!controller.signal.aborted) {
                        setNarrative(data);
                    }
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error("Failed to generate ecosystem narrative:", err);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        loadNarrative();
        return () => controller.abort();
    }, [habitatId, store]);

    // Helper to wrap species names in DiscoveryHighlight breadcrumbs
    const renderWithBreadcrumbs = (text: string) => {
        if (!text) return null;
        
        let parts: (string | JSX.Element)[] = [text];

        inhabitants.forEach(organism => {
            const newParts: (string | JSX.Element)[] = [];
            const name = organism.name;
            const regex = new RegExp(`(${name})`, 'gi');

            parts.forEach(part => {
                if (typeof part === 'string') {
                    const subParts = part.split(regex);
                    subParts.forEach(sub => {
                        if (sub.toLowerCase() === name.toLowerCase()) {
                            newParts.push(
                                <DiscoveryHighlight 
                                    key={`${organism.id}-${Math.random()}`}
                                    speciesName={organism.name}
                                    initialData={organism.discovery}
                                    className="mx-1"
                                >
                                    {sub}
                                </DiscoveryHighlight>
                            );
                        } else if (sub) {
                            newParts.push(sub);
                        }
                    });
                } else {
                    newParts.push(part);
                }
            });
            parts = newParts;
        });

        return <>{parts}</>;
    };

    if (loading) {
        return (
            <div className={`p-8 rounded-3xl bg-slate-900/40 border border-slate-800 animate-pulse ${className}`}>
                <div className="h-4 bg-slate-800 rounded w-1/4 mb-6"></div>
                <div className="space-y-3">
                    <div className="h-3 bg-slate-800 rounded w-full"></div>
                    <div className="h-3 bg-slate-800 rounded w-5/6"></div>
                    <div className="h-3 bg-slate-800 rounded w-4/6"></div>
                </div>
            </div>
        );
    }

    if (!narrative) return null;

    return (
        <div className={`relative p-8 rounded-3xl bg-gradient-to-b from-slate-900/60 to-slate-950/80 border border-white/5 backdrop-blur-3xl shadow-3xl ${className}`}>
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-xl font-medium text-white tracking-tight">Ecosystem Narrative</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Holistic Synthesis</p>
                </div>
            </div>

            <div className="space-y-10">
                <section>
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500/80 mb-3 ml-1">The Web of Life</h4>
                    <div className="text-lg text-slate-200 leading-relaxed font-light">
                        {renderWithBreadcrumbs(narrative.webOfLife)}
                    </div>
                </section>

                <section>
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400/80 mb-3 ml-1">Biomic Story</h4>
                    <div className="text-slate-300 leading-relaxed font-light italic border-l-2 border-indigo-500/20 pl-6">
                        {renderWithBreadcrumbs(narrative.biomicStory)}
                    </div>
                </section>

                <section>
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500/80 mb-3 ml-1">Evolutionary Tension</h4>
                    <div className="text-sm text-slate-400 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                        {renderWithBreadcrumbs(narrative.evolutionaryTension)}
                    </div>
                </section>
            </div>
            
            {/* Ambient decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg className="w-24 h-24" viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" />
                    <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="0.5" />
                </svg>
            </div>
        </div>
    );
};
