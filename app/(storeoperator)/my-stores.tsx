/**
 * Maya Connect V2 — Store Operator "My Stores" Screen
 *
 * Uses the aggregated endpoint GET /api/v1/store-operators/my-partner-stores
 * to display partner info + all stores the partner owns.
 * Allows setting active store.
 */
import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { storeOperatorsApi } from '../../src/api/store-operators.api';
import { usePartnerStore } from '../../src/stores/partner.store';
import { operatorColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import {
  MCard,
  MBadge,
  MAvatar,
  EmptyState,
  LoadingSpinner,
  ErrorState,
} from '../../src/components/ui';
import { MHeader } from '../../src/components/ui';

import type { StoreDto } from '../../src/types';

export default function MyStoresScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const setPartner = usePartnerStore((s) => s.setPartner);
  const setStores = usePartnerStore((s) => s.setStores);

  /* ---- Fetch partner + stores from dedicated endpoint ---- */
  const myDataQ = useQuery({
    queryKey: ['myPartnerStores'],
    queryFn: () => storeOperatorsApi.getMyPartnerStores(),
    select: (res) => res.data,
  });

  const partner = myDataQ.data?.partner;
  const stores = myDataQ.data?.stores ?? [];
  const activeStoreId = myDataQ.data?.activeStore?.storeId ?? usePartnerStore.getState().activeStore?.storeId;

  // Sync Zustand store when data arrives
  React.useEffect(() => {
    if (myDataQ.data) {
      if (myDataQ.data.partner) setPartner(myDataQ.data.partner);
      if (myDataQ.data.stores) setStores(myDataQ.data.stores);
    }
  }, [myDataQ.data, setPartner, setStores]);

  /* ---- Set active store ---- */
  const setActiveMutation = useMutation({
    mutationFn: (storeId: string) =>
      storeOperatorsApi.setActiveStore({ storeId }),
    onSuccess: (_data, storeId) => {
      queryClient.invalidateQueries({ queryKey: ['activeStore'] });
      queryClient.invalidateQueries({ queryKey: ['myPartnerStores'] });
      const found = stores.find((s) => s.id === storeId);
      usePartnerStore.getState().setActiveStore({
        id: '',
        userId: '',
        storeId,
        isManager: found ? true : false,
        isActiveStore: true,
        createdAt: new Date().toISOString(),
      });
      Alert.alert('Succès', `Magasin actif changé : ${found?.name ?? storeId.slice(0, 8)}`);
    },
    onError: () => {
      Alert.alert('Erreur', 'Impossible de changer le magasin actif.');
    },
  });

  const renderStore = ({ item }: { item: StoreDto }) => {
    const isActive = item.id === activeStoreId;
    return (
      <MCard style={StyleSheet.flatten([styles.storeCard, isActive ? styles.storeCardActive : {}])} elevation="sm">
        <View style={styles.storeRow}>
          <View style={[styles.storeIcon, isActive && styles.storeIconActive]}>
            <Ionicons
              name="storefront"
              size={wp(22)}
              color={isActive ? '#FFFFFF' : colors.violet[500]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.storeName} numberOfLines={1}>
                {item.name}
              </Text>
              {isActive && (
                <MBadge label="Actif" variant="success" size="sm" />
              )}
            </View>
            {item.address ? (
              <Text style={styles.storeAddress} numberOfLines={1}>
                {item.address}{item.city ? `, ${item.city}` : ''}
              </Text>
            ) : null}
          </View>
          {!isActive && (
            <TouchableOpacity
              style={styles.activateBtn}
              onPress={() => setActiveMutation.mutate(item.id)}
              disabled={setActiveMutation.isPending}
            >
              <Text style={styles.activateTxt}>Activer</Text>
            </TouchableOpacity>
          )}
        </View>
      </MCard>
    );
  };

  if (myDataQ.isLoading) {
    return <LoadingSpinner fullScreen message="Chargement…" />;
  }

  if (myDataQ.isError) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <MHeader title="Mes magasins" />
        <ErrorState
          fullScreen
          title="Erreur"
          description="Impossible de charger les données."
          onRetry={() => myDataQ.refetch()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <MHeader title="Mes magasins" />

      {/* Partner card */}
      {partner ? (
        <MCard style={styles.partnerCard} elevation="sm">
          <View style={styles.partnerRow}>
            <MAvatar
              name={partner.displayName ?? partner.legalName ?? 'P'}
              uri={partner.imageUrl}
              size="md"
            />
            <View style={{ flex: 1, marginLeft: spacing[3] }}>
              <Text style={styles.partnerName}>
                {partner.displayName ?? partner.legalName}
              </Text>
              {partner.email ? (
                <Text style={styles.partnerEmail}>{partner.email}</Text>
              ) : null}
            </View>
          </View>
        </MCard>
      ) : null}

      {/* Stores count */}
      <View style={styles.topBar}>
        <Text style={styles.countLabel}>
          {stores.length} magasin{stores.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={stores}
        keyExtractor={(item) => item.id}
        renderItem={renderStore}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={myDataQ.isRefetching}
            onRefresh={() => myDataQ.refetch()}
            tintColor={colors.violet[500]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="storefront-outline"
            title="Aucun magasin"
            description="Vous n'êtes assigné à aucun magasin pour le moment."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  partnerCard: {
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    marginBottom: spacing[1],
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerName: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
  },
  partnerEmail: {
    ...textStyles.micro,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  countLabel: {
    ...textStyles.caption,
    color: colors.neutral[500],
  },
  listContent: {
    padding: spacing[4],
    paddingTop: spacing[1],
    paddingBottom: wp(100),
  },
  storeCard: {
    marginBottom: spacing[3],
  },
  storeCardActive: {
    borderWidth: 2,
    borderColor: colors.violet[500],
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIcon: {
    width: wp(44),
    height: wp(44),
    borderRadius: borderRadius.lg,
    backgroundColor: colors.violet[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  storeIconActive: {
    backgroundColor: colors.violet[500],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  storeName: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
    flexShrink: 1,
  },
  storeAddress: {
    ...textStyles.micro,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  activateBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    backgroundColor: colors.violet[50],
  },
  activateTxt: {
    ...textStyles.caption,
    fontFamily: fontFamily.semiBold,
    color: colors.violet[600],
  },
});
