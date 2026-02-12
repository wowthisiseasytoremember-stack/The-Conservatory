
import React, { useState } from 'react';
import { X, Check, AlertTriangle, Database, ExternalLink, ShieldCheck } from 'lucide-react';

interface FirebaseConfigModalProps {
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({ onClose }) => {
  const [configJson, setConfigJson] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    try {
      const config = JSON.parse(configJson);
      if (!config.apiKey || !config.projectId) {
        throw new Error("Config must contain at least 'apiKey' and 'projectId'");
      }
      localStorage.setItem('conservatory_firebase_config', JSON.stringify(config));
      window.location.reload();
    } catch (e: any) {
      setError(e.message || "Invalid JSON");
    }
  };

  const handleClear = () => {
    if (confirm("This will remove the local configuration. Continue?")) {
      localStorage.removeItem('conservatory_firebase_config');
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-lg border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-black/20">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-500" />
            <h3 className="text-white font-bold">Connect Database</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh] no-scrollbar">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-200/80 flex gap-3 items-start leading-relaxed">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
            <div>
              <p className="font-bold text-amber-500 mb-1 uppercase tracking-wider">Critical Step: Project ID</p>
              Ensure you are using your own Firebase Project. The default ID is <strong>the-conservatory-d858b</strong>. If you are seeing "API Disabled" errors, you must manually enable the API for your specific project.
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-200/80 flex gap-3 items-start leading-relaxed">
            <ShieldCheck className="w-5 h-5 shrink-0 text-blue-400" />
            <div>
              <p className="font-bold text-blue-400 mb-1">Step 1: Enable Firestore API</p>
              Before using Firestore, the API must be active in your Google Cloud Project.
              <a 
                href="https://console.developers.google.com/apis/api/firestore.googleapis.com/overview" 
                target="_blank" 
                rel="noreferrer" 
                className="mt-2 flex items-center gap-1 underline font-bold text-blue-400"
              >
                Go to API Dashboard <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-200/80 flex gap-3 items-start leading-relaxed">
            <Database className="w-5 h-5 shrink-0 text-emerald-500" />
            <div>
              <p className="font-bold text-emerald-500 mb-1">Step 2: Create Database Instance</p>
              <p className="text-emerald-200/80">
                Go to <strong>Build &gt; Firestore Database</strong> in Firebase Console and click <strong>Create Database</strong>.
                Select <strong>Production Mode</strong> or <strong>Test Mode</strong> (allow writes for dev).
              </p>
              <a 
                href="https://console.firebase.google.com" 
                target="_blank" 
                rel="noreferrer" 
                className="mt-2 flex items-center gap-1 underline font-bold text-emerald-400"
              >
                Open Firebase Console <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Step 3: Paste Web App Config</label>
            <textarea
              value={configJson}
              onChange={(e) => { setConfigJson(e.target.value); setError(null); }}
              placeholder={'{ "apiKey": "...", "authDomain": "...", "projectId": "..." }'}
              className="w-full h-32 bg-black/50 border border-slate-700 rounded-xl p-4 text-xs font-mono text-emerald-400 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/50 resize-none"
            />
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-950/30 p-2 rounded border border-red-900/50">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 bg-black/40 border-t border-slate-800 flex justify-between items-center shrink-0">
           <button 
            onClick={handleClear}
            className="text-xs text-red-400 hover:text-red-300 underline"
          >
            Clear Local Config
          </button>
          <div className="flex gap-3">
             <button 
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={!configJson.trim()}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
            >
              <Check className="w-4 h-4" /> Save & Reload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
