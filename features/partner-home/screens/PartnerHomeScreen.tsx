import { NavigationTransition } from '@/components/common/navigation-transition';
import { PartnerBottomNav, PartnerTab } from '@/components/partners/partner-bottom-nav';
import { PartnerHeader } from '@/components/partners/partner-header';
import { PartnerHistory } from '@/components/partners/partner-history';
import { PartnerMe } from '@/components/partners/partner-me';
import { PartnerOverview } from '@/components/partners/partner-overview';
import { PartnerStats } from '@/components/partners/partner-stats';
import { PartnerStoreModal } from '@/components/partners/partner-store-modal';
// import { PartnerStores } from '@/components/partners/partner-stores';
import { QrValidationModal } from '@/components/partners/qr-validation-modal';
import { StoreSelectionModal } from '@/components/partners/store-selection-modal';
import { QRScanner } from '@/components/qr/qr-scanner';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { QrApi } from '@/features/home/services/qrApi';
import { TransactionsApi } from '@/features/home/services/transactionsApi';
import { StoreOperatorsApi } from '@/features/partner-home/services/storeOperatorsApi';
import { StoresApi } from '@/features/stores-map/services/storesApi';
import { useAuth } from '@/hooks/use-auth';
import { AuthService } from '@/services/auth.service';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextStyle,
  ViewStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function PartnerHomeScreen() {
  const { user, signOut } = useAuth();
  const [selectedTab, setSelectedTab] = useState<PartnerTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [validatingQR, setValidatingQR] = useState(false);
  const [showStoreSelection, setShowStoreSelection] = useState(false);
  const [selectedStoreForScan, setSelectedStoreForScan] = useState<string | null>(null);
  
  // État pour le store actif
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [activeStore, setActiveStore] = useState<any | null>(null);
  const [showActiveStoreSelection, setShowActiveStoreSelection] = useState(false);
  const [loadingActiveStore, setLoadingActiveStore] = useState(false);

  // États pour le modal de validation QR
  const [showQRValidationModal, setShowQRValidationModal] = useState(false);
  const [qrValidationData, setQrValidationData] = useState<{
    qrToken: string;
    partnerId: string;
    storeId: string;
    operatorUserId: string;
    storeName?: string;
    discountPercent?: number;
  } | null>(null);

  // États pour les clients
  const [clients, setClients] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);

  // État pour les scans détaillés
  const [scans, setScans] = useState<any[]>([]);
  const [scansLoading, setScansLoading] = useState(false);
  const [scansError, setScansError] = useState<string | null>(null);
  
  // État pour les statistiques de clients
  const [topCustomers, setTopCustomers] = useState<Array<{
    customerId: string;
    customerName: string;
    visitCount: number;
    totalAmount: number;
  }>>([]);

  // États pour les transactions du partenaire
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>(undefined);

  // États pour les stores
  const [stores, setStores] = useState<any[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [storeDetailLoading, setStoreDetailLoading] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');

  // États pour les statistiques de scans
  const [scanCounts, setScanCounts] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0,
  });
  const [scanCountsLoading, setScanCountsLoading] = useState(false);

  const handleScanQR = () => {
    console.log('📱 [Partner Home] Bouton Scanner QR cliqué');

    // Utiliser directement le store actif choisi au démarrage
    if (activeStoreId) {
      console.log('📱 [Partner Home] Utilisation du store actif:', activeStoreId);
      setSelectedStoreForScan(activeStoreId);
      setShowQRScanner(true);
    } else if (stores.length > 0) {
      // Si pas de store actif mais qu'on a des stores, utiliser le premier
      console.log('📱 [Partner Home] Pas de store actif, utilisation du premier store disponible');
      setSelectedStoreForScan(stores[0].id);
      setShowQRScanner(true);
    } else {
      // Aucun store disponible
      console.warn('⚠️ [Partner Home] Aucun store disponible');
      Alert.alert(
        '⚠️ Aucun magasin',
        'Vous devez avoir au moins un magasin pour scanner un QR Code.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleStoreSelected = (storeId: string) => {
    console.log('📱 [Partner Home] Store sélectionné pour le scan:', storeId);
    setSelectedStoreForScan(storeId);
    setShowStoreSelection(false);
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
      
      // Récupérer les informations de l'opérateur
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
          role: (userInfo as any)?.role,
          userInfoKeys: Object.keys(userInfo),
        });

        // L'ID de l'opérateur est l'ID de l'utilisateur connecté
        operatorUserId = userInfo.id;

        console.log('✅ [QR SCAN] IDs extraits:', {
          operatorUserId: operatorUserId ? operatorUserId.substring(0, 20) + '...' : 'undefined',
        });

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
          partnerId: s.partnerId || s.partner?.id,
          avgDiscountPercent: s.avgDiscountPercent,
          discountPercent: s.discountPercent,
          discount: s.discount,
        })),
      });

      // Sélectionner le store actif et extraire son partnerId
      let activeStore: any = null;

      // Utiliser le store actif choisi au démarrage (priorité) ou celui sélectionné pour le scan
      const storeToUse = activeStoreId || selectedStoreForScan;
      
      if (storeToUse) {
        activeStore = stores.find((s: any) => s.id === storeToUse);
        if (activeStore) {
          storeId = activeStore.id as string;
          partnerId = activeStore.partnerId || activeStore.partner?.id;
          console.log('✅ [QR SCAN] Store actif utilisé pour le scan:', {
            storeId: storeId.substring(0, 20) + '...',
            storeName: activeStore.name || activeStore.partner?.name || 'N/A',
            partnerId: partnerId ? partnerId.substring(0, 20) + '...' : 'undefined',
          });
        } else {
          console.error('❌ [QR SCAN] Store actif introuvable dans la liste des stores');
          throw new Error('Store actif introuvable');
        }
      } else {
        // Si aucun store actif n'est défini
        console.error('❌ [QR SCAN] Aucun store actif défini');
        Alert.alert(
          '⚠️ Aucun magasin actif',
          'Veuillez sélectionner un magasin actif avant de scanner un QR Code.',
          [{ text: 'OK' }]
        );
        return;
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
      
      // Récupérer le discountPercent du store
      console.log('🔍 [QR SCAN] Détails du store actif:', {
        storeId: activeStore?.id,
        storeName: activeStore?.name,
        avgDiscountPercent: activeStore?.avgDiscountPercent,
        discountPercent: activeStore?.discountPercent,
        discount: activeStore?.discount,
        allKeys: activeStore ? Object.keys(activeStore) : [],
      });
      
      const discountPercent = activeStore?.avgDiscountPercent || activeStore?.discountPercent || activeStore?.discount || 10;
      
      console.log('✅ [QR SCAN] Réduction calculée:', discountPercent);
      
      console.log('📤 [QR SCAN] Paramètres préparés pour le modal:', {
        qrToken: qrToken.substring(0, 30) + '...',
        qrTokenLength: qrToken.length,
        partnerId: finalPartnerId.substring(0, 20) + '...',
        storeId: finalStoreId.substring(0, 20) + '...',
        operatorUserId: finalOperatorUserId.substring(0, 20) + '...',
        storeName: activeStore?.name || activeStore?.partner?.name || 'N/A',
        discountPercent,
      });

      // Préparer les données pour le modal de validation
      setQrValidationData({
        qrToken,
        partnerId: finalPartnerId,
        storeId: finalStoreId,
        operatorUserId: finalOperatorUserId,
        storeName: activeStore?.name || activeStore?.partner?.name,
        discountPercent,
      });

      // Ouvrir le modal de validation
      setShowQRValidationModal(true);

      console.log('✅ [QR SCAN] Modal de validation ouvert');
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

  const handleValidateQR = async (amountGross: number) => {
    if (!qrValidationData) {
      console.error('❌ [QR VALIDATION] Aucune donnée de validation disponible');
      return;
    }

    setValidatingQR(true);

    try {
      const personsCount = 1;
      // Trouver le magasin pour obtenir son discountPercent
      const store = stores.find(s => s.id === qrValidationData.storeId || s.storeId === qrValidationData.storeId);
      // L'API utilise avgDiscountPercent, discountPercent ou discount
      const discountPercent = store?.avgDiscountPercent || store?.discountPercent || store?.discount || 10; // Fallback à 10% si non trouvé

      console.log('═══════════════════════════════════════════════════════════');
      console.log('🌐 [QR VALIDATION] Début de la validation');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📤 [QR VALIDATION] Paramètres de validation:', {
        qrToken: qrValidationData.qrToken.substring(0, 30) + '...',
        partnerId: qrValidationData.partnerId.substring(0, 20) + '...',
        storeId: qrValidationData.storeId.substring(0, 20) + '...',
        operatorUserId: qrValidationData.operatorUserId.substring(0, 20) + '...',
        amountGross,
        personsCount,
        discountPercent,
        storeName: store?.name || 'Magasin inconnu',
      });

      const validationStartTime = Date.now();

      // Validation sécurisée - l'erreur sera catchée par le bloc catch principal
      const validationResult = await QrApi.validateQrToken(
        qrValidationData.qrToken,
        qrValidationData.partnerId,
        qrValidationData.storeId,
        qrValidationData.operatorUserId,
        amountGross,
        personsCount,
        discountPercent
      );

      const validationDuration = Date.now() - validationStartTime;

      console.log('✅ [QR VALIDATION] Validation réussie:', {
        duration: validationDuration + 'ms',
        hasResult: !!validationResult,
        resultType: typeof validationResult,
        resultKeys: validationResult ? Object.keys(validationResult) : [],
        clientName: validationResult?.clientName || validationResult?.client?.firstName || 'N/A',
        amount: validationResult?.amount || 'N/A',
        discount: validationResult?.discountAmount || 'N/A',
        fullResult: JSON.stringify(validationResult, null, 2),
      });

      // Fermer le modal de manière sécurisée
      try {
        setShowQRValidationModal(false);
        setQrValidationData(null);
      } catch (closeError) {
        console.error('Erreur lors de la fermeture du modal:', closeError);
      }

      // Afficher le résultat avec gestion sécurisée
      try {
        const clientName = validationResult?.clientName || validationResult?.client?.firstName || 'Client';
        const storeName = qrValidationData?.storeName || 'N/A';
        const amount = typeof amountGross === 'number' ? amountGross.toFixed(2) : '0.00';
        const discount = validationResult?.discountAmount 
          ? (typeof validationResult.discountAmount === 'number' ? validationResult.discountAmount.toFixed(2) : '0.00')
          : '0.00';
        
        Alert.alert(
          '✅ QR Code validé',
          `Visite enregistrée avec succès !\n\nClient: ${clientName}\nMagasin: ${storeName}\nMontant: ${amount}€\nRéduction: ${discount}€`,
          [
            {
              text: 'OK',
              onPress: () => {
                try {
                  console.log('🔄 [QR VALIDATION] Rechargement des clients et statistiques après validation...');
                  loadClients();
                  loadScanCounts(); // Recharger les statistiques de scans
                } catch (reloadError) {
                  console.error('Erreur lors du rechargement:', reloadError);
                }
              },
            },
          ]
        );
      } catch (alertError) {
        console.error('Erreur lors de l\'affichage de l\'alerte de succès:', alertError);
        // Afficher une alerte simplifiée en cas d'erreur
        Alert.alert('✅ QR Code validé', 'Visite enregistrée avec succès !', [{ text: 'OK' }]);
      }

      console.log('✅ [QR VALIDATION] Processus terminé avec succès');
      console.log('═══════════════════════════════════════════════════════════');
    } catch (error: any) {
      // S'assurer que toutes les erreurs sont catchées pour éviter les plantages
      try {
        console.error('═══════════════════════════════════════════════════════════');
        console.error('❌ [QR VALIDATION] Erreur lors de la validation');
        console.error('═══════════════════════════════════════════════════════════');
        console.error('❌ [QR VALIDATION] Détails de l\'erreur:', {
          error: error instanceof Error ? error.message : String(error),
          errorName: error instanceof Error ? error.name : 'Unknown',
          statusCode: error?.statusCode || error?.status || 'N/A',
          hasStack: !!(error instanceof Error && error.stack),
        });
      } catch (logError) {
        // Si même le log échoue, utiliser console.error basique
        console.error('Erreur lors de la validation QR:', error);
      }

      // Message d'erreur utilisateur avec gestion sécurisée
      let errorMessage = 'Impossible de valider le QR Code. Veuillez réessayer.';
      let errorTitle = '❌ Erreur';

      try {
        if (error instanceof Error) {
          errorMessage = error.message || errorMessage;
          
          // Titre spécifique selon le type d'erreur
          const lowerMessage = errorMessage.toLowerCase();
          if (lowerMessage.includes('déjà utilisé') || lowerMessage.includes('already used')) {
            errorTitle = '⚠️ QR Code déjà utilisé';
          } else if (lowerMessage.includes('expiré') || lowerMessage.includes('expired')) {
            errorTitle = '⏰ QR Code expiré';
          } else if (lowerMessage.includes('invalide') || lowerMessage.includes('invalid')) {
            errorTitle = '⚠️ QR Code invalide';
          } else if (lowerMessage.includes('authentification') || lowerMessage.includes('authentication')) {
            errorTitle = '🔐 Erreur d\'authentification';
          } else if (lowerMessage.includes('serveur') || lowerMessage.includes('server')) {
            errorTitle = '🔧 Erreur serveur';
          }
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
      } catch (parseError) {
        // Si l'extraction échoue, utiliser les valeurs par défaut
        console.error('Erreur lors de l\'extraction du message d\'erreur:', parseError);
      }

      // Afficher l'alerte de manière sécurisée
      try {
        Alert.alert(
          errorTitle,
          errorMessage,
          [
            {
              text: 'OK',
              onPress: () => {
                // Ne pas fermer le modal automatiquement pour permettre de réessayer
                // L'utilisateur peut fermer manuellement s'il le souhaite
              },
            },
          ]
        );
      } catch (alertError) {
        // Si Alert.alert échoue, au moins logger l'erreur
        console.error('Impossible d\'afficher l\'alerte:', alertError);
        console.error('Message d\'erreur original:', errorMessage);
      }

      try {
        console.error('═══════════════════════════════════════════════════════════');
      } catch {
        // Ignorer les erreurs de log
      }
    } finally {
      // Toujours réinitialiser l'état, même en cas d'erreur
      try {
        setValidatingQR(false);
        console.log('🏁 [QR VALIDATION] État de validation réinitialisé');
      } catch (finallyError) {
        // Si même le finally échoue, au moins essayer de réinitialiser l'état
        console.error('Erreur dans le bloc finally:', finallyError);
      }
    }
  };

  const loadClients = useCallback(async () => {
    setClientsLoading(true);
    setClientsError(null);
    try {
      // Note: getClients n'est pas disponible dans ProfileApi
      // Pour l'instant, on ne charge pas les clients depuis l'API
      // TODO: Implémenter getClients dans ProfileApi si nécessaire
      setClients([]);
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

  // Charger les scans détaillés avec la route filtered
  const loadScans = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      setScansLoading(true);
      setScansError(null);

      // Récupérer le partnerId depuis les stores
      let partnerId: string | undefined;

      // Utiliser le store actif
      const currentStoreId = activeStoreId || selectedStoreId;
      
      if (currentStoreId) {
        // Si un store actif est défini
        const currentStore = stores.find((s: any) => s.id === currentStoreId);
        if (currentStore) {
          partnerId = currentStore.partnerId || currentStore.partner?.id;
        }
      } else if (stores.length > 0) {
        // Sinon, utiliser le partnerId du premier store
        const firstStore = stores[0];
        partnerId = firstStore.partnerId || firstStore.partner?.id;
      }

      console.log('📊 [Partner Home] Chargement des scans détaillés avec filtered:', {
        partnerId: partnerId ? partnerId.substring(0, 20) + '...' : 'undefined',
        storeId: currentStoreId,
        operatorUserId: user.id.substring(0, 20) + '...',
      });

      // Utiliser getPartnerTransactions directement (route filtered temporairement désactivée)
      let response;
      if (partnerId) {
        response = await TransactionsApi.getPartnerTransactions(partnerId, {
          page: 1,
          pageSize: 1000,
          storeId: currentStoreId,
        });
      } else {
        // Fallback : getUserTransactions
        response = await TransactionsApi.getUserTransactions(user.id, {
          page: 1,
          pageSize: 1000,
        });
      }

      console.log('✅ [Partner Home] Scans détaillés récupérés:', {
        count: response.items?.length || 0,
        totalCount: response.totalCount,
      });

      const scansData = response.items || [];
      setScans(scansData);

      // Calculer les statistiques des clients (personne la plus venue, etc.)
      const customerStats = new Map<string, {
        customerId: string;
        customerName: string;
        visitCount: number;
        totalAmount: number;
      }>();

      scansData.forEach((scan: any) => {
        const customerId = scan.customerUserId || scan.customerId || scan.clientId || scan.client?.id || scan.customer?.id;
        const customerName = scan.customerName || 
                            scan.clientName || 
                            `${scan.customer?.firstName || scan.client?.firstName || ''} ${scan.customer?.lastName || scan.client?.lastName || ''}`.trim() ||
                            'Client inconnu';
        const amount = scan.amountGross || scan.amount || 0;

        if (customerId) {
          if (customerStats.has(customerId)) {
            const existing = customerStats.get(customerId)!;
            existing.visitCount += 1;
            existing.totalAmount += amount;
          } else {
            customerStats.set(customerId, {
              customerId,
              customerName: customerName || 'Client inconnu',
              visitCount: 1,
              totalAmount: amount,
            });
          }
        }
      });

      // Trier par nombre de visites (décroissant) et prendre le top 10
      const topCustomersList = Array.from(customerStats.values())
        .sort((a, b) => b.visitCount - a.visitCount)
        .slice(0, 10);

      setTopCustomers(topCustomersList);
      console.log('📊 [Partner Home] Statistiques clients calculées:', {
        totalCustomers: customerStats.size,
        topCustomers: topCustomersList.length,
      });
    } catch (error) {
      console.error('❌ Erreur lors du chargement des scans:', error);
      setScansError('Impossible de charger les scans');
      setScans([]);
      // Réinitialiser les statistiques clients en cas d'erreur
      if (typeof setTopCustomers === 'function') {
        setTopCustomers([]);
      }
    } finally {
      setScansLoading(false);
    }
  }, [user, activeStoreId, selectedStoreId, stores, setTopCustomers]);

  // Ne charger les scans que si un store actif est défini
  useEffect(() => {
    if (stores.length > 0 && activeStoreId && !showActiveStoreSelection) {
      loadScans();
    }
  }, [loadScans, stores.length, activeStoreId, showActiveStoreSelection]);

  // Charger les transactions du partenaire/opérateur
  const loadPartnerTransactions = useCallback(async () => {
    if (!user?.id) {
      setTransactionsError('Utilisateur non connecté');
      setTransactionsLoading(false);
      return;
    }

    try {
      setTransactionsLoading(true);
      setTransactionsError(null);

      // Calculer les dates selon la période sélectionnée
      let startDate: string | undefined;
      const now = new Date();

      if (filterPeriod === 'today') {
        // Début de la journée en heure locale, pas UTC
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        startDate = todayStart.toISOString();
        console.log('📅 Filtre TODAY - startDate:', startDate, 'Date actuelle:', now.toISOString());
      } else if (filterPeriod === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        startDate = weekAgo.toISOString();
      } else if (filterPeriod === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        monthAgo.setHours(0, 0, 0, 0);
        startDate = monthAgo.toISOString();
      }

      // Si un store spécifique est sélectionné, utiliser son partnerId
      // Sinon, essayer de charger toutes les transactions via l'endpoint user
      let partnerId: string | undefined;
      let useUserEndpoint = false;

      // Utiliser le store actif
      const currentStoreId = activeStoreId || selectedStoreId;
      
      if (currentStoreId) {
        // Trouver le store actif pour extraire son partnerId
        const currentStore = stores.find((s: any) => s.id === currentStoreId);
        if (currentStore) {
          partnerId = currentStore.partnerId || currentStore.partner?.id;
          console.log('📊 [Partner History] Store actif, utilisation de son partnerId:', {
            storeId: currentStoreId,
            storeName: currentStore.name,
            partnerId: partnerId ? partnerId.substring(0, 20) + '...' : 'undefined',
          });
        }
      }

      // Si on n'a pas de partnerId ou de store actif, on ne peut pas charger les transactions
      if (!partnerId || !currentStoreId) {
        console.warn('⚠️ [Partner History] Pas de store actif défini, impossible de charger les transactions');
        setTransactions([]);
        setTransactionsError('Veuillez sélectionner un magasin actif pour voir l\'historique');
        return;
      }

      console.log('📊 [Partner History] Paramètres de chargement:', {
        userId: user.id,
        partnerId: partnerId ? partnerId.substring(0, 20) + '...' : 'N/A',
        filterPeriod,
        startDate,
        storeId: currentStoreId,
      });

      // Toujours utiliser l'endpoint partner avec le store actif pour filtrer uniquement ce magasin
      const response = await TransactionsApi.getPartnerTransactions(partnerId, {
        page: 1,
        pageSize: 100,
        storeId: currentStoreId, // Filtrer uniquement par le store actif
        startDate: startDate,
      });
      
      // Filtrer également côté client pour être sûr de n'avoir que les transactions du store actif
      const filteredTransactions = (response.items || []).filter((transaction: any) => {
        const transactionStoreId = transaction.storeId || transaction.store?.id;
        return transactionStoreId === currentStoreId;
      });

      console.log('✅ [Partner History] Transactions reçues (filtrées par store actif):', {
        count: filteredTransactions.length,
        totalCount: response.totalCount,
        storeId: currentStoreId,
      });

      setTransactions(filteredTransactions);
    } catch (err) {
      console.error('❌ [Partner History] Erreur lors du chargement des transactions:', err);
      let errorMessage = 'Erreur lors du chargement';

      if (err instanceof Error) {
        if (err.message.includes('401')) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        } else if (err.message.includes('403')) {
          errorMessage = 'Accès refusé.';
        } else {
          errorMessage = err.message;
        }
      }

      setTransactionsError(errorMessage);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  }, [user, filterPeriod, activeStoreId, selectedStoreId, stores]);

  // Ne charger les transactions que si un store actif est défini
  useEffect(() => {
    if (selectedTab === 'history' && activeStoreId && !showActiveStoreSelection) {
      loadPartnerTransactions();
    }
  }, [selectedTab, loadPartnerTransactions, activeStoreId, showActiveStoreSelection]);

  // Charger les stores du partenaire/opérateur connecté
  const loadStores = useCallback(async () => {
    console.log('🏪 [Partner Home] Chargement des stores depuis /auth/me...');
    setStoresLoading(true);
    setStoresError(null);
    try {
      // 1) Récupérer les infos complètes de l'utilisateur (partner / operator)
      const userInfo = await AuthService.getCurrentUserInfo();

      console.log('👤 [Partner Home] Données utilisateur complètes:', {
        id: userInfo.id,
        email: userInfo.email,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        keys: Object.keys(userInfo),
      });

      // 2) Extraire les stores directement depuis la réponse /auth/me
      // Les stores peuvent être à différents endroits selon le rôle
      const userStores =
        (userInfo as any).stores ||
        (userInfo as any).partnerStores ||
        (userInfo as any).operatorStores ||
        (userInfo as any).myStores ||
        (userInfo as any).partnerData?.operatorStores ||  // Pour les StoreOperator
        (userInfo as any).partnerData?.stores ||
        [];

      console.log('🏪 [Partner Home] Stores extraits depuis /auth/me:', {
        count: Array.isArray(userStores) ? userStores.length : 0,
        type: typeof userStores,
        isArray: Array.isArray(userStores),
      });

      if (!Array.isArray(userStores) || userStores.length === 0) {
        console.warn(
          '⚠️ [Partner Home] Aucun store trouvé dans la réponse /auth/me. Vérifier que l’API renvoie bien un tableau de magasins (stores, partnerStores, operatorStores, myStores, ...).'
        );
        setStores([]);
        setStoresError('Aucun magasin trouvé pour votre compte');
        return;
      }

      // 3) Charger les détails complets de chaque store pour avoir avgDiscountPercent
      console.log('🔄 [Partner Home] Chargement des détails complets des stores...');
      const storesWithDetails = await Promise.all(
        userStores.map(async (store: any) => {
          try {
            const storeDetails = await StoresApi.getStoreById(store.id);
            console.log(`✅ [Partner Home] Store ${store.name} chargé:`, {
              id: storeDetails.id,
              avgDiscountPercent: storeDetails.avgDiscountPercent,
            });
            return storeDetails;
          } catch (error) {
            console.warn(`⚠️ [Partner Home] Impossible de charger les détails du store ${store.id}:`, error);
            // En cas d'erreur, utiliser les données de base
            return store;
          }
        })
      );

      setStoresError(null);
      setStores(storesWithDetails);

      console.log('✅ [Partner Home] Stores du partenaire chargés avec détails complets:', {
        count: storesWithDetails.length,
        preview: storesWithDetails.slice(0, 3).map((s: any) => ({
          id: s.id,
          name: s.name || s.partner?.name,
          avgDiscountPercent: s.avgDiscountPercent,
          discountPercent: s.discountPercent,
          discount: s.discount,
        })),
      });
    } catch (error) {
      console.error('❌ [Partner Home] Erreur lors du chargement des stores:', error);
      if (error instanceof Error) {
        setStoresError(`Erreur: ${error.message}`);
      } else {
        setStoresError('Impossible de charger les stores');
      }
      setStores([]);
    } finally {
      setStoresLoading(false);
    }
  }, []);

  // Charger le store actif (optionnel - pour vérifier s'il y en a un déjà défini)
  const loadActiveStore = useCallback(async () => {
    console.log('🏪 [Partner Home] Vérification du store actif...');
    setLoadingActiveStore(true);
    try {
      const activeStoreData = await StoreOperatorsApi.getActiveStore();
      if (activeStoreData && activeStoreData.id) {
        setActiveStoreId(activeStoreData.id);
        setActiveStore(activeStoreData);
        setSelectedStoreId(activeStoreData.id);
        setShowActiveStoreSelection(false); // S'assurer que le modal est fermé
        console.log('✅ [Partner Home] Store actif trouvé:', activeStoreData.id);
      } else {
        console.log('⚠️ [Partner Home] Aucun store actif trouvé - affichage du modal');
        // Toujours afficher le modal si aucun store actif
        if (stores.length > 0) {
          setShowActiveStoreSelection(true);
        }
      }
    } catch (error) {
      console.error('❌ [Partner Home] Erreur lors du chargement du store actif:', error);
      // En cas d'erreur, afficher le modal pour permettre la sélection
      if (stores.length > 0) {
        setShowActiveStoreSelection(true);
      }
    } finally {
      setLoadingActiveStore(false);
    }
  }, [stores.length]);

  // Définir le store actif
  const handleSetActiveStore = useCallback(async (storeId: string) => {
    console.log('🏪 [Partner Home] Définition du store actif:', storeId);
    
    // Vérifier si ce store est déjà actif pour éviter les appels inutiles
    if (activeStoreId === storeId) {
      console.log('✅ [Partner Home] Ce store est déjà actif, fermeture du modal');
      setShowActiveStoreSelection(false);
      return;
    }
    
    setLoadingActiveStore(true);
    // Fermer le modal immédiatement pour éviter les boucles
    setShowActiveStoreSelection(false);
    
    try {
      const activeStoreData = await StoreOperatorsApi.setActiveStore(storeId);
      console.log('📦 [Partner Home] Réponse API setActiveStore:', activeStoreData);
      
      // L'API retourne { "message": "...", "storeId": "..." }
      // On utilise l'ID du store de la réponse ou celui passé en paramètre
      const finalStoreId = activeStoreData?.id || activeStoreData?.storeId || storeId;
      
      if (finalStoreId) {
        // Trouver le store complet dans la liste des stores pour avoir toutes les infos
        const storeFromList = stores.find((s: any) => s.id === finalStoreId);
        const storeToSet = storeFromList || activeStoreData;
        
        // Mettre à jour les états de manière atomique
        setActiveStoreId(finalStoreId);
        setActiveStore(storeToSet);
        setSelectedStoreId(finalStoreId);
        console.log('✅ [Partner Home] Store actif défini:', finalStoreId);
        
        // Les useEffect se chargeront automatiquement de recharger les données
        // car activeStoreId a changé
      } else {
        console.error('❌ [Partner Home] Réponse API invalide - pas d\'ID trouvé:', activeStoreData);
        throw new Error('Réponse API invalide - pas d\'ID de store trouvé');
      }
    } catch (error) {
      console.error('❌ [Partner Home] Erreur lors de la définition du store actif:', error);
      // Réafficher le modal en cas d'erreur seulement si on n'a pas de store actif
      if (!activeStoreId) {
        setShowActiveStoreSelection(true);
      }
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      Alert.alert('Erreur', `Impossible de définir le store actif: ${errorMessage}`);
    } finally {
      setLoadingActiveStore(false);
    }
  }, [activeStoreId, stores]);

  // Charger les stores au démarrage et quand l'onglet Me est affiché
  useEffect(() => {
    loadStores();
  }, [loadStores]);

  // Afficher le modal de sélection de store au démarrage
  useEffect(() => {
    // Dès que les stores sont chargés, afficher directement le modal pour choisir le store actif
    // Ne s'exécuter qu'une seule fois quand les stores sont chargés et qu'il n'y a pas de store actif
    if (stores.length > 0 && !activeStoreId && !showActiveStoreSelection && !loadingActiveStore) {
      console.log('🏪 [Partner Home] Stores chargés, affichage du modal de sélection au démarrage...');
      setShowActiveStoreSelection(true);
    }
  }, [stores.length, activeStoreId, showActiveStoreSelection, loadingActiveStore]);

  // Charger les statistiques de scans
  const loadScanCounts = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    console.log('📊 [Partner Home] Chargement des statistiques de scans...');
    setScanCountsLoading(true);

    try {
      // Récupérer les infos utilisateur pour déterminer le partnerId
      const userInfo = await AuthService.getCurrentUserInfo();
      const partnerId = 
        (userInfo as any).partnerId || 
        (userInfo as any).partner?.id || 
        (userInfo as any).partnerData?.id ||
        userInfo.id;

      const now = new Date();
      
      // Calculer les dates pour chaque période
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(now);
      monthStart.setMonth(monthStart.getMonth() - 30);

      // Charger les statistiques pour chaque période
      const [todayCount, weekCount, monthCount, totalCount] = await Promise.all([
        TransactionsApi.getScanCount(partnerId, activeStoreId || selectedStoreId, todayStart.toISOString()),
        TransactionsApi.getScanCount(partnerId, activeStoreId || selectedStoreId, weekStart.toISOString()),
        TransactionsApi.getScanCount(partnerId, activeStoreId || selectedStoreId, monthStart.toISOString()),
        TransactionsApi.getScanCount(partnerId, activeStoreId || selectedStoreId),
      ]);

      setScanCounts({
        today: parseInt(todayCount, 10) || 0,
        week: parseInt(weekCount, 10) || 0,
        month: parseInt(monthCount, 10) || 0,
        total: parseInt(totalCount, 10) || 0,
      });

      console.log('✅ [Partner Home] Statistiques de scans chargées:', {
        today: parseInt(todayCount, 10) || 0,
        week: parseInt(weekCount, 10) || 0,
        month: parseInt(monthCount, 10) || 0,
        total: parseInt(totalCount, 10) || 0,
      });
    } catch (error) {
      console.error('❌ [Partner Home] Erreur lors du chargement des statistiques de scans:', error);
      setScanCounts({
        today: 0,
        week: 0,
        month: 0,
        total: 0,
      });
    } finally {
      setScanCountsLoading(false);
    }
  }, [user, activeStoreId, selectedStoreId]);

  // Charger les statistiques au démarrage et quand le store sélectionné change
  // Ne charger que si un store actif est défini
  useEffect(() => {
    if (stores.length > 0 && activeStoreId && !showActiveStoreSelection) {
      loadScanCounts();
    }
  }, [loadScanCounts, stores.length, activeStoreId, showActiveStoreSelection]);

  // Afficher les détails d'un store
  const handleStoreSelect = async (store: any) => {
    console.log('🔍 [Partner Home] Affichage des détails du store:', store.id);
    setSelectedStore(store);
    setShowStoreModal(true);
    setStoreDetailLoading(true);

    try {
      // Charger les détails du store
      const storeDetails = await StoresApi.getStoreById(store.id);
      console.log('✅ [Partner Home] Détails du store récupérés:', storeDetails);
      
      // Charger les statistiques du store
      try {
        // Filtrer les transactions pour ce store spécifique
        const storeTransactions = transactions.filter(
          t => t.storeId === store.id || t.store?.id === store.id
        );
        
        // Calculer les statistiques
        const totalScans = storeTransactions.length;
        const totalRevenue = storeTransactions.reduce((sum, t) => sum + (t.amountGross || 0), 0);
        
        // Compter les clients uniques
        const uniqueClientIds = new Set(
          storeTransactions
            .map(t => t.clientId || t.customerId || t.client?.id || t.customer?.id)
            .filter(Boolean)
        );
        const clientsCount = uniqueClientIds.size;
        
        console.log('📊 [Partner Home] Statistiques du store calculées:', {
          totalScans,
          totalRevenue: totalRevenue.toFixed(2),
          clientsCount,
        });
        
        // Enrichir les détails avec les statistiques
        const enrichedStore = {
          ...storeDetails,
          totalScans,
          totalRevenue,
          clientsCount,
        };
        
        setSelectedStore(enrichedStore);
      } catch (statsError) {
        console.warn('⚠️ [Partner Home] Erreur lors du calcul des statistiques:', statsError);
        // Continuer quand même avec les détails de base
        setSelectedStore(storeDetails);
      }
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

  // Calculer les statistiques à partir des transactions
  const totalRevenue = transactions.reduce((sum, transaction) => {
    return sum + (transaction.amountGross || transaction.amount || 0);
  }, 0);

  // Calculer le revenu d'aujourd'hui en comparant les dates correctement
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const todayRevenue = transactions.reduce((sum, transaction) => {
    const transactionDate = new Date(transaction.createdAt || transaction.date || transaction.transactionDate);
    // Vérifier si la transaction est d'aujourd'hui
    if (transactionDate >= todayStart) {
      return sum + (transaction.amountGross || transaction.amount || 0);
    }
    return sum;
  }, 0);

  // Calculer les réductions totales de la journée
  const todayDiscounts = transactions.reduce((sum, transaction) => {
    const transactionDate = new Date(transaction.createdAt || transaction.date || transaction.transactionDate);
    // Vérifier si la transaction est d'aujourd'hui
    if (transactionDate >= todayStart) {
      return sum + (transaction.discountAmount || transaction.discount || 0);
    }
    return sum;
  }, 0);

  console.log('💰 Statistiques calculées:', {
    totalRevenue,
    todayRevenue,
    todayStart: todayStart.toISOString(),
    transactionsCount: transactions.length,
    transactionsDates: transactions.map(t => new Date(t.createdAt || t.date || t.transactionDate).toISOString()),
  });

  return (
    <NavigationTransition delay={50}>
      <LinearGradient
        colors={Colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <PartnerHeader
            firstName={user?.firstName}
            lastName={user?.lastName}
            showWelcome={selectedTab === 'overview'}
            title={
              selectedTab === 'history' ? 'Historique' :
              selectedTab === 'stats' ? 'Statistiques' :
              selectedTab === 'me' ? 'Mon profil' :
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

          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent, 
              { paddingTop: selectedTab === 'overview' ? 180 : 120 }
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
              clients={clients}
              clientsLoading={clientsLoading}
              clientsError={clientsError}
              filteredClients={filteredClients}
              onExportData={handleExportData}
              onScanQR={handleScanQR}
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
                // Le magasin actif est défini au démarrage
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
              onSearchChange={setStoreSearchQuery}
              onStoreSelect={handleStoreSelect}
              onChangeStore={() => {
                // Ouvrir le modal de sélection de store actif
                setShowActiveStoreSelection(true);
              }}
            />
          )}

          {selectedTab === 'stats' && (
            <PartnerStats
              scanCounts={scanCounts}
              scanCountsLoading={scanCountsLoading}
            />
          )}
        </ScrollView>

        <PartnerBottomNav selectedTab={selectedTab} onTabChange={setSelectedTab} />
        </SafeAreaView>

        <PartnerStoreModal
          visible={showStoreModal}
          selectedStore={selectedStore}
          loading={storeDetailLoading}
          onClose={() => {
            setShowStoreModal(false);
            setSelectedStore(null);
          }}
        />

        {/* Modal de sélection de store actif au démarrage - OBLIGATOIRE */}
        <StoreSelectionModal
          visible={showActiveStoreSelection && stores.length > 0}
          stores={stores}
          onClose={() => {
            // Ne pas permettre de fermer sans sélectionner un store
            // Le modal doit rester ouvert jusqu'à ce qu'un store soit sélectionné
            console.log('⚠️ [Partner Home] Tentative de fermeture du modal sans sélection - ignorée');
          }}
          onSelectStore={handleSetActiveStore}
        />

        {/* Modal de sélection de store avant le scan - DÉSACTIVÉ (on utilise le store actif) */}
        {/* <StoreSelectionModal
          visible={showStoreSelection}
          stores={stores}
          onClose={() => setShowStoreSelection(false)}
          onSelectStore={handleStoreSelected}
        /> */}

        <QRScanner
          visible={showQRScanner}
          onClose={() => {
            setShowQRScanner(false);
            setSelectedStoreForScan(null); // Réinitialiser le store sélectionné
          }}
          onScan={handleQRScanned}
          mode="partner"
        />

        {/* Modal de validation QR */}
        {qrValidationData && (() => {
          // Récupérer le discountPercent du store en temps réel pour le modal
          const currentStore = stores.find(s => s.id === qrValidationData.storeId || s.storeId === qrValidationData.storeId);
          const currentDiscount = qrValidationData.discountPercent || 
                                  currentStore?.avgDiscountPercent || 
                                  currentStore?.discountPercent || 
                                  currentStore?.discount || 
                                  10;
          
          console.log('🎯 [Partner Home] Modal discount calculé:', {
            fromQrData: qrValidationData.discountPercent,
            fromStore: currentStore?.avgDiscountPercent || currentStore?.discountPercent,
            final: currentDiscount,
            storeName: currentStore?.name,
          });
          
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  } as ViewStyle,
  safeArea: {
    flex: 1,
  } as ViewStyle,
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  } as ViewStyle,
  headerTitle: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.light,
    marginBottom: Spacing.xs,
  } as TextStyle,
  headerSubtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  } as ViewStyle,
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100, // Espace pour la barre de navigation en bas
  } as ViewStyle,
  scrollContent: {
    paddingBottom: Spacing.xl,
  } as ViewStyle,
  bottomNavBarContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: '#1A0A0E',
    borderTopWidth: 0,
    borderRadius: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  } as ViewStyle,
  bottomNavBar: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingBottom: 12,
    paddingTop: 12,
    height: 70,
  } as ViewStyle,
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    gap: 2,
  } as ViewStyle,
  bottomNavItemActive: {
    // Style pour l'item actif
  } as ViewStyle,
  bottomNavText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  } as TextStyle,
  bottomNavTextActive: {
    color: '#8B2F3F',
    fontWeight: '600',
  } as TextStyle,
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
  qrCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  } as ViewStyle,
  qrCardTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.light,
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 3,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
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
    color: Colors.text.light,
    marginBottom: Spacing.md,
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
    color: Colors.text.light,
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
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
    color: Colors.text.light,
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
  amountBadge: {
    alignItems: 'flex-end',
    gap: 4,
  } as ViewStyle,
  amountText: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
  } as TextStyle,
  discountText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.status.success,
  } as TextStyle,
  storeFilterContainer: {
    marginBottom: Spacing.md,
  } as ViewStyle,
  storeFilterLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.light,
    marginBottom: Spacing.xs,
  } as TextStyle,
  storeFilterScroll: {
    marginBottom: Spacing.sm,
  } as ViewStyle,
  storeFilterContent: {
    gap: Spacing.sm,
  } as ViewStyle,
  storeFilterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginRight: Spacing.sm,
  } as ViewStyle,
  storeFilterChipActive: {
    backgroundColor: 'rgba(139, 47, 63, 0.3)',
    borderColor: '#8B2F3F',
  } as ViewStyle,
  storeFilterChipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '500',
    color: Colors.text.secondary,
  } as TextStyle,
  storeFilterChipTextActive: {
    color: Colors.text.light,
    fontWeight: '600',
  } as TextStyle,
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
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
    color: Colors.text.light,
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
    color: Colors.text.light,
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  } as ViewStyle,
  statsCardTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
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
    color: Colors.text.light,
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
    color: Colors.text.light,
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
    color: Colors.text.light,
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
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
    color: Colors.text.light,
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  } as ViewStyle,
  searchIcon: {
    marginRight: Spacing.sm,
  } as TextStyle,
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
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
    color: Colors.text.light,
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
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
    color: Colors.text.light,
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
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
    color: Colors.text.light,
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  } as ViewStyle,
  closeButton: {
    padding: Spacing.sm,
  } as ViewStyle,
  modalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
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
    color: Colors.text.light,
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
    color: Colors.text.light,
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
    color: Colors.text.light,
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
    color: Colors.text.light,
    lineHeight: 22,
  } as TextStyle,
});

