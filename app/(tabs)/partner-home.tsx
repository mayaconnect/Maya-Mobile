import { NavigationTransition } from '@/components/common/navigation-transition';
import { QRScanner } from '@/components/qr/qr-scanner';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { AuthService } from '@/services/auth.service';
import { ClientService } from '@/services/client.service';
import { QrService } from '@/services/qr.service';
import { StoresService } from '@/services/stores.service';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [selectedTab, setSelectedTab] = useState<'overview' | 'history' | 'subscription' | 'stats' | 'stores'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [validatingQR, setValidatingQR] = useState(false);
  
  // États pour les clients
  const [clients, setClients] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);

  // États pour les stores
  const [stores, setStores] = useState<any[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [storeDetailLoading, setStoreDetailLoading] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/connexion/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleScanQR = () => {
    setShowQRScanner(true);
  };

  const handleQRScanned = async (qrData: string) => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📱 [QR SCAN] Début du processus de scan QR Code');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📥 [QR SCAN] Données brutes reçues:', {
      length: qrData.length,
      preview: qrData.substring(0, 100) + (qrData.length > 100 ? '...' : ''),
      hasTokenKeyword: qrData.includes('Token:'),
      hasColon: qrData.includes(':'),
      hasNewline: qrData.includes('\n'),
    });
    
    setShowQRScanner(false);
    setValidatingQR(true);
    
    try {
      // Le token peut être dans différents formats :
      // 1. Texte partagé : "Mon QR Code Maya\n\nToken: xxx"
      // 2. Token brut : "xxx"
      // 3. Format avec préfixe : "maya:token:xxx"
      let qrToken = qrData;
      console.log('🔄 [QR SCAN] Extraction du token...');
      console.log('📋 [QR SCAN] Format détecté:', {
        isSharedText: qrData.includes('Token:'),
        hasPrefix: qrData.includes(':') && !qrData.includes('Token:'),
        isRawToken: !qrData.includes('Token:') && !qrData.includes(':'),
      });
      
      // Extraire le token si c'est un texte partagé
      if (qrData.includes('Token:')) {
        console.log('🔍 [QR SCAN] Format détecté: Texte partagé');
        const tokenMatch = qrData.match(/Token:\s*([^\s\n]+)/);
        if (tokenMatch && tokenMatch[1]) {
          qrToken = tokenMatch[1];
          console.log('✅ [QR SCAN] Token extrait depuis le texte partagé:', {
            originalLength: qrData.length,
            extractedLength: qrToken.length,
            tokenPreview: qrToken.substring(0, 30) + '...',
          });
        } else {
          console.warn('⚠️ [QR SCAN] Pattern "Token:" trouvé mais extraction échouée');
        }
      } else if (qrData.includes(':') && !qrData.includes('Token:')) {
        console.log('🔍 [QR SCAN] Format détecté: Format avec préfixe');
        qrToken = qrData.split(':').pop() || qrData;
        console.log('✅ [QR SCAN] Token extrait depuis le format avec préfixe:', {
          originalLength: qrData.length,
          extractedLength: qrToken.length,
          tokenPreview: qrToken.substring(0, 30) + '...',
        });
      } else {
        console.log('🔍 [QR SCAN] Format détecté: Token brut');
        console.log('✅ [QR SCAN] Utilisation du token tel quel:', {
          length: qrToken.length,
          tokenPreview: qrToken.substring(0, 30) + '...',
        });
      }
      
      console.log('📤 [QR SCAN] Token final à valider:', {
        length: qrToken.length,
        preview: qrToken.substring(0, 50) + (qrToken.length > 50 ? '...' : ''),
        lastChars: qrToken.substring(Math.max(0, qrToken.length - 10)),
      });
      
      // Récupérer les informations du partenaire et de l'opérateur
      console.log('👤 [QR SCAN] Récupération des informations utilisateur...');
      let partnerId: string | undefined;
      let operatorUserId: string | undefined;
      let storeId: string | undefined;
      
      try {
        const startTime = Date.now();
        const userInfo = await AuthService.getCurrentUserInfo();
        const duration = Date.now() - startTime;
        
        console.log('✅ [QR SCAN] Informations utilisateur récupérées:', {
          duration: duration + 'ms',
          email: userInfo.email,
          id: userInfo.id,
          hasPartnerId: !!(userInfo as any)?.partnerId,
          hasId: !!userInfo.id,
          userInfoKeys: Object.keys(userInfo),
        });
        
        // L'ID du partenaire peut être dans userInfo.partnerId ou userInfo.id
        partnerId = (userInfo as any)?.partnerId || (userInfo as any)?.id;
        // L'ID de l'opérateur est l'ID de l'utilisateur connecté
        operatorUserId = userInfo.id;
        
        console.log('✅ [QR SCAN] IDs extraits:', {
          partnerId: partnerId ? partnerId.substring(0, 20) + '...' : 'undefined',
          operatorUserId: operatorUserId ? operatorUserId.substring(0, 20) + '...' : 'undefined',
          partnerIdSource: (userInfo as any)?.partnerId ? 'partnerId' : 'id',
        });
        
        if (!partnerId) {
          console.error('❌ [QR SCAN] partnerId manquant après extraction');
        }
        if (!operatorUserId) {
          console.error('❌ [QR SCAN] operatorUserId manquant après extraction');
        }
      } catch (error) {
        console.error('❌ [QR SCAN] Erreur lors de la récupération des infos utilisateur:', {
          error: error instanceof Error ? error.message : String(error),
          errorName: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack?.substring(0, 200) : undefined,
        });
        throw new Error('Impossible de récupérer les informations du partenaire');
      }
      
      // Si le partenaire a plusieurs stores, demander de sélectionner un store
      // Sinon, utiliser le premier store disponible
      console.log('🏪 [QR SCAN] Vérification des stores disponibles...');
      console.log('📊 [QR SCAN] Nombre de stores actuellement chargés:', stores.length);
      
      if (stores.length === 0) {
        console.log('🔄 [QR SCAN] Aucun store chargé, chargement des stores...');
        const loadStartTime = Date.now();
        await loadStores();
        const loadDuration = Date.now() - loadStartTime;
        console.log('✅ [QR SCAN] Stores chargés:', {
          duration: loadDuration + 'ms',
          count: stores.length,
        });
      }
      
      if (stores.length === 0) {
        console.error('❌ [QR SCAN] Aucun magasin disponible pour le partenaire');
        Alert.alert(
          '⚠️ Aucun magasin',
          'Vous devez avoir au moins un magasin pour valider un QR Code.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      console.log('✅ [QR SCAN] Stores disponibles:', {
        count: stores.length,
        stores: stores.map((s: any) => ({
          id: s.id,
          name: s.name || s.partner?.name || 'N/A',
        })),
      });
      
      // Si un seul store, l'utiliser automatiquement
      if (stores.length === 1) {
        storeId = stores[0].id;
        console.log('✅ [QR SCAN] Store unique sélectionné automatiquement:', {
          storeId: storeId ? storeId.substring(0, 20) + '...' : 'undefined',
          storeName: stores[0].name || stores[0].partner?.name || 'N/A',
        });
      } else {
        // Si plusieurs stores, demander à l'utilisateur de choisir
        // Pour l'instant, on utilise le premier store
        // TODO: Implémenter une sélection de store
        storeId = stores[0].id;
        console.log('⚠️ [QR SCAN] Plusieurs stores disponibles, utilisation du premier:', {
          storeId: storeId ? storeId.substring(0, 20) + '...' : 'undefined',
          storeName: stores[0].name || stores[0].partner?.name || 'N/A',
          totalStores: stores.length,
          note: 'TODO: Implémenter une sélection de store',
        });
      }
      
      // Vérification finale des paramètres
      console.log('🔍 [QR SCAN] Vérification finale des paramètres...');
      const missingParams: string[] = [];
      if (!partnerId) missingParams.push('partnerId');
      if (!operatorUserId) missingParams.push('operatorUserId');
      if (!storeId) missingParams.push('storeId');
      if (!qrToken) missingParams.push('qrToken');
      
      if (missingParams.length > 0) {
        console.error('❌ [QR SCAN] Paramètres manquants:', missingParams);
        throw new Error(`Informations manquantes pour valider le QR Code: ${missingParams.join(', ')}`);
      }
      
      // À ce stade, tous les paramètres sont garantis d'être définis
      const finalPartnerId = partnerId!;
      const finalStoreId = storeId!;
      const finalOperatorUserId = operatorUserId!;
      
      console.log('✅ [QR SCAN] Tous les paramètres sont présents');
      console.log('📤 [QR SCAN] Paramètres de validation complets:', {
        qrToken: qrToken.substring(0, 30) + '...',
        qrTokenLength: qrToken.length,
        partnerId: finalPartnerId.substring(0, 20) + '...',
        storeId: finalStoreId.substring(0, 20) + '...',
        operatorUserId: finalOperatorUserId.substring(0, 20) + '...',
        amountGross: 0,
        personsCount: 0,
      });
      
      // Valider le QR Code via l'API avec tous les paramètres requis
      console.log('🌐 [QR SCAN] Appel API de validation...');
      const validationStartTime = Date.now();
      
      const validationResult = await QrService.validateQrToken(
        qrToken,
        finalPartnerId,
        finalStoreId,
        finalOperatorUserId,
        0, // amountGross - peut être modifié pour demander à l'utilisateur
        0  // personsCount - peut être modifié pour demander à l'utilisateur
      );
      
      const validationDuration = Date.now() - validationStartTime;
      
      console.log('✅ [QR SCAN] Validation réussie:', {
        duration: validationDuration + 'ms',
        hasResult: !!validationResult,
        resultType: typeof validationResult,
        resultKeys: validationResult ? Object.keys(validationResult) : [],
        clientName: validationResult?.clientName || validationResult?.client?.firstName || 'N/A',
        amount: validationResult?.amount || 'N/A',
        fullResult: JSON.stringify(validationResult, null, 2),
      });
      
      const selectedStore = stores.find((s: any) => s.id === finalStoreId);
      console.log('📋 [QR SCAN] Informations pour l\'alerte:', {
        clientName: validationResult?.clientName || validationResult?.client?.firstName || 'Client',
        storeName: selectedStore?.name || selectedStore?.partner?.name || 'N/A',
        amount: validationResult?.amount || 'N/A',
      });
      
      Alert.alert(
        '✅ QR Code validé',
        `Visite enregistrée avec succès !\n\nClient: ${validationResult.clientName || validationResult.client?.firstName || 'Client'}\nMagasin: ${selectedStore?.name || selectedStore?.partner?.name || 'N/A'}\nMontant: ${validationResult.amount || 'N/A'}€`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              console.log('🔄 [QR SCAN] Rechargement des clients après validation...');
              loadClients();
            }
          }
        ]
      );
      
      console.log('✅ [QR SCAN] Processus terminé avec succès');
      console.log('═══════════════════════════════════════════════════════════');
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ [QR SCAN] Erreur lors de la validation du QR Code');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ [QR SCAN] Détails de l\'erreur:', {
        error: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      Alert.alert(
        '❌ Erreur',
        error instanceof Error ? error.message : 'Impossible de valider le QR Code. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
      
      console.error('═══════════════════════════════════════════════════════════');
    } finally {
      setValidatingQR(false);
      console.log('🏁 [QR SCAN] État de validation réinitialisé');
    }
  };

  const loadClients = useCallback(async () => {
    setClientsLoading(true);
    setClientsError(null);
    try {
      const response = await ClientService.getClients({
        page: 1,
        pageSize: 100,
      });
      setClients(response.items || []);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      setClientsError('Impossible de charger les clients');
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Charger les stores du partenaire connecté uniquement
  const loadStores = useCallback(async () => {
    console.log('🏪 [Partner Home] Chargement des stores du partenaire...');
    setStoresLoading(true);
    setStoresError(null);
    try {
      // Récupérer les informations du partenaire connecté
      let partnerId: string | undefined;
      try {
        const userInfo = await AuthService.getCurrentUserInfo();
        console.log('👤 [Partner Home] Informations utilisateur:', {
          email: userInfo.email,
          hasPartnerId: !!(userInfo as any)?.partnerId,
          hasId: !!userInfo.id,
        });
        
        // L'ID du partenaire peut être dans userInfo.partnerId ou userInfo.id
        partnerId = (userInfo as any)?.partnerId || (userInfo as any)?.id;
        
        if (!partnerId) {
          console.warn('⚠️ [Partner Home] Aucun partnerId trouvé, récupération de tous les stores');
        } else {
          console.log('✅ [Partner Home] PartnerId trouvé:', partnerId);
        }
      } catch (error) {
        console.warn('⚠️ [Partner Home] Impossible de récupérer les infos utilisateur:', error);
      }

      // Récupérer tous les stores (l'API devrait filtrer automatiquement par partenaire si authentifié)
      // Sinon, on filtre côté client
      const response = await StoresService.searchStores({
        page: 1,
        pageSize: 100,
      });
      
      console.log('✅ [Partner Home] Stores récupérés (avant filtre):', response.items?.length || 0);
      
      // Filtrer les stores pour ne garder que ceux du partenaire connecté
      let filteredStores = response.items || [];
      
      if (partnerId) {
        filteredStores = filteredStores.filter((store: any) => {
          const storePartnerId = store.partnerId || store.partner?.id || store.partnerId;
          const matches = storePartnerId === partnerId || storePartnerId?.toString() === partnerId?.toString();
          if (!matches) {
            console.log('🚫 [Partner Home] Store filtré:', {
              storeId: store.id,
              storeName: store.name || store.partner?.name,
              storePartnerId,
              currentPartnerId: partnerId,
            });
          }
          return matches;
        });
        console.log('✅ [Partner Home] Stores filtrés (après filtre):', filteredStores.length);
      } else {
        console.warn('⚠️ [Partner Home] Aucun partnerId, affichage de tous les stores');
      }
      
      setStores(filteredStores);
    } catch (error) {
      console.error('❌ [Partner Home] Erreur lors du chargement des stores:', error);
      setStoresError('Impossible de charger les stores');
      setStores([]);
    } finally {
      setStoresLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTab === 'stores') {
      loadStores();
    }
  }, [selectedTab, loadStores]);

  // Afficher les détails d'un store
  const handleStoreSelect = async (store: any) => {
    console.log('🔍 [Partner Home] Affichage des détails du store:', store.id);
    setSelectedStore(store);
    setShowStoreModal(true);
    setStoreDetailLoading(true);

    try {
      const storeDetails = await StoresService.getStoreById(store.id);
      console.log('✅ [Partner Home] Détails du store récupérés:', storeDetails);
      setSelectedStore(storeDetails);
    } catch (error) {
      console.error('❌ [Partner Home] Erreur lors du chargement des détails:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du store');
    } finally {
      setStoreDetailLoading(false);
    }
  };

  // Filtrer les stores
  const filteredStores = stores.filter((store) => {
    const storeName = (store.name || store.partner?.name || '').toLowerCase();
    const category = (store.category || store.partner?.category || '').toLowerCase();
    const address = (store.address?.street || store.address?.city || '').toLowerCase();
    const matchesSearch = 
      storeName.includes(storeSearchQuery.toLowerCase()) ||
      category.includes(storeSearchQuery.toLowerCase()) ||
      address.includes(storeSearchQuery.toLowerCase());
    
    return matchesSearch;
  });


  const handleExportData = () => {
    // Logique pour exporter les données
    console.log('Export des données');
  };

  // Filtrer les clients
  const filteredClients = clients.filter((client) => {
    const fullName = `${client.firstName || ''} ${client.lastName || ''}`.toLowerCase();
    const email = (client.email || '').toLowerCase();
    const matchesSearch = 
      fullName.includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase());
    
    // Note: Les clients n'ont pas de date de visite dans l'API /api/clients
    // Si tu veux filtrer par période, il faudrait une autre route API
    return matchesSearch;
  });

  // Statistiques basées sur les clients (à adapter selon tes besoins)
  const totalScans = clients.length;
  const totalRevenue = 0; // L'API clients ne fournit pas les montants
  const todayRevenue = 0; // L'API clients ne fournit pas les montants

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
                  <Text style={styles.statLabel}>Aujourd&apos;hui</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="scan" size={24} color="#F59E0B" />
                  </View>
                  <Text style={[styles.statValue, { color: '#F59E0B' }]}>{totalScans}</Text>
                  <Text style={styles.statLabel}>Scans total</Text>
                </View>
              </View>

              {/* Scanner QR Code */}
              <View style={styles.qrCard}>
                <View style={styles.qrCardHeader}>
                  <View>
                    <Text style={styles.qrCardTitle}>Scanner QR Code Client</Text>
                    <Text style={styles.qrCardSubtitle}>
                      Scannez le QR Code du client pour valider sa visite
                    </Text>
                  </View>
                </View>
                <View style={styles.scannerContainer}>
                  {validatingQR ? (
                    <View style={styles.scannerLoadingContainer}>
                      <ActivityIndicator size="large" color={Colors.primary[600]} />
                      <Text style={styles.scannerLoadingText}>Validation en cours...</Text>
                    </View>
                  ) : (
                    <View style={styles.scannerPlaceholder}>
                      <Ionicons name="scan" size={64} color={Colors.primary[600]} />
                      <Text style={styles.scannerPlaceholderText}>
                        Appuyez sur le bouton pour scanner
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.scanButton}
                  onPress={handleScanQR}
                  disabled={validatingQR}
                >
                  <Ionicons name="scan" size={24} color="white" />
                  <Text style={styles.scanButtonText}>Scanner QR Code</Text>
                </TouchableOpacity>
              </View>
              
              {/* Modal Scanner */}
              <QRScanner
                visible={showQRScanner}
                onScan={handleQRScanned}
                onClose={() => setShowQRScanner(false)}
              />

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

              {/* Clients récents */}
              <View style={styles.recentSection}>
                <Text style={styles.sectionTitle}>Clients récents</Text>
                {clientsLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={Colors.primary[600]} />
                    <Text style={styles.loadingText}>Chargement des clients...</Text>
                  </View>
                ) : clientsError ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={20} color={Colors.status.error} />
                    <Text style={styles.errorText}>{clientsError}</Text>
                  </View>
                ) : filteredClients.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={32} color={Colors.text.secondary} />
                    <Text style={styles.emptyText}>Aucun client trouvé</Text>
                  </View>
                ) : (
                  filteredClients.slice(0, 3).map((client) => (
                    <View key={client.id || client.email} style={styles.transactionItem}>
                      <View style={styles.transactionIcon}>
                        <Ionicons name="person" size={20} color={Colors.primary[600]} />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionName}>
                          {client.firstName || ''} {client.lastName || ''}
                        </Text>
                        <Text style={styles.transactionDate}>{client.email || ''}</Text>
                      </View>
                    </View>
                  ))
                )}
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
              {clientsLoading ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="large" color={Colors.primary[600]} />
                  <Text style={styles.emptyStateText}>Chargement des clients...</Text>
                </View>
              ) : clientsError ? (
                <View style={styles.emptyState}>
                  <Ionicons name="alert-circle" size={64} color={Colors.status.error} />
                  <Text style={styles.emptyStateTitle}>Erreur</Text>
                  <Text style={styles.emptyStateText}>{clientsError}</Text>
                </View>
              ) : filteredClients.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={64} color={Colors.text.secondary} />
                  <Text style={styles.emptyStateTitle}>Aucun résultat</Text>
                  <Text style={styles.emptyStateText}>
                    Aucun client ne correspond à vos critères
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.resultsCount}>
                    <Text style={styles.resultsCountText}>
                      {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                  {filteredClients.map((client) => (
                    <View key={client.id || client.email} style={styles.historyCard}>
                      <View style={styles.historyHeader}>
                        <View style={styles.historyIcon}>
                          <Ionicons name="person" size={24} color={Colors.primary[600]} />
                        </View>
                        <View style={styles.historyInfo}>
                          <Text style={styles.historyCustomer}>
                            {client.firstName || ''} {client.lastName || ''}
                          </Text>
                          <Text style={styles.historyDate}>{client.email || ''}</Text>
                          {client.phoneNumber && (
                            <Text style={styles.historyDate}>{client.phoneNumber}</Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.historyStatus}>
                        <View style={[styles.statusBadge, client.isActive !== false && { backgroundColor: '#D1FAE5' }]}>
                          <Text style={[styles.statusText, client.isActive !== false && { color: '#10B981' }]}>
                            {client.isActive !== false ? 'Actif' : 'Inactif'}
                          </Text>
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
                      <Text style={styles.manageButtonText}>Gérer l&apos;abonnement</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {selectedTab === 'stores' && (
            <View style={styles.storesSection}>
              <Text style={styles.sectionTitle}>Mes Magasins</Text>

              {/* Barre de recherche */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={Colors.text.secondary} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher un magasin..."
                  placeholderTextColor={Colors.text.secondary}
                  value={storeSearchQuery}
                  onChangeText={setStoreSearchQuery}
                />
                {storeSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setStoreSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color={Colors.text.secondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Liste des stores */}
              {storesLoading ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="large" color={Colors.primary[600]} />
                  <Text style={styles.emptyStateText}>Chargement des magasins...</Text>
                </View>
              ) : storesError ? (
                <View style={styles.emptyState}>
                  <Ionicons name="alert-circle" size={64} color={Colors.status.error} />
                  <Text style={styles.emptyStateTitle}>Erreur</Text>
                  <Text style={styles.emptyStateText}>{storesError}</Text>
                </View>
              ) : filteredStores.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="storefront-outline" size={64} color={Colors.text.secondary} />
                  <Text style={styles.emptyStateTitle}>Aucun magasin</Text>
                  <Text style={styles.emptyStateText}>
                    {storeSearchQuery ? 'Aucun magasin ne correspond à votre recherche' : 'Aucun magasin trouvé'}
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.resultsCount}>
                    <Text style={styles.resultsCountText}>
                      {filteredStores.length} magasin{filteredStores.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                  {filteredStores.map((store) => {
                    const partner = store.partner || store.partnerData;
                    const address = store.address;
                    const addressString = address 
                      ? `${address.street || ''} ${address.postalCode || ''} ${address.city || ''}`.trim()
                      : 'Adresse non renseignée';

                    return (
                      <TouchableOpacity
                        key={store.id}
                        style={styles.storeCard}
                        onPress={() => handleStoreSelect(store)}
                      >
                        <View style={styles.storeCardHeader}>
                          <View style={styles.storeIcon}>
                            <Ionicons name="storefront" size={24} color={Colors.primary[600]} />
                          </View>
                          <View style={styles.storeInfo}>
                            <Text style={styles.storeName}>
                              {store.name || partner?.name || 'Magasin sans nom'}
                            </Text>
                            {store.category && (
                              <Text style={styles.storeCategory}>{store.category}</Text>
                            )}
                            <View style={styles.storeAddressRow}>
                              <Ionicons name="location" size={14} color={Colors.text.secondary} />
                              <Text style={styles.storeAddress} numberOfLines={1}>
                                {addressString}
                              </Text>
                            </View>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
                        </View>
                        {store.isOpen !== undefined && (
                          <View style={styles.storeStatus}>
                            <View style={[styles.statusBadge, store.isOpen ? styles.statusBadgeOpen : styles.statusBadgeClosed]}>
                              <Ionicons 
                                name="time" 
                                size={12} 
                                color={store.isOpen ? '#10B981' : Colors.status.error} 
                              />
                              <Text style={[styles.statusText, { color: store.isOpen ? '#10B981' : Colors.status.error }]}>
                                {store.isOpen ? 'Ouvert' : 'Fermé'}
                              </Text>
                            </View>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
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
              Vue d&apos;ensemble
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
          <TouchableOpacity
            style={[styles.bottomNavItem, selectedTab === 'stores' && styles.bottomNavItemActive]}
            onPress={() => setSelectedTab('stores')}
          >
            <Ionicons
              name={selectedTab === 'stores' ? "storefront" : "storefront-outline"}
              size={24}
              color={selectedTab === 'stores' ? '#F59E0B' : Colors.text.secondary}
            />
            <Text
              style={[
                styles.bottomNavText,
                selectedTab === 'stores' && styles.bottomNavTextActive,
              ]}
            >
              Magasins
            </Text>
          </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Modal détails du store */}
        <Modal
          visible={showStoreModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowStoreModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => {
                  setShowStoreModal(false);
                  setSelectedStore(null);
                }}
              >
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Détails du magasin</Text>
              <View style={styles.placeholder} />
            </View>
            
            {selectedStore && (
              <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
                {storeDetailLoading && (
                  <View style={styles.modalLoading}>
                    <ActivityIndicator size="small" color={Colors.primary[600]} />
                    <Text style={styles.modalLoadingText}>Chargement...</Text>
                  </View>
                )}

                <View style={styles.storeDetailCard}>
                  <View style={styles.storeDetailIcon}>
                    <Ionicons name="storefront" size={48} color={Colors.primary[600]} />
                  </View>
                  
                  <Text style={styles.storeDetailName}>
                    {selectedStore.name || selectedStore.partner?.name || 'Magasin sans nom'}
                  </Text>

                  {selectedStore.category && (
                    <View style={styles.storeDetailCategory}>
                      <Ionicons name="pricetag" size={16} color={Colors.text.secondary} />
                      <Text style={styles.storeDetailCategoryText}>{selectedStore.category}</Text>
                    </View>
                  )}

                  {selectedStore.address && (
                    <View style={styles.storeDetailAddress}>
                      <Ionicons name="location" size={18} color={Colors.text.secondary} />
                      <View style={styles.storeDetailAddressText}>
                        {selectedStore.address.street && (
                          <Text style={styles.storeDetailAddressLine}>
                            {selectedStore.address.street}
                          </Text>
                        )}
                        <Text style={styles.storeDetailAddressLine}>
                          {[selectedStore.address.postalCode, selectedStore.address.city]
                            .filter(Boolean)
                            .join(' ')}
                        </Text>
                        {selectedStore.address.country && (
                          <Text style={styles.storeDetailAddressLine}>
                            {selectedStore.address.country}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  {selectedStore.isOpen !== undefined && (
                    <View style={styles.storeDetailStatus}>
                      <View style={[styles.statusBadge, selectedStore.isOpen ? styles.statusBadgeOpen : styles.statusBadgeClosed]}>
                        <Ionicons 
                          name="time" 
                          size={16} 
                          color={selectedStore.isOpen ? '#10B981' : Colors.status.error} 
                        />
                        <Text style={[styles.statusText, { color: selectedStore.isOpen ? '#10B981' : Colors.status.error }]}>
                          {selectedStore.isOpen ? 'Ouvert' : 'Fermé'}
                        </Text>
                      </View>
                    </View>
                  )}

                  {selectedStore.partner && (
                    <View style={styles.storeDetailPartner}>
                      <Text style={styles.storeDetailPartnerTitle}>Partenaire</Text>
                      <Text style={styles.storeDetailPartnerName}>
                        {selectedStore.partner.name || 'N/A'}
                      </Text>
                      {selectedStore.partner.email && (
                        <Text style={styles.storeDetailPartnerEmail}>
                          {selectedStore.partner.email}
                        </Text>
                      )}
                    </View>
                  )}

                  {selectedStore.description && (
                    <View style={styles.storeDetailDescription}>
                      <Text style={styles.storeDetailDescriptionTitle}>Description</Text>
                      <Text style={styles.storeDetailDescriptionText}>
                        {selectedStore.description}
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </SafeAreaView>
        </Modal>
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
    marginBottom: Spacing.xs,
  } as TextStyle,
  qrCardSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  } as TextStyle,
  scannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  } as ViewStyle,
  scannerLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  } as ViewStyle,
  scannerLoadingText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
  } as TextStyle,
  scannerPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  } as ViewStyle,
  scannerPlaceholderText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  } as TextStyle,
  scanButton: {
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
  scanButtonText: {
    color: 'white',
    fontSize: Typography.sizes.base,
    fontWeight: '700',
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
  reloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#FCD34D',
  } as ViewStyle,
  reloadButtonText: {
    color: '#B45309',
    fontSize: Typography.sizes.base,
    fontWeight: '700',
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
  } as TextStyle,
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
  
  // Stores section
  storesSection: {
    marginBottom: Spacing.lg,
  } as ViewStyle,
  storeCard: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.md,
  } as ViewStyle,
  storeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  storeIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  } as ViewStyle,
  storeInfo: {
    flex: 1,
  } as ViewStyle,
  storeName: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  } as TextStyle,
  storeCategory: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary[600],
    fontWeight: '600',
    marginBottom: 4,
  } as TextStyle,
  storeAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  storeAddress: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    flex: 1,
  } as TextStyle,
  storeStatus: {
    marginTop: Spacing.sm,
  } as ViewStyle,
  statusBadgeOpen: {
    backgroundColor: '#D1FAE5',
  } as ViewStyle,
  statusBadgeClosed: {
    backgroundColor: '#FEE2E2',
  } as ViewStyle,
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background.light,
  } as ViewStyle,
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary[200],
    backgroundColor: 'white',
  } as ViewStyle,
  closeButton: {
    padding: Spacing.sm,
  } as ViewStyle,
  modalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  } as TextStyle,
  placeholder: {
    width: 40,
  } as ViewStyle,
  modalContent: {
    flex: 1,
  } as ViewStyle,
  modalContentContainer: {
    padding: Spacing.lg,
  } as ViewStyle,
  modalLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  } as ViewStyle,
  modalLoadingText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  storeDetailCard: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.lg,
  } as ViewStyle,
  storeDetailIcon: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  } as ViewStyle,
  storeDetailName: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '800',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  } as TextStyle,
  storeDetailCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  } as ViewStyle,
  storeDetailCategoryText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    fontWeight: '600',
  } as TextStyle,
  storeDetailAddress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.lg,
  } as ViewStyle,
  storeDetailAddressText: {
    flex: 1,
  } as ViewStyle,
  storeDetailAddressLine: {
    fontSize: Typography.sizes.base,
    color: Colors.text.primary,
    marginBottom: 2,
  } as TextStyle,
  storeDetailStatus: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  } as ViewStyle,
  storeDetailPartner: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.primary[100],
  } as ViewStyle,
  storeDetailPartnerTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  } as TextStyle,
  storeDetailPartnerName: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  } as TextStyle,
  storeDetailPartnerEmail: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
  } as TextStyle,
  storeDetailDescription: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.primary[100],
  } as ViewStyle,
  storeDetailDescriptionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  } as TextStyle,
  storeDetailDescriptionText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.primary,
    lineHeight: 22,
  } as TextStyle,
});

