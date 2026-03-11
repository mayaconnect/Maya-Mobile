/**
 * Maya Connect V2 — Transaction Types
 */

export interface TransactionDto {
  transactionId: string;
  partnerId: string;
  storeId: string;
  storeName?: string | null;
  operatorUserId?: string | null;
  customerUserId?: string | null;
  clientName?: string | null;
  subscriptionId?: string | null;
  planId?: string | null;
  personsCount: number;
  amountGross: number;
  discountPercent: number;
  discountAmount: number;
  amountNet: number;
  createdAt: string;
}

export interface SavingsByCategoryDto {
  category?: string | null;
  amount: number;
}

export interface SavingsByPeriodDto {
  key?: string | null;
  amount: number;
  date?: string | null;
}
