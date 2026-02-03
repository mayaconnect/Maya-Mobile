import { useMemo } from 'react';

export function usePartnerStats(transactions: any[], clients: any[], searchQuery: string) {
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const fullName = `${client.firstName || ''} ${client.lastName || ''}`.toLowerCase();
      const email = (client.email || '').toLowerCase();
      const matchesSearch = 
        fullName.includes(searchQuery.toLowerCase()) ||
        email.includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  }, [clients, searchQuery]);

  const stats = useMemo(() => {
    const totalRevenue = transactions.reduce((sum, transaction) => {
      return sum + (transaction.amountGross || transaction.amount || 0);
    }, 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayRevenue = transactions.reduce((sum, transaction) => {
      const transactionDate = new Date(transaction.createdAt || transaction.date || transaction.transactionDate);
      if (transactionDate >= todayStart) {
        return sum + (transaction.amountGross || transaction.amount || 0);
      }
      return sum;
    }, 0);

    const todayDiscounts = transactions.reduce((sum, transaction) => {
      const transactionDate = new Date(transaction.createdAt || transaction.date || transaction.transactionDate);
      if (transactionDate >= todayStart) {
        return sum + (transaction.discountAmount || transaction.discount || 0);
      }
      return sum;
    }, 0);

    return {
      totalRevenue,
      todayRevenue,
      todayDiscounts,
    };
  }, [transactions]);

  return {
    filteredClients,
    ...stats,
  };
}

