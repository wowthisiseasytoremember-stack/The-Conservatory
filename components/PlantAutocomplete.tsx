import React, { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { plantService } from '../services/plantService';
import { logger } from '../services/logger';
import { Loader2, Leaf, Search } from 'lucide-react';

interface PlantAutocompleteProps {
    onSelect: (plant: any) => void;
    placeholder?: string;
    className?: string;
}

export const PlantAutocomplete: React.FC<PlantAutocompleteProps> = ({ 
    onSelect, 
    placeholder = "Search species library...",
    className = "" 
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const searchResults = await plantService.search(query);
                setResults(searchResults);
                setIsOpen(true);
            } catch (err) {
                logger.error({ err }, "Plant search failed");
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <div className="relative">
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    placeholder={placeholder}
                    className="pl-10 bg-slate-900/50 border-slate-800 focus:border-emerald-500/50 transition-all"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 animate-spin" />}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute z-[110] w-full mt-2 py-2 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {results.map((plant) => (
                        <button
                            key={plant.id || plant.scientificName}
                            onClick={() => {
                                onSelect(plant);
                                setQuery('');
                                setIsOpen(false);
                            }}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-emerald-500/10 text-left transition-colors group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:border-emerald-500/30">
                                <Leaf className="w-4 h-4 text-emerald-500/70" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-white">{plant.commonName || plant.name}</div>
                                <div className="text-[10px] text-slate-500 italic font-mono uppercase tracking-tighter">{plant.scientificName}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
