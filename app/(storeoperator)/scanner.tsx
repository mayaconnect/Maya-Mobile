/**
 * Maya Connect V2 — Store Operator QR Scanner Screen
 *
 * Redesigned with:
 * - Real-time discount preview (via API debounce 500ms)
 * - Subscription plan displayed prominently after scan
 * - Persons count as secondary compact stepper
 * - Live discount + net amount calculation
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { qrApi } from '../../src/api/qr.api';
import { storeOperatorsApi } from '../../src/api/store-operators.api';
import { useAuthStore } from '../../src/stores/auth.store';
import { usePartnerStore } from '../../src/stores/partner.store';
import { operatorColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import { formatPrice, formatPlanLabel } from '../../src/utils/format';
import { MButton, MInput, MCard, MHeader } from '../../src/components/ui';
import StoreSelectionModal from '../../src/components/partner/StoreSelectionModal';
import { useAppAlert } from '../../src/hooks/use-app-alert';
import type { QrValidateResultDto, QrPreviewDiscountResultDto } from '../../src/types';

const PLAN_THEME: Record<string, { bg: string; text: string; icon: string }> = {
  SOLO:   { bg: '#EDE9FE', text: '#7C3AED', icon: 'person' },
  DUO:    { bg: '#DBEAFE', text: '#2563EB', icon: 'people' },
  FAMILY: { bg: '#FEF3C7', text: '#D97706', icon: 'home' },
  VIP:    { bg: '#FEE2E2', text: '#DC2626', icon: 'diamond' },
};

type ScanState = 'scanning' | 'form' | 'success' | 'error';

export default function StoreOperatorScannerScreen() {
  const insets = useSafeAreaInsets();
  const { alert, AlertModal } = useAppAlert();
  const user = useAuthStore((s) => s.user);
  const activeStore = usePartnerStore((s) => s.activeStore);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [scannedToken, setScannedToken] = useState('');
  const [validateResult, setValidateResult] = useState<QrValidateResultDto | null>(null);
  const [preview, setPreview] = useState<QrPreviewDiscountResultDto | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const scannedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Watch amount for real-time preview
  const watchedAmount = useWatch({ control, name: 'amountGross' });

  /* ---- Resolve partner & store IDs ---- */
  const resolveIds = useCallback(() => {
    const store = activeStoreQ.data;
    const storeIdVal = store?.storeId ?? activeStore?.storeId ?? '';
    const partner = usePartnerStore.getState().partner;
    const stores = usePartnerStore.getState().stores;
    const matchedStore = stores.find((s) => s.id === storeIdVal);
    const partnerIdVal = partner?.id ?? matchedStore?.partnerId ?? '';
    return { storeIdVal, partnerIdVal };
  }, [activeStoreQ.data, activeStore]);

  /* ---- Real-time discount preview (debounced 500ms) ---- */
  useEffect(() => {
    if (scanState !== 'form' || !scannedToken) return;

    const amount = parseFloat(watchedAmount);
    if (isNaN(amount) || amount <= 0) {
      setPreview(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const { storeIdVal, partnerIdVal } = resolveIds();
      if (!partnerIdVal) return;

      setPreviewLoading(true);
      try {
        const res = await qrApi.previewDiscount({
          qrToken: scannedToken,
          partnerId: partnerIdVal,
          storeId: storeIdVal || undefined,
          amountGross: amount,
        });
        setPreview(res.data);
      } catch {
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [watchedAmount, scanState, scannedToken, resolveIds]);

  /* ---- Validate mutation ---- */
  const validateMutation = useMutation({
    mutationFn: (dto: any) => qrApi.validate(dto),
    onSuccess: (response) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setValidateResult(response.data);
      setScanState('success');
    },
    onError: (err: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setScanState('error');
      alert(
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
      alert('Erreur', 'Veuillez saisir un montant valide.');
      return;
    }

    const { storeIdVal, partnerIdVal } = resolveIds();

    if (!partnerIdVal) {
      alert('Erreur', "Impossible de déterminer le partenaire. Veuillez sélectionner un magasin.");
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
    setValidateResult(null);
    setPreview(null);
    setPreviewLoading(false);
    reset();
    setScanState('scanning');
  };

  /* ---- Auto-reset when screen regains focus ---- */
  useFocusEffect(
    useCallback(() => {
      // Always reset to camera mode when navigating back to scanner tab
      resetScanner();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

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

              {/* ── Plan badge (prominent) ── */}
              {preview && (() => {
                const pt = PLAN_THEME[preview.planCode?.toUpperCase()] ?? PLAN_THEME.SOLO;
                return (
                  <Animated.View entering={FadeIn.duration(300)}>
                    <MCard style={[styles.planCard, { backgroundColor: pt.bg }]} elevation="sm">
                      <View style={styles.planRow}>
                        <View style={[styles.planIconWrap, { backgroundColor: pt.text + '20' }]}>
                          <Ionicons name={pt.icon as any} size={wp(22)} color={pt.text} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.planTitle, { color: pt.text }]}>
                            {preview.planName || formatPlanLabel(preview.planCode)}
                          </Text>
                          <Text style={[styles.planSub, { color: pt.text + 'AA' }]}>
                            {preview.personsAllowed} pers. autorisées · {preview.discountPercent}% de réduction
                          </Text>
                        </View>
                      </View>
                    </MCard>
                  </Animated.View>
                );
              })()}

              {/* ── Amount input (primary) ── */}
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

              {/* ── Real-time discount preview ── */}
              {(preview || previewLoading) && (
                <Animated.View entering={FadeIn.duration(200)}>
                  <MCard style={styles.previewCard} elevation="sm">
                    {previewLoading ? (
                      <View style={styles.previewLoading}>
                        <ActivityIndicator size="small" color={colors.violet[500]} />
                        <Text style={styles.previewLoadingText}>Calcul en cours…</Text>
                      </View>
                    ) : preview ? (
                      <>
                        <View style={styles.previewRow}>
                          <Text style={styles.previewLabel}>Réduction ({preview.discountPercent}%)</Text>
                          <Text style={[styles.previewValue, { color: colors.success[600] }]}>
                            -{formatPrice(preview.discountAmount)}
                          </Text>
                        </View>
                        <View style={styles.previewDivider} />
                        <View style={styles.previewRow}>
                          <Text style={[styles.previewLabel, { fontFamily: fontFamily.bold }]}>Net à payer</Text>
                          <Text style={[styles.previewValueBig, { color: colors.neutral[900] }]}>
                            {formatPrice(preview.amountNet)}
                          </Text>
                        </View>
                      </>
                    ) : null}
                  </MCard>
                </Animated.View>
              )}

              {/* ── Persons count (secondary compact stepper) ── */}
              <View style={styles.personsRow}>
                <View style={styles.personsLabelWrap}>
                  <Ionicons name="people-outline" size={wp(16)} color={colors.neutral[400]} />
                  <Text style={styles.personsLabel}>Nombre de personnes</Text>
                </View>
                <Controller
                  control={control}
                  name="personsCount"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.personsInput}>
                      <TouchableOpacity
                        style={styles.personsBtn}
                        onPress={() => {
                          const n = Math.max(1, parseInt(value, 10) - 1);
                          onChange(String(n));
                        }}
                      >
                        <Ionicons name="remove" size={wp(18)} color={colors.neutral[600]} />
                      </TouchableOpacity>
                      <Text style={styles.personsValue}>{value}</Text>
                      <TouchableOpacity
                        style={styles.personsBtn}
                        onPress={() => {
                          const max = preview?.personsAllowed ?? 10;
                          const n = Math.min(max, parseInt(value, 10) + 1);
                          onChange(String(n));
                        }}
                      >
                        <Ionicons name="add" size={wp(18)} color={colors.neutral[600]} />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              </View>

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

            {validateResult && (
              <MCard style={styles.resultDetailsCard} elevation="md">
                {/* Plan — prominent badge */}
                <View style={styles.resultPlanRow}>
                  <View style={[
                    styles.resultPlanBadge,
                    { backgroundColor: (PLAN_THEME[validateResult.planCode?.toUpperCase()]?.bg ?? '#EDE9FE') }
                  ]}>
                    <Ionicons
                      name={(PLAN_THEME[validateResult.planCode?.toUpperCase()]?.icon ?? 'person') as any}
                      size={wp(16)}
                      color={PLAN_THEME[validateResult.planCode?.toUpperCase()]?.text ?? '#7C3AED'}
                    />
                    <Text style={[
                      styles.resultPlanText,
                      { color: PLAN_THEME[validateResult.planCode?.toUpperCase()]?.text ?? '#7C3AED' }
                    ]}>
                      {formatPlanLabel(validateResult.planCode)}
                    </Text>
                  </View>
                </View>
                <View style={styles.resultDivider} />
                <View style={styles.resultDetailRow}>
                  <Ionicons name="trending-down-outline" size={wp(18)} color={colors.success[500]} />
                  <Text style={styles.resultDetailLabel}>Réduction</Text>
                  <Text style={[styles.resultDetailValue, { color: colors.success[600] }]}>
                    -{formatPrice(validateResult.discountAmount)} ({validateResult.discountPercent}%)
                  </Text>
                </View>
                <View style={styles.resultDivider} />
                <View style={styles.resultDetailRow}>
                  <Ionicons name="cash-outline" size={wp(18)} color={colors.orange[500]} />
                  <Text style={styles.resultDetailLabel}>Net à payer</Text>
                  <Text style={[styles.resultDetailValue, { fontFamily: fontFamily.bold, fontSize: wp(18) }]}>
                    {formatPrice(validateResult.amountNet)}
                  </Text>
                </View>
              </MCard>
            )}

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
      <AlertModal />
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
  tokenCard: { marginBottom: spacing[3] },
  tokenRow: { flexDirection: 'row', alignItems: 'center' },
  tokenIcon: {
    width: wp(44), height: wp(44), borderRadius: borderRadius.lg,
    backgroundColor: colors.violet[50], alignItems: 'center', justifyContent: 'center', marginRight: spacing[3],
  },
  tokenLabel: { ...textStyles.micro, color: colors.neutral[400], textTransform: 'uppercase', letterSpacing: 0.5 },
  tokenValue: { ...textStyles.body, fontFamily: fontFamily.medium, color: colors.neutral[900], marginTop: spacing[1] },
  // Plan card (prominent after scan)
  planCard: { marginBottom: spacing[3], padding: spacing[3] },
  planRow: { flexDirection: 'row', alignItems: 'center' },
  planIconWrap: {
    width: wp(44), height: wp(44), borderRadius: borderRadius.lg,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing[3],
  },
  planTitle: { ...textStyles.h4, fontFamily: fontFamily.bold },
  planSub: { ...textStyles.caption, marginTop: 2 },
  // Preview card (live discount calculation)
  previewCard: { marginTop: spacing[2], marginBottom: spacing[2], padding: spacing[3], backgroundColor: '#F0FDF4' },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing[1] },
  previewLabel: { ...textStyles.body, color: colors.neutral[600] },
  previewValue: { ...textStyles.body, fontFamily: fontFamily.semiBold },
  previewValueBig: { fontSize: wp(20), fontFamily: fontFamily.bold },
  previewDivider: { height: 1, backgroundColor: '#D1FAE5', marginVertical: spacing[1] },
  previewLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing[2] },
  previewLoadingText: { ...textStyles.caption, color: colors.neutral[500], marginLeft: spacing[2] },
  // Persons row (secondary compact stepper)
  personsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing[3], paddingHorizontal: spacing[2], marginTop: spacing[1],
    backgroundColor: colors.neutral[50], borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.neutral[100],
  },
  personsLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  personsLabel: { ...textStyles.caption, color: colors.neutral[500] },
  personsInput: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  personsBtn: {
    width: wp(32), height: wp(32), borderRadius: wp(16),
    backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center',
  },
  personsValue: { ...textStyles.body, fontFamily: fontFamily.bold, color: colors.neutral[900], minWidth: wp(24), textAlign: 'center' },
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
  resultDetailsCard: { width: '100%', marginTop: spacing[5], padding: spacing[4] },
  resultDetailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing[2] },
  resultDetailLabel: { ...textStyles.body, color: colors.neutral[500], flex: 1, marginLeft: spacing[2] },
  resultDetailValue: { ...textStyles.body, fontFamily: fontFamily.medium, color: colors.neutral[900] },
  resultDivider: { height: 1, backgroundColor: colors.neutral[100], marginVertical: spacing[1] },
  resultPlanRow: { alignItems: 'center', paddingVertical: spacing[2] },
  resultPlanBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing[4], paddingVertical: spacing[2],
    borderRadius: borderRadius.full, gap: spacing[2],
  },
  resultPlanText: { fontFamily: fontFamily.bold, fontSize: wp(14) },
});
