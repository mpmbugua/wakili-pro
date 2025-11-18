import { useEffect, useState } from 'react';
import axios from 'axios';

export function useSubscriptionStatus(userId: string) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    axios.get('/api/lawyer-subscriptions/subscriptions/status', { params: { userId } })
      .then(res => {
        if (mounted) setStatus(res.data.subscription?.status || null);
      })
      .catch(() => {
        if (mounted) setStatus(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [userId]);

  return { status, loading };
}
