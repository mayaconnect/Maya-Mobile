/**
 * Maya Connect V2 — Support API Module
 *
 * Public endpoint for creating support tickets from the mobile app.
 * No auth required for the public route (used for "request new store" flow).
 */
import apiClient from './client';

export interface PublicTicketRequest {
  categoryId: string;
  subject: string;
  body: string;
  priority?: string;
}

export interface SupportTicketDto {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
}

/** Known category IDs (from supportCategory.md) */
export const SUPPORT_CATEGORY = {
  PARTNER_REQUEST: '6F1A9E2C-3C7B-4A91-B6A5-8E2F4C1D9A11',
  BILLING: 'A3D7C2F9-91F4-4F0B-9E2A-2B8D6F5E1C22',
  TECHNICAL: 'C8E4A1B7-5D92-4C3E-8A6F-9D3B7E2A4F33',
  ACCOUNT: 'D1B9F3E6-7A4C-4E92-9F1A-3C5D8B7E6A44',
  GENERAL: 'F2A6B1C3-8E4D-4A7F-B2C9-5E1D3A9F8C66',
} as const;

export const supportApi = {
  /**
   * POST /api/public/support/tickets — Create a public support ticket.
   * No authentication required.
   */
  createPublicTicket: (dto: PublicTicketRequest) =>
    apiClient.post<SupportTicketDto>('/api/public/support/tickets', dto),
};
