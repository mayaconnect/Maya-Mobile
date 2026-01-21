export interface QrTokenData {
  token: string;
  qrCode?: string;
  expiresAt?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  discount: number;
  date: string;
  storeName?: string;
  storeId?: string;
  category?: string;
}

export interface SavingsByCategory {
  category: string;
  totalSavings: number;
  transactionCount: number;
}

