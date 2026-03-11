/**
 * Maya Connect V2 — API Response & Common Types
 */

/** Standard paged result from the API */
export interface PagedResult<T> {
  items: T[] | null;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/** Problem details (RFC 7807) */
export interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [key: string]: unknown;
}

/** Address DTO shared across entities */
export interface AddressDto {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

/** Generic nullable helper */
export type Nullable<T> = T | null;
