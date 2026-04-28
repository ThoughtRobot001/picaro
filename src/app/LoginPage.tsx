import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import { AuthModal } from '../components/auth/AuthModal';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // If already logged in go straight to app
  useEffect(() => {
    if (!loading && user) navigate('/app');
  }, [user, loading, navigate]);

  if (loading) return null;

  return (
    <div
      className="min-h-screen bg-[#050506] flex flex-col items-center justify-center"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-1 mb-8">
        <span className="font-mono text-[18px] font-bold text-white">
          Picora
        </span>
        <span className="font-mono text-[18px] font-bold text-emerald-500">
          .art
        </span>
      </div>

      {/* Auth card — always visible, no modal overlay */}
      <div
        className="w-full max-w-sm mx-4 rounded-2xl border border-white/[0.08] shadow-2xl"
        style={{ background: '#0a0a0c' }}
      >
        <AuthModal
          isOpen={true}
          onClose={() => navigate('/')}
          onSuccess={() => navigate('/app')}
          inline={true}
        />
      </div>

      {/* Back to landing */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className="mt-6 font-mono text-[11px] uppercase tracking-wider text-white/20 hover:text-white/40 transition-colors"
      >
        ← Back to home
      </button>
    </div>
  );
}
