/**
 * Maya Connect V2 — Partner Store Initialization Hook
 *
 * Two-phase init:
 *  1. Instant hydration from `user.partnerData.operatorStores` (returned by GET /api/v1/auth/me)
 *     → gives fast initial state (partner name, store names, active store)
 *  2. Background fetch of `GET /api/v1/store-operators/my-partner-stores`
 *     → replaces Zustand data with COMPLETE PartnerDto (imageUrl!) + full StoreDto[] (imageUrl, address, etc.)
 *
 * Place this hook inside the (partner) and (storeoperator) _layout.tsx.
 */
import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { usePartnerStore } from '../stores/partner.store';
import { storeOperatorsApi } from '../api/store-operators.api';
import type { PartnerDto, StoreDto, OperatorStoreInfo, StoreOperatorDto } from '../types';

/**
 * Hydrates the partner Zustand store:
 *  - Phase 1: instant from user.partnerData (partial data)
 *  - Phase 2: async from /my-partner-stores (complete data with images)
 */
export function usePartnerInit(): void {
  const user = useAuthStore((s: { user: any }) => s.user);
  const setPartner = usePartnerStore((s: { setPartner: any }) => s.setPartner);
  const setStores = usePartnerStore((s: { setStores: any }) => s.setStores);
  const setActiveStore = usePartnerStore((s: { setActiveStore: any }) => s.setActiveStore);
  const setLoading = usePartnerStore((s: { setLoading: any }) => s.setLoading);
  const didFetchRef = useRef(false);

  useEffect(() => {
    const opStores: OperatorStoreInfo[] | undefined = user?.partnerData?.operatorStores;
    if (!opStores?.length) {
      // No operator stores — clear partner context
      setPartner(null);
      setStores([]);
      didFetchRef.current = false;
      return;
    }

    // ═══ Phase 1: Instant hydration from auth/me (partial) ═══
    const firstWithPartner = opStores.find((s: OperatorStoreInfo) => s.partner);
    if (firstWithPartner?.partner) {
      const p = firstWithPartner.partner;
      const partnerDto: PartnerDto = {
        id: p.id,
        legalName: p.legalName,
        displayName: p.displayName ?? null,
        email: p.email ?? null,
        isActive: true,
        createdAt: user!.createdAt,
        // imageUrl is NOT available from auth/me — will be filled by Phase 2
      };
      setPartner(partnerDto);
    }

    // Lightweight store list (no images/addresses yet)
    const lightStores: StoreDto[] = opStores.map((os: OperatorStoreInfo) => ({
      id: os.id,
      partnerId: os.partnerId ?? '',
      name: os.name ?? 'Magasin',
      latitude: null,
      longitude: null,
      category: null,
      avgDiscountPercent: 0,
      address: null,
      city: null,
      country: null,
      phone: null,
      email: null,
      openingJson: null,
      imageUrl: null,
      partnerImageUrl: null,
      isActive: true,
      createdAt: user!.createdAt,
      distanceKm: null,
      subscribersCount: 0,
      operators: null,
    }));
    setStores(lightStores);

    // Set initial active store
    const activeOs = opStores.find((os: OperatorStoreInfo) => os.isActiveStore) ?? opStores[0];
    if (activeOs) {
      const activeStoreDto: StoreOperatorDto = {
        id: activeOs.id,
        userId: user!.id,
        storeId: activeOs.id,
        isManager: activeOs.isManager ?? false,
        isActiveStore: true,
        createdAt: user!.createdAt,
        lastActiveStoreChangedAt: activeOs.lastActiveStoreChangedAt ?? null,
      };
      setActiveStore(activeStoreDto);
    }

    // ═══ Phase 2: Fetch complete data from /my-partner-stores ═══
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    setLoading(true);

    storeOperatorsApi.getMyPartnerStores()
      .then((res) => {
        const data = res.data;
        if (!data) return;

        // Complete PartnerDto with imageUrl, phone, kycStatus, etc.
        if (data.partner) {
          setPartner(data.partner);
        }

        // Complete StoreDto[] with imageUrl, partnerImageUrl, address, phone, etc.
        if (data.stores?.length) {
          setStores(data.stores);
        }

        // Active store from API (may differ from auth/me if changed recently)
        if (data.activeStore) {
          setActiveStore(data.activeStore);
        }
      })
      .catch(() => {
        // Silently fail — Phase 1 data is still usable
        // The user can still use the app, just without images
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.partnerData, setPartner, setStores, setActiveStore, setLoading]);
}
