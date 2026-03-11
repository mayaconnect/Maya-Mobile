/**
 * Maya Connect V2 — Store Operator QR Scanner Screen
 *
 * Identical scanner functionality to partner's — scans client QR codes
 * and validates transactions for the active store.
 * Includes mandatory store selection if no active store.
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { qrApi } from '../../src/api/qr.api';
import { storeOperatorsApi } from '../../src/api/store-operators.api';
import { useAuthStore } from '../../src/stores/auth.store';
import { usePartnerStore } from '../../src/stores/partner.store';
import { operatorColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import { MButton, MInput, MCard, MHeader } from '../../src/components/ui';
import StoreSelectionModal from '../../src/components/partner/StoreSelectionModal';

type ScanState = 'scanning' | 'form' | 'success' | 'error';

export default function StoreOperatorScannerScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const activeStore = usePartnerStore((s) => s.activeStore);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [scannedToken, setScannedToken] = useState('');
  const scannedRef = useRef(false);

  /* ---- Active store ---- */
  const activeStoreQ = useQuery({
    queryKey: ['activeStore'],
    queryFn: () => storeOperatorsApi.getActiveStore(),
    select: (res) => res.data,
  });

  const hasActiveStore = !!(activeStoreQ.data?.storeId || activeStore?.storeId);

  /* ---- Form ---- */
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ amountGross: string; personsCount: string }>({
    defaultValues: { amountGross: '', personsCount: '1' },
  });

  /* ---- Validate mutation ---- */
  const validateMutation = useMutation({
    mutationFn: (dto: any) => qrApi.validate(dto),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScanState('success');
    },
    onError: (err: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setScanState('error');
      Alert.alert(
        'Erreur de validation',
        err?.response?.data?.detail ?? 'Le QR code est invalide ou expiré.',
      );
    },
  });

  const onBarcodeScanned = ({ data }: { data: string }) => {
    if (scannedRef.current || scanState !== 'scanning') return;
    scannedRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScannedToken(data);
    setScanState('form');
  };

  const onSubmit = (values: any) => {
    const amount = parseFloat(values.amountGross);
    const persons = parseInt(values.personsCount, 10) || 1;

    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir un montant valide.');
      return;
    }

    const store = activeStoreQ.data;
    const storeIdVal = store?.storeId ?? activeStore?.storeId ?? '';
    // StoreOperatorDto has no partnerId — resolve from partner store or stores array
    const partner = usePartnerStore.getState().partner;
    const stores = usePartnerStore.getState().stores;
    const matchedStore = stores.find((s) => s.id === storeIdVal);
    const partnerIdVal = partner?.id ?? matchedStore?.partnerId ?? '';

    if (!partnerIdVal) {
      Alert.alert('Erreur', "Impossible de déterminer le partenaire. Veuillez sélectionner un magasin.");
      return;
    }

    validateMutation.mutate({
      partnerId: partnerIdVal,
      storeId: storeIdVal,
      operatorUserId: user?.id ?? '',
      qrToken: scannedToken,
      amountGross: amount,
      personsCount: persons,
    });
  };

  const resetScanner = () => {
    scannedRef.current = false;
    setScannedToken('');
    reset();
    setScanState('scanning');
  };

  /* ---- If no active store → show selection modal ---- */
  if (!hasActiveStore && !activeStoreQ.isLoading) {
    return (
      <StoreSelectionModal
        visible
        onDismiss={() => {}}
        mandatory
      />
    );
  }

  /* ---- Permission ---- */
  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={wp(60)} color={colors.neutral[300]} />
        <Text style={styles.permTitle}>Caméra requise</Text>
        <Text style={styles.permDesc}>
          Autorisez l'accès à la caméra pour scanner les QR codes clients.
        </Text>
        <MButton title="Autoriser la caméra" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {scanState === 'scanning' && (
        <>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={onBarcodeScanned}
          />
          <View style={styles.overlay}>
            <View style={[styles.overlayTop, { paddingTop: insets.top }]}>
              <MHeader title="Scanner un QR" transparent />
              {/* Active store indicator */}
              <View style={styles.storeIndicator}>
                <Ionicons name="storefront" size={wp(14)} color="#FFFFFF" />
                <Text style={styles.storeIndicatorText} numberOfLines={1}>
                  {(activeStoreQ.data as any)?.storeName ?? 'Magasin actif'}
                </Text>
              </View>
            </View>
            <View style={styles.scanFrame}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
            </View>
            <View style={styles.overlayBottom}>
              <Text style={styles.scanHint}>
                Placez le QR code du client dans le cadre
              </Text>
            </View>
          </View>
        </>
      )}

      {scanState === 'form' && (
        <KeyboardAvoidingView
          style={styles.formContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={[
              styles.formContent,
              { paddingTop: insets.top + spacing[4] },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <MHeader title="Validation" showBack onBack={resetScanner} />
            <Animated.View entering={FadeInUp.duration(400)}>
              <MCard style={styles.tokenCard} elevation="md">
                <View style={styles.tokenRow}>
                  <View style={styles.tokenIcon}>
                    <Ionicons name="qr-code" size={wp(24)} color={colors.violet[500]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tokenLabel}>QR Token scanné</Text>
                    <Text style={styles.tokenValue} numberOfLines={1}>
                      {scannedToken.slice(0, 20)}…
                    </Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={wp(22)} color={colors.success[500]} />
                </View>
              </MCard>

              <Controller
                control={control}
                name="amountGross"
                render={({ field: { onChange, onBlur, value } }) => (
                  <MInput
                    label="Montant brut (€)"
                    placeholder="Ex: 45.50"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.amountGross?.message}
                    keyboardType="decimal-pad"
                    icon="cash-outline"
                  />
                )}
              />

              <Controller
                control={control}
                name="personsCount"
                render={({ field: { onChange, onBlur, value } }) => (
                  <MInput
                    label="Nombre de personnes"
                    placeholder="1"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.personsCount?.message}
                    keyboardType="number-pad"
                    icon="people-outline"
                  />
                )}
              />

              <MButton
                title="Valider la transaction"
                onPress={handleSubmit(onSubmit)}
                loading={validateMutation.isPending}
                style={{ marginTop: spacing[4] }}
              />
              <MButton
                title="Annuler"
                variant="ghost"
                onPress={resetScanner}
                style={{ marginTop: spacing[2] }}
              />
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {scanState === 'success' && (
        <View style={[styles.resultContainer, { paddingTop: insets.top }]}>
          <Animated.View entering={FadeInUp.springify().damping(15)} style={styles.resultContent}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={wp(48)} color="#FFFFFF" />
            </View>
            <Text style={styles.resultTitle}>Transaction validée !</Text>
            <Text style={styles.resultDesc}>La réduction a été appliquée avec succès.</Text>
            <MButton title="Scanner un autre QR" onPress={resetScanner} style={{ marginTop: spacing[6] }} />
          </Animated.View>
        </View>
      )}

      {scanState === 'error' && (
        <View style={[styles.resultContainer, { paddingTop: insets.top }]}>
          <Animated.View entering={FadeInUp.springify().damping(15)} style={styles.resultContent}>
            <View style={[styles.successCircle, { backgroundColor: colors.error[500] }]}>
              <Ionicons name="close" size={wp(48)} color="#FFFFFF" />
            </View>
            <Text style={styles.resultTitle}>Échec de validation</Text>
            <Text style={styles.resultDesc}>Le QR code est invalide, expiré ou déjà utilisé.</Text>
            <MButton title="Réessayer" onPress={resetScanner} style={{ marginTop: spacing[6] }} />
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const CORNER = wp(24);
const FRAME = wp(240);
const cornerBase: any = {
  position: 'absolute',
  width: CORNER,
  height: CORNER,
  borderColor: colors.orange[400],
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  permTitle: { ...textStyles.h3, color: colors.neutral[900], marginTop: spacing[4], marginBottom: spacing[2] },
  permDesc: { ...textStyles.body, color: colors.neutral[500], textAlign: 'center', marginBottom: spacing[5] },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  overlayTop: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: spacing[4] },
  storeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    marginTop: spacing[2],
    marginBottom: spacing[3],
  },
  storeIndicatorText: {
    ...textStyles.micro,
    color: '#FFFFFF',
    fontFamily: fontFamily.medium,
    marginLeft: spacing[1],
    maxWidth: wp(180),
  },
  scanFrame: { width: FRAME, height: FRAME, alignSelf: 'center' },
  cornerTL: { ...cornerBase, top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
  cornerTR: { ...cornerBase, top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
  cornerBL: { ...cornerBase, bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
  cornerBR: { ...cornerBase, bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
  overlayBottom: { backgroundColor: 'rgba(0,0,0,0.5)', padding: spacing[6], alignItems: 'center' },
  scanHint: { ...textStyles.body, color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
  formContainer: { flex: 1, backgroundColor: colors.neutral[50] },
  formContent: { padding: spacing[4] },
  tokenCard: { marginBottom: spacing[4] },
  tokenRow: { flexDirection: 'row', alignItems: 'center' },
  tokenIcon: {
    width: wp(44), height: wp(44), borderRadius: borderRadius.lg,
    backgroundColor: colors.violet[50], alignItems: 'center', justifyContent: 'center', marginRight: spacing[3],
  },
  tokenLabel: { ...textStyles.micro, color: colors.neutral[400], textTransform: 'uppercase', letterSpacing: 0.5 },
  tokenValue: { ...textStyles.body, fontFamily: fontFamily.medium, color: colors.neutral[900], marginTop: spacing[1] },
  resultContainer: {
    flex: 1, backgroundColor: colors.neutral[50], alignItems: 'center', justifyContent: 'center', padding: spacing[6],
  },
  resultContent: { alignItems: 'center', width: '100%' },
  successCircle: {
    width: wp(96), height: wp(96), borderRadius: wp(48),
    backgroundColor: colors.success[500], alignItems: 'center', justifyContent: 'center', marginBottom: spacing[5],
  },
  resultTitle: { ...textStyles.h2, color: colors.neutral[900], textAlign: 'center' },
  resultDesc: { ...textStyles.body, color: colors.neutral[500], textAlign: 'center', marginTop: spacing[2] },
});
