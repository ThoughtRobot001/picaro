import React, { useState } from 'react';
import { X, Mail, Lock, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(
    'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccess(
          'Account created! Check your email to confirm.'
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

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
              {mode === 'login' ? 'Sign In' : 'Create Account'}
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

        {/* Form */}
        <div className="flex flex-col gap-3 px-6 py-5">
          {error && (
            <div className="text-[11px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2 font-mono">
              {error}
            </div>
          )}
          {success && (
            <div className="text-[11px] text-emerald-400 bg-emerald-400/10 rounded-lg px-3 py-2 font-mono">
              {success}
            </div>
          )}

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
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                }}
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
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                }}
                placeholder="••••••••"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2.5 text-[13px] text-white placeholder-white/20 outline-none focus:border-white/20 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="flex items-center justify-center gap-2 w-full h-10 rounded-lg font-mono text-[11px] uppercase tracking-wider font-bold transition-all disabled:opacity-50 mt-1"
            style={{
              background:
                'linear-gradient(135deg, #12b76a 0%, #0ea5e9 100%)',
              color: '#fff',
              boxShadow:
                '0 0 18px rgba(18,183,106,0.25)',
            }}
          >
            {loading && (
              <Loader2 size={13} className="animate-spin" />
            )}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {/* Toggle mode */}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError(null);
              setSuccess(null);
            }}
            className="font-mono text-[10px] uppercase tracking-wider text-white/25 hover:text-white/50 transition-colors text-center mt-1"
          >
            {mode === 'login'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};
