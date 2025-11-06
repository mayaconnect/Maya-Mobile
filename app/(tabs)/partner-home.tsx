import { NavigationTransition } from '@/components/common/navigation-transition';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Données mockées pour les historiques
const mockHistory = [
  {
    id: 1,
    customerName: 'Marie Dupont',
    amount: 15.50,
    date: '2024-01-15T10:30:00',
    status: 'completed',
  },
  {
    id: 2,
    customerName: 'Jean Martin',
    amount: 8.75,
    date: '2024-01-15T14:20:00',
    status: 'completed',
  },
  {
    id: 3,
    customerName: 'Sophie Bernard',
    amount: 22.00,
    date: '2024-01-14T18:45:00',
    status: 'completed',
  },
  {
    id: 4,
    customerName: 'Pierre Leroy',
    amount: 12.30,
    date: '2024-01-14T12:15:00',
    status: 'completed',
  },
];

// Données mockées pour les abonnements
const mockSubscriptions = [
  {
    id: 1,
    planName: 'Plan Premium',
    price: 49.99,
    period: 'Mensuel',
    status: 'active',
    nextBilling: '2024-02-15',
    features: ['QR Code illimité', 'Statistiques avancées', 'Support prioritaire'],
  },
];

export default function PartnerHomeScreen() {
  const { user, signOut } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'history' | 'subscription' | 'stats'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showQRShare, setShowQRShare] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/connexion/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleShareQR = () => {
    // Logique pour partager le QR code
    console.log('Partage du QR code');
    setShowQRShare(true);
    setTimeout(() => setShowQRShare(false), 2000);
  };

  const handleExportData = () => {
    // Logique pour exporter les données
    console.log('Export des données');
  };

  // Filtrer l'historique
  const filteredHistory = mockHistory.filter((item) => {
    const matchesSearch = item.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const itemDate = new Date(item.date);
    const now = new Date();
    
    let matchesPeriod = true;
    if (filterPeriod === 'today') {
      matchesPeriod = itemDate.toDateString() === now.toDateString();
    } else if (filterPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesPeriod = itemDate >= weekAgo;
    } else if (filterPeriod === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesPeriod = itemDate >= monthAgo;
    }
    
    return matchesSearch && matchesPeriod;
  });

  const totalRevenue = mockHistory.reduce((sum, item) => sum + item.amount, 0);
  const todayRevenue = mockHistory
    .filter(item => new Date(item.date).toDateString() === new Date().toDateString())
    .reduce((sum, item) => sum + item.amount, 0);
  const totalScans = mockHistory.length;

  return (
    <NavigationTransition>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#F59E0B', '#EF4444']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>
                {user?.firstName || 'Partenaire'} {user?.lastName || ''}
              </Text>
              <Text style={styles.headerSubtitle}>Tableau de bord partenaire</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.notificationButton}>
                <Ionicons name="notifications" size={24} color="white" />
                <View style={styles.notificationBadge} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>


        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {selectedTab === 'overview' && (
            <>
              {/* Statistiques */}
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="wallet" size={24} color="#10B981" />
                  </View>
                  <Text style={styles.statValue}>{totalRevenue.toFixed(2)}€</Text>
                  <Text style={styles.statLabel}>Revenus totaux</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={[styles.statIconContainer, { backgroundColor: Colors.primary[50] }]}>
                    <Ionicons name="today" size={24} color={Colors.primary[600]} />
                  </View>
                  <Text style={[styles.statValue, { color: Colors.primary[600] }]}>
                    {todayRevenue.toFixed(2)}€
                  </Text>
                  <Text style={styles.statLabel}>Aujourd'hui</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="scan" size={24} color="#F59E0B" />
                  </View>
                  <Text style={[styles.statValue, { color: '#F59E0B' }]}>{totalScans}</Text>
                  <Text style={styles.statLabel}>Scans total</Text>
                </View>
              </View>

              {/* QR Code partenaire */}
              <View style={styles.qrCard}>
                <View style={styles.qrCardHeader}>
                  <View>
                    <Text style={styles.qrCardTitle}>Votre QR Code Partenaire</Text>
                    <Text style={styles.qrCardSubtitle}>
                      Les clients scannent ce code pour valider leur visite
                    </Text>
                  </View>
                  <View style={styles.qrActions}>
                    <TouchableOpacity 
                      style={styles.qrActionButton}
                      onPress={handleShareQR}
                    >
                      <Ionicons name="share-social" size={20} color={Colors.primary[600]} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.qrCodeContainer}>
                  <View style={styles.qrCode}>
                    <View style={styles.qrGrid}>
                      {Array.from({ length: 49 }, (_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.qrSquare,
                            {
                              backgroundColor:
                                (i % 7 + Math.floor(i / 7)) % 2 === 0 ? '#F59E0B' : 'white',
                            },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                </View>
                {showQRShare && (
                  <View style={styles.shareSuccessBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.shareSuccessText}>QR Code copié !</Text>
                  </View>
                )}
                <View style={styles.qrButtonsRow}>
                  <TouchableOpacity style={styles.downloadButton}>
                    <Ionicons name="download" size={20} color="white" />
                    <Text style={styles.downloadButtonText}>Télécharger</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.printButton}
                    onPress={handleShareQR}
                  >
                    <Ionicons name="print" size={20} color={Colors.primary[600]} />
                    <Text style={styles.printButtonText}>Partager</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Actions rapides */}
              <View style={styles.quickActionsSection}>
                <Text style={styles.sectionTitle}>Actions rapides</Text>
                <View style={styles.quickActionsGrid}>
                  <TouchableOpacity 
                    style={styles.quickActionCard}
                    onPress={handleExportData}
                  >
                    <View style={styles.quickActionIcon}>
                      <Ionicons name="document-text" size={24} color="#3B82F6" />
                    </View>
                    <Text style={styles.quickActionLabel}>Exporter</Text>
                    <Text style={styles.quickActionSubtext}>Données</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickActionCard}>
                    <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                      <Ionicons name="settings" size={24} color="#F59E0B" />
                    </View>
                    <Text style={styles.quickActionLabel}>Paramètres</Text>
                    <Text style={styles.quickActionSubtext}>Compte</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickActionCard}>
                    <View style={[styles.quickActionIcon, { backgroundColor: '#D1FAE5' }]}>
                      <Ionicons name="help-circle" size={24} color="#10B981" />
                    </View>
                    <Text style={styles.quickActionLabel}>Aide</Text>
                    <Text style={styles.quickActionSubtext}>Support</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Transactions récentes */}
              <View style={styles.recentSection}>
                <Text style={styles.sectionTitle}>Transactions récentes</Text>
                {mockHistory.slice(0, 3).map((item) => (
                  <View key={item.id} style={styles.transactionItem}>
                    <View style={styles.transactionIcon}>
                      <Ionicons name="person" size={20} color={Colors.primary[600]} />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionName}>{item.customerName}</Text>
                      <Text style={styles.transactionDate}>
                        {new Date(item.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <Text style={styles.transactionAmount}>+{item.amount.toFixed(2)}€</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {selectedTab === 'history' && (
            <View style={styles.historySection}>
              <View style={styles.historyHeaderSection}>
                <Text style={styles.sectionTitle}>Historique complet</Text>
                <TouchableOpacity 
                  style={styles.exportButton}
                  onPress={handleExportData}
                >
                  <Ionicons name="download-outline" size={18} color={Colors.primary[600]} />
                  <Text style={styles.exportButtonText}>Exporter</Text>
                </TouchableOpacity>
              </View>

              {/* Barre de recherche */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={Colors.text.secondary} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher un client..."
                  placeholderTextColor={Colors.text.secondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color={Colors.text.secondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filtres par période */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.filtersContainer}
                contentContainerStyle={styles.filtersContent}
              >
                {[
                  { key: 'all', label: 'Tout' },
                  { key: 'today', label: "Aujourd'hui" },
                  { key: 'week', label: '7 jours' },
                  { key: 'month', label: '30 jours' },
                ].map((filter) => (
                  <TouchableOpacity
                    key={filter.key}
                    style={[
                      styles.filterChip,
                      filterPeriod === filter.key && styles.filterChipActive,
                    ]}
                    onPress={() => setFilterPeriod(filter.key as any)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        filterPeriod === filter.key && styles.filterChipTextActive,
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Résultats filtrés */}
              {filteredHistory.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={64} color={Colors.text.secondary} />
                  <Text style={styles.emptyStateTitle}>Aucun résultat</Text>
                  <Text style={styles.emptyStateText}>
                    Aucune transaction ne correspond à vos critères
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.resultsCount}>
                    <Text style={styles.resultsCountText}>
                      {filteredHistory.length} transaction{filteredHistory.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                  {filteredHistory.map((item) => (
                    <View key={item.id} style={styles.historyCard}>
                      <View style={styles.historyHeader}>
                        <View style={styles.historyIcon}>
                          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                        </View>
                        <View style={styles.historyInfo}>
                          <Text style={styles.historyCustomer}>{item.customerName}</Text>
                          <Text style={styles.historyDate}>
                            {new Date(item.date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                        <Text style={styles.historyAmount}>+{item.amount.toFixed(2)}€</Text>
                      </View>
                      <View style={styles.historyStatus}>
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusText}>Complété</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}

          {selectedTab === 'subscription' && (
            <View style={styles.subscriptionSection}>
              {mockSubscriptions.map((sub) => (
                <View key={sub.id} style={styles.subscriptionCard}>
                  <View style={styles.subscriptionHeader}>
                    <View>
                      <Text style={styles.subscriptionPlanName}>{sub.planName}</Text>
                      <Text style={styles.subscriptionPrice}>
                        {sub.price}€ / {sub.period}
                      </Text>
                    </View>
                    <View style={styles.subscriptionStatusBadge}>
                      <Text style={styles.subscriptionStatusText}>Actif</Text>
                    </View>
                  </View>
                  <View style={styles.subscriptionFeatures}>
                    {sub.features.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Ionicons name="checkmark" size={16} color="#10B981" />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.subscriptionFooter}>
                    <Text style={styles.subscriptionNextBilling}>
                      Prochain paiement : {new Date(sub.nextBilling).toLocaleDateString('fr-FR')}
                    </Text>
                    <TouchableOpacity style={styles.manageButton}>
                      <Text style={styles.manageButtonText}>Gérer l'abonnement</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {selectedTab === 'stats' && (
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Statistiques détaillées</Text>
              
              {/* Graphiques de revenus */}
              <View style={styles.statsCard}>
                <Text style={styles.statsCardTitle}>Évolution des revenus</Text>
                <View style={styles.chartContainer}>
                  <View style={styles.chartBars}>
                    {[65, 80, 45, 90, 70, 85, 95].map((height, index) => (
                      <View key={index} style={styles.chartBarWrapper}>
                        <View style={[styles.chartBar, { height: `${height}%` }]} />
                        <Text style={styles.chartLabel}>{['L', 'M', 'M', 'J', 'V', 'S', 'D'][index]}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {/* Statistiques par période */}
              <View style={styles.periodStatsGrid}>
                <View style={styles.periodStatCard}>
                  <View style={styles.periodStatHeader}>
                    <Ionicons name="calendar" size={18} color={Colors.primary[600]} />
                    <Text style={styles.periodStatLabel}>Cette semaine</Text>
                  </View>
                  <Text style={styles.periodStatValue}>142.50€</Text>
                  <View style={styles.periodStatTrend}>
                    <Ionicons name="trending-up" size={16} color="#10B981" />
                    <Text style={styles.periodStatTrendText}>+12% vs semaine dernière</Text>
                  </View>
                </View>
                <View style={styles.periodStatCard}>
                  <View style={styles.periodStatHeader}>
                    <Ionicons name="calendar-outline" size={18} color={Colors.primary[600]} />
                    <Text style={styles.periodStatLabel}>Ce mois</Text>
                  </View>
                  <Text style={styles.periodStatValue}>587.30€</Text>
                  <View style={styles.periodStatTrend}>
                    <Ionicons name="trending-up" size={16} color="#10B981" />
                    <Text style={styles.periodStatTrendText}>+8% vs mois dernier</Text>
                  </View>
                </View>
              </View>

              {/* Indicateurs de performance */}
              <View style={styles.performanceCard}>
                <Text style={styles.statsCardTitle}>Indicateurs de performance</Text>
                <View style={styles.performanceGrid}>
                  <View style={styles.performanceItem}>
                    <View style={styles.performanceIcon}>
                      <Ionicons name="people" size={20} color="#3B82F6" />
                    </View>
                    <Text style={styles.performanceValue}>24</Text>
                    <Text style={styles.performanceLabel}>Clients uniques</Text>
                  </View>
                  <View style={styles.performanceItem}>
                    <View style={[styles.performanceIcon, { backgroundColor: '#FEF3C7' }]}>
                      <Ionicons name="time" size={20} color="#F59E0B" />
                    </View>
                    <Text style={styles.performanceValue}>2.3</Text>
                    <Text style={styles.performanceLabel}>Visites moy./client</Text>
                  </View>
                  <View style={styles.performanceItem}>
                    <View style={[styles.performanceIcon, { backgroundColor: '#D1FAE5' }]}>
                      <Ionicons name="cash" size={20} color="#10B981" />
                    </View>
                    <Text style={styles.performanceValue}>24.45€</Text>
                    <Text style={styles.performanceLabel}>Panier moyen</Text>
                  </View>
                </View>
              </View>

              {/* Top clients */}
              <View style={styles.statsCard}>
                <Text style={styles.statsCardTitle}>Top clients</Text>
                {[
                  { name: 'Marie Dupont', visits: 12, total: 186.50 },
                  { name: 'Jean Martin', visits: 8, total: 124.75 },
                  { name: 'Sophie Bernard', visits: 6, total: 98.00 },
                ].map((client, index) => (
                  <View key={index} style={styles.topClientItem}>
                    <View style={styles.topClientRank}>
                      <Text style={styles.topClientRankText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.topClientInfo}>
                      <Text style={styles.topClientName}>{client.name}</Text>
                      <Text style={styles.topClientDetails}>
                        {client.visits} visites • {client.total.toFixed(2)}€
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
                  </View>
                ))}
              </View>

              {/* Heures de pointe */}
              <View style={styles.statsCard}>
                <Text style={styles.statsCardTitle}>Heures de pointe</Text>
                <View style={styles.peakHoursContainer}>
                  {[
                    { hour: '10h', value: 15 },
                    { hour: '12h', value: 45 },
                    { hour: '14h', value: 30 },
                    { hour: '18h', value: 60 },
                    { hour: '20h', value: 25 },
                  ].map((item, index) => (
                    <View key={index} style={styles.peakHourItem}>
                      <Text style={styles.peakHourLabel}>{item.hour}</Text>
                      <View style={styles.peakHourBarContainer}>
                        <View style={[styles.peakHourBar, { width: `${item.value}%` }]} />
                      </View>
                      <Text style={styles.peakHourValue}>{item.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Barre de navigation en bas */}
        <SafeAreaView edges={['bottom']} style={styles.bottomNavBarContainer}>
          <View style={styles.bottomNavBar}>
          <TouchableOpacity
            style={[styles.bottomNavItem, selectedTab === 'overview' && styles.bottomNavItemActive]}
            onPress={() => setSelectedTab('overview')}
          >
            <Ionicons
              name={selectedTab === 'overview' ? "grid" : "grid-outline"}
              size={24}
              color={selectedTab === 'overview' ? '#F59E0B' : Colors.text.secondary}
            />
            <Text
              style={[
                styles.bottomNavText,
                selectedTab === 'overview' && styles.bottomNavTextActive,
              ]}
            >
              Vue d'ensemble
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bottomNavItem, selectedTab === 'history' && styles.bottomNavItemActive]}
            onPress={() => setSelectedTab('history')}
          >
            <Ionicons
              name={selectedTab === 'history' ? "time" : "time-outline"}
              size={24}
              color={selectedTab === 'history' ? '#F59E0B' : Colors.text.secondary}
            />
            <Text
              style={[
                styles.bottomNavText,
                selectedTab === 'history' && styles.bottomNavTextActive,
              ]}
            >
              Historique
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bottomNavItem, selectedTab === 'stats' && styles.bottomNavItemActive]}
            onPress={() => setSelectedTab('stats')}
          >
            <Ionicons
              name={selectedTab === 'stats' ? "stats-chart" : "stats-chart-outline"}
              size={24}
              color={selectedTab === 'stats' ? '#F59E0B' : Colors.text.secondary}
            />
            <Text
              style={[
                styles.bottomNavText,
                selectedTab === 'stats' && styles.bottomNavTextActive,
              ]}
            >
              Statistiques
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bottomNavItem, selectedTab === 'subscription' && styles.bottomNavItemActive]}
            onPress={() => setSelectedTab('subscription')}
          >
            <Ionicons
              name={selectedTab === 'subscription' ? "card" : "card-outline"}
              size={24}
              color={selectedTab === 'subscription' ? '#F59E0B' : Colors.text.secondary}
            />
            <Text
              style={[
                styles.bottomNavText,
                selectedTab === 'subscription' && styles.bottomNavTextActive,
              ]}
            >
              Abonnement
            </Text>
          </TouchableOpacity>
          </View>
        </SafeAreaView>
      </SafeAreaView>
    </NavigationTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.light,
  } as ViewStyle,
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  } as ViewStyle,
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  } as ViewStyle,
  headerTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '800',
    color: 'white',
    marginBottom: Spacing.xs,
  } as TextStyle,
  headerSubtitle: {
    fontSize: Typography.sizes.base,
    color: 'rgba(255, 255, 255, 0.9)',
  } as TextStyle,
  notificationButton: {
    padding: Spacing.sm,
    position: 'relative',
  } as ViewStyle,
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  } as ViewStyle,
  logoutButton: {
    padding: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  } as ViewStyle,
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 100, // Espace pour la barre de navigation en bas
  } as ViewStyle,
  scrollContent: {
    paddingBottom: Spacing.xl,
  } as ViewStyle,
  bottomNavBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
  } as ViewStyle,
  bottomNavBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: Colors.primary[100],
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  } as ViewStyle,
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    gap: 4,
  } as ViewStyle,
  bottomNavItemActive: {
    // Style pour l'item actif
  } as ViewStyle,
  bottomNavText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginTop: 2,
  } as TextStyle,
  bottomNavTextActive: {
    color: '#F59E0B',
    fontWeight: '700',
  } as TextStyle,
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  } as ViewStyle,
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
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
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: Spacing.xs,
  } as TextStyle,
  statLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '500',
  } as TextStyle,
  qrCard: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  } as ViewStyle,
  qrCardTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  } as TextStyle,
  qrCardSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  } as TextStyle,
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  } as ViewStyle,
  qrCode: {
    width: 200,
    height: 200,
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 3,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
  } as ViewStyle,
  qrGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  } as ViewStyle,
  qrSquare: {
    width: '12%',
    height: '12%',
    margin: '1%',
    borderRadius: 2,
  } as ViewStyle,
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[600],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadows.md,
  } as ViewStyle,
  downloadButtonText: {
    color: 'white',
    fontSize: Typography.sizes.base,
    fontWeight: '700',
  } as TextStyle,
  recentSection: {
    marginBottom: Spacing.lg,
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  } as TextStyle,
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  } as ViewStyle,
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
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
    color: Colors.text.primary,
    marginBottom: 2,
  } as TextStyle,
  transactionDate: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  transactionAmount: {
    fontSize: Typography.sizes.lg,
    fontWeight: '800',
    color: '#10B981',
  } as TextStyle,
  historySection: {
    marginBottom: Spacing.lg,
  } as ViewStyle,
  historyCard: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.md,
  } as ViewStyle,
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  historyIcon: {
    marginRight: Spacing.md,
  } as ViewStyle,
  historyInfo: {
    flex: 1,
  } as ViewStyle,
  historyCustomer: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  } as TextStyle,
  historyDate: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  historyAmount: {
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    color: '#10B981',
  } as TextStyle,
  historyStatus: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  } as ViewStyle,
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  } as ViewStyle,
  statusText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    color: '#10B981',
  } as TextStyle,
  subscriptionSection: {
    marginBottom: Spacing.lg,
  } as ViewStyle,
  subscriptionCard: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  } as ViewStyle,
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary[100],
  } as ViewStyle,
  subscriptionPlanName: {
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  } as TextStyle,
  subscriptionPrice: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.primary[600],
  } as TextStyle,
  subscriptionStatusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  } as ViewStyle,
  subscriptionStatusText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: '#10B981',
  } as TextStyle,
  subscriptionFeatures: {
    marginBottom: Spacing.lg,
  } as ViewStyle,
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  } as ViewStyle,
  featureText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.primary,
    fontWeight: '500',
  } as TextStyle,
  subscriptionFooter: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.primary[100],
  } as ViewStyle,
  subscriptionNextBilling: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  } as TextStyle,
  manageButton: {
    backgroundColor: Colors.primary[50],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  } as ViewStyle,
  manageButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.primary[600],
  } as TextStyle,
  
  // Statistiques
  statsSection: {
    marginBottom: Spacing.lg,
  } as ViewStyle,
  statsCard: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  } as ViewStyle,
  statsCardTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  } as TextStyle,
  chartContainer: {
    marginTop: Spacing.md,
  } as ViewStyle,
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 150,
    paddingHorizontal: Spacing.sm,
  } as ViewStyle,
  chartBarWrapper: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  } as ViewStyle,
  chartBar: {
    width: '80%',
    backgroundColor: '#F59E0B',
    borderRadius: BorderRadius.sm,
    minHeight: 20,
    marginBottom: Spacing.xs,
  } as ViewStyle,
  chartLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: '600',
  } as TextStyle,
  periodStatsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  } as ViewStyle,
  periodStatCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.md,
  } as ViewStyle,
  periodStatLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  } as TextStyle,
  periodStatValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  } as TextStyle,
  periodStatTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  periodStatTrendText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: '#10B981',
  } as TextStyle,
  topClientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary[100],
  } as ViewStyle,
  topClientRank: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  } as ViewStyle,
  topClientRankText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '800',
    color: Colors.primary[600],
  } as TextStyle,
  topClientInfo: {
    flex: 1,
  } as ViewStyle,
  topClientName: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  } as TextStyle,
  topClientDetails: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  peakHoursContainer: {
    marginTop: Spacing.md,
  } as ViewStyle,
  peakHourItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  } as ViewStyle,
  peakHourLabel: {
    width: 40,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
  } as TextStyle,
  peakHourBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.primary[100],
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  } as ViewStyle,
  peakHourBar: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: BorderRadius.full,
  } as ViewStyle,
  peakHourValue: {
    width: 30,
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'right',
  } as TextStyle,
  
  // QR Code amélioré
  qrCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  } as ViewStyle,
  qrActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  } as ViewStyle,
  qrActionButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.md,
  } as ViewStyle,
  qrButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  } as ViewStyle,
  printButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[50],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  } as ViewStyle,
  printButtonText: {
    color: Colors.primary[600],
    fontSize: Typography.sizes.base,
    fontWeight: '700',
  } as TextStyle,
  shareSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  } as ViewStyle,
  shareSuccessText: {
    color: '#10B981',
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  } as TextStyle,
  
  // Actions rapides
  quickActionsSection: {
    marginBottom: Spacing.lg,
  } as ViewStyle,
  quickActionsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  } as ViewStyle,
  quickActionCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.md,
  } as ViewStyle,
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  quickActionLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  } as TextStyle,
  quickActionSubtext: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  } as TextStyle,
  
  // Historique amélioré
  historyHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  } as ViewStyle,
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.md,
  } as ViewStyle,
  exportButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.primary[600],
  } as TextStyle,
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary[100],
    ...Shadows.sm,
  } as ViewStyle,
  searchIcon: {
    marginRight: Spacing.sm,
  } as ViewStyle,
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.text.primary,
  } as TextStyle,
  filtersContainer: {
    marginBottom: Spacing.md,
  } as ViewStyle,
  filtersContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  } as ViewStyle,
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
  } as ViewStyle,
  filterChipActive: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[600],
  } as ViewStyle,
  filterChipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
  } as TextStyle,
  filterChipTextActive: {
    color: 'white',
    fontWeight: '700',
  } as TextStyle,
  resultsCount: {
    marginBottom: Spacing.md,
  } as ViewStyle,
  resultsCountText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '600',
  } as TextStyle,
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
  } as ViewStyle,
  emptyStateTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  } as TextStyle,
  emptyStateText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  } as TextStyle,
  
  // Statistiques améliorées
  periodStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  } as ViewStyle,
  performanceCard: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  } as ViewStyle,
  performanceGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  } as ViewStyle,
  performanceItem: {
    flex: 1,
    alignItems: 'center',
  } as ViewStyle,
  performanceIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  performanceValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  } as TextStyle,
  performanceLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontWeight: '500',
  } as TextStyle,
});

