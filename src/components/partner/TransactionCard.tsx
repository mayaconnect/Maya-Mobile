/**
 * TransactionCard — Displays a single transaction row for partner history.
 *
 * Usage:
 *   <TransactionCard tx={transaction} />
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MCard, MBadge } from '../ui';
import { colors } from '../../theme/colors';
import { textStyles, fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { wp } from '../../utils/responsive';
import { formatPrice, formatDateTime } from '../../utils/format';

interface TransactionCardProps {
  tx: {
    transactionId?: string;
    customerName?: string;
    customerUserId?: string;
    storeName?: string;
    amountGross?: number;
    amountNet?: number;
    discountPercent?: number;
    personsCount?: number;
    createdAt?: string;
  };
}

export function TransactionCard({ tx }: TransactionCardProps) {
  const displayName =
    tx.customerName ??
    tx.storeName ??
    `Transaction #${tx.transactionId?.slice(0, 6) ?? '—'}`;

  return (
    <MCard style={styles.card} elevation="sm">
      <View style={styles.row}>
        <View style={styles.icon}>
          <Ionicons name="receipt-outline" size={wp(18)} color={colors.violet[500]} />
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.date}>{formatDateTime(tx.createdAt ?? '')}</Text>
          {tx.personsCount ? (
            <View style={styles.meta}>
              <Ionicons
                name="people-outline"
                size={wp(12)}
                color={colors.neutral[400]}
              />
              <Text style={styles.metaText}>{tx.personsCount} pers.</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.amounts}>
          <Text style={styles.gross}>{formatPrice(tx.amountGross ?? 0)}</Text>
          <MBadge
            label={`-${tx.discountPercent ?? 0}%`}
            variant="warning"
            size="sm"
          />
          {tx.amountNet != null && (
            <Text style={styles.net}>Net: {formatPrice(tx.amountNet)}</Text>
          )}
        </View>
      </View>
    </MCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: wp(40),
    height: wp(40),
    borderRadius: borderRadius.md,
    backgroundColor: colors.violet[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  info: {
    flex: 1,
  },
  name: {
    ...textStyles.body,
    fontFamily: fontFamily.medium,
    color: colors.neutral[900],
  },
  date: {
    ...textStyles.micro,
    color: colors.neutral[400],
    marginTop: spacing[1],
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[1],
  },
  metaText: {
    ...textStyles.micro,
    color: colors.neutral[400],
  },
  amounts: {
    alignItems: 'flex-end',
  },
  gross: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  net: {
    ...textStyles.micro,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
});
