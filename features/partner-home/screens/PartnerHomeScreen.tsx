import { NavigationTransition } from '@/components/common/navigation-transition';
import { QRScanner } from '@/components/qr/qr-scanner';
import { Colors, Spacing } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PartnerBottomNav, PartnerTab } from '../components/PartnerBottomNav';
import { PartnerHeader } from '../components/PartnerHeader';
import { PartnerHistory } from '../components/PartnerHistory';
import { PartnerMe } from '../components/PartnerMe';
import { PartnerOverview } from '../components/PartnerOverview';
import { PartnerStats } from '../components/PartnerStats';
import { PartnerStoreModal } from '../components/PartnerStoreModal';
import { QrValidationModal } from '../components/QrValidationModal';
import { StoreSelectionModal } from '../components/StoreSelectionModal';
import { usePartnerHomeData } from '../hooks/usePartnerHomeData';
import { usePartnerStats } from '../hooks/usePartnerStats';
import { useQRValidation } from '../hooks/useQRValidation';
import { useStoreManagement } from '../hooks/useStoreManagement';
import { styles } from './PartnerHomeScreen.styles';

export default function PartnerHomeScreen() {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState<PartnerTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedStoreForScan, setSelectedStoreForScan] = useState<string | null>(null);
  const [activeStoreIdForData, setActiveStoreIdForData] = useState<string | null>(null);
  const [selectedStoreIdForData, setSelectedStoreIdForData] = useState<string | undefined>(undefined);

  // Hook pour les données - utilise les valeurs de activeStoreId et selectedStoreId
  const data = usePartnerHomeData(
    user,
    activeStoreIdForData,
    selectedStoreIdForData,
    filterPeriod,
    selectedTab,
    false
  );
  const {
    clients,
    clientsLoading,
    clientsError,
    loadClients,
    scans,
    scansLoading,
    scansError,
    transactions,
    transactionsLoading,
    transactionsError,
    stores,
    storesLoading,
    storesError,
    loadStores,
    scanCounts,
    scanCountsLoading,
    loadScanCounts,
  } = data;

  // Hook pour la gestion des stores (utilise les stores chargés)
  const storeManagement = useStoreManagement(stores, transactions);
  const {
    activeStoreId,
    activeStore,
    showActiveStoreSelection,
    setShowActiveStoreSelection,
    loadingActiveStore,
    loadActiveStore,
    handleSetActiveStore,
    selectedStoreId,
    selectedStore,
    showStoreModal,
    setShowStoreModal,
    storeDetailLoading,
    handleStoreSelect,
    storeSearchQuery,
    setStoreSearchQuery,
    filteredStores,
  } = storeManagement;

  // Synchroniser activeStoreId et selectedStoreId avec usePartnerHomeData
  useEffect(() => {
    if (activeStoreId !== activeStoreIdForData) {
      setActiveStoreIdForData(activeStoreId);
    }
  }, [activeStoreId, activeStoreIdForData]);

  useEffect(() => {
    if (selectedStoreId !== selectedStoreIdForData) {
      setSelectedStoreIdForData(selectedStoreId);
    }
  }, [selectedStoreId, selectedStoreIdForData]);

  // Hook pour les statistiques
  const { filteredClients, totalRevenue, todayRevenue, todayDiscounts } = usePartnerStats(
    transactions,
    clients,
    searchQuery
  );

  // Hook pour la validation QR
  const qrValidation = useQRValidation(
    stores,
    activeStoreId,
    selectedStoreForScan,
    loadStores,
    loadClients,
    loadScanCounts,
    setSelectedStoreForScan
  );
  const {
    showQRScanner,
    setShowQRScanner,
    validatingQR,
    showQRValidationModal,
    setShowQRValidationModal,
    qrValidationData,
    setQrValidationData,
    handleScanQR,
    handleQRScanned,
    handleValidateQR,
  } = qrValidation;

  // Afficher le modal de sélection de store au démarrage
  useEffect(() => {
    if (stores.length > 0 && !activeStoreId && !showActiveStoreSelection && !loadingActiveStore) {
      console.log('🏪 [Partner Home] Stores chargés, affichage du modal de sélection au démarrage...');
      setShowActiveStoreSelection(true);
    }
  }, [stores.length, activeStoreId, showActiveStoreSelection, loadingActiveStore]);

  const handleExportData = () => {
    console.log('Export des données');
  };

  return (
    <NavigationTransition delay={50}>
      <LinearGradient
        colors={Colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {selectedTab !== 'me' && (
            <PartnerHeader
              firstName={user?.firstName}
              lastName={user?.lastName}
              showWelcome={selectedTab === 'overview'}
              title={
                selectedTab === 'history' ? 'Historique' :
                selectedTab === 'stats' ? 'Statistiques' :
                undefined
              }
              onLogout={async () => {
                try {
                  await signOut();
                  router.replace('/connexion/login');
                } catch (error) {
                  console.error('Erreur lors de la déconnexion:', error);
                  Alert.alert('Erreur', 'Impossible de se déconnecter');
                }
              }}
            />
          )}

          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent, 
              { 
                paddingTop: selectedTab === 'overview' ? Spacing.lg : 0, // Plus d'espace pour la page home
                paddingBottom: Math.max(insets.bottom, 20) + 150, // Espace pour la navbar (75px) + bouton qui dépasse (76px) + marge
              }
            ]}
          >
            {selectedTab === 'overview' && (
              <PartnerOverview
                totalRevenue={totalRevenue}
                todayRevenue={todayRevenue}
                todayDiscounts={todayDiscounts}
                scans={scans}
                scansLoading={scansLoading}
                scansError={scansError}
                transactions={transactions}
                clients={clients}
                clientsLoading={clientsLoading}
                clientsError={clientsError}
                filteredClients={filteredClients}
                onExportData={handleExportData}
                onScanQR={handleScanQR}
                onViewStats={() => {
                  // TODO: Naviguer vers les stats détaillées
                }}
                onViewAllTransactions={() => {
                  setSelectedTab('history');
                }}
                validatingQR={validatingQR}
              />
            )}

            {selectedTab === 'history' && (
              <PartnerHistory
                searchQuery={searchQuery}
                filterPeriod={filterPeriod}
                selectedStoreId={activeStoreId || selectedStoreId}
                stores={stores}
                transactions={transactions}
                transactionsLoading={transactionsLoading}
                transactionsError={transactionsError} 
                onSearchChange={setSearchQuery}
                onFilterPeriodChange={setFilterPeriod}
                onStoreFilterChange={() => {
                  // Désactivé - on ne peut plus changer de magasin depuis l'historique
                }}
                onExportData={handleExportData}
              />
            )}

            {selectedTab === ('me' as PartnerTab) && (
              <PartnerMe
                user={user}
                storeSearchQuery={storeSearchQuery}
                stores={stores}
                storesLoading={storesLoading}
                storesError={storesError}
                filteredStores={filteredStores}
                activeStoreId={activeStoreId}
                activeStore={activeStore}
                transactions={transactions}
                clients={clients}
                scans={scans}
                onSearchChange={setStoreSearchQuery}
                onStoreSelect={handleStoreSelect}
                onChangeStore={() => {
                  setShowActiveStoreSelection(true);
                }}
                onLogout={async () => {
                  try {
                    await signOut();
                    router.replace('/connexion/login');
                  } catch (error) {
                    console.error('Erreur lors de la déconnexion:', error);
                    Alert.alert('Erreur', 'Impossible de se déconnecter');
                  }
                }}
              />
            )}

            {selectedTab === 'stats' && (
              <PartnerStats
                transactions={transactions}
                clients={clients}
                scanCounts={scanCounts}
                scanCountsLoading={scanCountsLoading}
                onExport={handleExportData}
              />
            )}
          </ScrollView>

          <PartnerBottomNav 
            selectedTab={selectedTab} 
            onTabChange={setSelectedTab}
            onScanQR={handleScanQR}
            validatingQR={validatingQR}
          />
        </SafeAreaView>

        <PartnerStoreModal
          visible={showStoreModal}
          selectedStore={selectedStore}
          loading={storeDetailLoading}
          onClose={() => {
            setShowStoreModal(false);
          }}
        />

        <StoreSelectionModal
          visible={showActiveStoreSelection && stores.length > 0}
          stores={stores}
          onClose={() => {
            console.log('⚠️ [Partner Home] Tentative de fermeture du modal sans sélection - ignorée');
          }}
          onSelectStore={handleSetActiveStore}
        />

        <QRScanner
          visible={showQRScanner}
          onClose={() => {
            setShowQRScanner(false);
            setSelectedStoreForScan(null);
          }}
          onScan={handleQRScanned}
          mode="partner"
        />

        {qrValidationData && (() => {
          const currentStore = stores.find(s => s.id === qrValidationData.storeId || s.storeId === qrValidationData.storeId);
          const currentDiscount = qrValidationData.discountPercent || 
                                  currentStore?.avgDiscountPercent || 
                                  currentStore?.discountPercent || 
                                  currentStore?.discount || 
                                  10;
          
          return (
            <QrValidationModal
              visible={showQRValidationModal}
              onClose={() => {
                setShowQRValidationModal(false);
                setQrValidationData(null);
              }}
              onValidate={handleValidateQR}
              partnerId={qrValidationData.partnerId}
              storeId={qrValidationData.storeId}
              operatorUserId={qrValidationData.operatorUserId}
              qrToken={qrValidationData.qrToken}
              storeName={qrValidationData.storeName}
              discountPercent={currentDiscount}
              isValidating={validatingQR}
            />
          );
        })()}
      </LinearGradient>
    </NavigationTransition>
  );
}
