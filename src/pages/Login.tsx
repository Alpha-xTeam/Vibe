import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export const Login = () => {
  const { signIn, refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

 // src/pages/Login.tsx

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setLoading(true);
  try {
    const meData = await signIn(email, password);
    const hasProfile = meData?.profile?.full_name && meData?.profile?.handle;
    
    if (meData && meData.authenticated !== false && !hasProfile) {
      setShowProfilePanel(true);
    } else {
      navigate('/');
    }
  } catch (err: any) {
    setError(err.message || 'Authentication failed.');
  } finally {
    setLoading(false);
  }
};

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background relative overflow-hidden">

      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[150px] opacity-[0.07]"
          style={{
            background: 'var(--color-neon)',
            top: '-10%',
            right: '-5%',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.05]"
          style={{
            background: 'var(--color-neon)',
            bottom: '5%',
            left: '-5%',
          }}
        />
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      </div>

      {/* Login Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', damping: 15 }}
            className="inline-flex items-center justify-center mb-6"
          >
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-2xl bg-neon/20 animate-pulse" />
              <div className="absolute inset-[3px] rounded-[13px] bg-background flex items-center justify-center">
                <span className="text-neon font-black text-3xl leading-none">V</span>
              </div>
              {/* Corner Dots */}
              <div className="absolute -top-1 -left-1 w-1.5 h-1.5 rounded-full bg-neon/60" />
              <div className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-neon/60" />
              <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 rounded-full bg-neon/60" />
              <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 rounded-full bg-neon/60" />
            </div>
          </motion.div>

          <h1 className="text-2xl font-bold text-content tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-content-muted mt-2">
            Sign in to your Vibe account
          </p>
        </div>

        {/* Card */}
        <div className="relative">
          {/* Neon Top Line */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-neon/40 to-transparent rounded-t-2xl" />

          <div className="bg-surface border border-line border-t-0 rounded-2xl rounded-t-none shadow-2xl shadow-black/10 overflow-hidden">
            <div className="p-6 pb-0">
              <div className="text-sm text-content-muted text-center">Sign in with your email and password</div>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-line" />
                <span className="text-xs text-content-muted font-medium uppercase tracking-wider">continue with</span>
                <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-line" />
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 pb-6">
              <div className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-semibold text-content-muted uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </label>
                  <div className={`relative rounded-xl border transition-all duration-300 ${
                    focusedField === 'email'
                      ? 'border-neon/50 shadow-[0_0_0_3px_var(--color-neon-subtle)]'
                      : 'border-line hover:border-content-muted/30'
                  }`}>
                    <input
                      ref={emailRef}
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(null); }}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3.5 bg-background rounded-xl text-sm text-content placeholder:text-content-muted/40 focus:outline-none"
                      autoComplete="email"
                    />
                    {email.length > 0 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {email.includes('@') && email.includes('.') ? (
                          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-content-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-xs font-semibold text-content-muted uppercase tracking-wider flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-xs text-neon hover:text-neon-hover font-medium transition-colors"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className={`relative rounded-xl border transition-all duration-300 ${
                    focusedField === 'password'
                      ? 'border-neon/50 shadow-[0_0_0_3px_var(--color-neon-subtle)]'
                      : 'border-line hover:border-content-muted/30'
                  }`}>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(null); }}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3.5 pr-12 bg-background rounded-xl text-sm text-content placeholder:text-content-muted/40 focus:outline-none"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-line text-content-muted hover:text-content transition-all"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Password Strength */}
                  {password.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 flex gap-1">
                        {[1, 2, 3, 4].map(level => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              password.length >= level * 3
                                ? level <= 1
                                  ? 'bg-red-400'
                                  : level <= 2
                                    ? 'bg-yellow-400'
                                    : level <= 3
                                      ? 'bg-neon/60'
                                      : 'bg-neon'
                                : 'bg-line'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-content-muted font-medium">
                        {password.length < 4 ? 'Weak' : password.length < 8 ? 'Fair' : password.length < 12 ? 'Good' : 'Strong'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-400/10 border border-red-400/20">
                        <div className="w-8 h-8 rounded-lg bg-red-400/15 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-red-400 font-medium">{error}</p>
                        </div>
                        <button
                          onClick={() => setError(null)}
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

                {/* Remember Me */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="w-5 h-5 rounded-md border border-line hover:border-neon/50 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-neon/30"
                    onClick={(e) => {
                      const el = e.currentTarget;
                      el.classList.toggle('bg-neon');
                      el.classList.toggle('border-neon');
                    }}
                  >
                    <svg className="w-3 h-3 text-black opacity-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <span className="text-sm text-content-muted">Remember me for 30 days</span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className="w-full relative py-4 rounded-xl bg-neon text-black font-bold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-neon/25 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2 group overflow-hidden"
                >
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in to Vibe</span>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Profile setup panel (shown after successful sign-in if name is missing) */}
            {showProfilePanel && (
              <div className="px-6 pb-6">
                <div className="p-4 rounded-xl border border-line bg-background">
                  <h3 className="text-base font-semibold mb-2">Set up your profile</h3>
                  <p className="text-sm text-content-muted mb-4">Choose a display name and a unique username (e.g., username123).</p>

                  <div className="space-y-3">
                    <input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Full name" className="w-full px-3 py-2 rounded bg-background border border-line" />
                    <input value={profileHandle} onChange={e => setProfileHandle(e.target.value)} placeholder="Username (no @)" className="w-full px-3 py-2 rounded bg-background border border-line" />
                    {profileError && <div className="text-sm text-red-400">{profileError}</div>}
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { /* optional: sign out instead? */ }} className="px-4 py-2 rounded bg-line text-content-muted">Cancel</button>
                      <button onClick={submitProfile} className="px-4 py-2 rounded bg-neon text-black font-bold">Save profile</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 border-t border-line bg-background/50">
              <p className="text-center text-sm text-content-muted">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="text-neon hover:text-neon-hover font-semibold transition-colors relative group"
                >
                  Create one
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-neon group-hover:w-full transition-all duration-300" />
                </button>
              </p>
            </div>
          </div>

          {/* Neon Bottom Line */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-neon/30 to-transparent rounded-b-2xl" />
        </div>

        {/* Security Note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-content-muted">
          <svg className="w-3.5 h-3.5 text-neon/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Secured with end-to-end encryption</span>
        </div>

        {/* Footer Links */}
        <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-content-muted">
          <button className="hover:text-neon transition-colors">Terms</button>
          <span>·</span>
          <button className="hover:text-neon transition-colors">Privacy</button>
          <span>·</span>
          <button className="hover:text-neon transition-colors">Help</button>
        </div>
      </motion.div>
    </div>
  );
};