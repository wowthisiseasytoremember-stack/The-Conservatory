import React, { useState } from 'react';
import { useConservatory } from '../../services/store/rootStore';
import { useConservatoryStore } from '../../services/store/useConservatoryStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Loader2, Search, FlaskConical, Beaker, Sprout } from 'lucide-react';
import { logger } from '../../services/logger';
import { db, doc, writeBatch } from '../../services/firebase';
import { v4 as uuidv4 } from 'uuid';
import { EntityType } from '../../types';

export const PlaygroundScreen: React.FC = () => {
  const { entities } = useConservatory();
  const { processVoiceInput, enrichEntity } = useConservatoryStore();
  const [voiceText, setVoiceText] = useState('');
  
  // Enrichment Debugger State
  const [debugEntityName, setDebugEntityName] = useState('');
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugResult, setDebugResult] = useState<any>(null);
  const [seeding, setSeeding] = useState(false);

  const handleVoiceTest = async () => {
    logger.info({ text: voiceText }, "Testing voice input in playground");
    await processVoiceInput(voiceText, entities);
  };

  const handleEnrichmentDebug = async () => {
    setDebugLoading(true);
    try {
      // Create a temporary entity ID for debugging
      const tempId = 'debug-' + Date.now();
      // The store expects an entity to exist in query cache for enrichment
      // For debugging, we might need a more direct way or just use a real one
      const result = await enrichEntity(tempId); 
      setDebugResult(result);
    } catch (e: any) {
      setDebugResult({ error: e.message });
    } finally {
      setDebugLoading(false);
    }
  };

  const handleSeedCollection = async () => {
    setSeeding(true);
    try {
      const batch = writeBatch(db);
      
      const habitats = [
        { id: 'hab-amazon-001', name: "Amazonian Blackwater Basin", type: EntityType.HABITAT, traits: [{ type: 'AQUATIC', parameters: { pH: 5.5, temp: 82, salinity: 'fresh' } }], overflow: { narrative: "A dark, tannin-rich sanctuary mimicking the Rio Negro." }, created_at: Date.now(), updated_at: Date.now() },
        { id: 'hab-dutch-002', name: "Emerald Dutch Garden", type: EntityType.HABITAT, traits: [{ type: 'AQUATIC', parameters: { pH: 6.8, temp: 75, salinity: 'fresh', co2: true } }], overflow: { narrative: "A high-tech precision aquascape focusing on vibrant plant contrasts." }, created_at: Date.now(), updated_at: Date.now() },
        { id: 'hab-monsoon-003', name: "Monsoon Terrarium", type: EntityType.HABITAT, traits: [{ type: 'TERRESTRIAL', parameters: { humidity: 85, temp: 78 } }], overflow: { narrative: "A vertical slice of a tropical cloud forest." }, created_at: Date.now(), updated_at: Date.now() }
      ];

      const organisms = [
        { name: "Cardinal Tetra", scientificName: "Paracheirodon axelrodi", hab: 'hab-amazon-001', type: EntityType.ORGANISM, qty: 30 },
        { name: "Apistogramma Agassizii", scientificName: "Apistogramma agassizii", hab: 'hab-amazon-001', type: EntityType.ORGANISM, qty: 2 },
        { name: "Amazon Frogbit", scientificName: "Limnobium laevigatum", hab: 'hab-amazon-001', type: EntityType.PLANT, qty: 15 },
        { name: "Rotala rotundifolia 'Hra'", scientificName: "Rotala rotundifolia", hab: 'hab-dutch-002', type: EntityType.PLANT, qty: 50 },
        { name: "Amano Shrimp", scientificName: "Caridina multidentata", hab: 'hab-dutch-002', type: EntityType.ORGANISM, qty: 12 },
        { name: "Dart Frog 'Blue'", scientificName: "Dendrobates tinctorius", hab: 'hab-monsoon-003', type: EntityType.ORGANISM, qty: 4 },
        { name: "Java Moss", scientificName: "Taxiphyllum barbieri", hab: 'hab-monsoon-003', type: EntityType.PLANT, qty: 10 },
        { name: "Bucephalandra 'Kedagang'", scientificName: "Bucephalandra sp.", hab: 'hab-dutch-002', type: EntityType.PLANT, qty: 12 },
        { name: "Vampire Crab", scientificName: "Geosesarma dennerle", hab: 'hab-monsoon-003', type: EntityType.ORGANISM, qty: 6 }
      ];

      habitats.forEach(h => batch.set(doc(db, 'entities', h.id), h));
      organisms.forEach(o => {
        const id = uuidv4();
        batch.set(doc(db, 'entities', id), { ...o, id, habitat_id: o.hab, traits: [], aliases: [], enrichment_status: 'queued', created_at: Date.now(), updated_at: Date.now(), confidence: 1 });
      });

      await batch.commit();
      alert("Database seeded successfully!");
    } catch (e: any) {
      alert("Seeding failed: " + e.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto pb-24">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">The Conservatory Playground</h1>
          <p className="text-slate-400">System test harnesses and AI debugging.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleSeedCollection} 
          disabled={seeding}
          className="border-gold/30 text-gold hover:bg-gold/10"
        >
          {seeding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sprout className="w-4 h-4 mr-2" />}
          Seed Curator Gallery
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrichment Debugger (Proof of Life) */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl lg:col-span-2 overflow-hidden">
          <div className="h-1 w-full bg-linear-to-r from-cyan-500 via-blue-500 to-purple-500" />
          <CardHeader>
            <CardTitle className="text-blue-400 flex items-center gap-2">
              <FlaskConical className="w-5 h-5" /> Enrichment Pipeline Debugger
            </CardTitle>
            <CardDescription>Verify the Waterfall + Perplexity + Gemini flow for any species.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-3">
              <Input 
                value={debugEntityName} 
                onChange={(e) => setDebugEntityName(e.target.value)}
                placeholder="Enter species name (e.g. 'Bucephalandra Kishii')"
                className="bg-black/40 border-slate-700"
              />
              <Button 
                onClick={handleEnrichmentDebug} 
                disabled={debugLoading || !debugEntityName}
                className="bg-blue-600 hover:bg-blue-500 min-w-[140px]"
              >
                {debugLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Beaker className="w-4 h-4 mr-2" />}
                Run Research
              </Button>
            </div>

            {debugResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Pipeline Result</h4>
                  <div className="bg-black/40 rounded-xl p-4 font-mono text-[10px] text-blue-300 h-[300px] overflow-y-auto border border-slate-800">
                    <pre>{JSON.stringify(debugResult, null, 2)}</pre>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Museum Preview</h4>
                  <div className="bg-slate-950 rounded-xl p-6 border border-gold/20 h-[300px] overflow-y-auto">
                    {debugResult.error ? (
                      <div className="text-red-400 text-sm">{debugResult.error}</div>
                    ) : (
                      <div className="space-y-4">
                        <h2 className="text-2xl font-serif italic text-white">{debugEntityName}</h2>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-[10px] border-gold/30 text-gold">{debugResult.source}</Badge>
                          <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">
                            {Math.round((debugResult.confidence || 0) * 100)}% Confidence
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed font-body italic">
                          {debugResult.description}
                        </p>
                        {debugResult.biologicalStory && (
                          <div className="pt-4 border-t border-slate-800">
                            <h5 className="text-[10px] font-bold uppercase text-gold mb-2">The Biological Story</h5>
                            <p className="text-xs text-slate-400 leading-relaxed">{debugResult.biologicalStory}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Voice Parser Tester */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl">
          <CardHeader>
            <CardTitle className="text-emerald-400 flex items-center gap-2">
              <Search className="w-5 h-5" /> Voice Command Tester
            </CardTitle>
            <CardDescription>Test how Gemini parses your natural language commands.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              value={voiceText} 
              onChange={(e) => setVoiceText(e.target.value)}
              placeholder="e.g., 'Add 3 neon tetras to the basement tank'"
              className="bg-black/20 border-slate-700"
            />
            <Button onClick={handleVoiceTest} className="w-full bg-emerald-600 hover:bg-emerald-500">
              Parse Command
            </Button>
          </CardContent>
        </Card>

        {/* System State Inspector */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl">
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <FlaskConical className="w-5 h-5" /> System State
            </CardTitle>
            <CardDescription>Current internal entities and groups.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-black/30 rounded-lg p-4 font-mono text-xs text-slate-300 max-h-48 overflow-y-auto">
              <pre>{JSON.stringify({ entityCount: entities.length, entities: entities.slice(0, 3) }, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
