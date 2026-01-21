import { useState, useEffect, useCallback } from 'react';
import { ProfileApi } from '../services/profileApi';
import { UserProfile } from '../types';
import { useAuth } from '@/hooks/use-auth';

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setError('Utilisateur non connecté');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const userProfile = await ProfileApi.getCurrentUser();
      setProfile(userProfile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement du profil';
      setError(errorMessage);
      console.error('Erreur useProfile:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      const updated = await ProfileApi.updateProfile(user.id, updates);
      setProfile(updated);
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du profil';
      setError(errorMessage);
      console.error('Erreur useProfile updateProfile:', err);
      throw err;
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile,
  };
};

