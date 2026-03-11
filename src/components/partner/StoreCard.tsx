/**
 * StoreCard — Displays a partner store with active indicator and action button.
 *
 * Usage:
 *   <StoreCard store={store} isActive onSetActive={() => {}} />
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MCard, MBadge, MButton } from '../ui';
import { colors } from '../../theme/colors';
import { textStyles, fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { wp } from '../../utils/responsive';

interface StoreCardProps {
  store: {
    id: string;
    name?: string;
    address?: string;
    city?: string;
    category?: string;
  };
  isActive?: boolean;
  loading?: boolean;
  onSetActive?: () => void;
}

export function StoreCard({
  store,
  isActive = false,
  loading = false,
  onSetActive,
}: StoreCardProps) {
  return (
    <MCard
      style={StyleSheet.flatten([styles.card, isActive && styles.activeCard])}
      elevation={isActive ? 'md' : 'sm'}
    >
      <View style={styles.row}>
        <View style={[styles.icon, isActive && styles.activeIcon]}>
          <Ionicons
            name="storefront"
            size={wp(22)}
            color={isActive ? '#FFFFFF' : colors.violet[500]}
          />
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {store.name ?? 'Magasin'}
            </Text>
            {isActive && <MBadge label="Actif" variant="success" size="sm" />}
          </View>
          {store.address ? (
            <Text style={styles.address} numberOfLines={1}>
              {store.address}
            </Text>
          ) : null}
          {store.city ? <Text style={styles.city}>{store.city}</Text> : null}
          {store.category ? (
            <MBadge
              label={store.category}
              variant="violet"
              size="sm"
              style={{ marginTop: spacing[2], alignSelf: 'flex-start' }}
            />
          ) : null}
        </View>
      </View>

      {!isActive && onSetActive && (
        <MButton
          title="Définir comme actif"
          variant="outline"
          size="sm"
          onPress={onSetActive}
          loading={loading}
          style={{ marginTop: spacing[3] }}
        />
      )}
    </MCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[3],
  },
  activeCard: {
    borderWidth: 2,
    borderColor: colors.violet[500],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
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
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  name: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
    flex: 1,
  },
  address: {
    ...textStyles.caption,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  city: {
    ...textStyles.micro,
    color: colors.neutral[400],
    marginTop: spacing[1],
  },
});
