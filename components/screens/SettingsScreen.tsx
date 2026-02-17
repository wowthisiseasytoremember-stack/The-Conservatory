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
          <h3 className="text-lg font-semibold mb-2">Theme</h3>
          <p className="text-slate-400 text-sm mb-2">
            Switch between light and dark modes (Phase 2)
          </p>
          <select className="w-full p-2 bg-slate-800 rounded border border-slate-700">
            <option>Dark (Default)</option>
            <option disabled>Light (Coming Soon)</option>
          </select>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2 text-red-400">Account Management</h3>
          <p className="text-slate-400 text-sm mb-4">
            Manage your personal data and account access.
          </p>
          <div className="space-y-4">
            <a 
              href="https://conservatory-privacy-policy.web.app" 
              target="_blank"
              rel="noreferrer"
              className="block w-full text-center py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded border border-slate-600 transition-colors"
            >
              Privacy Policy
            </a>
            <button 
              onClick={() => {
                if (window.confirm("CRITICAL WARNING: This will permanently DELETE your account and ALL data. This cannot be undone.")) {
                  const { store } = require('../../services/store');
                  store.deleteAccount().then(() => {
                    alert("Account deleted.");
                    navigate('/');
                  }).catch((e: any) => {
                    alert(e.message);
                  });
                }
              }}
              className="w-full py-2 bg-red-900/50 hover:bg-red-800 text-red-200 rounded border border-red-500/30 font-bold transition-colors"
            >
              Delete Account & Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
