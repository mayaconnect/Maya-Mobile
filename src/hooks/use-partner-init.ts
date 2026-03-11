/**
 * Maya Connect V2 — Partner Store Initialization Hook
 *
 * Syncs the partner Zustand store from the authenticated user's
 * `partnerData` (returned by GET /api/v1/auth/me for Partner/StoreOperator roles).
 *
 * Place this hook inside the (partner) _layout.tsx so it runs once
 * when the partner tab group mounts.
 */
import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { usePartnerStore } from '../stores/partner.store';
import type { PartnerDto, StoreDto, OperatorStoreInfo, StoreOperatorDto } from '../types';

/**
 * Extracts partner & store data from `UserProfile.partnerData.operatorStores`
 * and populates the partner Zustand store.
 * Also sets the initial active store from the operatorStores data.
 */
export function usePartnerInit(): void {
  const user = useAuthStore((s: { user: any }) => s.user);
  const setPartner = usePartnerStore((s: { setPartner: any }) => s.setPartner);
  const setStores = usePartnerStore((s: { setStores: any }) => s.setStores);
  const setActiveStore = usePartnerStore((s: { setActiveStore: any }) => s.setActiveStore);

  useEffect(() => {
    const opStores: OperatorStoreInfo[] | undefined = user?.partnerData?.operatorStores;
    if (!opStores?.length) {
      // No operator stores — clear partner context
      setPartner(null);
      setStores([]);
      return;
    }

    // --- Derive the partner from the first store's partner info ---
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
      };
      setPartner(partnerDto);
    }

    // --- Map operator stores into StoreDto-like objects ---
    const stores: StoreDto[] = opStores.map((os: OperatorStoreInfo) => ({
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
      isActive: true,
      createdAt: user!.createdAt,
      distanceKm: null,
      subscribersCount: 0,
      operators: null,
    }));
    setStores(stores);

    // --- Set initial active store from operatorStores data ---
    // Find the store marked as isActiveStore, or fall back to first
    const activeOs = opStores.find((os: OperatorStoreInfo) => os.isActiveStore) ?? opStores[0];
    if (activeOs) {
      const activeStoreDto: StoreOperatorDto = {
        id: activeOs.id,           // StoreId doubles as id here
        userId: user!.id,
        storeId: activeOs.id,
        isManager: activeOs.isManager ?? false,
        isActiveStore: true,
        createdAt: user!.createdAt,
        lastActiveStoreChangedAt: activeOs.lastActiveStoreChangedAt ?? null,
      };
      setActiveStore(activeStoreDto);
    }
  }, [user?.partnerData, setPartner, setStores, setActiveStore]);
}
