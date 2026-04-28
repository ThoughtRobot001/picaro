import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/useAuth';
import { LoadingScreen } from '../components/ui/LoadingScreen';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell wraps the entire router. It shows the loading screen
 * while Supabase is resolving the session, preventing any route
 * (including the LandingPage redirect) from flashing before auth is ready.
 */
export function AppShell({ children }: AppShellProps) {
  const { user, loading: authLoading } = useAuth();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Not logged in — dismiss quickly
      setVisible(false);
      return;
    }

    // Logged in — hold for 1.2s minimum so the loading screen is seen
    const t = window.setTimeout(() => setVisible(false), 1200);
    return () => window.clearTimeout(t);
  }, [authLoading, user]);

  return (
    <>
      {visible && <LoadingScreen />}
      {/* Always render children so router/hooks initialise, but the
          loading screen sits on top (z-[1000]) until dismissed */}
      {children}
    </>
  );
}
