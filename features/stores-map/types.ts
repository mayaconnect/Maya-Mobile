export interface Store {
  id: string;
  name: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };
  partner?: {
    name?: string;
  };
  category?: string;
  distance?: number;
  latitude?: number;
  longitude?: number;
}

export interface StoreSearchParams {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  category?: string;
  page?: number;
  pageSize?: number;
}

