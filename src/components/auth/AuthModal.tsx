import React, { useState } from 'react';
import { X, Mail, Lock, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  inline?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  inline = false,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ── FIX 1: Google Sign In ─────────────────────────────
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/app`,
      },
    });
    if (error) setError(error.message);
  };

  // ── FIX 2: Email & Password Validation ───────────────
  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (mode === 'signup') {
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return false;
      }
      if (!/[A-Z]/.test(password)) {
        setError('Password must contain at least one uppercase letter');
        return false;
      }
      if (!/[0-9]/.test(password)) {
        setError('Password must contain at least one number');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // ── FIX 5: use email as trigger for confirmation screen
        setSuccess(email);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onSuccess();
        if (!inline) onClose();
      }
    } catch (err: any) {
      // ── FIX 3: Friendly error messages ─────────────────
      const message = err.message || '';
      if (message.includes('Invalid login credentials')) {
        setError('Incorrect email or password');
      } else if (message.includes('Email not confirmed')) {
        setError('Please confirm your email first. Check your inbox.');
      } else if (message.includes('User already registered')) {
        setError('An account with this email already exists. Sign in instead.');
      } else if (message.includes('Password should be')) {
        setError('Password is too weak. Use at least 8 characters.');
      } else if (message.includes('rate limit')) {
        setError('Too many attempts. Please wait a minute and try again.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── FIX 5: Email confirmation screen ─────────────────
  const confirmationScreen = (
    <div className="flex flex-col items-center text-center px-6 py-8 gap-4">
      <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
        <Mail size={20} className="text-emerald-500" />
      </div>
      <div>
        <h3 className="font-mono text-[13px] font-bold uppercase tracking-wider text-white/80 mb-1">
          Check your email
        </h3>
        <p className="text-white/40 text-[13px] leading-relaxed">
          We sent a confirmation link to
          <br />
          <span className="text-white/60">{success}</span>
        </p>
      </div>
      <p className="text-white/20 text-[11px] font-mono">
        Click the link in your email to activate your account
      </p>
      <button
        type="button"
        onClick={() => {
          setSuccess(null);
          setMode('login');
        }}
        className="font-mono text-[11px] uppercase tracking-wider text-emerald-500 hover:text-emerald-400 transition-colors"
      >
        Back to sign in
      </button>
    </div>
  );

  /** Shared form content */
  const formContent = success ? confirmationScreen : (
    <div className="flex flex-col gap-3 px-6 py-5">
      {error && (
        <div className="text-[11px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2 font-mono">
          {error}
        </div>
      )}

      {/* ── FIX 1: Google Sign In Button ─────────────── */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full h-10 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-colors flex items-center justify-center gap-3 font-mono text-[12px] text-white/60 hover:text-white/80"
      >
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M15.68 8.18c0-.57-.05-1.11-.14-1.64H8v3.1h4.31a3.68 3.68 0 01-1.6 2.42v2h2.58c1.51-1.39 2.39-3.44 2.39-5.88z" fill="#4285F4"/>
          <path d="M8 16c2.16 0 3.97-.72 5.3-1.94l-2.58-2a4.8 4.8 0 01-7.15-2.52H.96v2.07A8 8 0 008 16z" fill="#34A853"/>
          <path d="M3.57 9.54A4.8 4.8 0 013.32 8c0-.54.09-1.06.25-1.54V4.39H.96A8 8 0 000 8c0 1.29.31 2.51.96 3.61l2.61-2.07z" fill="#FBBC05"/>
          <path d="M8 3.18c1.22 0 2.31.42 3.17 1.24l2.37-2.37A8 8 0 00.96 4.39L3.57 6.46A4.77 4.77 0 018 3.18z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="font-mono text-[10px] text-white/20 uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[10px] uppercase tracking-wider text-white/30">
          Email
        </label>
        <div className="relative">
          <Mail
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            placeholder="you@example.com"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2.5 text-[13px] text-white placeholder-white/20 outline-none focus:border-white/20 transition-colors font-mono"
          />
        </div>
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[10px] uppercase tracking-wider text-white/30">
          Password
        </label>
        <div className="relative">
          <Lock
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            placeholder="••••••••"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2.5 text-[13px] text-white placeholder-white/20 outline-none focus:border-white/20 transition-colors font-mono"
          />
        </div>
      </div>

      {/* ── FIX 4: Password Strength Indicator ────────── */}
      {mode === 'signup' && password.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-1">
            {[
              password.length >= 8,
              /[A-Z]/.test(password),
              /[0-9]/.test(password),
              /[^A-Za-z0-9]/.test(password),
            ].map((met, i) => (
              <div
                key={i}
                className="flex-1 h-1 rounded-full transition-all duration-300"
                style={{
                  background: met
                    ? i < 2 ? '#f59e0b'
                      : i < 3 ? '#12b76a'
                      : '#0ea5e9'
                    : 'rgba(255,255,255,0.08)',
                }}
              />
            ))}
          </div>
          <span className="font-mono text-[10px] text-white/30">
            {password.length < 8
              ? 'Too short'
              : !/[A-Z]/.test(password)
              ? 'Add uppercase letter'
              : !/[0-9]/.test(password)
              ? 'Add a number'
              : 'Strong password ✓'}
          </span>
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        disabled={loading}
        onClick={handleSubmit}
        className="flex items-center justify-center gap-2 w-full h-10 rounded-lg font-mono text-[11px] uppercase tracking-wider font-bold transition-all disabled:opacity-50 mt-1"
        style={{
          background: 'linear-gradient(135deg, #12b76a 0%, #0ea5e9 100%)',
          color: '#fff',
          boxShadow: '0 0 18px rgba(18,183,106,0.25)',
        }}
      >
        {loading && <Loader2 size={13} className="animate-spin" />}
        {mode === 'login' ? 'Sign In' : 'Create Account'}
      </button>

      {/* Toggle mode */}
      <button
        type="button"
        onClick={() => {
          setMode(mode === 'login' ? 'signup' : 'login');
          setError(null);
          setSuccess(null);
          setPassword('');
        }}
        className="font-mono text-[10px] uppercase tracking-wider text-white/25 hover:text-white/50 transition-colors text-center mt-1"
      >
        {mode === 'login'
          ? "Don't have an account? Sign up"
          : 'Already have an account? Sign in'}
      </button>
    </div>
  );

  /** ── Inline mode: render card content only, no overlay ── */
  if (inline) {
    return (
      <div className="flex flex-col rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div>
            <h2 className="font-mono text-[13px] font-bold uppercase tracking-[0.16em] text-white/80">
              {success ? 'Email Sent' : mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="font-mono text-[10px] text-white/30 mt-0.5 uppercase tracking-wider">
              Picora AI
            </p>
          </div>
        </div>
        {formContent}
      </div>
    );
  }

  /** ── Modal mode: overlay + card ── */
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(12px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative flex flex-col rounded-2xl border border-white/[0.08] shadow-2xl w-full max-w-sm mx-4"
        style={{ background: '#0a0a0c' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div>
            <h2 className="font-mono text-[13px] font-bold uppercase tracking-[0.16em] text-white/80">
              {success ? 'Email Sent' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </h2>
            <p className="font-mono text-[10px] text-white/30 mt-0.5 uppercase tracking-wider">
              Picaro AI
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        {formContent}
      </div>
    </div>
  );
};
