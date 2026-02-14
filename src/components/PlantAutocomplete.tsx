
import React, { useState, useEffect, useRef } from 'react';
import { plantService, PlantData } from '../../services/plantService';

interface PlantAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelect?: (plant: PlantData) => void;
    placeholder?: string;
    className?: string;
}

export const PlantAutocomplete: React.FC<PlantAutocompleteProps> = ({ 
    value, 
    onChange, 
    onSelect, 
    placeholder = "Type a plant name...",
    className = ""
}) => {
    const [suggestions, setSuggestions] = useState<PlantData[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value.length > 1 && showSuggestions) {
            // Find matches
            const matches = plantService.searchMany(value);
            setSuggestions(matches);
        } else {
            setSuggestions([]);
        }
    }, [value, showSuggestions]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (plant: PlantData) => {
        onChange(plant.name);
        if (onSelect) onSelect(plant);
        setShowSuggestions(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        onChange(newVal);
        setShowSuggestions(true);
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <input
                type="text"
                value={value}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(true)}
                placeholder={placeholder}
                className="w-full bg-slate-800 border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            
            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((plant) => (
                        <li 
                            key={plant.id}
                            onClick={() => handleSelect(plant)}
                            className="px-3 py-2 cursor-pointer hover:bg-slate-700 text-sm transition-colors border-b border-slate-700/50 last:border-0"
                        >
                            <div className="font-medium text-emerald-400">{plant.name}</div>
                            {plant.scientificName && (
                                <div className="text-xs text-slate-400 italic">{plant.scientificName}</div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
