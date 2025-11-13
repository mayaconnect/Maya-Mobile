import { NavigationTransition } from '@/components/common/navigation-transition';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { QrService } from '@/services/qr.service';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Transaction = {
  id: number;
  customerName: string;
  amount: number;
  date: string;
};

const initialTransactions: Transaction[] = [
  { id: 1, customerName: 'Marie Dupont', amount: 15.5, date: '2024-01-15T10:30:00' },
  { id: 2, customerName: 'Jean Martin', amount: 8.75, date: '2024-01-15T14:20:00' },
  { id: 3, customerName: 'Sophie Bernard', amount: 22.0, date: '2024-01-14T18:45:00' },
  { id: 4, customerName: 'Pierre Leroy', amount: -12.3, date: '2024-01-14T12:15:00' },
];

export default function PartnerHomeScreen() {
  const { user, signOut } = useAuth();
  const [showQRShare, setShowQRShare] = useState(false);
  const [qrToken, setQrToken] = useState<{ token: string; expiresAt: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');
  const [transactions] = useState<Transaction[]>(initialTransactions);

  const formatCurrency = (value: number): string =>
    Number.isFinite(value)
      ? value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
      : '0,00 €';

  const loadQrToken = async (forceRefresh = false) => {
    try {
      setQrLoading(true);
      setQrError('');

      const cached = await QrService.getStoredQrToken();
      const isExpired =
        cached && new Date(cached.expiresAt).getTime() <= Date.now() + 60 * 1000;

      if (cached && !forceRefresh && !isExpired) {
        setQrToken(cached);
        return;
      }

      const fresh = await QrService.issueQrToken(forceRefresh);
      if (fresh) {
        setQrToken(fresh);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du QR token:', error);
      setQrError('Impossible de générer un nouveau QR code pour le moment');
    } finally {
      setQrLoading(false);
    }
  };

  useEffect(() => {
    loadQrToken();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/connexion/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      Alert.alert('Erreur', 'Impossible de se déconnecter pour le moment.');
    }
  };

  const handleShareQR = async () => {
    if (!qrToken) return;

    try {
      const result = await Share.share({
        message: `Token partenaire : ${qrToken.token}`,
      });

      if (result.action === Share.sharedAction) {
        setShowQRShare(true);
        setTimeout(() => setShowQRShare(false), 2000);
      }
    } catch (error) {
      console.error('Erreur lors du partage du QR token:', error);
      Alert.alert('Erreur', 'Impossible de partager le QR code.');
    }
  };

  const balance = useMemo(
    () => transactions.reduce((sum, tx) => sum + tx.amount, 0),
    [transactions],
  );

  const biggestPayment = useMemo(
    () => (transactions.length ? Math.max(...transactions.map((tx) => tx.amount)) : 0),
    [transactions],
  );

  const averageTicket = useMemo(
    () => (transactions.length ? balance / transactions.length : 0),
    [transactions, balance],
  );

  const formattedTransactions = useMemo(
    () =>
      transactions
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((item) => ({
          ...item,
          displayDate: new Date(item.date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
          }),
        })),
    [transactions],
  );

  return (
    <NavigationTransition>
      <View style={styles.screen}>
        <LinearGradient colors={['#450A1D', '#120A18']} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" />
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <LinearGradient colors={['#571329', '#1C112A']} style={styles.hero}>
              <View style={styles.heroHeader}>
                <View>
                  <Text style={styles.heroTitle}>QR Validation</Text>
                  <Text style={styles.heroSubtitle}>Partage ton code pour valider une visite</Text>
                </View>
                <View style={styles.heroActions}>
                  <TouchableOpacity style={styles.heroButton} onPress={() => loadQrToken(true)}>
                    <Ionicons name="refresh" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.heroLogout} onPress={handleLogout}>
                    <Ionicons name="log-out" size={18} color={Colors.text.light} />
                    <Text style={styles.heroLogoutText}>Se déconnecter</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.qrContainer}>
                {qrLoading ? (
                  <View style={styles.qrLoading}>
                    <ActivityIndicator size="large" color={Colors.primary[400]} />
                    <Text style={styles.qrLoadingText}>Génération du QR code…</Text>
                  </View>
                ) : qrError ? (
                  <View style={styles.qrError}>
                    <Ionicons name="alert-circle" size={28} color={Colors.status.error} />
                    <Text style={styles.qrErrorText}>{qrError}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => loadQrToken(true)}>
                      <Ionicons name="refresh" size={16} color="#FFFFFF" />
                      <Text style={styles.retryLabel}>Réessayer</Text>
                    </TouchableOpacity>
                  </View>
                ) : qrToken ? (
                  <>
                    <View style={styles.qrImageWrapper}>
                      <Image
                        source={{
                          uri: `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                            qrToken.token,
                          )}`,
                        }}
                        style={styles.qrImage}
                      />
                    </View>
                    <Text style={styles.qrTokenValue}>{qrToken.token}</Text>
                    <Text style={styles.qrTokenExpiry}>
                      Expire le{' '}
                      {new Date(qrToken.expiresAt).toLocaleString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    <TouchableOpacity style={styles.qrShareButton} onPress={handleShareQR}>
                      <Ionicons name="share-social" size={18} color="#FFFFFF" />
                      <Text style={styles.qrShareLabel}>Partager</Text>
                    </TouchableOpacity>
                  </>
                ) : null}

                {showQRShare && (
                  <View style={styles.qrShareBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.secondary[400]} />
                    <Text style={styles.qrShareText}>QR code partagé !</Text>
                  </View>
                )}
              </View>
            </LinearGradient>

            <LinearGradient colors={['#262148', '#392F7A']} style={styles.savingsCard}>
              <View style={styles.savingsHeader}>
                <Text style={styles.savingsLabel}>Économies cumulées</Text>
                <Ionicons name="sparkles" size={18} color="rgba(255,255,255,0.85)" />
              </View>
              <Text style={styles.savingsValue}>{formatCurrency(balance)}</Text>
              <View style={styles.savingsStats}>
                <View style={styles.statBlock}>
                  <Text style={styles.statLabel}>Ticket moyen</Text>
                  <Text style={styles.statValue}>{formatCurrency(averageTicket)}</Text>
                </View>
                <View style={styles.statSeparator} />
                <View style={styles.statBlock}>
                  <Text style={styles.statLabel}>Max transaction</Text>
                  <Text style={styles.statValue}>{formatCurrency(biggestPayment)}</Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Transactions</Text>
                <TouchableOpacity>
                  <Text style={styles.sectionAction}>Voir tout</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.transactionList}>
                {formattedTransactions.map((tx, index) => (
                  <View
                    key={tx.id}
                    style={[
                      styles.transactionRow,
                      index === formattedTransactions.length - 1 && styles.transactionRowLast,
                    ]}
                  >
                    <View style={styles.transactionIcon}>
                      <Text style={styles.transactionInitial}>{tx.customerName.charAt(0)}</Text>
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionName}>{tx.customerName}</Text>
                      <Text style={styles.transactionDate}>{tx.displayDate}</Text>
                    </View>
                    <Text
                      style={[
                        styles.transactionAmount,
                        tx.amount >= 0 ? styles.positive : styles.negative,
                      ]}
                    >
                      {tx.amount >= 0 ? '+' : '-'}
                      {formatCurrency(Math.abs(tx.amount))}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </NavigationTransition>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#450A1D',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['4xl'],
    gap: Spacing['2xl'],
  },
  hero: {
    borderRadius: BorderRadius['3xl'],
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
    overflow: 'hidden',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing['2xl'],
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  heroTitle: {
    color: Colors.text.primary,
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.semibold as any,
  },
  heroSubtitle: {
    marginTop: Spacing.xs,
    color: Colors.text.muted,
    fontSize: Typography.sizes.sm,
  },
  heroButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroLogoutText: {
    color: Colors.text.light,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold as any,
  },
  qrContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  qrLoading: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  qrLoadingText: {
    color: Colors.text.secondary,
  },
  qrError: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  qrErrorText: {
    color: Colors.status.error,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  retryLabel: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.sm,
  },
  qrImageWrapper: {
    padding: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius['2xl'],
  },
  qrImage: {
    width: 220,
    height: 220,
  },
  qrTokenValue: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
  },
  qrTokenExpiry: {
    color: Colors.text.muted,
    fontSize: Typography.sizes.sm,
  },
  qrShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  qrShareLabel: {
    color: Colors.text.light,
    fontSize: Typography.sizes.sm,
  },
  qrShareBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(39,239,161,0.16)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  qrShareText: {
    color: Colors.secondary[300],
    fontSize: Typography.sizes.sm,
  },
  savingsCard: {
    borderRadius: BorderRadius['3xl'],
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  savingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savingsLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: Typography.sizes.sm,
    letterSpacing: 0.4,
  },
  savingsValue: {
    color: Colors.text.light,
    fontSize: Typography.sizes['4xl'],
    fontWeight: Typography.weights.bold as any,
  },
  savingsStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statBlock: {
    flex: 1,
    gap: Spacing.xs / 2,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: Typography.sizes.xs,
  },
  statValue: {
    color: Colors.text.light,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold as any,
  },
  statSeparator: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: Spacing.lg,
  },
  section: {
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold as any,
  },
  sectionAction: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: Typography.sizes.sm,
  },
  transactionList: {
    borderRadius: BorderRadius['3xl'],
    backgroundColor: 'rgba(22,14,30,0.85)',
    paddingVertical: Spacing.sm,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  transactionRowLast: {
    borderBottomWidth: 0,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  transactionInitial: {
    color: Colors.text.light,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold as any,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium as any,
  },
  transactionDate: {
    color: Colors.text.muted,
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: Typography.sizes.base,
  },
  positive: {
    color: Colors.secondary[200],
  },
  negative: {
    color: Colors.status.error,
  },
});

