import { useState, useEffect, useCallback } from 'react';
import { SubscriptionApi } from '../services/subscriptionApi';
import { ActiveSubscription } from '../types';

export const useSubscription = () => {
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const hasSubscription = await SubscriptionApi.hasActiveSubscription();
      setHasActiveSubscription(hasSubscription);
      
      if (hasSubscription) {
        const subscription = await SubscriptionApi.getMySubscription();
        setActiveSubscription(subscription);
      } else {
        setActiveSubscription(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de l\'abonnement';
      setError(errorMessage);
      console.error('Erreur useSubscription:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    hasActiveSubscription,
    activeSubscription,
    loading,
    error,
    refetch: fetchSubscription,
  };
};

