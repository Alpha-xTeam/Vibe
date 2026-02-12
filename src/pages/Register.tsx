import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export const Register = () => {
  const { signUp, refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const API_URL = (import.meta as any).env.VITE_API_URL;
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileHandle, setProfileHandle] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const data = await signUp(email, password);
      
      if (data.session) {
        // If auto-confirm is on, we are already signed in
        setShowProfilePanel(true);
        setProfileHandle(email.split('@')[0]);
      } else {
        setSuccess('Account created! Please check your email to confirm your account.');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitProfile = async () => {
    setProfileError('');
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
        body: JSON.stringify({ full_name: profileName, handle: profileHandle }),
      });
      if (!res.ok) throw new Error(await res.text());
      await refresh();
      navigate('/');
    } catch (err: any) {
      setProfileError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = email.trim().length > 0 && password.trim().length >= 6 && password === confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background relative overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[150px] opacity-[0.07]" style={{ background: 'var(--color-neon)', top: '-10%', right: '-5%' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.05]" style={{ background: 'var(--color-neon)', bottom: '5%', left: '-5%' }} />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring' }} className="inline-flex items-center justify-center mb-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-2xl bg-neon/20 animate-pulse" />
              <div className="absolute inset-[3px] rounded-[13px] bg-background flex items-center justify-center">
                <span className="text-neon font-black text-3xl leading-none">V</span>
              </div>
            </div>
          </motion.div>
          <h1 className="text-2xl font-bold text-content tracking-tight">Create Account</h1>
          <p className="text-sm text-content-muted mt-2">Join Vibe and start sharing your thoughts</p>
        </div>

        <div className="relative">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-neon/40 to-transparent rounded-t-2xl" />
          <div className="bg-surface border border-line border-t-0 rounded-2xl rounded-t-none shadow-2xl overflow-hidden">
            {!showProfilePanel && !success && (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-content-muted uppercase tracking-wider">Email</label>
                  <div className={`relative rounded-xl border transition-all duration-300 ${focusedField === 'email' ? 'border-neon/50 ring-2 ring-neon/10' : 'border-line'}`}>
                    <input ref={emailRef} type="email" value={email} onChange={e => setEmail(e.target.value)} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} placeholder="you@example.com" className="w-full px-4 py-3.5 bg-background rounded-xl text-sm focus:outline-none" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-content-muted uppercase tracking-wider">Password</label>
                  <div className={`relative rounded-xl border transition-all duration-300 ${focusedField === 'password' ? 'border-neon/50 ring-2 ring-neon/10' : 'border-line'}`}>
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} placeholder="At least 6 characters" className="w-full px-4 py-3.5 bg-background rounded-xl text-sm focus:outline-none" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted">
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-content-muted uppercase tracking-wider">Confirm Password</label>
                  <div className={`relative rounded-xl border transition-all duration-300 ${focusedField === 'confirm' ? 'border-neon/50 ring-2 ring-neon/10' : 'border-line'}`}>
                    <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onFocus={() => setFocusedField('confirm')} onBlur={() => setFocusedField(null)} placeholder="Repeat your password" className="w-full px-4 py-3.5 bg-background rounded-xl text-sm focus:outline-none" required />
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-3 bg-red-400/10 border border-red-400/20 rounded-xl text-red-400 text-sm">
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" disabled={!isFormValid || loading} className="w-full py-4 rounded-xl bg-neon text-black font-bold text-sm hover:shadow-lg hover:shadow-neon/25 transition-all disabled:opacity-30">
                  {loading ? 'Creating...' : 'Sign Up'}
                </button>
              </form>
            )}

            {success && (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-green-400/10 border border-green-400/20 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-lg font-bold">Check your email</h3>
                <p className="text-sm text-content-muted">{success}</p>
                <button onClick={() => navigate('/login')} className="text-neon font-semibold">Back to Login</button>
              </div>
            )}

            {showProfilePanel && (
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-bold">Complete your profile</h3>
                <div className="space-y-3">
                  <input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Full name" className="w-full px-4 py-3 rounded-xl bg-background border border-line" />
                  <input value={profileHandle} onChange={e => setProfileHandle(e.target.value)} placeholder="Username (no @)" className="w-full px-4 py-3 rounded-xl bg-background border border-line" />
                  {profileError && <p className="text-red-400 text-sm">{profileError}</p>}
                  <button onClick={submitProfile} disabled={loading} className="w-full py-4 rounded-xl bg-neon text-black font-bold">
                    {loading ? 'Saving...' : 'Explore Vibe'}
                  </button>
                </div>
              </div>
            )}

            {!showProfilePanel && !success && (
              <div className="p-6 border-t border-line bg-background/50 text-center text-sm text-content-muted">
                Already have an account?{' '}
                <button onClick={() => navigate('/login')} className="text-neon font-semibold">Sign In</button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
