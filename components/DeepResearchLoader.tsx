
import React from 'react';
import { ResearchProgress, ResearchStageStatus } from '../types';
import { Microscope, CheckCircle2, Loader2, XCircle, BookOpen, Globe2, Search, Leaf, Sparkles, X } from 'lucide-react';

interface DeepResearchLoaderProps {
  progress: ResearchProgress;
  onDismiss: () => void;
}

const STAGE_ICONS: Record<string, React.ReactNode> = {
  library: <BookOpen className="w-4 h-4" />,
  gbif: <Globe2 className="w-4 h-4" />,
  wikipedia: <Search className="w-4 h-4" />,
  inaturalist: <Leaf className="w-4 h-4" />,
  discovery: <Sparkles className="w-4 h-4" />
};

const STAGE_LABELS: Record<string, string> = {
  library: 'Consulting local library...',
  gbif: 'Querying GBIF taxonomy...',
  wikipedia: 'Searching Wikipedia...',
  inaturalist: 'Checking iNaturalist...',
  discovery: 'Synthesizing discoveries...'
};

const StageIndicator: React.FC<{ status: ResearchStageStatus; label: string; icon: React.ReactNode }> = ({
  status, label, icon
}) => {
  const colors: Record<ResearchStageStatus, string> = {
    waiting: 'text-slate-600',
    active: 'text-amber-400',
    complete: 'text-emerald-400',
    error: 'text-red-400',
    skipped: 'text-slate-700'
  };

  return (
    <div className={`flex items-center gap-3 py-1.5 transition-all duration-500 ${colors[status]}`}>
      <div className="w-5 h-5 flex items-center justify-center">
        {status === 'waiting' && <div className="w-2 h-2 rounded-full bg-slate-700" />}
        {status === 'active' && <Loader2 className="w-4 h-4 animate-spin text-amber-400" />}
        {status === 'complete' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        {status === 'error' && <XCircle className="w-4 h-4 text-red-400" />}
        {status === 'skipped' && <div className="w-2 h-2 rounded-full bg-slate-800" />}
      </div>
      <span className={`text-xs font-medium transition-all duration-300 ${
        status === 'active' ? 'opacity-100 translate-x-0' : 
        status === 'complete' ? 'opacity-80' : 
        'opacity-40'
      }`}>
        {status === 'complete' ? label.replace('...', '') + ' ✓' : label}
      </span>
    </div>
  );
};

export const DeepResearchLoader: React.FC<DeepResearchLoaderProps> = ({ progress, onDismiss }) => {
  if (!progress.isActive && progress.totalEntities === 0) return null;

  const isComplete = !progress.isActive && progress.completedEntities > 0;
  const percent = progress.totalEntities > 0
    ? Math.round((progress.completedEntities / progress.totalEntities) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-6" style={{ zIndex: 80 }}>
      <div className="bg-slate-900 w-full max-w-md border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-800/50 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isComplete ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
              <Microscope className={`w-5 h-5 ${isComplete ? 'text-emerald-400' : 'text-amber-400'}`} />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-white">
                {isComplete ? 'Research Complete' : 'Deep Research'}
              </h2>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">
                {isComplete
                  ? `${progress.discoveries.length} discoveries unlocked`
                  : `${progress.completedEntities} of ${progress.totalEntities} species`
                }
              </p>
            </div>
          </div>
          {isComplete && (
            <button
              onClick={onDismiss}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        {progress.isActive && (
          <div className="px-6 pt-4">
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Current Entity + Stages */}
        {progress.isActive && progress.currentEntity && (
          <div className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {progress.currentEntity.name}
              </span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-400 font-mono">
                {progress.currentEntityIndex + 1}/{progress.totalEntities}
              </span>
            </div>

            {/* Stage Stepper */}
            <div className="pl-2 border-l border-slate-800 space-y-0">
              {progress.entityResults[progress.entityResults.length - 1]?.stages.map((stage) => (
                <StageIndicator
                  key={stage.name}
                  status={stage.status}
                  label={stage.label}
                  icon={STAGE_ICONS[stage.name]}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completion: Discovery Reveal */}
        {isComplete && (
          <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto no-scrollbar">
            {progress.discoveries.length > 0 ? (
              <>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
                  Discoveries
                </p>
                <div className="space-y-3">
                  {progress.discoveries.map((d, i) => (
                    <div
                      key={d.entityId}
                      className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 transition-all"
                      style={{ animationDelay: `${i * 150}ms` }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-400">{d.entityName}</span>
                      </div>
                      <p className="text-sm text-slate-300 font-serif italic leading-relaxed">
                        {d.mechanism}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-slate-300">
                  All {progress.completedEntities} species enriched.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  View specimen placards for full details.
                </p>
              </div>
            )}

            {/* Entity Summary List */}
            <div className="border-t border-slate-800 pt-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">
                Researched Species
              </p>
              <div className="grid grid-cols-2 gap-2">
                {progress.entityResults.map((er) => {
                  const allComplete = er.stages.every(s => s.status === 'complete');
                  const hasError = er.stages.some(s => s.status === 'error');
                  return (
                    <div
                      key={er.entityId}
                      className={`text-xs px-3 py-2 rounded-lg border ${
                        hasError
                          ? 'bg-red-500/5 border-red-500/20 text-red-400'
                          : allComplete
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800/50 border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {hasError ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        <span className="truncate">{er.entityName}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer Action */}
        {isComplete && (
          <div className="p-6 pt-0">
            <button
              onClick={onDismiss}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-2xl transition-colors"
            >
              Explore Discoveries
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
