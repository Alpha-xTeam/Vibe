import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/imageCompression';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdate: () => void;
}

const MAX_BIO = 160;

export function EditProfileModal({ isOpen, onClose, user, onUpdate }: EditProfileModalProps) {
  const [name, setName] = useState(user.name);
  const [handle, setHandle] = useState(user.handle.replace('@', ''));
  const [bio, setBio] = useState(user.bio || '');
  const [location, setLocation] = useState(user.location || '');
  const [website, setWebsite] = useState(user.website || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<'avatar' | 'info' | 'social'>('info');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const API_URL = (import.meta as any).env.VITE_API_URL;
  const { refresh } = useAuth();

  // Auto focus name field
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameRef.current?.focus(), 200);
      setSuccess(false);
      setError('');
    }
  }, [isOpen]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleSubmit(e as any);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [isOpen, name, handle, bio, location, website, avatarUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const compressed = await compressImage(file, 400, 400, 0.8);
        setAvatarFile(compressed);
        const reader = new FileReader();
        reader.onload = (ev) => setAvatarUrl(ev.target?.result as string);
        reader.readAsDataURL(compressed);
      } catch {
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setAvatarUrl(ev.target?.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const fakeEvent = { target: { files: [file] } } as any;
      handleFileChange(fakeEvent);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !handle.trim()) {
      setError('Name and username are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let finalAvatarUrl = avatarUrl;

      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const uploadRes = await fetch(`${API_URL}/uploads/avatar`, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalAvatarUrl = uploadData.url;
        }
      }

      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          full_name: name,
          handle,
          bio,
          location,
          website,
          avatar_url: finalAvatarUrl
        }),
      });
      if (res.ok) {
        setSuccess(true);
        await refresh();
        onUpdate();
        setTimeout(() => onClose(), 800);
      } else {
        const data = await res.json();
        setError(data.detail || 'Failed to update profile');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hasChanges =
    name !== user.name ||
    handle !== user.handle.replace('@', '') ||
    bio !== (user.bio || '') ||
    location !== (user.location || '') ||
    website !== (user.website || '') ||
    avatarFile !== null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full sm:max-w-xl bg-surface border-x sm:border border-line rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden h-[92vh] sm:h-auto sm:max-h-[90vh] flex flex-col"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {/* Drag Overlay */}
            <AnimatePresence>
              {isDragging && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-neon/5 border-2 border-dashed border-neon/40 rounded-2xl flex items-center justify-center backdrop-blur-sm"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-neon/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-neon">Drop your avatar here</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Overlay */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-surface/95 backdrop-blur-sm flex items-center justify-center"
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 10 }}
                      className="w-20 h-20 mx-auto mb-4 rounded-full bg-neon/15 flex items-center justify-center"
                    >
                      <svg className="w-10 h-10 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                    <p className="text-lg font-bold text-content">Profile Updated!</p>
                    <p className="text-sm text-content-muted mt-1">Your changes have been saved</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Top Neon Line */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-neon/40 to-transparent" />

            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="p-2 -ml-2 rounded-xl hover:bg-line/50 transition-colors text-content-muted hover:text-content"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div>
                  <h2 className="text-base font-bold text-content">Edit Profile</h2>
                  <p className="text-[10px] text-content-muted font-mono uppercase tracking-wider mt-0.5">
                    Customize your identity
                  </p>
                </div>
              </div>

              {/* Change indicator */}
              {hasChanges && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neon/5 border border-neon/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />
                  <span className="text-[10px] text-neon font-medium">Unsaved</span>
                </div>
              )}
            </div>

            {/* Section Tabs */}
            <div className="px-5 pb-3">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-background border border-line">
                {[
                  {
                    key: 'avatar' as const,
                    label: 'Avatar',
                    icon: (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ),
                  },
                  {
                    key: 'info' as const,
                    label: 'Info',
                    icon: (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ),
                  },
                  {
                    key: 'social' as const,
                    label: 'Social',
                    icon: (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    ),
                  },
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveSection(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                      activeSection === tab.key
                        ? 'bg-neon text-black shadow-lg shadow-neon/20'
                        : 'text-content-muted hover:text-content hover:bg-line/30'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 pb-5 no-scrollbar">

              {/* Avatar Section */}
              <AnimatePresence mode="wait">
                {activeSection === 'avatar' && (
                  <motion.div
                    key="avatar"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />

                    {/* Avatar Preview */}
                    <div className="flex flex-col items-center py-6">
                      <div
                        className="relative group cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="relative">
                          <img
                            src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${handle}`}
                            alt="Avatar"
                            className="w-32 h-32 rounded-2xl object-cover ring-2 ring-line group-hover:ring-neon/40 transition-all shadow-lg"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-2xl flex items-center justify-center transition-all">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center">
                              <svg className="w-8 h-8 text-white mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="text-xs text-white font-medium">Change Image</span>
                            </div>
                          </div>
                        </div>

                        {/* Online Badge */}
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-lg border-3 border-surface flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>

                      <div className="mt-6 p-4 rounded-xl border border-line bg-background/50 text-center w-full">
                        <p className="text-sm font-medium text-content">Profile Media</p>
                        <p className="text-xs text-content-muted mt-1 leading-relaxed">
                          Your avatar is your digital fingerprint. <br />
                          PNG, JPG, or GIF up to 5MB.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-neon/20 bg-neon/5 text-neon text-sm font-bold hover:bg-neon/10 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Choose from files
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Info Section */}
                {activeSection === 'info' && (
                  <motion.div
                    key="info"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    {/* Mini Avatar Preview */}
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-line bg-background">
                      <img
                        src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${handle}`}
                        alt="Preview"
                        className="w-12 h-12 rounded-xl object-cover ring-1 ring-line"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-content text-sm truncate">
                          {name || 'Your Name'}
                        </p>
                        <p className="text-xs text-content-muted truncate">
                          @{handle || 'username'}
                        </p>
                      </div>
                      <div className="text-[10px] text-content-muted bg-line px-2 py-1 rounded-lg font-mono">
                        Preview
                      </div>
                    </div>

                    {/* Full Name */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-content-muted uppercase tracking-wider flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Full Name
                      </label>
                      <div className={`relative rounded-xl border transition-all duration-300 ${
                        focusedField === 'name'
                          ? 'border-neon/50 shadow-[0_0_0_3px_var(--color-neon-subtle)]'
                          : 'border-line hover:border-content-muted/30'
                      }`}>
                        <input
                          ref={nameRef}
                          value={name}
                          onChange={e => setName(e.target.value)}
                          onFocus={() => setFocusedField('name')}
                          onBlur={() => setFocusedField(null)}
                          className="w-full px-4 py-3 bg-background rounded-xl text-sm text-content placeholder:text-content-muted/40 focus:outline-none"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                    </div>

                    {/* Username */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-content-muted uppercase tracking-wider flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                        Username
                      </label>
                      <div className={`relative rounded-xl border transition-all duration-300 ${
                        focusedField === 'handle'
                          ? 'border-neon/50 shadow-[0_0_0_3px_var(--color-neon-subtle)]'
                          : 'border-line hover:border-content-muted/30'
                      }`}>
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neon text-sm font-medium">@</span>
                        <input
                          value={handle}
                          onChange={e => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                          onFocus={() => setFocusedField('handle')}
                          onBlur={() => setFocusedField(null)}
                          className="w-full pl-9 pr-4 py-3 bg-background rounded-xl text-sm text-content placeholder:text-content-muted/40 focus:outline-none"
                          placeholder="username"
                          required
                        />
                        {handle.length > 0 && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-content-muted font-mono">
                            {handle.length}/20
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-content-muted uppercase tracking-wider flex items-center gap-2">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                          </svg>
                          Bio
                        </label>
                        <span className={`text-[10px] font-mono ${bio.length > MAX_BIO ? 'text-red-400' : 'text-content-muted'}`}>
                          {bio.length}/{MAX_BIO}
                        </span>
                      </div>
                      <div className={`relative rounded-xl border transition-all duration-300 ${
                        focusedField === 'bio'
                          ? 'border-neon/50 shadow-[0_0_0_3px_var(--color-neon-subtle)]'
                          : 'border-line hover:border-content-muted/30'
                      }`}>
                        <textarea
                          value={bio}
                          onChange={e => setBio(e.target.value)}
                          onFocus={() => setFocusedField('bio')}
                          onBlur={() => setFocusedField(null)}
                          className="w-full px-4 py-3 bg-background rounded-xl text-sm text-content placeholder:text-content-muted/40 focus:outline-none resize-none h-24"
                          placeholder="Tell the world about yourself..."
                          maxLength={MAX_BIO + 10}
                        />
                      </div>
                      {/* Bio progress bar */}
                      <div className="h-1 rounded-full bg-line overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            bio.length > MAX_BIO ? 'bg-red-400' : bio.length > MAX_BIO * 0.8 ? 'bg-yellow-400' : 'bg-neon'
                          }`}
                          style={{ width: `${Math.min((bio.length / MAX_BIO) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Social Section */}
                {activeSection === 'social' && (
                  <motion.div
                    key="social"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    {/* Location */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-content-muted uppercase tracking-wider flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Location
                      </label>
                      <div className={`relative rounded-xl border transition-all duration-300 ${
                        focusedField === 'location'
                          ? 'border-neon/50 shadow-[0_0_0_3px_var(--color-neon-subtle)]'
                          : 'border-line hover:border-content-muted/30'
                      }`}>
                        <input
                          value={location}
                          onChange={e => setLocation(e.target.value)}
                          onFocus={() => setFocusedField('location')}
                          onBlur={() => setFocusedField(null)}
                          className="w-full px-4 py-3 bg-background rounded-xl text-sm text-content placeholder:text-content-muted/40 focus:outline-none"
                          placeholder="San Francisco, CA"
                        />
                      </div>
                    </div>

                    {/* Website */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-content-muted uppercase tracking-wider flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        Website
                      </label>
                      <div className={`relative rounded-xl border transition-all duration-300 ${
                        focusedField === 'website'
                          ? 'border-neon/50 shadow-[0_0_0_3px_var(--color-neon-subtle)]'
                          : 'border-line hover:border-content-muted/30'
                      }`}>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-content-muted">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </div>
                        <input
                          value={website}
                          onChange={e => setWebsite(e.target.value)}
                          onFocus={() => setFocusedField('website')}
                          onBlur={() => setFocusedField(null)}
                          className="w-full pl-11 pr-4 py-3 bg-background rounded-xl text-sm text-content placeholder:text-content-muted/40 focus:outline-none"
                          placeholder="https://yourwebsite.com"
                        />
                        {website && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {website.startsWith('http') ? (
                              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Social Links Preview */}
                    <div className="rounded-xl border border-line bg-background p-4">
                      <div className="text-[10px] text-content-muted font-mono uppercase tracking-wider mb-3">
                        Profile Preview
                      </div>
                      <div className="flex items-center gap-3">
                        <img
                          src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${handle}`}
                          alt="Preview"
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-line"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-content text-sm truncate">{name || 'Your Name'}</p>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {location && (
                              <span className="flex items-center gap-1 text-[10px] text-content-muted">
                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                {location}
                              </span>
                            )}
                            {website && (
                              <span className="flex items-center gap-1 text-[10px] text-neon">
                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                                </svg>
                                {website.replace(/^https?:\/\//, '')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {bio && (
                        <p className="text-xs text-content-muted mt-3 leading-relaxed">{bio}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="overflow-hidden mt-4"
                  >
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-400/10 border border-red-400/20">
                      <div className="w-8 h-8 rounded-lg bg-red-400/15 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <p className="text-sm text-red-400 font-medium flex-1">{error}</p>
                      <button
                        type="button"
                        onClick={() => setError('')}
                        className="p-1 rounded-md hover:bg-red-400/10 text-red-400/60 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            {/* Footer */}
            <div className="px-5 pb-5 pt-2">
              {/* Separator */}
              <div className="h-[1px] bg-gradient-to-r from-transparent via-line to-transparent mb-4" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-content-muted">
                  <kbd className="px-1.5 py-0.5 rounded bg-line font-mono text-[9px]">⌘</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-line font-mono text-[9px]">Enter</kbd>
                  <span className="ml-1">to save</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-content-muted hover:text-content hover:bg-line/50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !hasChanges}
                    className="px-6 py-2.5 rounded-xl bg-neon text-black font-bold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-neon/25 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Neon Line */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-neon/30 to-transparent" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}