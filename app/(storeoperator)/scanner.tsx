/**
 * Maya Connect V2 — Store Operator QR Scanner Screen
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
  TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
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
import { MButton, MCard, MHeader } from '../../src/components/ui';
import { useAppAlert } from '../../src/hooks/use-app-alert';
import type { QrValidateResultDto, QrPreviewDiscountResultDto } from '../../src/types';

const PLAN_THEME: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  SOLO:   { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE', icon: 'person' },
  DUO:    { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE', icon: 'people' },
  FAMILY: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', icon: 'home' },
  VIP:    { bg: '#FFF1F2', text: '#E11D48', border: '#FECDD3', icon: 'diamond' },
};

type ScanState = 'scanning' | 'form' | 'success' | 'error';

export default function StoreOperatorScannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { alert, AlertModal } = useAppAlert();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const activeStore = usePartnerStore((s) => s.activeStore);
  const partner = usePartnerStore((s) => s.partner);
  const stores = usePartnerStore((s) => s.stores);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [scannedToken, setScannedToken] = useState('');
  const [validateResult, setValidateResult] = useState<QrValidateResultDto | null>(null);
  const [preview, setPreview] = useState<QrPreviewDiscountResultDto | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [planInfo, setPlanInfo] = useState<QrPreviewDiscountResultDto | null>(null);
  const [planInfoLoading, setPlanInfoLoading] = useState(false);
  const scannedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeStoreQ = useQuery({
    queryKey: ['activeStore'],
    queryFn: () => storeOperatorsApi.getActiveStore(),
    select: (res) => res.data,
  });

  const hasActiveStore = !!(activeStoreQ.data?.storeId || activeStore?.storeId);

  const { control, handleSubmit, reset } = useForm<{
    amountGross: string; personsCount: string;
  }>({ defaultValues: { amountGross: '', personsCount: '1' } });

  const watchedAmount = useWatch({ control, name: 'amountGross' });

  const resolveIds = useCallback(() => {
    const opStores = user?.partnerData?.operatorStores ?? [];
    const storeIdVal =
      activeStoreQ.data?.storeId ??
      activeStore?.storeId ??
      opStores[0]?.id ?? '';
    const matchedStore = stores.find((s) => s.id === storeIdVal);
    const partnerIdVal =
      partner?.id ??
      matchedStore?.partnerId ??
      opStores.find((s) => s.id === storeIdVal)?.partnerId ??
      opStores.find((s) => s.id === storeIdVal)?.partner?.id ??
      opStores[0]?.partnerId ??
      opStores[0]?.partner?.id ?? '';
    return { storeIdVal, partnerIdVal };
  }, [activeStoreQ.data, activeStore, partner, stores, user]);

  /* ---- Debounced discount preview ---- */
  useEffect(() => {
    if (scanState !== 'form' || !scannedToken) return;
    const amount = parseFloat(watchedAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) { setPreview(null); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const { storeIdVal, partnerIdVal } = resolveIds();
      if (!partnerIdVal) return;
      setPreviewLoading(true);
      try {
        const res = await qrApi.previewDiscount({
          qrToken: scannedToken, partnerId: partnerIdVal,
          storeId: storeIdVal || null, amountGross: amount,
        } as any);
        setPreview(res.data);
      } catch { setPreview(null); }
      finally { setPreviewLoading(false); }
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [watchedAmount, scanState, scannedToken, resolveIds]);

  const validateMutation = useMutation({
    mutationFn: (dto: any) => qrApi.validate(dto),
    onSuccess: (response) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setValidateResult(response.data);
      setScanState('success');
      // Invalide le cache des transactions (historique + dashboard)
      queryClient.invalidateQueries({ queryKey: ['operatorTxHistory'] });
      queryClient.invalidateQueries({ queryKey: ['storeRecentTx'] });
      queryClient.invalidateQueries({ queryKey: ['storeKpiTx'] });
      queryClient.invalidateQueries({ queryKey: ['storeScanCount'] });
    },
    onError: (err: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setScanState('error');
      alert('Erreur de validation', err?.response?.data?.detail ?? 'Le QR code est invalide ou expiré.');
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
    const amount = parseFloat(values.amountGross.replace(',', '.'));
    const persons = parseInt(values.personsCount, 10) || 1;
    if (isNaN(amount) || amount <= 0) { alert('Erreur', 'Veuillez saisir un montant valide.'); return; }
    if (preview?.personsAllowed && persons > preview.personsAllowed) {
      alert('Limite atteinte', `Abonnement limité à ${preview.personsAllowed} personne${preview.personsAllowed > 1 ? 's' : ''}.`);
      return;
    }
    const { storeIdVal, partnerIdVal } = resolveIds();
    if (!partnerIdVal) { alert('Erreur', 'Impossible de déterminer le partenaire.'); return; }
    validateMutation.mutate({
      partnerId: partnerIdVal, storeId: storeIdVal,
      operatorUserId: user?.id ?? '', qrToken: scannedToken,
      amountGross: amount, personsCount: persons,
    });
  };

  /* ---- Plan info immédiat après scan ---- */
  useEffect(() => {
    if (scanState !== 'form' || !scannedToken) return;
    const { storeIdVal, partnerIdVal } = resolveIds();

    console.log('[PLAN_INFO] === Démarrage ===');
    console.log('[PLAN_INFO] partnerIdVal:', partnerIdVal);
    console.log('[PLAN_INFO] storeIdVal:', storeIdVal);
    console.log('[PLAN_INFO] qrToken:', scannedToken);
    console.log('[PLAN_INFO] payload:', JSON.stringify({
      qrToken: scannedToken,
      partnerId: partnerIdVal,
      storeId: storeIdVal || null,
      amountGross: 0,
    }));

    if (!partnerIdVal) {
      console.warn('[PLAN_INFO] ❌ partnerIdVal vide — appel annulé');
      return;
    }

    setPlanInfoLoading(true);
    qrApi.previewDiscount({
      qrToken: scannedToken,
      partnerId: partnerIdVal,
      storeId: storeIdVal || null,
      amountGross: 0,
    } as any)
      .then((res) => {
        console.log('[PLAN_INFO] ✅ Succès:', JSON.stringify(res.data));
        setPlanInfo(res.data);
      })
      .catch((err: any) => {
        console.warn('[PLAN_INFO] ❌ Erreur HTTP:', err?.response?.status);
        console.warn('[PLAN_INFO] ❌ Body:', JSON.stringify(err?.response?.data));
        console.warn('[PLAN_INFO] ❌ Message:', err?.message);
        setPlanInfo(null);
      })
      .finally(() => setPlanInfoLoading(false));
  }, [scanState, scannedToken, resolveIds]);

  const resetScanner = () => {
    scannedRef.current = false;
    setScannedToken(''); setValidateResult(null);
    setPreview(null); setPreviewLoading(false);
    setPlanInfo(null); setPlanInfoLoading(false);
    reset(); setScanState('scanning');
  };

  useFocusEffect(useCallback(() => { resetScanner(); }, []));

  /* ── Guards ── */
  if (!hasActiveStore && !activeStoreQ.isLoading) {
    return (
      <View style={styles.guardContainer}>
        <View style={styles.guardIconWrap}>
          <Ionicons name="storefront-outline" size={wp(36)} color={colors.neutral[300]} />
        </View>
        <Text style={styles.guardTitle}>Aucun magasin actif</Text>
        <Text style={styles.guardDesc}>Sélectionnez un magasin pour commencer à scanner.</Text>
        <MButton title="Choisir un magasin" onPress={() => router.push('/(storeoperator)/my-stores')} />
      </View>
    );
  }

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.guardContainer}>
        <View style={styles.guardIconWrap}>
          <Ionicons name="camera-outline" size={wp(36)} color={colors.neutral[300]} />
        </View>
        <Text style={styles.guardTitle}>Caméra requise</Text>
        <Text style={styles.guardDesc}>Autorisez l'accès à la caméra pour scanner les QR codes clients.</Text>
        <MButton title="Autoriser la caméra" onPress={requestPermission} />
      </View>
    );
  }

  /* ── Scanning ── */
  if (scanState === 'scanning') {
    return (
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onBarcodeScanned}
        />
        <View style={styles.overlay}>
          <View style={[styles.overlayTop, { paddingTop: insets.top }]}>
            <MHeader title="Scanner un QR" transparent />
            <View style={styles.storeIndicator}>
              <Ionicons name="storefront" size={wp(13)} color="#FFFFFF" />
              <Text style={styles.storeIndicatorText} numberOfLines={1}>
                {(activeStoreQ.data as any)?.storeName ?? 'Magasin actif'}
              </Text>
            </View>
          </View>
          <View style={styles.frameWrap}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cTL]} />
              <View style={[styles.corner, styles.cTR]} />
              <View style={[styles.corner, styles.cBL]} />
              <View style={[styles.corner, styles.cBR]} />
            </View>
          </View>
          <View style={[styles.overlayBottom, { paddingBottom: insets.bottom + spacing[6] }]}>
            <Text style={styles.scanHint}>Placez le QR code du client dans le cadre</Text>
          </View>
        </View>
      </View>
    );
  }

  /* ── Form ── */
  if (scanState === 'form') {
    return (
      <View style={[styles.container, { backgroundColor: colors.neutral[50] }]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={[styles.formScroll, { paddingTop: insets.top + spacing[2] }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.formHeader}>
              <TouchableOpacity style={styles.backBtn} onPress={resetScanner} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={wp(20)} color={colors.neutral[700]} />
              </TouchableOpacity>
              <Text style={styles.formTitle}>Validation</Text>
              <View style={styles.scannedBadge}>
                <Ionicons name="checkmark-circle" size={wp(13)} color={colors.success[500]} />
                <Text style={styles.scannedBadgeText}>QR Scanné</Text>
              </View>
            </View>

            <Animated.View entering={FadeInUp.duration(350)} style={styles.formBody}>

              {/* Token card */}
              <View style={styles.tokenCard}>
                <View style={styles.tokenIconWrap}>
                  <Ionicons name="qr-code" size={wp(20)} color={colors.violet[500]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tokenLabel}>Token QR vérifié</Text>
                  <Text style={styles.tokenValue} numberOfLines={1}>{scannedToken.slice(0, 22)}…</Text>
                </View>
                <View style={styles.tokenCheck}>
                  <Ionicons name="checkmark" size={wp(13)} color={colors.success[600]} />
                </View>
              </View>

              {/* ── Plan info ── */}
              {planInfoLoading && (
                <View style={styles.planInfoLoading}>
                  <ActivityIndicator size="small" color={colors.violet[500]} />
                  <Text style={styles.planInfoLoadingText}>Vérification abonnement…</Text>
                </View>
              )}
              {planInfo && (() => {
                const pt = PLAN_THEME[planInfo.planCode?.toUpperCase()] ?? PLAN_THEME.SOLO;
                return (
                  <Animated.View entering={FadeIn.duration(300)}>
                    <View style={[styles.planInfoCard, { backgroundColor: pt.bg, borderColor: pt.border }]}>
                      <View style={styles.planInfoRow}>
                        <View style={[styles.planInfoIcon, { backgroundColor: pt.text + '18' }]}>
                          <Ionicons name={pt.icon as any} size={wp(20)} color={pt.text} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.planInfoLabel, { color: pt.text + 'AA' }]}>Abonnement</Text>
                          <Text style={[styles.planInfoName, { color: pt.text }]}>
                            {planInfo.planName || formatPlanLabel(planInfo.planCode)}
                          </Text>
                        </View>
                        <View style={[styles.planCodeBadge, { backgroundColor: pt.text + '15', borderColor: pt.border }]}>
                          <Text style={[styles.planCodeText, { color: pt.text }]}>{planInfo.planCode}</Text>
                        </View>
                      </View>
                      <View style={[styles.planInfoStats, { borderTopColor: pt.text + '20' }]}>
                        <View style={styles.planInfoStat}>
                          <Text style={[styles.planInfoStatValue, { color: pt.text }]}>{planInfo.discountPercent}%</Text>
                          <Text style={[styles.planInfoStatLabel, { color: pt.text + '99' }]}>Réduction</Text>
                        </View>
                        <View style={[styles.planInfoStatDiv, { backgroundColor: pt.text + '25' }]} />
                        <View style={styles.planInfoStat}>
                          <Text style={[styles.planInfoStatValue, { color: pt.text }]}>{planInfo.personsAllowed}</Text>
                          <Text style={[styles.planInfoStatLabel, { color: pt.text + '99' }]}>
                            {planInfo.personsAllowed > 1 ? 'Pers. max' : 'Personne'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                );
              })()}

              {/* Amount input */}
              <View style={styles.amountCard}>
                <Text style={styles.amountCardLabel}>Montant brut</Text>
                <Controller
                  control={control}
                  name="amountGross"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.amountInputRow}>
                      <Ionicons name="cash-outline" size={wp(18)} color={colors.orange[400]} />
                      <TextInput
                        style={styles.amountInput}
                        placeholder="0.00"
                        placeholderTextColor={colors.neutral[300]}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="decimal-pad"
                        autoFocus
                      />
                      <Text style={styles.amountUnit}>€</Text>
                    </View>
                  )}
                />
              </View>

              {/* Discount preview */}
              {(preview || previewLoading) && (
                <Animated.View entering={FadeIn.duration(200)}>
                  <View style={styles.previewCard}>
                    {previewLoading ? (
                      <View style={styles.previewLoading}>
                        <ActivityIndicator size="small" color={colors.orange[500]} />
                        <Text style={styles.previewLoadingText}>Calcul de la réduction…</Text>
                      </View>
                    ) : preview ? (
                      <>
                        {/* Plan badge */}
                        {preview.planCode && (() => {
                          const pt = PLAN_THEME[preview.planCode.toUpperCase()] ?? PLAN_THEME.SOLO;
                          return (
                            <View style={[styles.planBadge, { backgroundColor: pt.bg, borderColor: pt.border }]}>
                              <Ionicons name={pt.icon as any} size={wp(13)} color={pt.text} />
                              <Text style={[styles.planBadgeText, { color: pt.text }]}>
                                {preview.planName || formatPlanLabel(preview.planCode)}
                              </Text>
                              <View style={[styles.discountChip, { backgroundColor: pt.text }]}>
                                <Text style={styles.discountChipText}>-{preview.discountPercent}%</Text>
                              </View>
                            </View>
                          );
                        })()}
                        <View style={styles.previewDivider} />
                        <View style={styles.previewRow}>
                          <Text style={styles.previewLabel}>Réduction</Text>
                          <Text style={[styles.previewValue, { color: colors.success[600] }]}>
                            -{formatPrice(preview.discountAmount)}
                          </Text>
                        </View>
                        <View style={styles.previewRow}>
                          <Text style={[styles.previewLabel, { fontFamily: fontFamily.semiBold, color: colors.neutral[800] }]}>
                            Net à payer
                          </Text>
                          <Text style={styles.previewNet}>{formatPrice(preview.amountNet)}</Text>
                        </View>
                      </>
                    ) : null}
                  </View>
                </Animated.View>
              )}

              {/* Persons stepper */}
              <View style={styles.personsCard}>
                <View style={styles.personsLeft}>
                  <Ionicons name="people-outline" size={wp(16)} color={colors.neutral[400]} />
                  <View>
                    <Text style={styles.personsTitle}>Nombre de personnes</Text>
                    {preview?.personsAllowed && (
                      <Text style={styles.personsHint}>Max {preview.personsAllowed} avec cet abonnement</Text>
                    )}
                  </View>
                </View>
                <Controller
                  control={control}
                  name="personsCount"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => onChange(String(Math.max(1, parseInt(value, 10) - 1)))}
                      >
                        <Ionicons name="remove" size={wp(16)} color={colors.neutral[600]} />
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>{value}</Text>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => onChange(String(Math.min(preview?.personsAllowed ?? 10, parseInt(value, 10) + 1)))}
                      >
                        <Ionicons name="add" size={wp(16)} color={colors.neutral[600]} />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, validateMutation.isPending && { opacity: 0.6 }]}
                onPress={handleSubmit(onSubmit)}
                disabled={validateMutation.isPending}
                activeOpacity={0.85}
              >
                {validateMutation.isPending
                  ? <ActivityIndicator color="#FFFFFF" size="small" />
                  : <>
                      <Ionicons name="checkmark-circle-outline" size={wp(18)} color="#FFFFFF" />
                      <Text style={styles.submitBtnText}>Valider la transaction</Text>
                    </>
                }
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={resetScanner} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
        <AlertModal />
      </View>
    );
  }

  /* ── Success ── */
  if (scanState === 'success') {
    const planKey = (validateResult?.planCode ?? '').toUpperCase();
    const pt = PLAN_THEME[planKey] ?? PLAN_THEME.SOLO;
    return (
      <View style={[styles.resultContainer, { paddingTop: insets.top }]}>
        <Animated.View entering={FadeInUp.springify().damping(15)} style={styles.resultContent}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={wp(44)} color="#FFFFFF" />
          </View>
          <Text style={styles.resultTitle}>Transaction validée !</Text>
          <Text style={styles.resultDesc}>La réduction a été appliquée avec succès.</Text>

          {validateResult && (
            <View style={styles.resultCard}>
              {/* Plan */}
              <View style={[styles.resultPlanRow, { backgroundColor: pt.bg, borderColor: pt.border }]}>
                <View style={[styles.resultPlanIcon, { backgroundColor: pt.text + '18' }]}>
                  <Ionicons name={pt.icon as any} size={wp(18)} color={pt.text} />
                </View>
                <Text style={[styles.resultPlanName, { color: pt.text }]}>
                  {formatPlanLabel(validateResult.planCode)}
                </Text>
                <View style={[styles.discountChip, { backgroundColor: pt.text }]}>
                  <Text style={styles.discountChipText}>-{validateResult.discountPercent}%</Text>
                </View>
              </View>

              <View style={styles.resultSep} />

              <View style={styles.resultRow}>
                <Ionicons name="trending-down-outline" size={wp(16)} color={colors.success[500]} />
                <Text style={styles.resultRowLabel}>Réduction</Text>
                <Text style={[styles.resultRowValue, { color: colors.success[600] }]}>
                  -{formatPrice(validateResult.discountAmount)}
                </Text>
              </View>
              <View style={styles.resultSep} />
              <View style={styles.resultRow}>
                <Ionicons name="cash-outline" size={wp(16)} color={colors.orange[500]} />
                <Text style={styles.resultRowLabel}>Net à payer</Text>
                <Text style={[styles.resultRowValue, { fontFamily: fontFamily.bold, fontSize: wp(18), color: colors.neutral[900] }]}>
                  {formatPrice(validateResult.amountNet)}
                </Text>
              </View>
            </View>
          )}

          <MButton title="Scanner un autre QR" onPress={resetScanner} style={{ marginTop: spacing[5] }} />
        </Animated.View>
        <AlertModal />
      </View>
    );
  }

  /* ── Error ── */
  return (
    <View style={[styles.resultContainer, { paddingTop: insets.top }]}>
      <Animated.View entering={FadeInUp.springify().damping(15)} style={styles.resultContent}>
        <View style={[styles.successCircle, { backgroundColor: colors.error[500] }]}>
          <Ionicons name="close" size={wp(44)} color="#FFFFFF" />
        </View>
        <Text style={styles.resultTitle}>Échec de validation</Text>
        <Text style={styles.resultDesc}>Le QR code est invalide, expiré ou déjà utilisé.</Text>
        <MButton title="Réessayer" onPress={resetScanner} style={{ marginTop: spacing[5] }} />
      </Animated.View>
      <AlertModal />
    </View>
  );
}

