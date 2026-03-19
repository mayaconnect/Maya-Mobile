/**
 * Maya Connect V2 — Store Management Screen (Manager StoreOperator only)
 *
 * Allows a Manager StoreOperator to:
 *  • View and change the store image
 *  • Edit opening hours (multi-slot schema)
 *  • See store details (name, address, contact)
 *
 * Only accessible if the active store's isManager === true.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppAlert } from '../../src/hooks/use-app-alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storesApi } from '../../src/api/stores.api';
import { usePartnerStore } from '../../src/stores/partner.store';
import { useAuthStore } from '../../src/stores/auth.store';
import { operatorColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import {
  MHeader,
  MCard,
  MBadge,
  MButton,
  MDivider,
  LoadingSpinner,
  ErrorState,
} from '../../src/components/ui';
import { OpeningHoursEditor, StoreImageManager } from '../../src/components/partner';
import type { StoreOpeningHours, StoreUpdateDto, StoreDto } from '../../src/types';
import { parseOpeningHours } from '../../src/types';

export default function StoreManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const activeStore = usePartnerStore((s) => s.activeStore);
  const user = useAuthStore((s) => s.user);

  // Get the operator store info to check isManager
  const operatorStores = user?.partnerData?.operatorStores ?? [];
  const activeStoreInfo = operatorStores.find(
    (s) => s.id === activeStore?.storeId,
  );
  const isManager = activeStoreInfo?.isManager ?? false;
  const storeId = activeStore?.storeId;
  const { alert, AlertModal } = useAppAlert();

  // Fetch full store data
  const storeQ = useQuery({
    queryKey: ['storeDetails', storeId],
    queryFn: () => storesApi.getById(storeId!),
    enabled: !!storeId,
    select: (res) => res.data,
  });

  const store = storeQ.data;

  // Parse opening hours from store data
  const openingHours = useMemo(
    () => parseOpeningHours(store?.openingJson) ?? { tz: 'Europe/Paris' },
    [store?.openingJson],
  );

  // Local editing state for opening hours
  const [editHours, setEditHours] = useState<StoreOpeningHours | null>(null);
  const currentHours = editHours ?? openingHours;
  const hasHoursChanges = editHours !== null;

  // ── Save opening hours mutation ──
  const saveHoursMutation = useMutation({
    mutationFn: async (hours: StoreOpeningHours) => {
      if (!storeId || !store) throw new Error('No store');
      const dto: StoreUpdateDto = {
        id: storeId,
        name: store.name,
        address: store.address,
        city: store.city,
        country: store.country,
        latitude: store.latitude,
        longitude: store.longitude,
        categoryId: store.categoryId,
        avgDiscountPercent: store.avgDiscountPercent,
        phone: store.phone,
        email: store.email,
        isActive: store.isActive,
        openingJson: JSON.stringify(hours),
      };
      return storesApi.updateStore(storeId, dto);
    },
    onSuccess: () => {
      setEditHours(null);
      queryClient.invalidateQueries({ queryKey: ['storeDetails', storeId] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      alert('Succès', 'Les horaires ont été mis à jour.', 'success');
    },
    onError: (err: any) => {
      const msg =
        err?.response?.status === 403
          ? "Vous n'avez pas les droits pour modifier ce magasin. Un administrateur doit accorder l'accès Manager."
          : err?.response?.status === 404
          ? "L'endpoint de mise à jour n'est pas disponible."
          : 'Impossible de sauvegarder les horaires.';
      alert('Erreur', msg);
    },
  });

  const handleSaveHours = useCallback(() => {
    if (!editHours) return;
    saveHoursMutation.mutate(editHours);
  }, [editHours, saveHoursMutation]);

  const handleCancelHours = useCallback(() => {
    setEditHours(null);
  }, []);

  // ── Guard: Not a manager ──
  if (!isManager) {
    return (
      <View style={styles.container}>
        <MHeader title="Gestion du magasin" showBack onBack={() => router.back()} />
        <View style={styles.centerContent}>
          <Ionicons name="lock-closed" size={wp(48)} color={colors.neutral[300]} />
          <Text style={styles.lockedTitle}>Accès restreint</Text>
          <Text style={styles.lockedText}>
            Seuls les opérateurs avec le rôle Manager peuvent gérer le magasin.
          </Text>
          <MButton
            title="Retour"
            variant="outline"
            onPress={() => router.back()}
            style={{ marginTop: spacing[4] }}
          />
        </View>
      </View>
    );
  }

  // ── Loading ──
  if (storeQ.isLoading) {
    return (
      <View style={styles.container}>
        <MHeader title="Gestion du magasin" showBack onBack={() => router.back()} />
        <LoadingSpinner fullScreen message="Chargement du magasin…" />
      </View>
    );
  }

  // ── Error ──
  if (storeQ.isError || !store) {
    return (
      <View style={styles.container}>
        <MHeader title="Gestion du magasin" showBack onBack={() => router.back()} />
        <ErrorState
          fullScreen
          title="Erreur"
          description="Impossible de charger les données du magasin."
          onRetry={() => storeQ.refetch()}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <MHeader
        title="Gestion du magasin"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + wp(100) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Store info banner */}
        <MCard style={styles.storeInfo} elevation="sm">
          <View style={styles.storeInfoRow}>
            <View style={styles.storeIconWrap}>
              <Ionicons name="storefront" size={wp(22)} color={colors.violet[500]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.storeName}>{store.name ?? 'Magasin'}</Text>
              {store.address && (
                <Text style={styles.storeAddress}>{store.address}</Text>
              )}
              {store.city && (
                <Text style={styles.storeCity}>{store.city}</Text>
              )}
            </View>
            <MBadge label="Manager" variant="violet" size="sm" />
          </View>
        </MCard>

        {/* ── Store Image ── */}
        <MCard style={styles.section} elevation="sm">
          <View style={styles.sectionHeader}>
            <Ionicons name="image" size={wp(18)} color={colors.orange[500]} />
            <Text style={styles.sectionTitle}>Image du magasin</Text>
          </View>
          <StoreImageManager
            storeId={store.id}
            imageUrl={store.imageUrl}
            partnerImageUrl={store.partnerImageUrl}
            onImageUpdated={(newUrl) => {
              queryClient.invalidateQueries({ queryKey: ['storeDetails', storeId] });
            }}
          />
        </MCard>

        {/* ── Opening Hours ── */}
        <MCard style={styles.section} elevation="sm">
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={wp(18)} color={colors.orange[500]} />
            <Text style={styles.sectionTitle}>Horaires d'ouverture</Text>
            {hasHoursChanges && (
              <MBadge label="Modifié" variant="warning" size="sm" />
            )}
          </View>

          <OpeningHoursEditor
            value={currentHours}
            onChange={setEditHours}
          />

          {/* Save / Cancel buttons */}
          {hasHoursChanges && (
            <View style={styles.hoursActions}>
              <MButton
                title="Annuler"
                variant="outline"
                size="sm"
                onPress={handleCancelHours}
                disabled={saveHoursMutation.isPending}
                style={{ flex: 1 }}
              />
              <MButton
                title="Enregistrer"
                variant="primary"
                size="sm"
                onPress={handleSaveHours}
                loading={saveHoursMutation.isPending}
                icon={<Ionicons name="checkmark" size={wp(16)} color="#FFF" />}
                style={{ flex: 1 }}
              />
            </View>
          )}
        </MCard>

        {/* ── Store Contact Info (read-only) ── */}
        <MCard style={styles.section} elevation="sm">
          <View style={styles.sectionHeader}>
            <Ionicons name="call" size={wp(18)} color={colors.orange[500]} />
            <Text style={styles.sectionTitle}>Contact</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Téléphone</Text>
            <Text style={styles.infoValue}>{store.phone ?? '—'}</Text>
          </View>
          <MDivider />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{store.email ?? '—'}</Text>
          </View>
          <MDivider />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Catégorie</Text>
            <Text style={styles.infoValue}>{store.category ?? '—'}</Text>
          </View>
          <MDivider />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Réduction moy.</Text>
            <Text style={styles.infoValue}>
              {store.avgDiscountPercent > 0 ? `${Math.round(store.avgDiscountPercent)}%` : '—'}
            </Text>
          </View>
        </MCard>
      </ScrollView>

      <AlertModal />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  scroll: {
    padding: spacing[4],
    gap: spacing[4],
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
    gap: spacing[3],
  },
  lockedTitle: {
    ...textStyles.h3,
    fontFamily: fontFamily.bold,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  lockedText: {
    ...textStyles.body,
    color: colors.neutral[400],
    textAlign: 'center',
    lineHeight: wp(20),
  },

  /* Store info */
  storeInfo: {
    padding: spacing[4],
  },
  storeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  storeIconWrap: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
    backgroundColor: colors.violet[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeName: {
    ...textStyles.subtitle,
    fontFamily: fontFamily.bold,
    color: colors.neutral[700],
  },
  storeAddress: {
    ...textStyles.caption,
    color: colors.neutral[400],
    marginTop: 2,
  },
  storeCity: {
    ...textStyles.caption,
    color: colors.neutral[400],
  },

  /* Section */
  section: {
    padding: spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    ...textStyles.subtitle,
    fontFamily: fontFamily.bold,
    color: colors.neutral[700],
    flex: 1,
  },

  /* Hours actions */
  hoursActions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[4],
  },

  /* Info rows */
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
  },
  infoLabel: {
    ...textStyles.body,
    color: colors.neutral[400],
  },
  infoValue: {
    ...textStyles.body,
    fontFamily: fontFamily.medium,
    color: colors.neutral[700],
  },
});
