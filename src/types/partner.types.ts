/**
 * Maya Connect V2 — Partner & Store Types
 */

export interface PartnerDto {
  id: string;
  categoryId?: string | null;
  legalName?: string | null;
  displayName?: string | null;
  kycStatus?: string | null;
  iban?: string | null;
  websiteUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PartnerDetailsDto extends PartnerDto {
  description?: string | null;
  stores?: StoreDto[] | null;
  payouts?: unknown[] | null;
  transactions?: TransactionDto[] | null;
  offers?: OfferDto[] | null;
}

export interface StoreDto {
  id: string;
  partnerId: string;
  name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  category?: string | null;
  categoryId?: string | null;
  avgDiscountPercent: number;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  openingJson?: string | null;
  imageUrl?: string | null;
  partnerImageUrl?: string | null;
  partnerName?: string | null;
  isActive: boolean;
  createdAt: string;
  distanceKm?: number | null;
  subscribersCount: number;
  operators?: StoreOperatorLiteDto[] | null;
}

export interface StoreDetailsDto extends StoreDto {
  categoryId: string;
  operators?: StoreOperatorDto[] | null;
  subscriptions?: unknown[] | null;
  transactions?: TransactionDto[] | null;
  offers?: OfferDto[] | null;
}

export interface StoreSearchRequestDto {
  partnerId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radiusKm?: number | null;
  category?: string | null;
  minDiscount?: number | null;
  sort?: string | null;
  page?: number;
  pageSize?: number;
}

export interface StoreOperatorDto {
  id: string;
  userId: string;
  storeId: string;
  isManager: boolean;
  isActiveStore: boolean;
  createdAt: string;
  lastActiveStoreChangedAt?: string | null;
}

export interface StoreOperatorLiteDto {
  userId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  isManager: boolean;
}

export interface SetActiveStoreDto {
  storeId: string;
}

/** DTO for updating a store (matches backend StoreUpdateDto) */
export interface StoreUpdateDto {
  id: string;
  name?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  categoryId?: string | null;
  avgDiscountPercent?: number;
  openingJson?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive?: boolean;
}

/** DTO for partial store update — only include fields you want to change */
export interface StorePatchDto {
  id: string;
  name?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  categoryId?: string | null;
  avgDiscountPercent?: number;
  openingJson?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive?: boolean;
}

/** DTO to create a new store (partner request → created inactive) */
export interface StoreCreateDto {
  partnerId: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  categoryId: string;
  avgDiscountPercent: number;
  openingJson?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface StoreSubscriberDto {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  storeId: string;
  storeName: string;
  startAt: string;
  endAt?: string | null;
  subscriptionId?: string | null;
  subscriptionPlanId?: string | null;
  subscriptionStatus?: string | null;
  subscriptionStartAt?: string | null;
  subscriptionEndAt?: string | null;
  seatsGranted?: number | null;
}

export interface OfferDto {
  id: string;
  partnerId: string;
  storeId: string;
  title?: string | null;
  description?: string | null;
  percent: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  rulesJson?: string | null;
  createdAt: string;
}

export interface StoreCategoryDto {
  id: string;
  code?: string | null;
  name?: string | null;
}

/** Store opening hours parsed from openingJson
 * New multi-slot schema:
 *   { "tz": "Europe/Paris", "mon": [["12:00","14:30"],["19:00","23:00"]], "tue": [...], ... }
 * Each day key is short (mon, tue, wed, thu, fri, sat, sun).
 * Each slot is a [open, close] tuple like ["12:00","14:30"].
 * A missing day or empty array means closed.
 */
export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type TimeSlot = [string, string]; // [open, close] e.g. ["12:00","14:30"]

export interface StoreOpeningHours {
  tz?: string; // IANA timezone e.g. "Europe/Paris"
  mon?: TimeSlot[];
  tue?: TimeSlot[];
  wed?: TimeSlot[];
  thu?: TimeSlot[];
  fri?: TimeSlot[];
  sat?: TimeSlot[];
  sun?: TimeSlot[];
}

/** All day keys in order (Monday → Sunday) */
export const DAY_KEYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** French labels for day keys */
export const DAY_LABELS_FR: Record<DayKey, string> = {
  mon: 'Lundi',
  tue: 'Mardi',
  wed: 'Mercredi',
  thu: 'Jeudi',
  fri: 'Vendredi',
  sat: 'Samedi',
  sun: 'Dimanche',
};

/** Check if a store is currently open based on opening hours */
export function isStoreOpenNow(hours: StoreOpeningHours | null): boolean {
  if (!hours) return false;
  const now = new Date();
  const dayIdx = now.getDay(); // 0=Sun, 1=Mon, ...
  const dayKey = DAY_KEYS[dayIdx === 0 ? 6 : dayIdx - 1];
  const slots = hours[dayKey];
  if (!slots || slots.length === 0) return false;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return slots.some(([open, close]) => {
    const [oh, om] = open.split(':').map(Number);
    const [ch, cm] = close.split(':').map(Number);
    if (isNaN(oh) || isNaN(om) || isNaN(ch) || isNaN(cm)) return false;
    return currentMinutes >= oh * 60 + om && currentMinutes <= ch * 60 + cm;
  });
}

/** Parse the openingJson field into structured hours (handles both old and new schema) */
export function parseOpeningHours(json?: string | null): StoreOpeningHours | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    // Detect old schema: { monday: { open, close }, ... }
    if (parsed.monday !== undefined || parsed.tuesday !== undefined) {
      return convertOldSchema(parsed);
    }
    return parsed as StoreOpeningHours;
  } catch {
    return null;
  }
}

/** Convert old { monday: { open, close } } schema to new multi-slot format */
function convertOldSchema(old: Record<string, { open: string; close: string } | null>): StoreOpeningHours {
  const dayMap: Record<string, DayKey> = {
    monday: 'mon', tuesday: 'tue', wednesday: 'wed', thursday: 'thu',
    friday: 'fri', saturday: 'sat', sunday: 'sun',
  };
  const result: StoreOpeningHours = { tz: 'Europe/Paris' };
  for (const [longDay, shortDay] of Object.entries(dayMap)) {
    const slot = old[longDay];
    if (slot && slot.open && slot.close) {
      result[shortDay] = [[slot.open, slot.close]];
    }
  }
  return result;
}

// Re-export for convenience
import type { TransactionDto } from './transaction.types';
export type { TransactionDto as StoreTransactionDto };

// ── Aggregated endpoint types ──

export interface MyPartnerStoresDto {
  partner: PartnerDto;
  stores: StoreDto[];
  activeStore?: StoreOperatorDto | null;
}

export interface CreateStoreOperatorDto {
  email: string;
  firstName: string;
  lastName: string;
  storeId: string;
  isManager?: boolean;
}

export interface CreateStoreOperatorResultDto {
  userId: string;
  email: string;
  temporaryPassword: string;
  storeId: string;
  isManager: boolean;
}
