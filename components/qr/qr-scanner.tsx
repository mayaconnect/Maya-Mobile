import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface QRScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
  mode?: 'client' | 'partner'; // Mode client: scanne les QR codes partenaires, Mode partner: scanne les tokens clients
}

export function QRScanner({ visible, onClose, onScan, mode = 'client' }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible, permission]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;

    setScanned(true);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📷 [QR SCANNER] Code-barres scanné par la caméra');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📥 [QR SCANNER] Données brutes du scan:', {
      length: data.length,
      preview: data.substring(0, 150) + (data.length > 150 ? '...' : ''),
      fullData: data,
      type: typeof data,
      hasNewlines: data.includes('\n'),
      hasColons: data.includes(':'),
      hasTokenKeyword: data.includes('Token:'),
    });
    console.log('🔍 [QR SCANNER] Mode scanner:', mode);

    // Mode partenaire: accepter tous les QR codes (tokens clients)
    if (mode === 'partner') {
      console.log('✅ [QR SCANNER - Partner Mode] QR Code accepté');
      console.log('📤 [QR SCANNER - Partner Mode] Envoi des données au composant parent...');
      onScan(data);
      console.log('✅ [QR SCANNER - Partner Mode] Callback onScan exécuté avec succès');
      // Ne pas fermer automatiquement, laisser la validation se faire
      setScanned(false); // Permettre de scanner à nouveau si nécessaire
      console.log('═══════════════════════════════════════════════════════════');
      return;
    }
    
    // Mode client: vérifier si c'est un QR code de partenaire Maya
    if (data.startsWith('maya:partner:') || data.includes('partner')) {
      onScan(data);
      Alert.alert(
        '✅ QR Code scanné',
        'Partenaire détecté avec succès !',
        [
          {
            text: 'OK',
            onPress: () => {
              setScanned(false);
              onClose();
            },
          },
        ]
      );
    } else {
      Alert.alert(
        '⚠️ QR Code invalide',
        'Ce QR code n\'est pas un code partenaire Maya.',
        [
          {
            text: 'Réessayer',
            onPress: () => setScanned(false),
          },
          {
            text: 'Fermer',
            onPress: onClose,
            style: 'cancel',
          },
        ]
      );
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <SafeAreaView style={styles.container}>
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-outline" size={64} color={Colors.text.secondary} />
            <Text style={styles.permissionTitle}>Accès à la caméra requis</Text>
            <Text style={styles.permissionText}>
              Pour scanner les QR codes des partenaires, Maya a besoin d'accéder à votre appareil photo.
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>Autoriser l'accès</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scanner un QR Code</Text>
          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing={facing}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          >
            {/* Overlay avec cadre de scan */}
            <View style={styles.overlay}>
              <View style={styles.scanArea}>
                {/* Cadre de scan avec coins */}
                <View style={styles.scanFrame}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
              </View>
              
              {/* Instructions */}
              <View style={styles.instructions}>
                <Text style={styles.instructionText}>
                  Positionnez le QR code dans le cadre
                </Text>
              </View>
            </View>
          </CameraView>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {mode === 'partner' 
              ? 'Scannez le QR code du client pour valider sa visite'
              : 'Scannez le QR code d\'un partenaire Maya pour valider votre visite'}
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  } as ViewStyle,
  closeButton: {
    padding: Spacing.sm,
  } as ViewStyle,
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: 'white',
  } as TextStyle,
  flipButton: {
    padding: Spacing.sm,
  } as ViewStyle,
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
  } as ViewStyle,
  camera: {
    flex: 1,
  } as ViewStyle,
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  } as ViewStyle,
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  } as ViewStyle,
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.primary[500],
    borderWidth: 4,
  } as ViewStyle,
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  } as ViewStyle,
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  } as ViewStyle,
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  } as ViewStyle,
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  } as ViewStyle,
  instructions: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  } as ViewStyle,
  instructionText: {
    color: 'white',
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  } as TextStyle,
  footer: {
    padding: Spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
  } as ViewStyle,
  footerText: {
    color: 'white',
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    opacity: 0.8,
  } as TextStyle,
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background.light,
  } as ViewStyle,
  permissionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  } as TextStyle,
  permissionText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  } as TextStyle,
  permissionButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
    marginBottom: Spacing.md,
  } as ViewStyle,
  permissionButtonText: {
    color: 'white',
    fontSize: Typography.sizes.base,
    fontWeight: '700',
  } as TextStyle,
  cancelButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  } as ViewStyle,
  cancelButtonText: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.base,
    fontWeight: '600',
  } as TextStyle,
});

