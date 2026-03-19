/**
 * Maya Connect V2 — QR Code API Module
 *
 * Role access:
 *   GET  /current              → Client, Admin
 *   POST /issue-token-frontend → Client, Admin
 *   POST /validate             → StoreOperator, Partner, Admin
 */
import apiClient from './client';
import type { QrFrontendTokenResult, QrValidateRequestDto, QrValidateResultDto, QrPreviewDiscountRequestDto, QrPreviewDiscountResultDto } from '../types';

const BASE = '/api/qr';

export const qrApi = {
  /** GET /api/qr/current — Client, Admin */
  getCurrent: () =>
    apiClient.get<QrFrontendTokenResult>(`${BASE}/current`),

  /** POST /api/qr/issue-token-frontend — Client, Admin */
  issueToken: () =>
    apiClient.post<QrFrontendTokenResult>(`${BASE}/issue-token-frontend`),

  /** POST /api/qr/validate — StoreOperator, Partner, Admin */
  validate: (dto: QrValidateRequestDto) =>
    apiClient.post<QrValidateResultDto>(`${BASE}/validate`, dto),

  /** POST /api/qr/preview-discount — StoreOperator, Partner, Admin */
  previewDiscount: (dto: QrPreviewDiscountRequestDto) =>
    apiClient.post<QrPreviewDiscountResultDto>(`${BASE}/preview-discount`, dto),
};
