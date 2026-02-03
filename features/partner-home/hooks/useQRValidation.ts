import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { AuthService } from '@/services/auth.service';
import { QrApi } from '@/features/home/services/qrApi';

interface QRValidationData {
  qrToken: string;
  partnerId: string;
  storeId: string;
  operatorUserId: string;
  storeName?: string;
  discountPercent?: number;
}

export function useQRValidation(
  stores: any[],
  activeStoreId: string | null,
  selectedStoreForScan: string | null,
  loadStores: () => Promise<void>,
  loadClients: () => Promise<void>,
  loadScanCounts: () => Promise<void>,
  setSelectedStoreForScan: (id: string | null) => void
) {
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [validatingQR, setValidatingQR] = useState(false);
  const [showQRValidationModal, setShowQRValidationModal] = useState(false);
  const [qrValidationData, setQrValidationData] = useState<QRValidationData | null>(null);

  const handleQRScanned = useCallback(async (qrData: string) => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📱 [QR SCAN] Début du processus de scan QR Code');
    console.log('═══════════════════════════════════════════════════════════');
    
    setShowQRScanner(false);
    setValidatingQR(true);
    
    try {
      let qrToken = qrData;
      
      if (qrData.includes('Token:')) {
        const tokenMatch = qrData.match(/Token:\s*([^\s\n]+)/);
        if (tokenMatch && tokenMatch[1]) {
          qrToken = tokenMatch[1];
        }
      } else if (qrData.includes(':') && !qrData.includes('Token:')) {
        qrToken = qrData.split(':').pop() || qrData;
      }
      
      let partnerId: string | undefined;
      let operatorUserId: string | undefined;
      let storeId: string | undefined;

      try {
        const userInfo = await AuthService.getCurrentUserInfo();
        operatorUserId = userInfo.id;

        if (!operatorUserId) {
          console.error('❌ [QR SCAN] operatorUserId manquant après extraction');
        }
      } catch (error) {
        console.error('❌ [QR SCAN] Erreur lors de la récupération des infos utilisateur:', error);
        throw new Error('Impossible de récupérer les informations du partenaire');
      }

      if (stores.length === 0) {
        await loadStores();
      }

      if (stores.length === 0) {
        Alert.alert(
          '⚠️ Aucun magasin',
          'Vous devez avoir au moins un magasin pour valider un QR Code.',
          [{ text: 'OK' }]
        );
        return;
      }

      let activeStore: any = null;
      const storeToUse = activeStoreId || selectedStoreForScan;
      
      if (storeToUse) {
        activeStore = stores.find((s: any) => s.id === storeToUse);
        if (activeStore) {
          storeId = activeStore.id as string;
          partnerId = activeStore.partnerId || activeStore.partner?.id;
        } else {
          throw new Error('Store actif introuvable');
        }
      } else {
        Alert.alert(
          '⚠️ Aucun magasin actif',
          'Veuillez sélectionner un magasin actif avant de scanner un QR Code.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      const missingParams: string[] = [];
      if (!partnerId) missingParams.push('partnerId');
      if (!operatorUserId) missingParams.push('operatorUserId');
      if (!storeId) missingParams.push('storeId');
      if (!qrToken) missingParams.push('qrToken');
      
      if (missingParams.length > 0) {
        throw new Error(`Informations manquantes pour valider le QR Code: ${missingParams.join(', ')}`);
      }
      
      const finalPartnerId = partnerId!;
      const finalStoreId = storeId!;
      const finalOperatorUserId = operatorUserId!;

      const discountPercent = activeStore?.avgDiscountPercent || activeStore?.discountPercent || activeStore?.discount || 10;

      setQrValidationData({
        qrToken,
        partnerId: finalPartnerId,
        storeId: finalStoreId,
        operatorUserId: finalOperatorUserId,
        storeName: activeStore?.name || activeStore?.partner?.name,
        discountPercent,
      });

      setShowQRValidationModal(true);
    } catch (error) {
      console.error('❌ [QR SCAN] Erreur lors de la validation du QR Code', error);
      Alert.alert(
        '❌ Erreur',
        error instanceof Error ? error.message : 'Impossible de valider le QR Code. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    } finally {
      setValidatingQR(false);
    }
  }, [stores, activeStoreId, selectedStoreForScan, loadStores, setSelectedStoreForScan]);

  const handleValidateQR = useCallback(async (amountGross: number) => {
    if (!qrValidationData) {
      console.error('❌ [QR VALIDATION] Aucune donnée de validation disponible');
      return;
    }

    setValidatingQR(true);

    try {
      const personsCount = 1;
      const store = stores.find(s => s.id === qrValidationData.storeId || s.storeId === qrValidationData.storeId);
      const discountPercent = store?.avgDiscountPercent || store?.discountPercent || store?.discount || 10;

      const validationResult = await QrApi.validateQrToken(
        qrValidationData.qrToken,
        qrValidationData.partnerId,
        qrValidationData.storeId,
        qrValidationData.operatorUserId,
        amountGross,
        personsCount,
        discountPercent
      );

      setShowQRValidationModal(false);
      setQrValidationData(null);

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
              loadClients();
              loadScanCounts();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ [QR VALIDATION] Erreur lors de la validation', error);
      
      let errorMessage = 'Impossible de valider le QR Code. Veuillez réessayer.';
      let errorTitle = '❌ Erreur';

      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
        
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
      }

      Alert.alert(errorTitle, errorMessage, [{ text: 'OK' }]);
    } finally {
      setValidatingQR(false);
    }
  }, [qrValidationData, stores, loadClients, loadScanCounts]);

  const handleScanQR = useCallback(() => {
    if (activeStoreId) {
      setSelectedStoreForScan(activeStoreId);
      setShowQRScanner(true);
    } else if (stores.length > 0) {
      setSelectedStoreForScan(stores[0].id);
      setShowQRScanner(true);
    } else {
      Alert.alert(
        '⚠️ Aucun magasin',
        'Vous devez avoir au moins un magasin pour scanner un QR Code.',
        [{ text: 'OK' }]
      );
    }
  }, [activeStoreId, stores, setSelectedStoreForScan]);

  return {
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
  };
}

