/**
 * Maya Connect V2 — Partner Stores Management Screen
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppAlert } from '../../src/hooks/use-app-alert';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storeOperatorsApi } from '../../src/api/store-operators.api';
import { usePartnerStore } from '../../src/stores/partner.store';
import { partnerColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';
import { EmptyState } from '../../src/components/ui';
import { config } from '../../src/constants/config';

function StoreImage({ item, isActive }: { item: any; isActive: boolean }) {
  const [errored, setErrored] = React.useState(false);
  const imageUri = item.imageUrl || item.partnerImageUrl ||
    (item.partnerId ? `${config.api.baseUrl}/api/partners/${item.partnerId}/image` : null);

  if (!errored && imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={[styles.storeImage, isActive && styles.storeImageActive]}
        resizeMode="cover"
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
      <Ionicons name="storefront" size={wp(22)} color={isActive ? '#FFF' : colors.violet[500]} />
    </View>
  );
}

export default function PartnerStoresScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const router = useRouter();

  const stores = usePartnerStore((s) => s.stores);
  const partner = usePartnerStore((s) => s.partner);
  const activeStoreZus = usePartnerStore((s) => s.activeStore);
  const { alert, confirm, AlertModal } = useAppAlert();

  const activeStoreQ = useQuery({
    queryKey: ['activeStore'],
    queryFn: () => storeOperatorsApi.getActiveStore(),
    select: (res) => res.data,
    retry: (count, error: any) => {
      if (error?.response?.status === 404) return false;
      return count < 2;
    },
  });

  const activeId = activeStoreQ.data?.storeId ?? activeStoreZus?.storeId;

  const setActiveMutation = useMutation({
    mutationFn: (storeId: string) =>
      storeOperatorsApi.setActiveStore({ storeId }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['activeStore'] });
      queryClient.invalidateQueries({ queryKey: ['partnerTxHistory'] });
    },
    onError: (err: any) => {
      alert('Erreur', err?.response?.data?.detail ?? 'Impossible de changer le magasin actif.');
    },
  });

  const handleSelect = (storeId: string, storeName: string) => {
    if (storeId === activeId) return;
    confirm(
      'Changer de magasin',
      `Activer "${storeName}" ?`,
      () => setActiveMutation.mutate(storeId),
    );
  };

  return (
    <View style={styles.container}>
      {/* Gradient header */}
      <LinearGradient
        colors={['#FF6A00', '#FFB347']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing[5] }]}
      >
        <Text style={styles.headerSub}>
          {partner?.displayName ?? partner?.legalName ?? 'Partenaire'}
        </Text>
        <Text style={styles.headerTitle}>Mes magasins</Text>
      </LinearGradient>

      <FlatList
        data={stores}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + wp(80) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={activeStoreQ.isFetching}
            onRefresh={() => activeStoreQ.refetch()}
            tintColor={colors.violet[500]}
          />
        }
        renderItem={({ item }: any) => {
          const isActive = item.id === activeId;
          const isPending = setActiveMutation.isPending && setActiveMutation.variables === item.id;

          return (
            <View style={[styles.card, isActive && styles.cardActive]}>
              <TouchableOpacity
                style={styles.cardTop}
                activeOpacity={isActive ? 1 : 0.7}
                onPress={() => handleSelect(item.id, item.name ?? 'Magasin')}
                disabled={isActive || setActiveMutation.isPending}
              >
                {/* Image / icône */}
                <StoreImage item={item} isActive={isActive} />

                {/* Infos */}
                <View style={styles.cardBody}>
                  <Text style={[styles.cardName, isActive && styles.cardNameActive]} numberOfLines={1}>
                    {item.name ?? 'Magasin'}
                  </Text>
                  <Text style={styles.cardSub} numberOfLines={1}>
                    {[item.address, item.city].filter(Boolean).join(' · ') || 'Adresse non renseignée'}
                  </Text>
                  {item.category ? (
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Right state */}
                {isActive ? (
                  <View style={styles.activeChip}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeChipText}>Actif</Text>
                  </View>
                ) : isPending ? (
                  <Ionicons name="sync-outline" size={wp(20)} color={colors.violet[400]} />
                ) : (
                  <Ionicons name="chevron-forward" size={wp(20)} color={colors.neutral[300]} />
                )}
              </TouchableOpacity>

              {/* Manage button — only for active store */}
              {isActive && (
                <TouchableOpacity
                  style={styles.manageBtn}
                  onPress={() => router.push('/(partner)/store-management' as any)}
                >
                  <Ionicons name="settings-outline" size={wp(14)} color={colors.violet[600]} />
                  <Text style={styles.manageBtnText}>Gérer le magasin</Text>
                  <Ionicons name="chevron-forward" size={wp(14)} color={colors.violet[400]} />
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="storefront-outline"
            title="Aucun magasin"
            description="Vous n'avez pas encore de magasin associé à votre compte."
          />
        }
      />

      <AlertModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },

  header: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[6],
    borderBottomLeftRadius: wp(32),
    borderBottomRightRadius: wp(32),
    overflow: 'hidden',
  },
  headerSub: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: fontFamily.medium,
    marginBottom: spacing[1],
  },
  headerTitle: {
    ...textStyles.h2,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },

  list: {
    padding: spacing[4],
    gap: spacing[3],
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1.5,
    borderColor: colors.neutral[100],
    ...shadows.sm,
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: colors.violet[400],
    backgroundColor: '#F5F3FF',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    padding: spacing[4],
  },

  storeImage: {
    width: wp(64),
    height: wp(64),
    borderRadius: borderRadius.xl,
    backgroundColor: colors.neutral[100],
    borderWidth: 1.5,
    borderColor: colors.neutral[100],
  },
  storeImageActive: {
    borderColor: colors.violet[300],
  },
  iconBox: {
    width: wp(64),
    height: wp(64),
    borderRadius: borderRadius.xl,
    backgroundColor: colors.violet[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: {
    backgroundColor: colors.violet[500],
  },

  cardBody: {
    flex: 1,
    gap: spacing[1],
  },
  cardName: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[800],
  },
  cardNameActive: {
    color: colors.violet[700],
  },
  cardSub: {
    ...textStyles.caption,
    color: colors.neutral[400],
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.violet[50],
    marginTop: spacing[1],
  },
  categoryText: {
    ...textStyles.micro,
    color: colors.violet[500],
    fontFamily: fontFamily.medium,
  },

  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.violet[100],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  activeDot: {
    width: wp(7),
    height: wp(7),
    borderRadius: wp(4),
    backgroundColor: '#22C55E',
  },
  activeChipText: {
    ...textStyles.micro,
    fontFamily: fontFamily.semiBold,
    color: colors.violet[700],
  },

  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.violet[100],
    backgroundColor: colors.violet[50],
  },
  manageBtnText: {
    flex: 1,
    ...textStyles.caption,
    fontFamily: fontFamily.semiBold,
    color: colors.violet[600],
  },
});
