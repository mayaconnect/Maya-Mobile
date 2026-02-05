import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

interface PartnerOverviewProps {
  totalRevenue: number;
  todayRevenue: number;
  todayDiscounts?: number;
  scans: any[];
  scansLoading: boolean;
  scansError: string | null;
  scanCounts?: {
    today: number;
    week: number;
    month: number;
    total: number;
  };
  scanCountsLoading?: boolean;
  clients: any[];
  clientsLoading: boolean;
  clientsError: string | null;
  filteredClients: any[];
  onExportData: () => void;
  onScanQR?: () => void;
  validatingQR?: boolean;
}

export function PartnerOverview({
  totalRevenue,
  todayRevenue,
  todayDiscounts = 0,
  scans,
  scansLoading,
  scansError,
  scanCounts,
  scanCountsLoading,
  clients,
  clientsLoading,
  clientsError,
  filteredClients,
  onExportData,
  onScanQR,
  validatingQR = false,
}: PartnerOverviewProps) {
  const totalScans = scanCounts?.total || scans.length;
  const todayScans = scanCounts?.today || 0;
  
  return (
    <>
      {/* Statistiques */}
      <BlurView intensity={15} tint="dark" style={styles.statsContainer}>
        {/* Première ligne : Montant global et Réductions */}
        <View style={styles.statsRow}>
          <BlurView intensity={15} tint="dark" style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(139, 47, 63, 0.25)' }]}>
                <Ionicons name="cash" size={20} color="#8B2F3F" />
              </View>
              <View style={styles.statCardContent}>
                <Text style={styles.statLabel}>Montant global</Text>
                <Text style={[styles.statValue, { color: '#8B2F3F' }]}>
                  {todayRevenue.toFixed(2)}€
                </Text>
                <Text style={styles.statSubLabel}>Aujourd&apos;hui</Text>
              </View>
            </View>
          </BlurView>
          <BlurView intensity={15} tint="dark" style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.25)' }]}>
                <Ionicons name="pricetag" size={20} color={Colors.status.success} />
              </View>
              <View style={styles.statCardContent}>
                <Text style={styles.statLabel}>Réductions totales</Text>
                <Text style={[styles.statValue, { color: Colors.status.success }]}>
                  {todayDiscounts.toFixed(2)}€
                </Text>
                <Text style={styles.statSubLabel}>Aujourd&apos;hui</Text>
              </View>
            </View>
          </BlurView>
        </View>
        
        {/* Deuxième ligne : Scans total */}
        <View style={styles.statsRow}>
          <BlurView intensity={15} tint="dark" style={[styles.statCard, styles.statCardFull]}>
            <View style={styles.statCardHeader}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="scan" size={20} color={Colors.accent.orange} />
              </View>
              <View style={styles.statCardContent}>
                {scanCountsLoading ? (
                  <ActivityIndicator size="small" color={Colors.accent.orange} />
                ) : (
                  <>
                    <Text style={styles.statLabel}>Scans total</Text>
                    <Text style={[styles.statValue, { color: Colors.accent.orange }]}>
                      {totalScans.toLocaleString('fr-FR')}
                    </Text>
                    {todayScans > 0 && (
                      <Text style={styles.statSubLabel}>+{todayScans} aujourd&apos;hui</Text>
                    )}
                  </>
                )}
              </View>
            </View>
          </BlurView>
        </View>
      </BlurView>

      {/* Compteurs détaillés de scans */}
      {scanCounts && (
        <BlurView intensity={15} tint="dark" style={styles.scanCountsSection}>
          <View style={styles.scanCountsGrid}>
            <BlurView intensity={15} tint="dark" style={styles.scanCountCard}>
              <View style={[styles.scanCountIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="today-outline" size={20} color={Colors.status.success} />
              </View>
              <Text style={styles.scanCountValue}>
                {scanCountsLoading ? '-' : scanCounts.today.toLocaleString('fr-FR')}
              </Text>
              <Text style={styles.scanCountLabel}>Aujourd&apos;hui</Text>
            </BlurView>
            <BlurView intensity={15} tint="dark" style={styles.scanCountCard}>
              <View style={[styles.scanCountIcon, { backgroundColor: 'rgba(139, 47, 63, 0.15)' }]}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primary[600]} />
              </View>
              <Text style={styles.scanCountValue}>
                {scanCountsLoading ? '-' : scanCounts.week.toLocaleString('fr-FR')}
              </Text>
              <Text style={styles.scanCountLabel}>7 jours</Text>
            </BlurView>
            <BlurView intensity={15} tint="dark" style={styles.scanCountCard}>
              <View style={[styles.scanCountIcon, { backgroundColor: 'rgba(139, 47, 63, 0.15)' }]}>
                <Ionicons name="calendar" size={20} color="#8B2F3F" />
              </View>
              <Text style={styles.scanCountValue}>
                {scanCountsLoading ? '-' : scanCounts.month.toLocaleString('fr-FR')}
              </Text>
              <Text style={styles.scanCountLabel}>30 jours</Text>
            </BlurView>
            <BlurView intensity={15} tint="dark" style={styles.scanCountCard}>
              <View style={[styles.scanCountIcon, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                <Ionicons name="stats-chart" size={20} color={Colors.accent.gold} />
              </View>
              <Text style={styles.scanCountValue}>
                {scanCountsLoading ? '-' : scanCounts.total.toLocaleString('fr-FR')}
              </Text>
              <Text style={styles.scanCountLabel}>Total</Text>
            </BlurView>
          </View>
        </BlurView>
      )}


      {/* Actions rapides */}
      <BlurView intensity={15} tint="dark" style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickActionsGrid}>
          <BlurView intensity={15} tint="dark" style={styles.quickActionCardBlur}>
            <TouchableOpacity 
              style={[styles.quickActionCard, validatingQR && styles.quickActionCardDisabled]}
              onPress={onScanQR || (() => console.warn('onScanQR non défini'))}
              disabled={validatingQR || !onScanQR}
            >
              {validatingQR ? (
                <ActivityIndicator size="small" color={Colors.text.light} />
              ) : (
                <Ionicons name="qr-code-outline" size={24} color={Colors.text.light} />
              )}
              <Text style={styles.quickActionLabel}>
                {validatingQR ? 'Validation...' : 'Scanner QR'}
              </Text>
              <Text style={styles.quickActionSubtext}>Code client</Text>
            </TouchableOpacity>
          </BlurView>
          <BlurView intensity={10} tint="dark" style={styles.quickActionCardBlur}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={onExportData}
            >
              <Ionicons name="document-text-outline" size={24} color={Colors.text.light} />
              <Text style={styles.quickActionLabel}>Exporter</Text>
              <Text style={styles.quickActionSubtext}>Données</Text>
            </TouchableOpacity>
          </BlurView>
          <BlurView intensity={15} tint="dark" style={styles.quickActionCardBlur}>
            <TouchableOpacity style={styles.quickActionCard}>
              <Ionicons name="settings-outline" size={24} color={Colors.text.light} />
              <Text style={styles.quickActionLabel}>Paramètres</Text>
              <Text style={styles.quickActionSubtext}>Compte</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </BlurView>

      {/* Scans récents */}
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
          <View style={styles.emptyContainer}>
            <Ionicons name="qr-code-outline" size={32} color={Colors.text.secondary} />
            <Text style={styles.emptyText}>Aucun scan trouvé</Text>
          </View>
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


    </>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    marginBottom: Spacing.md,
    gap: Spacing.md,
  } as ViewStyle,
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  } as ViewStyle,
  statCard: {
    flex: 1,
        borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    overflow: 'hidden',
  } as ViewStyle,
  statCardFull: {
    flex: 1,
  } as ViewStyle,
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  } as ViewStyle,
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  statCardContent: {
    flex: 1,
  } as ViewStyle,
  statValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.light,
    marginTop: 2,
    marginBottom: 2,
  } as TextStyle,
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium as any,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 4,
  } as TextStyle,
  statSubLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium as any,
    marginTop: 2,
    opacity: 0.8,
  } as TextStyle,
  scanCountsSection: {
    marginBottom: Spacing.lg,
  } as ViewStyle,
  scanCountsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  } as ViewStyle,
  scanCountCard: {
    flex: 1,
    minWidth: '48%',
        borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    overflow: 'hidden',
  } as ViewStyle,
  scanCountIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  } as ViewStyle,
  scanCountValue: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.light,
    marginBottom: 2,
  } as TextStyle,
  scanCountLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  quickActionsSection: {
    marginBottom: Spacing.md,
  } as ViewStyle,
  quickActionsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  } as ViewStyle,
  quickActionCardBlur: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    overflow: 'hidden',
  } as ViewStyle,
  quickActionCard: {

    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  } as ViewStyle,
  quickActionCardDisabled: {
    opacity: 0.6,
  } as ViewStyle,
  quickActionLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: 2,
  } as TextStyle,
  quickActionSubtext: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  } as TextStyle,
  recentSection: {
    position: 'relative',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    right: 10,
    width: 360,
    
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  } as ViewStyle,
  emptyText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
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
  discountText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.status.success,
  } as TextStyle,
});

