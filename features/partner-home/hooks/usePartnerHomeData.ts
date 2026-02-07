import { TransactionsApi } from '@/features/home/services/transactionsApi';
import { StoresApi } from '@/features/stores-map/services/storesApi';
import { AuthService } from '@/services/auth.service';
import { useCallback, useEffect, useState } from 'react';

export function usePartnerHomeData(user: any, activeStoreId: string | null, selectedStoreId: string | undefined, filterPeriod: 'all' | 'today' | 'week' | 'month', selectedTab: string, showActiveStoreSelection: boolean) {
  // États pour les clients
  const [clients, setClients] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);

  // État pour les scans détaillés
  const [scans, setScans] = useState<any[]>([]);
  const [scansLoading, setScansLoading] = useState(false);
  const [scansError, setScansError] = useState<string | null>(null);
  
  // État pour les statistiques de clients
  const [topCustomers, setTopCustomers] = useState<Array<{
    customerId: string;
    customerName: string;
    visitCount: number;
    totalAmount: number;
  }>>([]);

  // États pour les transactions du partenaire
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  // États pour les stores
  const [stores, setStores] = useState<any[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);

  // États pour les statistiques de scans
  const [scanCounts, setScanCounts] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0,
  });
  const [scanCountsLoading, setScanCountsLoading] = useState(false);

  const loadClients = useCallback(async () => {
    setClientsLoading(true);
    setClientsError(null);
    try {
      setClients([]);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      setClientsError('Impossible de charger les clients');
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  }, []);

  const loadScans = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      setScansLoading(true);
      setScansError(null);

      let partnerId: string | undefined;
      const currentStoreId = activeStoreId || selectedStoreId;
      
      if (currentStoreId) {
        const currentStore = stores.find((s: any) => s.id === currentStoreId);
        if (currentStore) {
          partnerId = currentStore.partnerId || currentStore.partner?.id;
        }
      } else if (stores.length > 0) {
        const firstStore = stores[0];
        partnerId = firstStore.partnerId || firstStore.partner?.id;
      }

      let response;
      if (partnerId) {
        response = await TransactionsApi.getPartnerTransactions(partnerId, {
          page: 1,
          pageSize: 1000,
          storeId: currentStoreId,
        });
      } else {
        response = await TransactionsApi.getUserTransactions(user.id, {
          page: 1,
          pageSize: 1000,
        });
      }

      const scansData = response.items || [];
      setScans(scansData);

      const customerStats = new Map<string, {
        customerId: string;
        customerName: string;
        visitCount: number;
        totalAmount: number;
      }>();

      scansData.forEach((scan: any) => {
        const customerId = scan.customerUserId || scan.customerId || scan.clientId || scan.client?.id || scan.customer?.id;
        const customerName = scan.customerName || 
                            scan.clientName || 
                            `${scan.customer?.firstName || scan.client?.firstName || ''} ${scan.customer?.lastName || scan.client?.lastName || ''}`.trim() ||
                            'Client inconnu';
        const amount = scan.amountNet || scan.amountAfterDiscount || scan.amountGross || scan.amount || 0;

        if (customerId) {
          if (customerStats.has(customerId)) {
            const existing = customerStats.get(customerId)!;
            existing.visitCount += 1;
            existing.totalAmount += amount;
          } else {
            customerStats.set(customerId, {
              customerId,
              customerName: customerName || 'Client inconnu',
              visitCount: 1,
              totalAmount: amount,
            });
          }
        }
      });

      const topCustomersList = Array.from(customerStats.values())
        .sort((a, b) => b.visitCount - a.visitCount)
        .slice(0, 10);

      setTopCustomers(topCustomersList);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des scans:', error);
      setScansError('Impossible de charger les scans');
      setScans([]);
      setTopCustomers([]);
    } finally {
      setScansLoading(false);
    }
  }, [user, activeStoreId, selectedStoreId, stores]);

  const loadPartnerTransactions = useCallback(async () => {
    if (!user?.id) {
      setTransactionsError('Utilisateur non connecté');
      setTransactionsLoading(false);
      return;
    }

    try {
      setTransactionsLoading(true);
      setTransactionsError(null);

      let startDate: string | undefined;
      const now = new Date();

      // Pour les stats, ne pas filtrer par période pour avoir toutes les données
      if (selectedTab !== 'stats') {
        if (filterPeriod === 'today') {
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          startDate = todayStart.toISOString();
        } else if (filterPeriod === 'week') {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          weekAgo.setHours(0, 0, 0, 0);
          startDate = weekAgo.toISOString();
        } else if (filterPeriod === 'month') {
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          monthAgo.setHours(0, 0, 0, 0);
          startDate = monthAgo.toISOString();
        }
      }

      let partnerId: string | undefined;
      const currentStoreId = activeStoreId || selectedStoreId;
      
      if (currentStoreId) {
        const currentStore = stores.find((s: any) => s.id === currentStoreId);
        if (currentStore) {
          partnerId = currentStore.partnerId || currentStore.partner?.id;
        }
      }

      if (!partnerId || !currentStoreId) {
        setTransactions([]);
        setTransactionsError('Veuillez sélectionner un magasin actif pour voir l\'historique');
        return;
      }

      // Pour les stats, charger plus de transactions (1000 au lieu de 100)
      const response = await TransactionsApi.getPartnerTransactions(partnerId, {
        page: 1,
        pageSize: selectedTab === 'stats' ? 1000 : 100,
        storeId: currentStoreId,
        startDate: startDate,
      });
      
      const filteredTransactions = (response.items || []).filter((transaction: any) => {
        const transactionStoreId = transaction.storeId || transaction.store?.id;
        return transactionStoreId === currentStoreId;
      });

      setTransactions(filteredTransactions);
    } catch (err) {
      console.error('❌ [Partner History] Erreur lors du chargement des transactions:', err);
      let errorMessage = 'Erreur lors du chargement';

      if (err instanceof Error) {
        if (err.message.includes('401')) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        } else if (err.message.includes('403')) {
          errorMessage = 'Accès refusé.';
        } else {
          errorMessage = err.message;
        }
      }

      setTransactionsError(errorMessage);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  }, [user, filterPeriod, activeStoreId, selectedStoreId, stores, selectedTab]);

  const loadStores = useCallback(async () => {
    console.log('🏪 [Partner Home] Chargement des stores depuis /auth/me...');
    setStoresLoading(true);
    setStoresError(null);
    try {
      const userInfo = await AuthService.getCurrentUserInfo();

      const userStores =
        (userInfo as any).stores ||
        (userInfo as any).partnerStores ||
        (userInfo as any).operatorStores ||
        (userInfo as any).myStores ||
        (userInfo as any).partnerData?.operatorStores ||
        (userInfo as any).partnerData?.stores ||
        [];

      if (!Array.isArray(userStores) || userStores.length === 0) {
        setStores([]);
        setStoresError('Aucun magasin trouvé pour votre compte');
        return;
      }

      const storesWithDetails = await Promise.all(
        userStores.map(async (store: any) => {
          try {
            const storeDetails = await StoresApi.getStoreById(store.id);
            return storeDetails;
          } catch (error) {
            console.warn(`⚠️ [Partner Home] Impossible de charger les détails du store ${store.id}:`, error);
            return store;
          }
        })
      );

      setStoresError(null);
      setStores(storesWithDetails);
    } catch (error) {
      console.error('❌ [Partner Home] Erreur lors du chargement des stores:', error);
      if (error instanceof Error) {
        setStoresError(`Erreur: ${error.message}`);
      } else {
        setStoresError('Impossible de charger les stores');
      }
      setStores([]);
    } finally {
      setStoresLoading(false);
    }
  }, []);

  const loadScanCounts = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    console.log('📊 [Partner Home] Chargement des statistiques de scans...');
    setScanCountsLoading(true);

    try {
      const userInfo = await AuthService.getCurrentUserInfo();
      const partnerId = 
        (userInfo as any).partnerId || 
        (userInfo as any).partner?.id || 
        (userInfo as any).partnerData?.id ||
        userInfo.id;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(now);
      monthStart.setMonth(monthStart.getMonth() - 30);

      const [todayCount, weekCount, monthCount, totalCount] = await Promise.all([
        TransactionsApi.getScanCount(partnerId, activeStoreId || selectedStoreId, todayStart.toISOString()),
        TransactionsApi.getScanCount(partnerId, activeStoreId || selectedStoreId, weekStart.toISOString()),
        TransactionsApi.getScanCount(partnerId, activeStoreId || selectedStoreId, monthStart.toISOString()),
        TransactionsApi.getScanCount(partnerId, activeStoreId || selectedStoreId),
      ]);

      setScanCounts({
        today: parseInt(todayCount, 10) || 0,
        week: parseInt(weekCount, 10) || 0,
        month: parseInt(monthCount, 10) || 0,
        total: parseInt(totalCount, 10) || 0,
      });
    } catch (error) {
      console.error('❌ [Partner Home] Erreur lors du chargement des statistiques de scans:', error);
      setScanCounts({
        today: 0,
        week: 0,
        month: 0,
        total: 0,
      });
    } finally {
      setScanCountsLoading(false);
    }
  }, [user, activeStoreId, selectedStoreId]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    if (stores.length > 0 && activeStoreId && !showActiveStoreSelection) {
      loadScans();
    }
  }, [loadScans, stores.length, activeStoreId, showActiveStoreSelection]);

  useEffect(() => {
    if ((selectedTab === 'history' || selectedTab === 'stats') && activeStoreId && !showActiveStoreSelection) {
      loadPartnerTransactions();
    }
  }, [selectedTab, loadPartnerTransactions, activeStoreId, showActiveStoreSelection]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  useEffect(() => {
    if (stores.length > 0 && activeStoreId && !showActiveStoreSelection) {
      loadScanCounts();
    }
  }, [loadScanCounts, stores.length, activeStoreId, showActiveStoreSelection]);

  return {
    // Clients
    clients,
    clientsLoading,
    clientsError,
    loadClients,
    // Scans
    scans,
    scansLoading,
    scansError,
    topCustomers,
    // Transactions
    transactions,
    transactionsLoading,
    transactionsError,
    // Stores
    stores,
    storesLoading,
    storesError,
    loadStores,
    // Scan counts
    scanCounts,
    scanCountsLoading,
    loadScanCounts,
  };
}

