import React from 'react';
import { useTheme } from '../context/ThemeContext';

export function Settings() {
  const { theme, toggleTheme, showTextures, toggleTextures, reduceMotion, toggleReduceMotion } = useTheme();

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-neon mb-4">Settings</h1>
      <p className="text-content-muted mb-6">Configure your experience on Vibe.</p>

      <div className="space-y-4">
        <div className="rounded-xl border border-line bg-surface p-4 flex items-center justify-between">
          <div>
            <div className="font-medium text-content">Theme</div>
            <div className="text-sm text-content-muted">Current: {theme}</div>
          </div>
          <button onClick={toggleTheme} className="px-3 py-1 rounded bg-neon/10 text-neon">Toggle</button>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4 flex items-center justify-between">
          <div>
            <div className="font-medium text-content">Background Textures</div>
            <div className="text-sm text-content-muted">Toggle subtle decorative textures</div>
          </div>
          <button onClick={toggleTextures} className={`px-3 py-1 rounded ${showTextures ? 'bg-neon text-black' : 'bg-black/5 text-content-muted'}`} aria-pressed={showTextures}>{showTextures ? 'Enabled' : 'Disabled'}</button>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4 flex items-center justify-between">
          <div>
            <div className="font-medium text-content">Reduce Motion</div>
            <div className="text-sm text-content-muted">Disable non-essential animations</div>
          </div>
          <button onClick={toggleReduceMotion} className={`px-3 py-1 rounded ${reduceMotion ? 'bg-neon text-black' : 'bg-black/5 text-content-muted'}`} aria-pressed={reduceMotion}>{reduceMotion ? 'On' : 'Off'}</button>
        </div>
      </div>
    </div>
  );
}
