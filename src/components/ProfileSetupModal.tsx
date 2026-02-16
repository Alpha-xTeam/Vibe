import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export const ProfileSetupModal = () => {
  const { refresh, user } = useAuth();
  const [step, setStep] = useState(1); // 1: Info, 2: Avatar
  const [loading, setLoading] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileHandle, setProfileHandle] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [profileError, setProfileError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_URL = (import.meta as any).env.VITE_API_URL;

  const validateHandle = (handle: string) => {
    // 1. Starts with a letter
    if (!/^[a-zA-Z]/.test(handle)) {
      return 'Username must start with a letter (a-z)';
    }
    // 2. Only letters, numbers, underscores, periods
    if (!/^[a-zA-Z0-9_.]+$/.test(handle)) {
      return 'Username can only contain letters, numbers, underscores, and periods';
    }
    // 3. Length
    if (handle.length < 3) {
      return 'Username is too short (min 3 characters)';
    }
    if (handle.length > 30) {
      return 'Username is too long (max 30 characters)';
    }
    return null;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    
    if (!profileName.trim()) {
      setProfileError('Please enter your full name');
      return;
    }

    const error = validateHandle(profileHandle);
    if (error) {
      setProfileError(error);
      return;
    }

    setStep(2);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const finishSetup = async () => {
    setLoading(true);
    setProfileError('');
    try {
      let finalAvatarUrl = '';

      // 1. Upload Avatar if selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const uploadRes = await fetch(`${API_URL}/uploads/avatar`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('vibe_token')}` },
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalAvatarUrl = uploadData.url;
        }
      }

      // 2. Save Profile
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('vibe_token')}`
        },
        body: JSON.stringify({ 
          full_name: profileName, 
          handle: profileHandle,
          bio,
          avatar_url: finalAvatarUrl
        }),
      });

      if (!res.ok) {
         const data = await res.json().catch(() => ({ detail: 'Failed to save profile' }));
         throw new Error(data.detail || 'Failed to save profile');
      }
      
      await refresh();
    } catch (err: any) {
      setProfileError(err.message || 'Error saving profile');
      setLoading(false);
    }
  };

  if (!user || user.hasProfile) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-surface border border-line rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-line flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-content italic uppercase tracking-tighter">Welcome to Vibe</h2>
            <p className="text-sm text-content-muted mt-1">Step {step} of 2</p>
          </div>
          <div className="flex gap-1">
            <div className={`w-8 h-1 rounded-full ${step >= 1 ? 'bg-neon' : 'bg-line'}`} />
            <div className={`w-8 h-1 rounded-full ${step >= 2 ? 'bg-neon' : 'bg-line'}`} />
          </div>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleNextStep}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-content-muted uppercase tracking-[0.2em]">Full Name</label>
                  <input
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    placeholder="Enter your name..."
                    className="w-full px-5 py-4 bg-background border border-line rounded-2xl text-sm focus:outline-none focus:border-neon transition-all hover:border-line/80 font-medium"
                    required
                    dir="auto"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-content-muted uppercase tracking-[0.2em]">Username</label>
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neon font-bold">@</span>
                    <input
                      value={profileHandle}
                      onChange={e => setProfileHandle(e.target.value.toLowerCase())}
                      placeholder="username"
                      className="w-full pl-10 pr-5 py-4 bg-background border border-line rounded-2xl text-sm focus:outline-none focus:border-neon transition-all hover:border-line/80 font-mono"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-content-muted pl-1">Lowercase, starts with letter, no symbols at start.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-content-muted uppercase tracking-[0.2em]">Bio (Optional)</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Tech enthusiast, developer..."
                    className="w-full px-5 py-4 bg-background border border-line rounded-2xl text-sm focus:outline-none focus:border-neon transition-all hover:border-line/80 h-24 resize-none"
                    dir="auto"
                  />
                </div>

                {profileError && (
                  <div className="p-4 bg-red-400/5 border border-red-400/10 rounded-2xl">
                    <p className="text-xs text-red-400 font-bold">{profileError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-5 rounded-2xl bg-neon text-black font-black text-xs uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(var(--color-neon-rgb),0.3)] active:scale-[0.98]"
                >
                  Continue
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8 flex flex-col items-center"
              >
                <div className="text-center">
                  <h3 className="text-lg font-bold text-content">Add a profile picture</h3>
                  <p className="text-xs text-content-muted mt-1">Show everyone who you are.</p>
                </div>

                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-dashed border-line group-hover:border-neon transition-all flex items-center justify-center bg-background relative">
                    {avatarPreview ? (
                      <img src={avatarPreview} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <svg className="w-8 h-8 text-content-muted group-hover:text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-neon rounded-xl flex items-center justify-center text-black shadow-lg">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />

                <div className="w-full space-y-3">
                  <button
                    onClick={finishSetup}
                    disabled={loading}
                    className="w-full py-5 rounded-2xl bg-neon text-black font-black text-xs uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(var(--color-neon-rgb),0.3)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Finalizing...' : 'Complete Registration'}
                  </button>
                  <button
                    onClick={() => setStep(1)}
                    disabled={loading}
                    className="w-full py-4 text-xs font-bold text-content-muted hover:text-content transition-colors uppercase tracking-widest"
                  >
                    Back to Info
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};