import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * SettingsScreen
 * 
 * Route: /settings
 * 
 * Design-agnostic placeholder for settings view.
 */
export const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-emerald-400 hover:text-emerald-300"
      >
        ← Back
      </button>

      <h2 className="text-2xl font-serif mb-6">Settings</h2>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Featured Habitat</h3>
          <p className="text-slate-400 text-sm mb-2">
            Choose which habitat shows on app open
          </p>
          <select className="w-full p-2 bg-slate-800 rounded border border-slate-700">
            <option>Most recently updated (default)</option>
            <option>User-selectable (coming soon)</option>
          </select>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Animation Speed</h3>
          <p className="text-slate-400 text-sm mb-2">
            Adjust animation speed (placeholder)
          </p>
          <select className="w-full p-2 bg-slate-800 rounded border border-slate-700">
            <option>Normal</option>
            <option>Slow</option>
            <option>Fast</option>
          </select>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Notifications</h3>
          <p className="text-slate-400 text-sm mb-2">
            Notification preferences (placeholder)
          </p>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">New observations</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">Enrichment complete</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
