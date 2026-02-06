import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

interface PartnerRecentScansProps {
  scans: any[];
  scansLoading: boolean;
  scansError: string | null;
  onScanQR?: () => void;
}

export const PartnerRecentScans: React.FC<PartnerRecentScansProps> = ({
  scans = [],
  scansLoading,
  scansError,
  onScanQR,
}) => {
  return (
    <View style={styles.recentSection}>
      <Text style={styles.sectionTitle}>Scans récents</Text>
      {scansLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.text.light} />
          <Text style={styles.loadingText}>Chargement des scans...</Text>
        </View>
      ) : scansError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color={Colors.status.error} />
          <Text style={styles.errorText}>{scansError}</Text>
        </View>
      ) : scans.length === 0 ? (
        <BlurView intensity={15} tint="dark" style={styles.emptyCard}>
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="qr-code-outline" size={48} color={Colors.text.secondary} />
            </View>
            <Text style={styles.emptyTitle}>Aucun scan pour le moment</Text>
            <Text style={styles.emptySubtext}>
              Scannez le QR code de vos clients pour commencer à enregistrer des transactions
            </Text>
            {onScanQR && (
              <View style={styles.emptyActionContainer}>
                <Ionicons name="scan" size={20} color={Colors.text.light} />
                <Text style={styles.emptyActionText}>Utilisez le scanner pour commencer</Text>
              </View>
            )}
          </View>
        </BlurView>
      ) : (
        <>
          {scans.slice(0, 5).map((scan, index) => (
            <BlurView key={scan.id || scan.transactionId || `scan-${index}`} intensity={15} tint="dark" style={styles.scanCard}>
              <View style={styles.scanCardContent}>
                <View style={styles.scanIconContainer}>
                  <View style={styles.scanIcon}>
                    <Ionicons name="qr-code-outline" size={24} color={Colors.text.light} />
                  </View>
                </View>
                <View style={styles.scanDetails}>
                  <View style={styles.scanHeader}>
                    <View style={styles.scanTitleContainer}>
                      <Text style={styles.scanName} numberOfLines={1}>
                        {scan.customer?.firstName || scan.client?.firstName || 'Client'}{' '}
                        {scan.customer?.lastName || scan.client?.lastName || ''}
                      </Text>
                      <Text style={styles.scanDate}>
                        {new Date(scan.createdAt).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.scanInfoRow}>
                    <View style={styles.scanStoreRow}>
                      <Ionicons name="storefront-outline" size={14} color={Colors.text.secondary} />
                      <Text style={styles.scanStore} numberOfLines={1}>
                        {scan.store?.name || 'Magasin'}
                      </Text>
                    </View>
                    <View style={styles.scanAmountRow}>
                      <Text style={styles.scanAmount}>
                        {scan.amountGross?.toFixed(2) || '0.00'}€
                      </Text>
                      {scan.discountAmount > 0 && (
                        <View style={styles.scanDiscountBadge}>
                          <Ionicons name="pricetag-outline" size={12} color={Colors.status.success} />
                          <Text style={styles.scanDiscountText}>
                            -{scan.discountAmount?.toFixed(2) || '0.00'}€
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </BlurView>
          ))}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  recentSection: {
    marginBottom: Spacing.md,
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: Spacing.md,
  } as TextStyle,
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  } as ViewStyle,
  loadingText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  } as ViewStyle,
  errorText: {
    fontSize: Typography.sizes.sm,
    color: Colors.status.error,
  } as TextStyle,
  emptyCard: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    overflow: 'hidden',
  } as ViewStyle,
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  } as ViewStyle,
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.light,
    textAlign: 'center',
    marginTop: Spacing.sm,
  } as TextStyle,
  emptySubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  } as TextStyle,
  emptyActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(139, 47, 63, 0.2)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(139, 47, 63, 0.3)',
  } as ViewStyle,
  emptyActionText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.light,
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  scanCard: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    overflow: 'hidden',
  } as ViewStyle,
  scanCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  } as ViewStyle,
  scanIconContainer: {
    position: 'relative',
  } as ViewStyle,
  scanIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(139, 47, 63, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  scanDetails: {
    flex: 1,
    gap: Spacing.xs,
  } as ViewStyle,
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  } as ViewStyle,
  scanTitleContainer: {
    flex: 1,
    gap: 2,
  } as ViewStyle,
  scanName: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.light,
  } as TextStyle,
  scanDate: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  } as TextStyle,
  scanInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  } as ViewStyle,
  scanStoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  } as ViewStyle,
  scanStore: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  scanAmountRow: {
    alignItems: 'flex-end',
    gap: 4,
  } as ViewStyle,
  scanAmount: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.light,
  } as TextStyle,
  scanDiscountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  } as ViewStyle,
  scanDiscountText: {
    fontSize: Typography.sizes.xs,
    color: Colors.status.success,
    fontWeight: '600',
  } as TextStyle,
});

