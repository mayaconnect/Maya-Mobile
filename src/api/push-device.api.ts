/**
 * Maya Connect V2 — Push Device API
 *
 * Manages push notification device token registration with the backend.
 */
import apiClient from './client';

const BASE = '/api/push-devices';

export interface RegisterPushDeviceRequest {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

export interface UnregisterPushDeviceRequest {
  token: string;
}

export const pushDeviceApi = {
  /** POST /api/push-devices/register — Register expo push token */
  register: (dto: RegisterPushDeviceRequest) =>
    apiClient.post<{ deviceId: string; message: string }>(`${BASE}/register`, dto),

  /** POST /api/push-devices/unregister — Unregister token (e.g. on logout) */
  unregister: (dto: UnregisterPushDeviceRequest) =>
    apiClient.post<{ message: string }>(`${BASE}/unregister`, dto),
};
