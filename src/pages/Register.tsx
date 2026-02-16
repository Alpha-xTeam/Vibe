import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export const Register = () => {
  const { signUp, refresh } = useAuth();
  const [step, setStep] = useState<'email' | 'password' | 'profile' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [profileName, setProfileName] = useState('');
  const [profileHandle, setProfileHandle] = useState('');
  const [profileError, setProfileError] = useState('');

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const API_URL = (import.meta as any).env.VITE_API_URL;

  useEffect(() => {
    if (step === 'email') setTimeout(() => emailRef.current?.focus(), 100);
    if (step === 'password') setTimeout(() => passwordRef.current?.focus(), 100);
    if (step === 'profile') setTimeout(() => nameRef.current?.focus(), 100);
  }, [step]);

  const isValidEmail = email.includes('@') && email.includes('.');

  const passwordStrength = (() => {
    if (password.length === 0) return { level: 0, label: '', color: '' };
    if (password.length < 6) return { level: 1, label: 'Too short', color: 'bg-red-400' };
    if (password.length < 8) return { level: 2, label: 'Fair', color: 'bg-yellow-400' };
    if (password.length < 12) return { level: 3, label: 'Good', color: 'bg-neon/60' };
    return { level: 4, label: 'Strong', color: 'bg-neon' };
  })();

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleEmailContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail) return;
    setError(null);
    setStep('password');
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const data = await signUp(email, password);
      if (data.session) {
        setProfileHandle(email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase());
        setStep('profile');
      } else {
        setStep('success');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
    if (!/^[a-zA-Z0-9_]{4,30}$/.test(profileHandle)) {
      setProfileError('Username: 4-30 chars, letters, numbers, underscore');
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

  // Step indicator
  const steps = ['Account', 'Password', 'Profile'];
  const currentStepIndex = step === 'email' ? 0 : step === 'password' ? 1 : 2;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full blur-[160px] opacity-[0.04]" style={{ background: 'var(--color-neon)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
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
                  <h1 className="text-2xl font-bold text-content">Create your account</h1>
                  <p className="text-sm text-content-muted mt-2">Start your journey on Vibe</p>
                </>
              )}
              {step === 'password' && (
                <>
                  <h1 className="text-2xl font-bold text-content">Set your password</h1>
                  <button onClick={() => setStep('email')} className="text-sm text-neon mt-2 hover:underline inline-flex items-center gap-1">
                    {email}
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </>
              )}
              {step === 'profile' && (
                <>
                  <h1 className="text-2xl font-bold text-content">Welcome to Vibe</h1>
                  <p className="text-sm text-content-muted mt-2">Let's set up your profile</p>
                </>
              )}
              {step === 'success' && (
                <>
                  <h1 className="text-2xl font-bold text-content">Check your email</h1>
                  <p className="text-sm text-content-muted mt-2">We sent a confirmation link</p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step Indicator */}
        {step !== 'success' && (
          <div className="flex items-center gap-2 mb-8">
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2 flex-1">
                  <div className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center transition-all shrink-0 ${i < currentStepIndex
                      ? 'bg-neon text-black'
                      : i === currentStepIndex
                        ? 'bg-neon/15 text-neon border border-neon/30'
                        : 'bg-line/50 text-content-muted'
                    }`}>
                    {i < currentStepIndex ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className={`text-[11px] font-medium hidden sm:block ${i <= currentStepIndex ? 'text-content' : 'text-content-muted/50'
                    }`}>
                    {s}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-[1px] transition-colors ${i < currentStepIndex ? 'bg-neon' : 'bg-line'
                    }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Forms */}
        <AnimatePresence mode="wait">

          {/* Step 1: Email */}
          {step === 'email' && (
            <motion.form
              key="email"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleEmailContinue}
              className="space-y-4"
            >
              <div>
                <label className="block text-[13px] font-medium text-content mb-2">Email address</label>
                <input
                  ref={emailRef}
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
                disabled={!isValidEmail}
                className="w-full py-3 rounded-xl bg-neon text-black font-bold text-sm transition-all hover:shadow-lg hover:shadow-neon/20 active:scale-[0.98] disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>



            </motion.form>
          )}

          {/* Step 2: Password */}
          {step === 'password' && (
            <motion.form
              key="password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleCreateAccount}
              className="space-y-4"
            >
              {/* Password */}
              <div>
                <label className="block text-[13px] font-medium text-content mb-2">Password</label>
                <div className="relative">
                  <input
                    ref={passwordRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(null); }}
                    placeholder="At least 6 characters"
                    className="w-full px-4 py-3 pr-11 bg-background border border-line rounded-xl text-sm text-content placeholder:text-content-muted/40 focus:outline-none focus:border-neon/50 focus:ring-2 focus:ring-neon/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" />
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>

                {/* Strength Meter */}
                {password.length > 0 && (
                  <div className="flex items-center gap-2.5 mt-2.5">
                    <div className="flex-1 flex gap-1 h-1">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength.level ? passwordStrength.color : 'bg-line'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-content-muted font-medium whitespace-nowrap">
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[13px] font-medium text-content mb-2">Confirm password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setError(null); }}
                    placeholder="Repeat your password"
                    className={`w-full px-4 py-3 pr-10 bg-background border rounded-xl text-sm text-content placeholder:text-content-muted/40 focus:outline-none transition-all ${passwordsMismatch
                        ? 'border-red-400/50 focus:border-red-400/50 focus:ring-2 focus:ring-red-400/10'
                        : passwordsMatch
                          ? 'border-green-400/50 focus:border-green-400/50 focus:ring-2 focus:ring-green-400/10'
                          : 'border-line focus:border-neon/50 focus:ring-2 focus:ring-neon/10'
                      }`}
                  />
                  {confirmPassword.length > 0 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {passwordsMatch ? (
                        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  )}
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

              {/* Terms */}
              <p className="text-[11px] text-content-muted/60 leading-relaxed">
                By creating an account, you agree to our{' '}
                <button className="text-content-muted hover:text-neon transition-colors">Terms</button>
                {' '}and{' '}
                <button className="text-content-muted hover:text-neon transition-colors">Privacy Policy</button>.
              </p>

              <button
                type="submit"
                disabled={password.length < 6 || !passwordsMatch || loading}
                className="w-full py-3 rounded-xl bg-neon text-black font-bold text-sm transition-all hover:shadow-lg hover:shadow-neon/20 active:scale-[0.98] disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create account</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep('email'); setError(null); }}
                className="w-full py-2 text-sm text-content-muted hover:text-content transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Back
              </button>
            </motion.form>
          )}

          {/* Step 3: Profile */}
          {step === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Avatar */}
              <div className="flex justify-center mb-2">
                <div className="w-20 h-20 rounded-2xl bg-neon/10 flex items-center justify-center text-3xl font-black text-neon">
                  {profileName ? profileName.charAt(0).toUpperCase() : '?'}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-content mb-2">Display name</label>
                <input
                  ref={nameRef}
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
                    className="w-full pl-9 pr-10 py-3 bg-background border border-line rounded-xl text-sm text-content placeholder:text-content-muted/40 focus:outline-none focus:border-neon/50 focus:ring-2 focus:ring-neon/10 transition-all"
                  />
                  {profileHandle.length >= 4 && (
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <p className="text-[11px] text-content-muted mt-1.5">Letters, numbers, underscore. 4-30 characters.</p>
              </div>

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
                disabled={!profileName.trim() || profileHandle.length < 4 || loading}
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
                  <span>Start exploring</span>
                )}
              </button>
            </motion.div>
          )}

          {/* Step 4: Email Confirmation */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-neon/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>

              <p className="text-sm text-content-muted leading-relaxed max-w-xs mx-auto mb-6">
                We sent a verification link to
                <br />
                <span className="text-content font-semibold">{email}</span>
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 rounded-xl bg-neon text-black font-bold text-sm hover:shadow-lg hover:shadow-neon/20 active:scale-[0.98] transition-all"
                >
                  Go to Sign in
                </button>
                <button
                  onClick={() => { setStep('email'); setPassword(''); setConfirmPassword(''); }}
                  className="w-full py-2 text-sm text-content-muted hover:text-content transition-colors"
                >
                  Use a different email
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sign In Link */}
        {(step === 'email' || step === 'password') && (
          <p className="text-center text-sm text-content-muted mt-8">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-neon font-semibold hover:underline">
              Sign in
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

/* ═══════════════════════════════
   Sub Components
   ═══════════════════════════════ */

function SocialButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-line hover:border-neon/20 hover:bg-surface transition-all text-sm font-medium text-content"
    >
      {icon}
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}