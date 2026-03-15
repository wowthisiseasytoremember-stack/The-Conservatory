import React, { useState } from 'react';
import { Search, Loader2, Sparkles } from 'lucide-react';
import { useConservatoryStore } from '../services/store/useConservatoryStore';
import { Button } from './ui/button';

export const AccessionInput = () => {
  const [query, setQuery] = useState('');
  const { processVoiceInput, pendingAction } = useConservatoryStore();
  const isAnalyzing = pendingAction?.status === 'ANALYZING';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    // We repurpose the voice input parser to handle text "Add Anubias nana"
    const command = query.toLowerCase().startsWith('add') ? query : `Add ${query}`;
    processVoiceInput(command, []);
    setQuery('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden p-2">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Curate a specimen (e.g., 'Anubias nana Pinto')..."
              className="w-full bg-transparent border-none focus:ring-0 text-foreground placeholder:text-muted-foreground pl-12 pr-4 py-4 font-body text-lg italic outline-none"
              disabled={isAnalyzing}
            />
          </div>
          <Button
            type="submit"
            disabled={isAnalyzing || !query.trim()}
            className="bg-botanical hover:bg-botanical-light text-primary-foreground px-6 py-6 rounded-xl font-bold tracking-widest uppercase text-xs"
          >
            {isAnalyzing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Accession
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
