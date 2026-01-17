export interface PartnerStore {
  id: string;
  name: string;
  address?: string;
  isActive?: boolean;
  partnerId?: string;
}

export interface PartnerTransaction {
  id: string;
  amount: number;
  discount: number;
  date: string;
  clientName?: string;
  clientId?: string;
  storeId?: string;
  storeName?: string;
  status?: string;
}

export interface PartnerStats {
  totalTransactions: number;
  totalRevenue: number;
  totalDiscounts: number;
  todayTransactions: number;
  todayRevenue: number;
}

