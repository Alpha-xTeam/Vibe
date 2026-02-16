import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../utils/api';

export const Login = () => {
  const { signIn, refresh, resetPassword } = useAuth();
  const [step, setStep] = useState<'email' | 'password' | 'profile' | 'forgot_password' | 'reset_sent'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Profile setup
  const [profileName, setProfileName] = useState('');
  const [profileHandle, setProfileHandle] = useState('');
  const [profileError, setProfileError] = useState('');

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (step === 'email') setTimeout(() => emailRef.current?.focus(), 100);
    if (step === 'password') setTimeout(() => passwordRef.current?.focus(), 100);
  }, [step]);

  const isValidEmail = email.includes('@') && email.includes('.');

  const handleEmailContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !isValidEmail) return;
    setError(null);
    setStep('password');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const meData = await signIn(email, password);
      const hasProfile = meData?.profile?.full_name && meData?.profile?.handle;
      if (meData && meData.authenticated !== false && !hasProfile) {
        setStep('profile');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const submitProfile = async () => {
    setProfileError('');
    if (!profileName.trim()) {
      setProfileError('Name is required');
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(profileHandle)) {
      setProfileError('Username: 3-30 chars, letters, numbers, underscore');
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
      setProfileError(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !isValidEmail) return;
    setLoading(true);
    setError(null);
    try {
      await resetPassword(email);
      setStep('reset_sent');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">

      {/* Subtle Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[160px] opacity-[0.04]" style={{ background: 'var(--color-neon)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-neon/10 mb-5">
            <span className="text-neon font-black text-2xl leading-none">V</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {step === 'email' && (
                <>
                  <h1 className="text-2xl font-bold text-content">Sign in to Vibe</h1>
                  <p className="text-sm text-content-muted mt-2">Enter your email to continue</p>
                </>
              )}
              {step === 'password' && (
                <>
                  <h1 className="text-2xl font-bold text-content">Welcome back</h1>
                  <button
                    onClick={() => setStep('email')}
                    className="text-sm text-neon mt-2 hover:underline inline-flex items-center gap-1"
                  >
                    {email}
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </>
              )}
              {step === 'profile' && (
                <>
                  <h1 className="text-2xl font-bold text-content">Complete your profile</h1>
                  <p className="text-sm text-content-muted mt-2">Choose how you appear on Vibe</p>
                </>
              )}
              {step === 'forgot_password' && (
                <>
                  <h1 className="text-2xl font-bold text-content">Reset password</h1>
                  <p className="text-sm text-content-muted mt-2">We'll send you a link to reset your password</p>
                </>
              )}
              {step === 'reset_sent' && (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-6">
                    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-content">Check your email</h1>
                  <p className="text-sm text-content-muted mt-2">
                    We've sent a password reset link to <br />
                    <span className="text-content font-medium">{email}</span>
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Forms */}
        <AnimatePresence mode="wait">

          {/* Step 1: Email */}
          {step === 'email' && (
            <motion.form
              key="email-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleEmailContinue}
              className="space-y-4"
            >
              <div>
                <label htmlFor="email" className="block text-[13px] font-medium text-content mb-2">
                  Email address
                </label>
                <input
                  ref={emailRef}
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-background border border-line rounded-xl text-sm text-content placeholder:text-content-muted/40 focus:outline-none focus:border-neon/50 focus:ring-2 focus:ring-neon/10 transition-all"
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                disabled={!email.trim() || !isValidEmail}
                className="w-full py-3 rounded-xl bg-neon text-black font-bold text-sm transition-all hover:shadow-lg hover:shadow-neon/20 active:scale-[0.98] disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-[1px] bg-line" />
                <span className="text-[11px] text-content-muted uppercase tracking-wider font-medium">or</span>
                <div className="flex-1 h-[1px] bg-line" />
              </div>




            </motion.form>
          )}

          {/* Step 2: Password */}
          {step === 'password' && (
            <motion.form
              key="password-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSignIn}
              className="space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="text-[13px] font-medium text-content">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setStep('forgot_password'); setError(null); }}
                    className="text-[12px] text-neon font-medium hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    ref={passwordRef}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(null); }}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pr-11 bg-background border border-line rounded-xl text-sm text-content placeholder:text-content-muted/40 focus:outline-none focus:border-neon/50 focus:ring-2 focus:ring-neon/10 transition-all"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-content-muted hover:text-content transition-colors"
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
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/15">
                      <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-[13px] text-red-400 flex-1">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={!password.trim() || loading}
                className="w-full py-3 rounded-xl bg-neon text-black font-bold text-sm transition-all hover:shadow-lg hover:shadow-neon/20 active:scale-[0.98] disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>

              {/* Back */}
              <button
                type="button"
                onClick={() => { setStep('email'); setPassword(''); setError(null); }}
                className="w-full py-2 text-sm text-content-muted hover:text-content transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Back
              </button>
            </motion.form>
          )}

          {/* Step 3: Profile Setup */}
          {step === 'profile' && (
            <motion.div
              key="profile-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Avatar Preview */}
              <div className="flex justify-center mb-2">
                <div className="w-20 h-20 rounded-2xl bg-neon/10 flex items-center justify-center text-2xl font-black text-neon">
                  {profileName ? profileName.charAt(0).toUpperCase() : '?'}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-content mb-2">Display name</label>
                <input
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  placeholder="How should we call you?"
                  className="w-full px-4 py-3 bg-background border border-line rounded-xl text-sm text-content placeholder:text-content-muted/40 focus:outline-none focus:border-neon/50 focus:ring-2 focus:ring-neon/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-content mb-2">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-content-muted text-sm">@</span>
                  <input
                    value={profileHandle}
                    onChange={e => setProfileHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                    placeholder="username"
                    className="w-full pl-9 pr-4 py-3 bg-background border border-line rounded-xl text-sm text-content placeholder:text-content-muted/40 focus:outline-none focus:border-neon/50 focus:ring-2 focus:ring-neon/10 transition-all"
                  />
                  {profileHandle.length >= 3 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-content-muted mt-1.5">
                  This is your unique identifier. Letters, numbers, underscore.
                </p>
              </div>

              {/* Profile Error */}
              <AnimatePresence>
                {profileError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/15">
                      <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-[13px] text-red-400 flex-1">{profileError}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={submitProfile}
                disabled={!profileName.trim() || profileHandle.length < 3 || loading}
                className="w-full py-3 rounded-xl bg-neon text-black font-bold text-sm transition-all hover:shadow-lg hover:shadow-neon/20 active:scale-[0.98] disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Setting up...</span>
                  </>
                ) : (
                  <span>Get started</span>
                )}
              </button>
            </motion.div>
          )}
          {/* Step 4: Forgot Password */}
          {step === 'forgot_password' && (
            <motion.form
              key="forgot-password-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleForgotPassword}
              className="space-y-4"
            >
              <div>
                <label className="block text-[13px] font-medium text-content mb-2">Email address</label>
                <input
                  type="email"
                  value={email}
                  disabled={true}
                  className="w-full px-4 py-3 bg-background border border-line rounded-xl text-sm text-content-muted opacity-60 transition-all cursor-not-allowed"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/15 text-[13px] text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-neon text-black font-bold text-sm transition-all hover:shadow-lg hover:shadow-neon/20 active:scale-[0.98] disabled:opacity-25 flex items-center justify-center gap-2"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('password'); setError(null); }}
                className="w-full py-2 text-sm text-content-muted hover:text-content transition-colors flex items-center justify-center gap-1.5"
              >
                Back to login
              </button>
            </motion.form>
          )}

          {/* Step 5: Reset Sent */}
          {step === 'reset_sent' && (
            <motion.div
              key="reset-sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <button
                onClick={() => setStep('email')}
                className="w-full py-3 rounded-xl bg-neon text-black font-bold text-sm transition-all hover:shadow-lg hover:shadow-neon/20 active:scale-[0.98]"
              >
                Return to sign in
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sign Up Link */}
        {step !== 'profile' && (
          <p className="text-center text-sm text-content-muted mt-8">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-neon font-semibold hover:underline"
            >
              Sign up
            </button>
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-center gap-4 mt-6 text-[11px] text-content-muted/50">
          <button className="hover:text-content-muted transition-colors">Terms</button>
          <span>·</span>
          <button className="hover:text-content-muted transition-colors">Privacy</button>
          <span>·</span>
          <button className="hover:text-content-muted transition-colors">Help</button>
        </div>
      </motion.div>
    </div>
  );
};