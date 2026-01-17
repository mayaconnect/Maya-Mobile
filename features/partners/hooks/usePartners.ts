import { useState, useEffect, useCallback } from 'react';
import { PartnerApi } from '../services/partnerApi';
import { Partner, PartnerQueryParams } from '../types';

export const usePartners = (initialFilters?: PartnerQueryParams) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPartners = useCallback(async (filters?: PartnerQueryParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await PartnerApi.getPartners(filters || initialFilters);
      setPartners(response.items);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des partenaires';
      setError(errorMessage);
      console.error('Erreur usePartners:', err);
    } finally {
      setLoading(false);
    }
  }, [initialFilters]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  return {
    partners,
    loading,
    error,
    refetch: fetchPartners,
  };
};

