import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export const ProfileSetupModal = () => {
  const { refresh, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileHandle, setProfileHandle] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [profileError, setProfileError] = useState('');

  const API_URL = (import.meta as any).env.VITE_API_URL;

  const submitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    
    if (!profileName.trim()) {
      setProfileError('Please enter your full name');
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(profileHandle)) {
      setProfileError('Username must be 3-30 characters (letters, numbers, underscore)');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          full_name: profileName, 
          handle: profileHandle,
          bio,
          location,
          website
        }),
      });
      if (!res.ok) {
         const text = await res.text();
         throw new Error(text || 'Failed to save profile');
      }
      await refresh();
    } catch (err: any) {
      setProfileError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.hasProfile) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md my-8 bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-line">
          <h2 className="text-xl font-bold text-content">Complete Your Profile</h2>
          <p className="text-sm text-content-muted mt-1">First time at Vibe? Tell us who you are.</p>
        </div>

        <form onSubmit={submitProfile} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-content-muted uppercase tracking-wider">Full Name *</label>
            <input
              value={profileName}
              onChange={e => setProfileName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-4 py-3 bg-background border border-line rounded-xl text-sm focus:outline-none focus:border-neon transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-content-muted uppercase tracking-wider">Username *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-content-muted">@</span>
              <input
                value={profileHandle}
                onChange={e => setProfileHandle(e.target.value)}
                placeholder="username"
                className="w-full pl-8 pr-4 py-3 bg-background border border-line rounded-xl text-sm focus:outline-none focus:border-neon transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-content-muted uppercase tracking-wider">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="w-full px-4 py-3 bg-background border border-line rounded-xl text-sm focus:outline-none focus:border-neon transition-colors h-24 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-xs font-semibold text-content-muted uppercase tracking-wider">Location</label>
                <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. London, UK"
                className="w-full px-4 py-3 bg-background border border-line rounded-xl text-sm focus:outline-none focus:border-neon transition-colors"
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-semibold text-content-muted uppercase tracking-wider">Website</label>
                <input
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="example.com"
                className="w-full px-4 py-3 bg-background border border-line rounded-xl text-sm focus:outline-none focus:border-neon transition-colors"
                />
            </div>
          </div>

          {profileError && (
            <div className="p-3 bg-red-400/10 border border-red-400/20 rounded-xl">
              <p className="text-xs text-red-400 font-medium">{profileError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-neon text-black font-bold text-sm transition-all hover:shadow-lg hover:shadow-neon/25 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              'Start Vibing'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};