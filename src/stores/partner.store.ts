/**
 * Maya Connect V2 — Partner Store (Zustand)
 *
 * Used by both StoreOperator & Partner roles for managing
 * their current active store context.
 */
import { create } from 'zustand';
import type { StoreDto, PartnerDto, StoreOperatorDto } from '../types';

interface PartnerState {
  /** Partner entity the user belongs to */
  partner: PartnerDto | null;
  /** All stores for the partner */
  stores: StoreDto[];
  /** Currently selected active store (operator context) */
  activeStore: StoreOperatorDto | null;
  isLoading: boolean;
}

interface PartnerActions {
  setPartner: (p: PartnerDto | null) => void;
  setStores: (stores: StoreDto[]) => void;
  setActiveStore: (store: StoreOperatorDto | null) => void;
  setLoading: (v: boolean) => void;
  reset: () => void;
}

export type PartnerStoreType = PartnerState & PartnerActions;

const initial: PartnerState = {
  partner: null,
  stores: [],
  activeStore: null,
  isLoading: false,
};

export const usePartnerStore = create<PartnerStoreType>((set) => ({
  ...initial,

  setPartner: (p) => set({ partner: p }),
  setStores: (stores) => set({ stores }),
  setActiveStore: (store) => set({ activeStore: store }),
  setLoading: (v) => set({ isLoading: v }),
  reset: () => set(initial),
}));
