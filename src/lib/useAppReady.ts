import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useStore } from '../store/useStore';

export function useAppReady() {
  const { user, loading: authLoading } = useAuth();
  const { pages } = useStore();
  const [dbLoaded, setDbLoaded] = useState(false);
  const [ready, setReady] = useState(false);

  // Wait for auth to resolve
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Not logged in — no DB to load
      setReady(true);
      return;
    }

    // Auth resolved and user exists
    // Give DB sync a moment to load pages
    const timeout = window.setTimeout(() => {
      setDbLoaded(true);
    }, 1500); // 1.5s max wait for DB

    return () => window.clearTimeout(timeout);
  }, [authLoading, user]);

  // Also mark ready when pages have loaded
  // from database (canvasDataURL populated)
  useEffect(() => {
    if (!user) return;
    const hasLoadedPages = pages.some(
      (p) => p.canvasDataURL !== null || p.aiResult !== null
    );
    if (hasLoadedPages) {
      setDbLoaded(true);
    }
  }, [pages, user]);

  useEffect(() => {
    if (!authLoading && dbLoaded) {
      // Small delay for smooth transition
      const t = window.setTimeout(() => {
        setReady(true);
      }, 300);
      return () => window.clearTimeout(t);
    }
  }, [authLoading, dbLoaded]);

  return ready;
}
