import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

interface PartnerOverviewProps {
  totalRevenue: number;
  todayRevenue: number;
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
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(139, 47, 63, 0.25)' }]}>
            <Ionicons name="today" size={24} color="#8B2F3F" />
          </View>
          <Text style={[styles.statValue, { color: '#8B2F3F' }]}>
            {todayRevenue.toFixed(2)}€
          </Text>
          <Text style={styles.statLabel}>Aujourd&apos;hui</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="scan" size={24} color={Colors.accent.orange} />
          </View>
          {scanCountsLoading ? (
            <ActivityIndicator size="small" color={Colors.accent.orange} style={{ marginVertical: 8 }} />
          ) : (
            <>
              <Text style={[styles.statValue, { color: Colors.accent.orange }]}>
                {totalScans.toLocaleString('fr-FR')}
              </Text>
              <Text style={styles.statLabel}>Scans total</Text>
              {todayScans > 0 && (
                <Text style={styles.statSubLabel}>+{todayScans} aujourd&apos;hui</Text>
              )}
            </>
          )}
        </View>
      </View>

      {/* Compteurs détaillés de scans */}
      {scanCounts && (
        <View style={styles.scanCountsSection}>
          <Text style={styles.sectionTitle}>Statistiques des scans</Text>
          <View style={styles.scanCountsGrid}>
            <View style={styles.scanCountCard}>
              <View style={[styles.scanCountIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="today-outline" size={20} color={Colors.status.success} />
              </View>
              <Text style={styles.scanCountValue}>
                {scanCountsLoading ? '-' : scanCounts.today.toLocaleString('fr-FR')}
              </Text>
              <Text style={styles.scanCountLabel}>Aujourd&apos;hui</Text>
            </View>
            <View style={styles.scanCountCard}>
              <View style={[styles.scanCountIcon, { backgroundColor: 'rgba(139, 47, 63, 0.15)' }]}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primary[600]} />
              </View>
              <Text style={styles.scanCountValue}>
                {scanCountsLoading ? '-' : scanCounts.week.toLocaleString('fr-FR')}
              </Text>
              <Text style={styles.scanCountLabel}>7 jours</Text>
            </View>
            <View style={styles.scanCountCard}>
              <View style={[styles.scanCountIcon, { backgroundColor: 'rgba(139, 47, 63, 0.15)' }]}>
                <Ionicons name="calendar" size={20} color="#8B2F3F" />
              </View>
              <Text style={styles.scanCountValue}>
                {scanCountsLoading ? '-' : scanCounts.month.toLocaleString('fr-FR')}
              </Text>
              <Text style={styles.scanCountLabel}>30 jours</Text>
            </View>
            <View style={styles.scanCountCard}>
              <View style={[styles.scanCountIcon, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                <Ionicons name="stats-chart" size={20} color={Colors.accent.gold} />
              </View>
              <Text style={styles.scanCountValue}>
                {scanCountsLoading ? '-' : scanCounts.total.toLocaleString('fr-FR')}
              </Text>
              <Text style={styles.scanCountLabel}>Total</Text>
            </View>
          </View>
        </View>
      )}


      {/* Actions rapides */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={[styles.quickActionCard, validatingQR && styles.quickActionCardDisabled]}
            onPress={onScanQR || (() => console.warn('onScanQR non défini'))}
            disabled={validatingQR || !onScanQR}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FEE2E2' }]}>
              {validatingQR ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <Ionicons name="qr-code-outline" size={24} color="#EF4444" />
              )}
            </View>
            <Text style={styles.quickActionLabel}>
              {validatingQR ? 'Validation...' : 'Scanner QR'}
            </Text>
            <Text style={styles.quickActionSubtext}>Code client</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={onExportData}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(139, 47, 63, 0.25)' }]}>
              <Ionicons name="document-text" size={24} color="#8B2F3F" />
            </View>
            <Text style={styles.quickActionLabel}>Exporter</Text>
            <Text style={styles.quickActionSubtext}>Données</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="settings" size={24} color={Colors.accent.orange} />
            </View>
            <Text style={styles.quickActionLabel}>Paramètres</Text>
            <Text style={styles.quickActionSubtext}>Compte</Text>
          </TouchableOpacity>
        </View>
      </View>

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
          scans.slice(0, 5).map((scan) => (
            <View key={scan.id} style={styles.transactionItem}>
              <View style={styles.transactionIcon}>
                <Ionicons name="qr-code" size={20} color={Colors.text.light} />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionName}>
                  {scan.customer?.firstName || scan.client?.firstName || 'Client'}{' '}
                  {scan.customer?.lastName || scan.client?.lastName || ''}
                </Text>
                <Text style={styles.transactionDate}>
                  {scan.store?.name || 'Magasin'} • {new Date(scan.createdAt).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <View style={styles.amountBadge}>
                <Text style={styles.amountText}>
                  {scan.amountGross?.toFixed(2) || '0.00'}€
                </Text>
                {scan.discountAmount > 0 && (
                  <Text style={styles.discountText}>
                    -{scan.discountAmount?.toFixed(2) || '0.00'}€
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>


    </>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  } as ViewStyle,
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.md,
  } as ViewStyle,
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  statValue: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.light,
    marginBottom: Spacing.xs,
  } as TextStyle,
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium as any,
    letterSpacing: 0.5,
  } as TextStyle,
  statSubLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.status.success,
    fontWeight: Typography.weights.semibold as any,
    marginTop: 2,
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  } as ViewStyle,
  scanCountIcon: {
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
    marginBottom: Spacing.lg,
  } as ViewStyle,
  quickActionsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  } as ViewStyle,
  quickActionCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadows.md,
  } as ViewStyle,
  quickActionCardDisabled: {
    opacity: 0.6,
  } as ViewStyle,
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(139, 47, 63, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
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
    marginBottom: Spacing.lg,
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
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  } as ViewStyle,
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(139, 47, 63, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  } as ViewStyle,
  transactionInfo: {
    flex: 1,
  } as ViewStyle,
  transactionName: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: 2,
  } as TextStyle,
  transactionDate: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  amountBadge: {
    alignItems: 'flex-end',
    gap: 4,
  } as ViewStyle,
  amountText: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.light,
  } as TextStyle,
  discountText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.status.success,
  } as TextStyle,
});

