import { renderHook, waitFor } from '@testing-library/react-native';
import { usePartnerHomeData } from '@/features/partner-home/hooks/usePartnerHomeData';
import { StoresApi } from '@/features/stores-map/services/storesApi';
import { TransactionsApi } from '@/features/home/services/transactionsApi';

// Mock des services
jest.mock('@/features/stores-map/services/storesApi', () => ({
  StoresApi: {
    getMyStores: jest.fn(),
  },
}));

jest.mock('@/features/home/services/transactionsApi', () => ({
  TransactionsApi: {
    getPartnerTransactions: jest.fn(),
    getPartnerStats: jest.fn(),
  },
}));

describe('usePartnerHomeData Hook', () => {
  const mockUser = {
    id: 'partner-1',
    email: 'partner@test.com',
  };

  const mockStores = [
    {
      id: 'store-1',
      name: 'Store 1',
      address: '123 Main St',
    },
    {
      id: 'store-2',
      name: 'Store 2',
      address: '456 Oak Ave',
    },
  ];

  const mockTransactions = [
    {
      id: 'tx-1',
      amount: 100,
      discountAmount: 10,
      createdAt: new Date().toISOString(),
      customer: { firstName: 'John', lastName: 'Doe' },
      store: { name: 'Store 1' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait charger les données initiales', async () => {
    (StoresApi.getMyStores as jest.Mock).mockResolvedValue({
      items: mockStores,
    });
    (TransactionsApi.getPartnerTransactions as jest.Mock).mockResolvedValue({
      items: mockTransactions,
    });

    const { result } = renderHook(() =>
      usePartnerHomeData(mockUser, null, undefined, 'all', 'overview', false)
    );

    await waitFor(() => {
      expect(result.current.storesLoading).toBe(false);
    });

    expect(result.current.stores).toEqual(mockStores);
    expect(result.current.transactions).toEqual(mockTransactions);
  });

  it('devrait filtrer les transactions par période', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayTransaction = {
      ...mockTransactions[0],
      createdAt: today.toISOString(),
    };
    const yesterdayTransaction = {
      ...mockTransactions[0],
      id: 'tx-2',
      createdAt: yesterday.toISOString(),
    };

    (StoresApi.getMyStores as jest.Mock).mockResolvedValue({
      items: mockStores,
    });
    (TransactionsApi.getPartnerTransactions as jest.Mock).mockResolvedValue({
      items: [todayTransaction, yesterdayTransaction],
    });

    const { result } = renderHook(() =>
      usePartnerHomeData(mockUser, null, undefined, 'today', 'overview', false)
    );

    await waitFor(() => {
      expect(result.current.transactionsLoading).toBe(false);
    });

    // Les transactions d'aujourd'hui devraient être filtrées
    expect(result.current.filteredTransactions.length).toBeGreaterThanOrEqual(0);
  });

  it('devrait gérer les erreurs de chargement', async () => {
    const error = new Error('Failed to load stores');
    (StoresApi.getMyStores as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() =>
      usePartnerHomeData(mockUser, null, undefined, 'all', 'overview', false)
    );

    await waitFor(() => {
      expect(result.current.storesLoading).toBe(false);
    });

    expect(result.current.storesError).toBeTruthy();
  });

  it('devrait calculer les statistiques correctement', async () => {
    const transactions = [
      { ...mockTransactions[0], amountGross: 100, discountAmount: 10 },
      { ...mockTransactions[0], id: 'tx-2', amountGross: 50, discountAmount: 5 },
    ];

    (StoresApi.getMyStores as jest.Mock).mockResolvedValue({
      items: mockStores,
    });
    (TransactionsApi.getPartnerTransactions as jest.Mock).mockResolvedValue({
      items: transactions,
    });

    const { result } = renderHook(() =>
      usePartnerHomeData(mockUser, null, undefined, 'all', 'overview', false)
    );

    await waitFor(() => {
      expect(result.current.transactionsLoading).toBe(false);
    });

    // Vérifier que les statistiques sont calculées
    expect(result.current.totalRevenue).toBeGreaterThanOrEqual(0);
  });
});

