export interface Transaction {
  id: string;
  amount: number;
  discount: number;
  totalAmount: number;
  date: string;
  storeName?: string;
  storeId?: string;
  category?: string;
  status?: string;
}

export interface TransactionQueryParams {
  page?: number;
  pageSize?: number;
  storeId?: string;
  startDate?: string;
  endDate?: string;
}

export interface TransactionListResponse {
  items: Transaction[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
}

