/**
 * ScanResultCard — Shows the result of a QR code scan validation.
 *
 * Usage:
 *   <ScanResultCard
 *     success
 *     customerName="Jean D."
 *     amount={45.50}
 *     discount={10}
 *     onScanAgain={reset}
 *   />
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { MButton, MCard, MBadge } from '../ui';
import { colors } from '../../theme/colors';
import { textStyles, fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { wp } from '../../utils/responsive';
import { formatPrice } from '../../utils/format';

interface ScanResultCardProps {
  success: boolean;
  /** Customer display name, shown on success */
  customerName?: string;
  /** Gross amount of the transaction */
  amount?: number;
  /** Discount percentage applied */
  discount?: number;
  /** Error message shown on failure */
  errorMessage?: string;
  /** Called when user taps "Scan again" */
  onScanAgain: () => void;
}

export function ScanResultCard({
  success,
  customerName,
  amount,
  discount,
  errorMessage,
  onScanAgain,
}: ScanResultCardProps) {
  return (
    <Animated.View entering={FadeInUp.springify().damping(15)} style={styles.wrapper}>
      {/* Result circle */}
      <View
        style={[
          styles.circle,
          { backgroundColor: success ? colors.success[500] : colors.error[500] },
        ]}
      >
        <Ionicons
          name={success ? 'checkmark' : 'close'}
          size={wp(48)}
          color="#FFFFFF"
        />
      </View>

      <Text style={styles.title}>
        {success ? 'Transaction validée !' : 'Échec de validation'}
      </Text>

      {success && (
        <MCard style={styles.detailCard} elevation="sm">
          {customerName ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Client</Text>
              <Text style={styles.detailValue}>{customerName}</Text>
            </View>
          ) : null}
          {amount != null ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Montant</Text>
              <Text style={styles.detailValue}>{formatPrice(amount)}</Text>
            </View>
          ) : null}
          {discount != null ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Réduction</Text>
              <MBadge label={`-${discount}%`} variant="warning" size="sm" />
            </View>
          ) : null}
        </MCard>
      )}

      {!success && (
        <Text style={styles.errorMsg}>
          {errorMessage ?? 'Le QR code est invalide, expiré ou déjà utilisé.'}
        </Text>
      )}

      <MButton
        title={success ? 'Scanner un autre QR' : 'Réessayer'}
        onPress={onScanAgain}
        style={{ marginTop: spacing[5], width: '100%' }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: '100%',
    padding: spacing[4],
  },
  circle: {
    width: wp(96),
    height: wp(96),
    borderRadius: wp(48),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[5],
  },
  title: {
    ...textStyles.h2,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  detailCard: {
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[100],
  },
  detailLabel: {
    ...textStyles.caption,
    color: colors.neutral[500],
  },
  detailValue: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
  },
  errorMsg: {
    ...textStyles.body,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: spacing[2],
  },
});
