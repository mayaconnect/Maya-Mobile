/**
 * StoreSelectionModal — Modal for selecting the active store.
 *
 * Used by StoreOperators and Partners when they need to select
 * which store to work with. Can be mandatory (no dismiss) at startup.
 *
 * Usage:
 *   <StoreSelectionModal visible onDismiss={() => {}} />
 *   <StoreSelectionModal visible onDismiss={() => {}} mandatory />
 */
import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storeOperatorsApi } from '../../api/store-operators.api';
import { usePartnerStore } from '../../stores/partner.store';
import { colors } from '../../theme/colors';
import { textStyles, fontFamily } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { wp } from '../../utils/responsive';
import { MButton, MCard, MBadge } from '../ui';

interface StoreSelectionModalProps {
  visible: boolean;
  onDismiss: () => void;
  /** If true, user cannot dismiss the modal (forced selection at startup) */
  mandatory?: boolean;
}

export default function StoreSelectionModal({
  visible,
  onDismiss,
  mandatory = false,
}: StoreSelectionModalProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const stores = usePartnerStore((s) => s.stores);
  const activeStore = usePartnerStore((s) => s.activeStore);
  const setActive = usePartnerStore((s) => s.setActiveStore);

  const setActiveMutation = useMutation({
    mutationFn: (storeId: string) =>
      storeOperatorsApi.setActiveStore({ storeId }),
    onSuccess: (_data, storeId) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['activeStore'] });
      queryClient.invalidateQueries({ queryKey: ['myPartnerStores'] });
      // Update local state
      const found = stores.find((s) => s.id === storeId);
      if (found) {
        setActive({ storeId, storeName: found.name } as any);
      }
      onDismiss();
    },
    onError: (err: any) => {
      Alert.alert(
        'Erreur',
        err?.response?.data?.detail ?? 'Impossible de changer le magasin actif.',
      );
    },
  });

  const activeId = activeStore?.storeId;

  const handleSelect = (storeId: string, storeName: string) => {
    if (storeId === activeId) {
      if (!mandatory) onDismiss();
      return;
    }
    Alert.alert(
      'Changer de magasin',
      `Voulez-vous définir "${storeName}" comme magasin actif ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => setActiveMutation.mutate(storeId),
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={mandatory ? undefined : onDismiss}
    >
      <View style={[styles.container, { paddingTop: insets.top + spacing[4] }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              {mandatory ? 'Sélectionnez un magasin' : 'Changer de magasin'}
            </Text>
            <Text style={styles.subtitle}>
              {mandatory
                ? 'Choisissez le magasin dans lequel vous travaillez aujourd\'hui.'
                : 'Sélectionnez le magasin pour lequel vous souhaitez travailler.'}
            </Text>
          </View>
          {!mandatory ? (
            <MButton
              title="Fermer"
              variant="ghost"
              size="sm"
              onPress={onDismiss}
              fullWidth={false}
            />
          ) : null}
        </View>

        <FlatList
          data={stores}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isActive = item.id === activeId;
            return (
              <MCard
                style={StyleSheet.flatten([styles.storeCard, isActive ? styles.activeCard : {}])}
                elevation={isActive ? 'md' : 'sm'}
              >
                <View style={styles.storeRow}>
                  <View style={[styles.storeIcon, isActive ? styles.activeIcon : {}]}>
                    <Ionicons
                      name="storefront"
                      size={wp(22)}
                      color={isActive ? '#FFFFFF' : colors.violet[500]}
                    />
                  </View>
                  <View style={styles.storeInfo}>
                    <Text style={styles.storeName} numberOfLines={1}>
                      {item.name ?? 'Magasin'}
                    </Text>
                    {item.address ? (
                      <Text style={styles.storeAddr} numberOfLines={1}>
                        {item.address}
                      </Text>
                    ) : null}
                    {item.city ? (
                      <Text style={styles.storeCity}>{item.city}</Text>
                    ) : null}
                  </View>
                  {isActive ? (
                    <MBadge label="Actif" variant="success" size="sm" />
                  ) : null}
                </View>

                <MButton
                  title={isActive ? 'Magasin actuel' : 'Sélectionner'}
                  variant={isActive ? 'primary' : 'outline'}
                  size="sm"
                  onPress={() => handleSelect(item.id, item.name ?? 'Magasin')}
                  loading={
                    setActiveMutation.isPending &&
                    setActiveMutation.variables === item.id
                  }
                  disabled={isActive && !mandatory}
                  style={{ marginTop: spacing[3] }}
                />
              </MCard>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="storefront-outline" size={wp(48)} color={colors.neutral[300]} />
              <Text style={styles.emptyTitle}>Aucun magasin</Text>
              <Text style={styles.emptyDesc}>
                Vous n'avez pas de magasin assigné. Contactez votre partenaire.
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  title: {
    ...textStyles.h3,
    color: colors.neutral[900],
  },
  subtitle: {
    ...textStyles.caption,
    color: colors.neutral[500],
    marginTop: spacing[1],
    maxWidth: wp(260),
  },
  list: {
    padding: spacing[4],
    paddingBottom: wp(100),
  },
  storeCard: {
    marginBottom: spacing[3],
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
  storeName: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  emptyTitle: {
    ...textStyles.h4,
    color: colors.neutral[900],
    marginTop: spacing[4],
  },
  emptyDesc: {
    ...textStyles.caption,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: spacing[2],
    maxWidth: wp(280),
  },
});
