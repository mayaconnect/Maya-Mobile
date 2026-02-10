import { useState, useCallback, useMemo, useEffect } from 'react';
import { Alert } from 'react-native';
import { StoreOperatorsApi } from '../services/storeOperatorsApi';
import { StoresApi } from '@/features/stores-map/services/storesApi';

export function useStoreManagement(
  stores: any[],
  transactions: any[]
) {
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [activeStore, setActiveStore] = useState<any | null>(null);
  const [showActiveStoreSelection, setShowActiveStoreSelection] = useState(false);
  const [loadingActiveStore, setLoadingActiveStore] = useState(false);
  const [hasTriedLoadActiveStore, setHasTriedLoadActiveStore] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>(undefined);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [storeDetailLoading, setStoreDetailLoading] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');

  const loadActiveStore = useCallback(async () => {
    console.log('🏪 [Partner Home] Vérification du store actif...');
    setLoadingActiveStore(true);
    setHasTriedLoadActiveStore(true);
    try {
      const activeStoreData = await StoreOperatorsApi.getActiveStore();
      console.log('📦 [Partner Home] Réponse API getActiveStore:', activeStoreData);
      
      // L'API retourne { id, userId, storeId, ... } - on doit utiliser storeId
      const storeId = activeStoreData?.storeId || activeStoreData?.id;
      
      if (activeStoreData && storeId) {
        console.log('✅ [Partner Home] Store actif trouvé, storeId:', storeId);
        
        // Chercher le store dans la liste des stores chargés
        const storeFromList = stores.find((s: any) => s.id === storeId || s.storeId === storeId);
        
        if (storeFromList) {
          setActiveStoreId(storeId);
          setActiveStore(storeFromList);
          setSelectedStoreId(storeId);
          setShowActiveStoreSelection(false);
          console.log('✅ [Partner Home] Store actif configuré:', storeId, storeFromList.name || storeFromList.partner?.name);
        } else {
          // Le store n'est pas dans la liste, on utilise les données de l'API
          console.warn('⚠️ [Partner Home] Store actif non trouvé dans la liste, utilisation des données API');
          setActiveStoreId(storeId);
          setActiveStore(activeStoreData);
          setSelectedStoreId(storeId);
          setShowActiveStoreSelection(false);
        }
      } else {
        console.log('⚠️ [Partner Home] Aucun store actif trouvé dans la réponse');
        // Pas de store actif trouvé, on affiche le modal seulement si on a des stores disponibles
        if (stores.length > 0) {
          setShowActiveStoreSelection(true);
        }
      }
    } catch (error) {
      console.error('❌ [Partner Home] Erreur lors du chargement du store actif:', error);
      // En cas d'erreur, on affiche le modal seulement si on a des stores disponibles
      if (stores.length > 0) {
        setShowActiveStoreSelection(true);
      }
    } finally {
      setLoadingActiveStore(false);
    }
  }, [stores]);

  // Charger automatiquement le store actif quand les stores sont disponibles
  useEffect(() => {
    if (stores.length > 0 && !hasTriedLoadActiveStore && !activeStoreId && !loadingActiveStore) {
      console.log('🏪 [Partner Home] Chargement automatique du store actif...');
      loadActiveStore();
    }
  }, [stores.length, hasTriedLoadActiveStore, activeStoreId, loadingActiveStore, loadActiveStore]);

  const handleSetActiveStore = useCallback(async (storeId: string) => {
    console.log('🏪 [Partner Home] Définition du store actif:', storeId);
    
    if (activeStoreId === storeId) {
      setShowActiveStoreSelection(false);
      return;
    }
    
    setLoadingActiveStore(true);
    setShowActiveStoreSelection(false);
    
    try {
      const activeStoreData = await StoreOperatorsApi.setActiveStore(storeId);
      const finalStoreId = activeStoreData?.id || activeStoreData?.storeId || storeId;
      
      if (finalStoreId) {
        const storeFromList = stores.find((s: any) => s.id === finalStoreId);
        const storeToSet = storeFromList || activeStoreData;
        
        setActiveStoreId(finalStoreId);
        setActiveStore(storeToSet);
        setSelectedStoreId(finalStoreId);
      } else {
        throw new Error('Réponse API invalide - pas d\'ID de store trouvé');
      }
    } catch (error) {
      console.error('❌ [Partner Home] Erreur lors de la définition du store actif:', error);
      if (!activeStoreId) {
        setShowActiveStoreSelection(true);
      }
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      Alert.alert('Erreur', `Impossible de définir le store actif: ${errorMessage}`);
    } finally {
      setLoadingActiveStore(false);
    }
  }, [activeStoreId, stores]);

  const handleStoreSelect = useCallback(async (store: any) => {
    console.log('🔍 [Partner Home] Affichage des détails du store:', store.id);
    setSelectedStore(store);
    setShowStoreModal(true);
    setStoreDetailLoading(true);

    try {
      const storeDetails = await StoresApi.getStoreById(store.id);
      
      try {
        const storeTransactions = transactions.filter(
          t => t.storeId === store.id || t.store?.id === store.id
        );
        
        const totalScans = storeTransactions.length;
        const totalRevenue = storeTransactions.reduce((sum, t) => sum + (t.amountNet || t.amountAfterDiscount || t.amountGross || 0), 0);
        
        const uniqueClientIds = new Set(
          storeTransactions
            .map(t => t.clientId || t.customerId || t.client?.id || t.customer?.id)
            .filter(Boolean)
        );
        const clientsCount = uniqueClientIds.size;
        
        const enrichedStore = {
          ...storeDetails,
          totalScans,
          totalRevenue,
          clientsCount,
        };
        
        setSelectedStore(enrichedStore);
      } catch (statsError) {
        console.warn('⚠️ [Partner Home] Erreur lors du calcul des statistiques:', statsError);
        setSelectedStore(storeDetails);
      }
    } catch (error) {
      console.error('❌ [Partner Home] Erreur lors du chargement des détails:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du store');
    } finally {
      setStoreDetailLoading(false);
    }
  }, [transactions]);

  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      const storeName = (store.name || store.partner?.name || '').toLowerCase();
      const category = (store.category || store.partner?.category || '').toLowerCase();
      const address = (store.address?.street || store.address?.city || '').toLowerCase();
      const matchesSearch = 
        storeName.includes(storeSearchQuery.toLowerCase()) ||
        category.includes(storeSearchQuery.toLowerCase()) ||
        address.includes(storeSearchQuery.toLowerCase());
      
      return matchesSearch;
    });
  }, [stores, storeSearchQuery]);

  return {
    activeStoreId,
    setActiveStoreId,
    activeStore,
    showActiveStoreSelection,
    setShowActiveStoreSelection,
    loadingActiveStore,
    loadActiveStore,
    handleSetActiveStore,
    selectedStoreId,
    setSelectedStoreId,
    selectedStore,
    showStoreModal,
    setShowStoreModal,
    storeDetailLoading,
    handleStoreSelect,
    storeSearchQuery,
    setStoreSearchQuery,
    filteredStores,
  };
}

