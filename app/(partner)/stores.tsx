/**
 * Maya Connect V2 — Partner Stores Management Screen
 *
 * Lists partner stores with active store selector.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { storesApi } from '../../src/api/stores.api';
import { storeOperatorsApi } from '../../src/api/store-operators.api';
import { usePartnerStore } from '../../src/stores/partner.store';
import { partnerColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import {
  MCard,
  MBadge,
  MButton,
  MHeader,
  LoadingSpinner,
  EmptyState,
  ErrorState,
} from '../../src/components/ui';

export default function PartnerStoresScreen() {
  const queryClient = useQueryClient();
  const setActive = usePartnerStore((s) => s.setActiveStore);
  const currentActive = usePartnerStore((s) => s.activeStore);
  const partner = usePartnerStore((s) => s.partner);
  const cachedStores = usePartnerStore((s) => s.stores);

  /* ---- My stores (via POST /stores/search with partnerId) ---- */
  const storesQ = useQuery({
    queryKey: ['myStores', partner?.id],
    queryFn: () =>
      storesApi.getByPartner(partner!.id),
    enabled: !!partner?.id,
    select: (res) => res.data,
  });

  /* ---- Active store ---- */
  const activeStoreQ = useQuery({
    queryKey: ['activeStore'],
    queryFn: () => storeOperatorsApi.getActiveStore(),
    select: (res) => res.data,
  });

  /* ---- Set active mutation ---- */
  const setActiveMutation = useMutation({
    mutationFn: (storeId: string) =>
      storeOperatorsApi.setActiveStore({ storeId }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['activeStore'] });
      queryClient.invalidateQueries({ queryKey: ['myStores'] });
    },
    onError: (err: any) => {
      Alert.alert(
        'Erreur',
        err?.response?.data?.detail ?? 'Impossible de changer le magasin actif.',
      );
    },
  });

  const stores = storesQ.data?.items ?? storesQ.data ?? cachedStores;
  const activeId = activeStoreQ.data?.storeId;

  const renderStore = ({ item }: any) => {
    const isActive = item.id === activeId;

    return (
      <MCard
        style={{ ...styles.storeCard, ...(isActive ? styles.activeCard : {}) }}
        elevation={isActive ? 'md' : 'sm'}
      >
        <View style={styles.storeRow}>
          <View style={[styles.storeIcon, isActive && styles.activeIcon]}>
            <Ionicons
              name="storefront"
              size={wp(22)}
              color={isActive ? '#FFFFFF' : colors.violet[500]}
            />
          </View>

          <View style={styles.storeInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.storeName} numberOfLines={1}>
                {item.name ?? 'Magasin'}
              </Text>
              {isActive && <MBadge label="Actif" variant="success" size="sm" />}
            </View>
            {item.address && (
              <Text style={styles.storeAddr} numberOfLines={1}>
                {item.address}
              </Text>
            )}
            {item.city && (
              <Text style={styles.storeCity}>{item.city}</Text>
            )}
            {item.category && (
              <MBadge
                label={item.category}
                variant="violet"
                size="sm"
                style={{ marginTop: spacing[2], alignSelf: 'flex-start' }}
              />
            )}
          </View>
        </View>

        {!isActive && (
          <MButton
            title="Définir comme actif"
            variant="outline"
            size="sm"
            onPress={() => {
              Alert.alert(
                'Changer de magasin',
                `Voulez-vous définir "${item.name}" comme magasin actif ?`,
                [
                  { text: 'Annuler', style: 'cancel' },
                  {
                    text: 'Confirmer',
                    onPress: () => setActiveMutation.mutate(item.id),
                  },
                ],
              );
            }}
            loading={
              setActiveMutation.isPending &&
              setActiveMutation.variables === item.id
            }
            style={{ marginTop: spacing[3] }}
          />
        )}
      </MCard>
    );
  };

  if (storesQ.isLoading) {
    return <LoadingSpinner message="Chargement des magasins…" />;
  }

  if (storesQ.isError) {
    return (
      <View style={styles.container}>
        <MHeader title="Mes magasins" />
        <ErrorState
          fullScreen
          title="Erreur de chargement"
          description="Impossible de charger la liste des magasins."
          onRetry={() => storesQ.refetch()}
          icon="storefront-outline"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MHeader title="Mes magasins" />

      <FlatList
        data={Array.isArray(stores) ? stores : []}
        keyExtractor={(item: any) => item.id ?? Math.random().toString()}
        renderItem={renderStore}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={storesQ.isFetching}
            onRefresh={() => {
              storesQ.refetch();
              activeStoreQ.refetch();
            }}
            tintColor={colors.violet[500]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="storefront-outline"
            title="Aucun magasin"
            description="Vous n'avez pas encore de magasin associé à votre compte."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  list: {
    paddingHorizontal: spacing[4],
    paddingBottom: wp(100),
  },
  storeCard: {
    marginBottom: spacing[3],
    backgroundColor: '#111827',
  },
  activeCard: {
    borderWidth: 2,
    borderColor: colors.violet[500],
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  storeIcon: {
    width: wp(48),
    height: wp(48),
    borderRadius: borderRadius.lg,
    backgroundColor: colors.violet[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  activeIcon: {
    backgroundColor: colors.violet[500],
  },
  storeInfo: {
    flex: 1,
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
    flex: 1,
  },
  storeAddr: {
    ...textStyles.caption,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  storeCity: {
    ...textStyles.micro,
    color: colors.neutral[400],
    marginTop: spacing[1],
  },
});
