/**
 * Maya Connect V2 — QR Code Types
 */

export interface QrFrontendTokenResult {
  token?: string | null;
  expiresAt: string;
}

export interface QrValidateRequestDto {
  partnerId: string;
  storeId?: string | null;
  operatorUserId?: string | null;
  qrToken: string;
  amountGross: number;
  personsCount?: number | null;
}

export interface QrValidateResultDto {
  transactionId: string;
  customerUserId: string;
  planCode: string;
  discountPercent: number;
  discountAmount: number;
  amountNet: number;
}

export interface QrTokenDto {
  id: string;
  userId: string;
  token?: string | null;
  issuedAt: string;
  expiresAt: string;
  isUsed: boolean;
  isRevoked: boolean;
}
