
import React, { useState } from 'react';
import { useConservatory } from '../services/store';
import { geminiService } from '../services/geminiService';
import { Terminal, X, Zap, Database, Bot, Copy, Check, Loader2, Play, ShieldCheck, ShieldAlert, AlertTriangle, Plus, Leaf, Fish, FlaskConical, RefreshCw, Beaker } from 'lucide-react';
import { AdvisoryReport, EntityType } from '../types';

export const DevTools: React.FC = () => {
  const { 
    processVoiceInput, testConnection, entities, enrichEntity, commitPendingAction,
    deepResearchAll, getHabitatInhabitants, getEntityHabitat, getRelatedEntities,
    calculateGrowthRate, getGrowthTimeline, computeHabitatSynergies,
    getFeaturedSpecimen, getHabitatHealth, getEcosystemFacts
  } = useConservatory();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'scenarios' | 'actions' | 'contractor' | 'backend'>('scenarios');
  const [dbStatus, setDbStatus] = useState<'idle' | 'testing' | 'success' | 'fail'>('idle');
  const [dbError, setDbError] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<string[]>([]);
  
  // Advisory State
  const [intent, setIntent] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [report, setReport] = useState<AdvisoryReport | null>(null);
  const [copied, setCopied] = useState(false);

  const habitats = entities.filter(e => e.type === EntityType.HABITAT);
  const organisms = entities.filter(e => e.type !== EntityType.HABITAT);

  const log = (msg: string) => {
    setActionLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));
  };

  const handleTestConnection = async () => {
    setDbStatus('testing');
    setDbError(null);
    const result = await testConnection();
    setDbStatus(result.success ? 'success' : 'fail');
    if (!result.success && result.error) setDbError(result.error);
    if (result.success) setTimeout(() => setDbStatus('idle'), 3000);
  };

  const handleAskAdvisor = async () => {
    if (!intent.trim()) return;
    setIsThinking(true);
    setReport(null);
    try {
        const result = await geminiService.getAdvisoryReport(intent);
        setReport(result);
    } catch (e) {
        console.error(e);
    } finally {
        setIsThinking(false);
    }
  };

  const handleCopyPrompt = () => {
    if (report) {
        navigator.clipboard.writeText(report.ide_prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  // === QUICK ACTION HANDLERS ===
  const handleQuickHabitat = () => {
    const names = ['The Shallows', 'Deep Blue', 'Moss Garden', 'Blackwater Creek', 'Reef Edge', 'Nano Cube'];
    const name = names[Math.floor(Math.random() * names.length)] + ` ${Date.now().toString(36).slice(-4)}`;
    const types = ['Freshwater', 'Saltwater', 'Brackish'];
    const type = types[Math.floor(Math.random() * types.length)];
    const size = [10, 20, 29, 40, 55, 75][Math.floor(Math.random() * 6)];
    processVoiceInput(`Create a ${size} gallon ${type.toLowerCase()} tank called ${name}.`);
    log(`🏠 Creating habitat: ${name} (${size}gal ${type})`);
  };

  const handleQuickOrganism = () => {
    if (habitats.length === 0) {
      log('⚠️ No habitats exist. Create one first!');
      return;
    }
    const targetHab = habitats[Math.floor(Math.random() * habitats.length)];
    const fauna = [
      { name: 'Neon Tetra', qty: Math.floor(Math.random() * 10) + 5 },
      { name: 'Cherry Shrimp', qty: Math.floor(Math.random() * 8) + 3 },
      { name: 'Amano Shrimp', qty: Math.floor(Math.random() * 5) + 2 },
      { name: 'Corydoras', qty: Math.floor(Math.random() * 4) + 2 },
      { name: 'Otocinclus', qty: Math.floor(Math.random() * 3) + 2 },
      { name: 'Betta', qty: 1 },
    ];
    const animal = fauna[Math.floor(Math.random() * fauna.length)];
    processVoiceInput(`I just added ${animal.qty} ${animal.name} to ${targetHab.name}.`);
    log(`🐟 Adding ${animal.qty}x ${animal.name} → ${targetHab.name}`);
  };

  const handleQuickPlant = () => {
    if (habitats.length === 0) {
      log('⚠️ No habitats exist. Create one first!');
      return;
    }
    const targetHab = habitats[Math.floor(Math.random() * habitats.length)];
    const plants = [
      'Java Fern', 'Anubias Nana', 'Java Moss', 'Dwarf Hairgrass', 
      'Amazon Sword', 'Rotala Rotundifolia', 'Bucephalandra', 'Monte Carlo'
    ];
    const plant = plants[Math.floor(Math.random() * plants.length)];
    const qty = Math.floor(Math.random() * 5) + 1;
    processVoiceInput(`I just planted ${qty} ${plant} in ${targetHab.name}.`);
    log(`🌿 Planting ${qty}x ${plant} → ${targetHab.name}`);
  };

  const handleQuickObservation = () => {
    if (habitats.length === 0) {
      log('⚠️ No habitats exist. Create one first!');
      return;
    }
    const targetHab = habitats[Math.floor(Math.random() * habitats.length)];
    const pH = (6.0 + Math.random() * 2).toFixed(1);
    const temp = Math.floor(74 + Math.random() * 8);
    processVoiceInput(`The pH in ${targetHab.name} is ${pH} and the temperature is ${temp} degrees.`);
    log(`📊 Logging pH=${pH}, temp=${temp}°F → ${targetHab.name}`);
  };

  const handleEnrichAll = async () => {
    const pending = organisms.filter(e => e.enrichment_status !== 'complete');
    if (pending.length === 0) {
      log('✅ All entities already enriched!');
      return;
    }
    log(`🔬 Initiating Deep Research pipeline for ${pending.length} entities...`);
    deepResearchAll();
  };

  const scenarios = [
    { label: "New Tank", cmd: "Create a 20 gallon freshwater tank in the living room called The Shallows.", icon: "🏠" },
    { label: "Log Fish", cmd: "I just added 12 Neon Tetras and 5 Cherry Shrimp to The Shallows.", icon: "🐟" },
    { label: "Log Parameters", cmd: "Log a water change for The Shallows. pH is 6.8 and temperature is 78 degrees.", icon: "📊" },
    { label: "Ambiguous", cmd: "Add 2 snails to the tank.", icon: "❓" }
  ];

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 bg-slate-800/50 p-2 rounded-full border border-slate-700 hover:bg-slate-700 hover:text-emerald-400 text-slate-500 transition-colors"
        title="Open Dev Tools"
        data-testid="devtools-fab"
      >
        <Terminal className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className={`fixed top-4 right-4 z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 animate-in slide-in-from-right-10 flex flex-col gap-3 transition-all duration-300 max-h-[85vh] overflow-hidden ${report ? 'w-[480px]' : 'w-80'}`}>
      {/* Header & Tabs */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
        <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg">
           <button 
             onClick={() => setActiveTab('scenarios')}
             className={`p-1.5 rounded-md transition-all ${activeTab === 'scenarios' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
             title="Test Scenarios"
           >
             <Zap className="w-4 h-4" />
           </button>
           <button 
             onClick={() => setActiveTab('actions')}
             className={`p-1.5 rounded-md transition-all ${activeTab === 'actions' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
             title="Quick Actions"
           >
             <Beaker className="w-4 h-4" />
           </button>
          <button 
            onClick={() => setActiveTab('contractor')}
            className={`p-1.5 rounded-md transition-all ${activeTab === 'contractor' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            title="Advisory Service"
          >
            <Bot className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setActiveTab('backend')}
            className={`p-1.5 rounded-md transition-all ${activeTab === 'backend' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            title="Backend Verification"
          >
            <Database className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-600 font-mono">{entities.length} entities</span>
          <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeTab === 'scenarios' ? (
        /* ============== SCENARIOS TAB ============== */
        <div className="space-y-4 overflow-y-auto custom-scrollbar">
             {/* DB Test Button */}
             <div className="space-y-2">
                 <button 
                   onClick={handleTestConnection}
                   className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                     dbStatus === 'idle' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' :
                     dbStatus === 'testing' ? 'bg-amber-500/20 text-amber-500 animate-pulse' :
                     dbStatus === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                     'bg-red-500/20 text-red-400'
                   }`}
                 >
                   <Database className="w-3 h-3" />
                   {dbStatus === 'idle' && "Test DB Connection"}
                   {dbStatus === 'testing' && "Verifying..."}
                   {dbStatus === 'success' && "Ping/Pong Verified"}
                   {dbStatus === 'fail' && "Connection Failed"}
                 </button>
                 {dbError && (
                     <div className="bg-red-950/30 border border-red-500/20 p-2 rounded text-[10px] text-red-300 flex gap-2 items-start">
                         <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                         <span className="break-words">{dbError}</span>
                     </div>
                 )}
             </div>

             {/* Scenario List */}
             <div className="space-y-2">
                {scenarios.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => processVoiceInput(s.cmd)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 border border-transparent text-xs text-slate-300 transition-all group"
                  >
                    <div className="font-bold mb-0.5">{s.icon} {s.label}</div>
                    <div className="text-[10px] text-slate-500 truncate group-hover:text-emerald-500/70">"{s.cmd}"</div>
                  </button>
                ))}
             </div>
        </div>

      ) : activeTab === 'actions' ? (
        /* ============== QUICK ACTIONS TAB ============== */
        <div className="space-y-3 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-right-4 duration-200">
          
          {/* Quick Add Buttons */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Quick Add</div>
            
            <button onClick={handleQuickHabitat} data-testid="devtools-add-habitat"
              className="w-full text-left px-3 py-2.5 rounded-lg bg-slate-800/50 hover:bg-cyan-500/10 hover:border-cyan-500/30 border border-transparent text-xs transition-all group flex items-center gap-2">
              <div className="bg-cyan-500/20 p-1.5 rounded-lg"><Plus className="w-3 h-3 text-cyan-400" /></div>
              <div>
                <div className="font-bold text-slate-200 group-hover:text-cyan-300">New Habitat</div>
                <div className="text-[10px] text-slate-500">Random name/size/type</div>
              </div>
            </button>

            <button onClick={handleQuickOrganism} data-testid="devtools-add-organism"
              className="w-full text-left px-3 py-2.5 rounded-lg bg-slate-800/50 hover:bg-orange-500/10 hover:border-orange-500/30 border border-transparent text-xs transition-all group flex items-center gap-2">
              <div className="bg-orange-500/20 p-1.5 rounded-lg"><Fish className="w-3 h-3 text-orange-400" /></div>
              <div>
                <div className="font-bold text-slate-200 group-hover:text-orange-300">Add Organism</div>
                <div className="text-[10px] text-slate-500">Random fauna → random habitat ({habitats.length} available)</div>
              </div>
            </button>

            <button onClick={handleQuickPlant} data-testid="devtools-add-plant"
              className="w-full text-left px-3 py-2.5 rounded-lg bg-slate-800/50 hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-transparent text-xs transition-all group flex items-center gap-2">
              <div className="bg-emerald-500/20 p-1.5 rounded-lg"><Leaf className="w-3 h-3 text-emerald-400" /></div>
              <div>
                <div className="font-bold text-slate-200 group-hover:text-emerald-300">Add Plant</div>
                <div className="text-[10px] text-slate-500">Random plant → random habitat ({habitats.length} available)</div>
              </div>
            </button>

            <button onClick={handleQuickObservation} data-testid="devtools-add-observation"
              className="w-full text-left px-3 py-2.5 rounded-lg bg-slate-800/50 hover:bg-purple-500/10 hover:border-purple-500/30 border border-transparent text-xs transition-all group flex items-center gap-2">
              <div className="bg-purple-500/20 p-1.5 rounded-lg"><FlaskConical className="w-3 h-3 text-purple-400" /></div>
              <div>
                <div className="font-bold text-slate-200 group-hover:text-purple-300">Log Observation</div>
                <div className="text-[10px] text-slate-500">Random pH/temp → random habitat</div>
              </div>
            </button>
          </div>

          {/* Enrichment */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Enrichment</div>
            <button onClick={handleEnrichAll} data-testid="devtools-enrich-all"
              className="w-full px-3 py-2.5 rounded-lg bg-slate-800/50 hover:bg-amber-500/10 hover:border-amber-500/30 border border-transparent text-xs transition-all group flex items-center gap-2">
              <div className="bg-amber-500/20 p-1.5 rounded-lg"><RefreshCw className="w-3 h-3 text-amber-400" /></div>
              <div className="text-left">
                <div className="font-bold text-slate-200 group-hover:text-amber-300">Enrich All Entities</div>
                <div className="text-[10px] text-slate-500">
                  {organisms.filter(e => e.enrichment_status !== 'complete').length} pending / {organisms.length} total
                </div>
              </div>
            </button>
          </div>

          {/* Live DB Summary */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Local DB</div>
            <div className="bg-black/40 rounded-lg p-2 text-[10px] font-mono text-slate-400 space-y-0.5">
              <div>🏠 Habitats: <span className="text-white">{habitats.length}</span></div>
              <div>🐟 Organisms: <span className="text-white">{organisms.filter(e => e.type === 'ORGANISM' as any).length}</span></div>
              <div>🌿 Plants: <span className="text-white">{organisms.filter(e => e.type === 'PLANT' as any).length}</span></div>
              <div>🦐 Colonies: <span className="text-white">{organisms.filter(e => e.type === 'COLONY' as any).length}</span></div>
              <div className="border-t border-slate-800 pt-1 mt-1">
                ✅ Enriched: <span className="text-emerald-400">{organisms.filter(e => e.enrichment_status === 'complete').length}</span>
                {' '}⏳ Pending: <span className="text-amber-400">{organisms.filter(e => e.enrichment_status !== 'complete').length}</span>
              </div>
            </div>
          </div>

          {/* Action Log */}
          {actionLog.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Action Log</div>
              <div className="bg-black/40 rounded-lg p-2 text-[10px] font-mono text-slate-500 space-y-0.5 max-h-32 overflow-y-auto">
                {actionLog.map((msg, i) => (
                  <div key={i} className={i === 0 ? 'text-emerald-400' : ''}>{msg}</div>
                ))}
              </div>
            </div>
          )}
        </div>

      ) : (
        /* ============== CONTRACTOR/ADVISORY TAB ============== */
        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300 overflow-y-auto custom-scrollbar">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <h4 className="text-emerald-400 font-bold text-xs flex items-center gap-2 mb-1">
                    <Bot className="w-3 h-3" /> Architectural Advisor
                </h4>
                <p className="text-[10px] text-emerald-500/70 leading-relaxed">
                   Consult on feature implementation. I analyze the intent against the current Entity/Event schema and return a safe implementation plan.
                </p>
            </div>

            <div className="space-y-2">
                <textarea 
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    placeholder="E.g., 'How do I add support for tracking fertilization schedules?'"
                    className="w-full bg-black/40 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none placeholder:text-slate-600 min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAskAdvisor();
                        }
                    }}
                />
                
                {!report && (
                    <button 
                        onClick={handleAskAdvisor}
                        disabled={isThinking || !intent.trim()}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors"
                    >
                        {isThinking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                        Generate Advisory Report
                    </button>
                )}
            </div>

            {report && (
                <div className="space-y-4 pt-2 border-t border-slate-800 animate-in slide-in-from-bottom-2">
                    
                    {/* Status Bar */}
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Report Status</span>
                        {report.persistence_status === 'SECURE' ? (
                            <div className="flex items-center gap-1 text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                <ShieldCheck className="w-3 h-3" /> Audit Log Secure
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                                <ShieldAlert className="w-3 h-3" /> Audit Log Failed
                            </div>
                        )}
                    </div>

                    {/* Strategy */}
                    <div className="space-y-1">
                        <h5 className="text-xs font-bold text-white">Strategy</h5>
                        <p className="text-xs text-slate-400 leading-relaxed bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                            {report.strategy}
                        </p>
                    </div>

                    {/* Impact Analysis */}
                    <div className="space-y-1">
                        <h5 className="text-xs font-bold text-amber-400">Impact Analysis</h5>
                        <p className="text-xs text-amber-500/80 leading-relaxed bg-amber-900/10 p-2 rounded-lg border border-amber-500/20">
                            {report.impact_analysis}
                        </p>
                    </div>

                    {/* Steps */}
                    <div className="space-y-1">
                        <h5 className="text-xs font-bold text-white">Implementation Steps</h5>
                        <ul className="text-xs text-slate-400 list-disc list-inside space-y-1 ml-1">
                            {report.implementation_steps.map((step, i) => (
                                <li key={i}>{step}</li>
                            ))}
                        </ul>
                    </div>

                    {/* IDE Prompt Action */}
                    <button 
                        onClick={handleCopyPrompt}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? "Prompt Copied!" : "Copy Master IDE Prompt"}
                    </button>
                    
                    <button 
                        onClick={() => { setReport(null); setIntent(''); }}
                        className="w-full py-2 text-xs text-slate-500 hover:text-white transition-colors"
                    >
                        Start New Query
                    </button>
                </div>
            )}
        </div>
      ) : (
        /* ============== BACKEND VERIFICATION TAB ============== */
        <div className="space-y-3 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
            <h4 className="text-cyan-400 font-bold text-xs flex items-center gap-2 mb-1">
              <Database className="w-3 h-3" /> Backend Verification
            </h4>
            <p className="text-[10px] text-cyan-500/70 leading-relaxed">
              Test the 5 critical backend fixes: relationships, growth tracking, synergies, voice observations, and feature manifest.
            </p>
          </div>

          {/* Entity Relationships */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">1. Entity Relationships</div>
            <button 
              onClick={() => {
                const habitat = habitats[0];
                if (!habitat) {
                  log('⚠️ No habitats found. Create one first!');
                  return;
                }
                const inhabitants = getHabitatInhabitants(habitat.id);
                log(`✅ getHabitatInhabitants(${habitat.name}): ${inhabitants.length} entities`);
                console.log('Inhabitants:', inhabitants);
                if (inhabitants.length > 0) {
                  const related = getRelatedEntities(inhabitants[0].id);
                  log(`✅ getRelatedEntities(${inhabitants[0].name}): habitat + ${related.tankmates.length} tankmates`);
                  console.log('Related:', related);
                  const entityHabitat = getEntityHabitat(inhabitants[0].id);
                  log(`✅ getEntityHabitat(${inhabitants[0].name}): ${entityHabitat?.name || 'null'}`);
                  console.log('Entity Habitat:', entityHabitat);
                }
              }}
              className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-cyan-500/10 hover:border-cyan-500/30 border border-transparent text-xs transition-all"
            >
              Test Relationships
            </button>
          </div>

          {/* Growth Tracking */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">2. Growth Tracking</div>
            <button 
              onClick={() => {
                const entity = organisms.find(e => e.observations?.length > 0);
                if (!entity) {
                  log('⚠️ No entities with observations found. Log some growth first!');
                  return;
                }
                const rate = calculateGrowthRate(entity.id, 'growth');
                log(`✅ calculateGrowthRate(${entity.name}): ${rate.rate?.toFixed(2)} ${rate.trend || 'N/A'}`);
                console.log('Growth Rate:', rate);
                const timeline = getGrowthTimeline(entity.id, 'growth');
                log(`✅ getGrowthTimeline(${entity.name}): ${timeline.length} data points`);
                console.log('Timeline:', timeline);
              }}
              className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-purple-500/10 hover:border-purple-500/30 border border-transparent text-xs transition-all"
            >
              Test Growth Tracking
            </button>
          </div>

          {/* Synergy Computation */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">3. Synergy Computation</div>
            <button 
              onClick={() => {
                const habitat = habitats[0];
                if (!habitat) {
                  log('⚠️ No habitats found.');
                  return;
                }
                const synergies = computeHabitatSynergies(habitat.id);
                log(`✅ computeHabitatSynergies(${habitat.name}): ${synergies.length} synergies`);
                console.log('Synergies:', synergies);
              }}
              className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-transparent text-xs transition-all"
            >
              Test Synergies
            </button>
          </div>

          {/* Voice Observation Logging */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">4. Voice Observation Logging</div>
            <button 
              onClick={() => {
                const habitat = habitats[0];
                if (!habitat) {
                  log('⚠️ No habitats found. Create one first!');
                  return;
                }
                processVoiceInput(`Log pH of 6.8 in ${habitat.name}`);
                log(`📝 Voice command sent: "Log pH of 6.8 in ${habitat.name}"`);
                log('→ Check ConfirmationCard, then confirm to test observation logging');
              }}
              className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-amber-500/10 hover:border-amber-500/30 border border-transparent text-xs transition-all"
            >
              Test Voice Observation
            </button>
          </div>

          {/* Feature Manifest Backend */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">5. Feature Manifest Backend</div>
            <button 
              onClick={() => {
                const featured = getFeaturedSpecimen();
                log(`✅ getFeaturedSpecimen(): ${featured?.name || 'null'}`);
                console.log('Featured Specimen:', featured);
                const habitat = habitats[0];
                if (habitat) {
                  const health = getHabitatHealth(habitat.id);
                  log(`✅ getHabitatHealth(${habitat.name}): ${health.score}/100`);
                  console.log('Habitat Health:', health);
                }
                const facts = getEcosystemFacts(5);
                log(`✅ getEcosystemFacts(5): ${facts.length} facts`);
                console.log('Ecosystem Facts:', facts);
              }}
              className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-violet-500/10 hover:border-violet-500/30 border border-transparent text-xs transition-all"
            >
              Test Feature Manifest
            </button>
          </div>

          {/* Results Log */}
          {actionLog.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Test Results</div>
              <div className="bg-black/40 rounded-lg p-2 text-[10px] font-mono text-slate-500 space-y-0.5 max-h-32 overflow-y-auto">
                {actionLog.map((msg, i) => (
                  <div key={i} className={i === 0 ? 'text-emerald-400' : ''}>{msg}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
