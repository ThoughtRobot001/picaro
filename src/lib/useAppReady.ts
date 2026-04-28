import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

type AppReadyState = 'loading' | 'ready' | 'unauthenticated';

export function useAppReady(): AppReadyState {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<AppReadyState>('loading');
  // Track whether we've already committed to a state so we don't re-run
  const settled = useRef(false);

  useEffect(() => {
    // Still waiting for Supabase to check the session
    if (authLoading) return;

    if (settled.current) return;

    if (!user) {
      // Auth resolved — not logged in
      settled.current = true;
      setState('unauthenticated');
      return;
    }

    // User is logged in. Show the loading screen for at least 1.2s
    // so it's visible even on fast connections, then mark ready.
    const minDisplayTimer = window.setTimeout(() => {
      settled.current = true;
      setState('ready');
    }, 1200);

    return () => window.clearTimeout(minDisplayTimer);
  }, [authLoading, user]);

  return state;
}
