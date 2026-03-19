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
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { EmptyState, MButton } from '../../src/components/ui';

export default function PartnerStoresScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const router = useRouter();

  const stores = usePartnerStore((s) => s.stores);
  const activeStoreZus = usePartnerStore((s) => s.activeStore);

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
      Alert.alert('Erreur', err?.response?.data?.detail ?? 'Impossible de changer le magasin actif.');
    },
  });

  const renderStore = ({ item, index }: any) => {
    const isActive = item.id === activeId;
    return (
      <View style={[styles.card, isActive && styles.cardActive]}>
        {/* Accent bar left */}
        {isActive && <View style={styles.accentBar} />}

        <View style={styles.cardInner}>
          {/* Icon + Info */}
          <View style={styles.row}>
            <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
              <Ionicons
                name="storefront"
                size={wp(20)}
                color={isActive ? '#FFFFFF' : colors.violet[500]}
              />
            </View>

            <View style={styles.info}>
              <Text style={styles.storeName} numberOfLines={1}>
                {item.name ?? 'Magasin'}
              </Text>
              {item.address ? (
                <Text style={styles.storeAddr} numberOfLines={1}>
                  <Ionicons name="location-outline" size={wp(11)} color={colors.neutral[400]} />
                  {' '}{item.address}{item.city ? `, ${item.city}` : ''}
                </Text>
              ) : null}
              {item.category ? (
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              ) : null}
            </View>

            {/* Right badge / button */}
            {isActive ? (
              <View style={styles.activeBadge}>
                <Ionicons name="checkmark-circle" size={wp(14)} color={colors.violet[500]} />
                <Text style={styles.activeBadgeText}>Actif</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.activateBtn,
                  setActiveMutation.isPending && setActiveMutation.variables === item.id
                    && styles.activateBtnLoading,
                ]}
                onPress={() =>
                  Alert.alert(
                    'Changer de magasin',
                    `Définir "${item.name}" comme magasin actif ?`,
                    [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Confirmer', onPress: () => setActiveMutation.mutate(item.id) },
                    ],
                  )
                }
                disabled={setActiveMutation.isPending}
              >
                <Text style={styles.activateTxt}>Activer</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Manage button — only for active store */}
          {isActive && (
            <MButton
              title="Gérer le magasin"
              variant="outline"
              size="sm"
              onPress={() => router.push('/(partner)/store-management' as any)}
              style={{ marginTop: spacing[3] }}
              icon={<Ionicons name="settings-outline" size={wp(14)} color={colors.violet[500]} />}
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Gradient header */}
      <LinearGradient
        colors={['#FF6A00', '#FFB347']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing[2] }]}
      >
        <Text style={styles.headerTitle}>Mes magasins</Text>
        <Text style={styles.headerSubtitle}>
          {stores.length} magasin{stores.length !== 1 ? 's' : ''}
          {activeId ? ' · 1 actif' : ''}
        </Text>
      </LinearGradient>

      <FlatList
        data={stores}
        keyExtractor={(item: any) => item.id}
        renderItem={renderStore}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={activeStoreQ.isFetching}
            onRefresh={() => activeStoreQ.refetch()}
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
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[5],
  },
  headerTitle: {
    ...textStyles.h3,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.75)',
    marginTop: spacing[1],
  },

  list: {
    padding: spacing[4],
    gap: spacing[3],
    paddingBottom: wp(100),
  },

  card: {
    backgroundColor: '#111827',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    ...shadows.md,
    flexDirection: 'row',
  },
  cardActive: {
    borderColor: colors.violet[500],
    backgroundColor: '#131E35',
  },
  accentBar: {
    width: 4,
    backgroundColor: colors.violet[500],
    borderTopLeftRadius: borderRadius.xl,
    borderBottomLeftRadius: borderRadius.xl,
  },
  cardInner: {
    flex: 1,
    padding: spacing[4],
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconBox: {
    width: wp(42),
    height: wp(42),
    borderRadius: borderRadius.lg,
    backgroundColor: colors.violet[50],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconBoxActive: {
    backgroundColor: colors.violet[500],
  },

  info: {
    flex: 1,
    gap: spacing[1],
  },
  storeName: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
  },
  storeAddr: {
    ...textStyles.micro,
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

  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.violet[50],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    flexShrink: 0,
  },
  activeBadgeText: {
    ...textStyles.micro,
    fontFamily: fontFamily.semiBold,
    color: colors.violet[500],
  },

  activateBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    flexShrink: 0,
  },
  activateBtnLoading: {
    opacity: 0.5,
  },
  activateTxt: {
    ...textStyles.caption,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[700],
  },
});
