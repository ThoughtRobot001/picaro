import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from './useAuth';

export function useUsage() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);

  const monthKey = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}`;
  })();

  useEffect(() => {
    if (!user) {
      setCount(0);
      setLoading(false);
      return;
    }

    void fetchUsage();
  }, [monthKey, user]);

  const fetchUsage = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('usage')
      .select('generation_count')
      .eq('user_id', user.id)
      .eq('month', monthKey)
      .maybeSingle();

    setCount(data?.generation_count ?? 0);
    setLoading(false);
  };

  const refresh = () => void fetchUsage();

  return { count, limit, loading, refresh };
}