const FRAME = wp(230);
const CORNER = wp(22);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  /* Guards */
  guardContainer: {
    flex: 1, backgroundColor: colors.neutral[50],
    alignItems: 'center', justifyContent: 'center', padding: spacing[6],
  },
  guardIconWrap: {
    width: wp(80), height: wp(80), borderRadius: wp(40),
    backgroundColor: colors.neutral[100],
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing[4],
  },
  guardTitle: { ...textStyles.h3, color: colors.neutral[900], marginBottom: spacing[2] },
  guardDesc: { ...textStyles.body, color: colors.neutral[500], textAlign: 'center', marginBottom: spacing[5] },

  /* Camera */
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  overlayTop: { backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: spacing[4], paddingBottom: spacing[3] },
  storeIndicator: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing[3], paddingVertical: spacing[1],
    borderRadius: borderRadius.full, gap: spacing[1],
    marginTop: spacing[1], marginBottom: spacing[2],
  },
  storeIndicatorText: { ...textStyles.micro, color: '#FFFFFF', fontFamily: fontFamily.medium, maxWidth: wp(180) },
  frameWrap: { alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: FRAME, height: FRAME },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.orange[400] },
  cTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 },
  cTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 },
  cBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 10 },
  cBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 10 },
  overlayBottom: { backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', paddingTop: spacing[5] },
  scanHint: { ...textStyles.body, color: 'rgba(255,255,255,0.9)' },

  /* Form */
  formScroll: { padding: spacing[4], paddingBottom: spacing[8] },
  formHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginBottom: spacing[4],
  },
  backBtn: {
    width: wp(36), height: wp(36), borderRadius: wp(18),
    backgroundColor: colors.neutral[100],
    alignItems: 'center', justifyContent: 'center',
  },
  formTitle: { flex: 1, fontSize: wp(20), fontFamily: fontFamily.bold, color: colors.neutral[900] },
  scannedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FDF4',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[2], paddingVertical: 4,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  scannedBadgeText: { fontSize: wp(10), fontFamily: fontFamily.semiBold, color: colors.success[600] },

  formBody: { gap: spacing[3] },

  /* Token card */
  tokenCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: colors.neutral[100],
    padding: spacing[3],
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tokenIconWrap: {
    width: wp(42), height: wp(42), borderRadius: borderRadius.lg,
    backgroundColor: colors.violet[50],
    alignItems: 'center', justifyContent: 'center',
  },
  tokenLabel: { fontSize: wp(9), fontFamily: fontFamily.semiBold, color: colors.neutral[400], textTransform: 'uppercase', letterSpacing: 0.5 },
  tokenValue: { fontSize: wp(13), fontFamily: fontFamily.medium, color: colors.neutral[700], marginTop: 2 },
  tokenCheck: {
    width: wp(28), height: wp(28), borderRadius: wp(14),
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
  },

  /* Plan info */
  planInfoLoading: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2],
    backgroundColor: '#FFFFFF', borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: colors.neutral[100],
    padding: spacing[3],
  },
  planInfoLoadingText: { ...textStyles.caption, color: colors.neutral[400] },
  planInfoCard: {
    borderRadius: borderRadius.xl, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  planInfoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[3] },
  planInfoIcon: {
    width: wp(44), height: wp(44), borderRadius: borderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  planInfoLabel: { fontSize: wp(9), fontFamily: fontFamily.semiBold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  planInfoName: { fontSize: wp(15), fontFamily: fontFamily.bold },
  planCodeBadge: {
    paddingHorizontal: spacing[2], paddingVertical: 4,
    borderRadius: borderRadius.md, borderWidth: 1,
  },
  planCodeText: { fontSize: wp(10), fontFamily: fontFamily.bold, letterSpacing: 0.5 },
  planInfoStats: {
    flexDirection: 'row', borderTopWidth: 1,
  },
  planInfoStat: { flex: 1, alignItems: 'center', paddingVertical: spacing[3] },
  planInfoStatDiv: { width: 1, marginVertical: spacing[2] },
  planInfoStatValue: { fontSize: wp(18), fontFamily: fontFamily.bold },
  planInfoStatLabel: { fontSize: wp(10), fontFamily: fontFamily.regular, marginTop: 2 },

  /* Amount */
  amountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    borderWidth: 1.5, borderColor: colors.orange[200],
    padding: spacing[4],
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  amountCardLabel: {
    fontSize: wp(10), fontFamily: fontFamily.semiBold,
    color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing[2],
  },
  amountInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  amountInput: {
    flex: 1, fontSize: wp(28), fontFamily: fontFamily.bold,
    color: colors.neutral[900], padding: 0,
  },
  amountUnit: { fontSize: wp(18), fontFamily: fontFamily.semiBold, color: colors.neutral[400] },

  /* Preview */
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: '#D1FAE5',
    padding: spacing[3],
    gap: spacing[1],
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  planBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    borderRadius: borderRadius.lg, borderWidth: 1,
    paddingHorizontal: spacing[3], paddingVertical: spacing[2],
    marginBottom: spacing[1],
  },
  planBadgeText: { flex: 1, fontSize: wp(13), fontFamily: fontFamily.semiBold },
  discountChip: {
    paddingHorizontal: spacing[2], paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  discountChipText: { fontSize: wp(10), fontFamily: fontFamily.bold, color: '#FFFFFF' },
  previewDivider: { height: 1, backgroundColor: '#D1FAE5', marginVertical: spacing[1] },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing[1] },
  previewLabel: { ...textStyles.body, color: colors.neutral[500] },
  previewValue: { ...textStyles.body, fontFamily: fontFamily.semiBold },
  previewNet: { fontSize: wp(20), fontFamily: fontFamily.bold, color: colors.neutral[900] },
  previewLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], padding: spacing[2] },
  previewLoadingText: { ...textStyles.caption, color: colors.neutral[500] },

  /* Persons */
  personsCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: colors.neutral[100],
    paddingVertical: spacing[3], paddingHorizontal: spacing[3],
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  personsLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  personsTitle: { ...textStyles.caption, fontFamily: fontFamily.medium, color: colors.neutral[700] },
  personsHint: { fontSize: wp(9), fontFamily: fontFamily.regular, color: colors.neutral[400], marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  stepperBtn: {
    width: wp(32), height: wp(32), borderRadius: wp(16),
    backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center',
  },
  stepperValue: { fontSize: wp(16), fontFamily: fontFamily.bold, color: colors.neutral[900], minWidth: wp(24), textAlign: 'center' },

  /* Buttons */
  submitBtn: {
    backgroundColor: colors.orange[500],
    borderRadius: borderRadius['2xl'],
    paddingVertical: spacing[4],
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2],
    shadowColor: colors.orange[500], shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitBtnText: { fontSize: wp(15), fontFamily: fontFamily.bold, color: '#FFFFFF' },
  cancelBtn: {
    alignItems: 'center', paddingVertical: spacing[3],
  },
  cancelBtnText: { fontSize: wp(14), fontFamily: fontFamily.medium, color: colors.neutral[400] },

  /* Result */
  resultContainer: {
    flex: 1, backgroundColor: colors.neutral[50],
    alignItems: 'center', justifyContent: 'center', padding: spacing[5],
  },
  resultContent: { alignItems: 'center', width: '100%' },
  successCircle: {
    width: wp(88), height: wp(88), borderRadius: wp(44),
    backgroundColor: colors.success[500], alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing[4],
    shadowColor: colors.success[500], shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  resultTitle: { ...textStyles.h2, color: colors.neutral[900], textAlign: 'center' },
  resultDesc: { ...textStyles.body, color: colors.neutral[500], textAlign: 'center', marginTop: spacing[2] },
  resultCard: {
    width: '100%', marginTop: spacing[5],
    backgroundColor: '#FFFFFF', borderRadius: borderRadius['2xl'],
    borderWidth: 1, borderColor: colors.neutral[100],
    padding: spacing[4], gap: spacing[2],
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  resultPlanRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    borderRadius: borderRadius.lg, borderWidth: 1,
    paddingHorizontal: spacing[3], paddingVertical: spacing[2],
  },
  resultPlanIcon: {
    width: wp(34), height: wp(34), borderRadius: borderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  resultPlanName: { flex: 1, fontSize: wp(14), fontFamily: fontFamily.bold },
  resultSep: { height: 1, backgroundColor: colors.neutral[100] },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  resultRowLabel: { flex: 1, ...textStyles.body, color: colors.neutral[500] },
  resultRowValue: { ...textStyles.body, fontFamily: fontFamily.semiBold, color: colors.neutral[800] },
});
