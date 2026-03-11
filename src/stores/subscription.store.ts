/**
 * Maya Connect V2 — Subscription Store (Zustand)
 */
import { create } from 'zustand';
import type {
  SubscriptionPlanDto,
  SubscriptionDto,
} from '../types';

interface SubscriptionState {
  plans: SubscriptionPlanDto[];
  currentSubscription: SubscriptionDto | null;
  hasActiveSubscription: boolean;
  isLoading: boolean;
}

interface SubscriptionActions {
  setPlans: (plans: SubscriptionPlanDto[]) => void;
  setCurrentSubscription: (sub: SubscriptionDto | null) => void;
  setHasActive: (v: boolean) => void;
  setLoading: (v: boolean) => void;
  reset: () => void;
}

export type SubscriptionStore = SubscriptionState & SubscriptionActions;

const initial: SubscriptionState = {
  plans: [],
  currentSubscription: null,
  hasActiveSubscription: false,
  isLoading: false,
};

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  ...initial,

  setPlans: (plans) => set({ plans }),
  setCurrentSubscription: (sub) =>
    set({ currentSubscription: sub, hasActiveSubscription: !!sub }),
  setHasActive: (v) => set({ hasActiveSubscription: v }),
  setLoading: (v) => set({ isLoading: v }),
  reset: () => set(initial),
}));
