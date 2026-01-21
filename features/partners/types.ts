export interface Partner {
  id: string;
  name: string;
  description: string;
  address: string;
  distance: number | null;
  isOpen: boolean;
  closingTime: string | null;
  category: string;
  image: string;
  promotion?: {
    discount: string;
    description: string;
    isActive: boolean;
  } | null;
  rating: number;
  latitude?: number;
  longitude?: number;
}

export type PartnerViewMode = 'grille' | 'liste' | 'carte';

export interface PartnerQueryParams {
  name?: string;
  email?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  category?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

export interface PartnerListResponse {
  items: Partner[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
}

