/**
 * Maya Connect V2 — Partner QR Scanner Screen (dark redesign)
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
import { useMutation, useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { qrApi } from '../../src/api/qr.api';
import { storeOperatorsApi } from '../../src/api/store-operators.api';
import { useAuthStore } from '../../src/stores/auth.store';
import { usePartnerStore } from '../../src/stores/partner.store';
import { fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import { formatPrice, formatPlanLabel } from '../../src/utils/format';
import { useAppAlert } from '../../src/hooks/use-app-alert';
import type { QrValidateResultDto, QrPreviewDiscountResultDto } from '../../src/types';

const PLAN_THEME: Record<string, { bg: string; accent: string; icon: string }> = {
  SOLO:   { bg: 'rgba(124,58,237,0.12)', accent: '#818CF8', icon: 'person' },
  DUO:    { bg: 'rgba(37,99,235,0.12)',  accent: '#60A5FA', icon: 'people' },
  FAMILY: { bg: 'rgba(217,119,6,0.12)',  accent: '#FBBF24', icon: 'home' },
  VIP:    { bg: 'rgba(220,38,38,0.12)',  accent: '#F87171', icon: 'diamond' },
};

type ScanState = 'scanning' | 'form' | 'success' | 'error';

export default function PartnerScannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { alert, AlertModal } = useAppAlert();
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

  const { control, handleSubmit, reset, formState: { errors } } = useForm<{
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

  useEffect(() => {
    if (scanState !== 'form' || !scannedToken) return;
    const amount = parseFloat(watchedAmount);
    if (isNaN(amount) || amount <= 0) { setPreview(null); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const { storeIdVal, partnerIdVal } = resolveIds();
      if (!partnerIdVal) return;
      setPreviewLoading(true);
      try {
        const res = await qrApi.previewDiscount({
          qrToken: scannedToken, partnerId: partnerIdVal,
          ...(storeIdVal ? { storeId: storeIdVal } : {}), amountGross: amount,
        } as any);
        setPreview(res.data);
      } catch { setPreview(null); }
      finally { setPreviewLoading(false); }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [watchedAmount, scanState, scannedToken, resolveIds]);

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
    const amount = parseFloat(values.amountGross);
    const persons = parseInt(values.personsCount, 10) || 1;
    if (isNaN(amount) || amount <= 0) { alert('Erreur', 'Veuillez saisir un montant valide.'); return; }
    if (preview?.personsAllowed && persons > preview.personsAllowed) {
      alert('Limite atteinte', `Abonnement limité à ${preview.personsAllowed} personne${preview.personsAllowed > 1 ? 's' : ''}.`);
      return;
    }
    const { storeIdVal, partnerIdVal } = resolveIds();
    if (!partnerIdVal) { alert('Erreur', "Impossible de déterminer le partenaire."); return; }
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
    setScannedToken(''); setValidateResult(null); setPreview(null); setPreviewLoading(false);
    setPlanInfo(null); setPlanInfoLoading(false);
    reset(); setScanState('scanning');
  };

  useFocusEffect(useCallback(() => { resetScanner(); }, []));

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.guardContainer}>
        <View style={styles.guardIconWrap}>
          <Ionicons name="camera-outline" size={wp(36)} color="rgba(255,255,255,0.4)" />
        </View>
        <Text style={styles.guardTitle}>Caméra requise</Text>
        <Text style={styles.guardDesc}>Autorisez l'accès à la caméra pour scanner les QR codes clients.</Text>
        <TouchableOpacity style={styles.guardBtn} onPress={requestPermission}>
          <LinearGradient colors={['#FF6A00', '#FF9F45']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.guardBtnInner}>
            <Text style={styles.guardBtnText}>Autoriser la caméra</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  if (!activeStoreQ.data?.storeId && !activeStoreQ.isLoading) {
    return (
      <View style={styles.guardContainer}>
        <View style={styles.guardIconWrap}>
          <Ionicons name="storefront-outline" size={wp(36)} color="rgba(255,255,255,0.4)" />
        </View>
        <Text style={styles.guardTitle}>Aucun magasin actif</Text>
        <Text style={styles.guardDesc}>Sélectionnez un magasin pour commencer à scanner.</Text>
        <TouchableOpacity style={styles.guardBtn} onPress={() => router.push('/(partner)/stores')}>
          <LinearGradient colors={['#FF6A00', '#FF9F45']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.guardBtnInner}>
            <Text style={styles.guardBtnText}>Choisir un magasin</Text>
          </LinearGradient>
        </TouchableOpacity>
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
          {/* Top bar */}
          <View style={[styles.overlayTop, { paddingTop: insets.top + spacing[3] }]}>
            <Text style={styles.overlayTitle}>Scanner un QR</Text>
            <TouchableOpacity style={styles.storePill} onPress={() => router.push('/(partner)/stores')}>
              <Ionicons name="storefront" size={wp(12)} color="#FF7A18" />
              <Text style={styles.storePillText} numberOfLines={1}>
                {(activeStoreQ.data as any)?.name ?? `#${activeStoreQ.data?.storeId?.slice(0, 6) ?? '—'}`}
              </Text>
              <Ionicons name="chevron-down" size={wp(12)} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>

          {/* Frame */}
          <View style={styles.frameWrap}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
          </View>

          {/* Bottom */}
          <View style={[styles.overlayBottom, { paddingBottom: insets.bottom + spacing[6] }]}>
            <Text style={styles.scanHint}>Placez le QR code dans le cadre</Text>
          </View>
        </View>
      </View>
    );
  }

  /* ── Form ── */
  if (scanState === 'form') {
    const activePlanCode = (planInfo?.planCode ?? preview?.planCode ?? '').toUpperCase();
    const pt = PLAN_THEME[activePlanCode] ?? PLAN_THEME.SOLO;
    return (
      <View style={styles.container}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={[styles.formScroll, { paddingTop: insets.top + spacing[2] }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.formHeader}>
              <TouchableOpacity style={styles.backBtn} onPress={resetScanner}>
                <Ionicons name="chevron-back" size={wp(20)} color="rgba(255,255,255,0.85)" />
              </TouchableOpacity>
              <Text style={styles.formTitle}>Validation</Text>
              <View style={styles.scannedBadge}>
                <Ionicons name="checkmark-circle" size={wp(13)} color="#22C55E" />
                <Text style={styles.scannedBadgeText}>Scanné</Text>
              </View>
            </View>

            <Animated.View entering={FadeInUp.duration(350)} style={styles.formBody}>
              {/* Token card */}
              <View style={styles.tokenCard}>
                <View style={styles.tokenIconWrap}>
                  <Ionicons name="qr-code" size={wp(18)} color="#818CF8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tokenLabel}>QR Token</Text>
                  <Text style={styles.tokenValue} numberOfLines={1}>{scannedToken.slice(0, 24)}…</Text>
                </View>
                <Ionicons name="checkmark-circle" size={wp(20)} color="#22C55E" />
              </View>

              {/* ── Abonnement (chargé immédiatement après scan) ── */}
              {planInfoLoading && !planInfo && (
                <View style={styles.planLoadingCard}>
                  <ActivityIndicator size="small" color="#818CF8" />
                  <Text style={styles.planLoadingText}>Vérification abonnement…</Text>
                </View>
              )}
              {planInfo && (
                <Animated.View entering={FadeIn.duration(300)} style={[styles.subscriptionCard, { borderColor: pt.accent + '40' }]}>
                  <View style={[styles.subscriptionBanner, { backgroundColor: pt.bg }]}>
                    <View style={[styles.subscriptionIconWrap, { backgroundColor: pt.accent + '25' }]}>
                      <Ionicons name={pt.icon as any} size={wp(22)} color={pt.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subscriptionLabel}>Abonnement</Text>
                      <Text style={[styles.subscriptionPlanName, { color: pt.accent }]}>
                        {planInfo.planName || formatPlanLabel(planInfo.planCode)}
                      </Text>
                    </View>
                    <View style={[styles.planCodeBadge, { backgroundColor: pt.accent + '20', borderColor: pt.accent + '40' }]}>
                      <Text style={[styles.planCodeText, { color: pt.accent }]}>{planInfo.planCode}</Text>
                    </View>
                  </View>
                  <View style={styles.subscriptionStats}>
                    <View style={styles.subscriptionStat}>
                      <Text style={[styles.subscriptionStatValue, { color: pt.accent }]}>{planInfo.discountPercent}%</Text>
                      <Text style={styles.subscriptionStatLabel}>Réduction</Text>
                    </View>
                    <View style={styles.subscriptionStatDivider} />
                    <View style={styles.subscriptionStat}>
                      <Text style={[styles.subscriptionStatValue, { color: '#FFFFFF' }]}>{planInfo.personsAllowed}</Text>
                      <Text style={styles.subscriptionStatLabel}>
                        {planInfo.personsAllowed > 1 ? 'Personnes max' : 'Personne'}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              )}

              {/* Amount input */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Montant brut</Text>
                <Controller
                  control={control}
                  name="amountGross"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputWrap}>
                      <Ionicons name="cash-outline" size={wp(16)} color="rgba(255,255,255,0.3)" />
                      <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="decimal-pad"
                      />
                      <Text style={styles.inputUnit}>€</Text>
                    </View>
                  )}
                />
              </View>

              {/* Preview */}
              {(preview || previewLoading) && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.previewCard}>
                  {previewLoading ? (
                    <View style={styles.previewLoading}>
                      <ActivityIndicator size="small" color="#818CF8" />
                      <Text style={styles.previewLoadingText}>Calcul en cours…</Text>
                    </View>
                  ) : preview ? (
                    <>
                      <View style={styles.previewRow}>
                        <Text style={styles.previewLabel}>Réduction ({preview.discountPercent}%)</Text>
                        <Text style={styles.previewDiscount}>-{formatPrice(preview.discountAmount)}</Text>
                      </View>
                      <View style={styles.previewSep} />
                      <View style={styles.previewRow}>
                        <Text style={[styles.previewLabel, { fontFamily: fontFamily.semiBold, color: '#FFFFFF' }]}>Net à payer</Text>
                        <Text style={styles.previewNet}>{formatPrice(preview.amountNet)}</Text>
                      </View>
                    </>
                  ) : null}
                </Animated.View>
              )}

              {/* Persons stepper */}
              <View style={styles.personsRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                  <Ionicons name="people-outline" size={wp(16)} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.personsLabel}>Nombre de personnes</Text>
                </View>
                <Controller
                  control={control}
                  name="personsCount"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.stepper}>
                      <TouchableOpacity style={styles.stepperBtn} onPress={() => onChange(String(Math.max(1, parseInt(value, 10) - 1)))}>
                        <Ionicons name="remove" size={wp(16)} color="rgba(255,255,255,0.7)" />
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>{value}</Text>
                      <TouchableOpacity style={styles.stepperBtn} onPress={() => onChange(String(Math.min(preview?.personsAllowed ?? 10, parseInt(value, 10) + 1)))}>
                        <Ionicons name="add" size={wp(16)} color="rgba(255,255,255,0.7)" />
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
                <LinearGradient colors={['#FF6A00', '#FF9F45']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtnInner}>
                  {validateMutation.isPending
                    ? <ActivityIndicator color="#FFFFFF" size="small" />
                    : <>
                        <Ionicons name="checkmark-circle-outline" size={wp(18)} color="#FFFFFF" />
                        <Text style={styles.submitBtnText}>Valider la transaction</Text>
                      </>
                  }
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={resetScanner}>
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
      <View style={[styles.container, styles.resultContainer, { paddingTop: insets.top }]}>
        <Animated.View entering={FadeInUp.springify().damping(15)} style={styles.resultContent}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={wp(44)} color="#FFFFFF" />
          </View>
          <Text style={styles.resultTitle}>Transaction validée !</Text>
          <Text style={styles.resultDesc}>La réduction a été appliquée avec succès.</Text>

          {validateResult && (
            <View style={styles.resultCard}>
              {/* Plan */}
              <View style={[styles.planCard, { backgroundColor: pt.bg, borderColor: pt.accent + '30', marginBottom: 0 }]}>
                <View style={[styles.planIconWrap, { backgroundColor: pt.accent + '20' }]}>
                  <Ionicons name={pt.icon as any} size={wp(20)} color={pt.accent} />
                </View>
                <Text style={[styles.planName, { color: pt.accent, flex: 1 }]}>
                  {formatPlanLabel(validateResult.planCode)}
                </Text>
              </View>

              <View style={styles.resultSep} />

              <View style={styles.resultRow}>
                <Ionicons name="trending-down-outline" size={wp(16)} color="#34D399" />
                <Text style={styles.resultRowLabel}>Réduction</Text>
                <Text style={[styles.resultRowValue, { color: '#34D399' }]}>
                  -{formatPrice(validateResult.discountAmount)} ({validateResult.discountPercent}%)
                </Text>
              </View>

              <View style={styles.resultSep} />

              <View style={styles.resultRow}>
                <Ionicons name="cash-outline" size={wp(16)} color="#FF7A18" />
                <Text style={styles.resultRowLabel}>Net à payer</Text>
                <Text style={[styles.resultRowValue, { color: '#FFFFFF', fontFamily: fontFamily.bold, fontSize: wp(17) }]}>
                  {formatPrice(validateResult.amountNet)}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={[styles.submitBtn, { marginTop: spacing[6] }]} onPress={resetScanner} activeOpacity={0.85}>
            <LinearGradient colors={['#FF6A00', '#FF9F45']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtnInner}>
              <Ionicons name="scan-outline" size={wp(18)} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Scanner un autre QR</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        <AlertModal />
      </View>
    );
  }

  /* ── Error ── */
  return (
    <View style={[styles.container, styles.resultContainer, { paddingTop: insets.top }]}>
      <Animated.View entering={FadeInUp.springify().damping(15)} style={styles.resultContent}>
        <View style={[styles.successCircle, { backgroundColor: '#EF4444' }]}>
          <Ionicons name="close" size={wp(44)} color="#FFFFFF" />
        </View>
        <Text style={styles.resultTitle}>Échec de validation</Text>
        <Text style={styles.resultDesc}>Le QR code est invalide, expiré ou déjà utilisé.</Text>
        <TouchableOpacity style={[styles.submitBtn, { marginTop: spacing[6] }]} onPress={resetScanner} activeOpacity={0.85}>
          <LinearGradient colors={['#FF6A00', '#FF9F45']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtnInner}>
            <Ionicons name="refresh-outline" size={wp(18)} color="#FFFFFF" />
            <Text style={styles.submitBtnText}>Réessayer</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      <AlertModal />
    </View>
  );
}

const FRAME = wp(240);
const CORNER_SIZE = wp(22);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },

  /* Guards */
  guardContainer: {
    flex: 1, backgroundColor: '#0F172A',
    alignItems: 'center', justifyContent: 'center', padding: spacing[6],
  },
  guardIconWrap: {
    width: wp(80), height: wp(80), borderRadius: wp(40),
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing[4],
  },
  guardTitle: { fontSize: wp(18), fontFamily: fontFamily.bold, color: '#FFFFFF', marginBottom: spacing[2] },
  guardDesc: { fontSize: wp(13), fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: spacing[5] },
  guardBtn: { borderRadius: borderRadius['2xl'], overflow: 'hidden', width: '100%' },
  guardBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing[4] },
  guardBtnText: { fontSize: wp(15), fontFamily: fontFamily.bold, color: '#FFFFFF' },

  /* Scan overlay */
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  overlayTop: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    alignItems: 'center',
    gap: spacing[2],
  },
  overlayTitle: { fontSize: wp(17), fontFamily: fontFamily.bold, color: '#FFFFFF' },
  storePill: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[1],
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3], paddingVertical: spacing[1],
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  storePillText: { fontSize: wp(11), fontFamily: fontFamily.semiBold, color: '#FFFFFF', maxWidth: wp(160) },
  frameWrap: { alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: FRAME, height: FRAME },
  corner: {
    position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE,
    borderColor: '#FF7A18',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 10 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 10 },
  overlayBottom: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', paddingTop: spacing[5],
  },
  scanHint: { fontSize: wp(13), fontFamily: fontFamily.medium, color: 'rgba(255,255,255,0.7)' },

  /* Form */
  formScroll: { padding: spacing[4] },
  formHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    marginBottom: spacing[4],
  },
  backBtn: {
    width: wp(36), height: wp(36), borderRadius: wp(18),
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  formTitle: { flex: 1, fontSize: wp(18), fontFamily: fontFamily.bold, color: '#FFFFFF' },
  scannedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[2], paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)',
  },
  scannedBadgeText: { fontSize: wp(10), fontFamily: fontFamily.semiBold, color: '#22C55E' },

  formBody: { gap: spacing[3] },

  tokenCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    backgroundColor: '#1E293B',
    borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    padding: spacing[3],
  },
  tokenIconWrap: {
    width: wp(38), height: wp(38), borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(129,140,248,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  tokenLabel: { fontSize: wp(9), fontFamily: fontFamily.semiBold, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 },
  tokenValue: { fontSize: wp(12), fontFamily: fontFamily.medium, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  /* Plan loading */
  planLoadingCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2],
    backgroundColor: '#1E293B', borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: spacing[3],
  },
  planLoadingText: { fontSize: wp(12), fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.4)' },

  /* Subscription card */
  subscriptionCard: {
    backgroundColor: '#1E293B', borderRadius: borderRadius.xl,
    borderWidth: 1, overflow: 'hidden',
    ...shadows.sm,
  },
  subscriptionBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    padding: spacing[3],
  },
  subscriptionIconWrap: {
    width: wp(44), height: wp(44), borderRadius: borderRadius.lg,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  subscriptionLabel: {
    fontSize: wp(9), fontFamily: fontFamily.semiBold,
    color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 2,
  },
  subscriptionPlanName: { fontSize: wp(15), fontFamily: fontFamily.bold },
  planCodeBadge: {
    paddingHorizontal: spacing[2], paddingVertical: 4,
    borderRadius: borderRadius.md, borderWidth: 1,
  },
  planCodeText: { fontSize: wp(10), fontFamily: fontFamily.bold, letterSpacing: 0.5 },
  subscriptionStats: {
    flexDirection: 'row',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  subscriptionStat: {
    flex: 1, alignItems: 'center', paddingVertical: spacing[3],
  },
  subscriptionStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: spacing[2] },
  subscriptionStatValue: { fontSize: wp(18), fontFamily: fontFamily.bold },
  subscriptionStatLabel: { fontSize: wp(10), fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.45)', marginTop: 2 },

  /* Legacy plan card (kept for success screen) */
  planCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    borderRadius: borderRadius.xl, borderWidth: 1, padding: spacing[3],
    marginBottom: 0,
  },
  planIconWrap: {
    width: wp(40), height: wp(40), borderRadius: borderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  planName: { fontSize: wp(14), fontFamily: fontFamily.bold },
  planSub: { fontSize: wp(11), fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.45)', marginTop: 2 },

  fieldGroup: { gap: spacing[1] },
  fieldLabel: { fontSize: wp(11), fontFamily: fontFamily.semiBold, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    backgroundColor: '#1E293B',
    borderRadius: borderRadius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing[3], paddingVertical: Platform.OS === 'ios' ? spacing[3] : spacing[2],
  },
  input: { flex: 1, fontSize: wp(16), fontFamily: fontFamily.medium, color: '#FFFFFF', padding: 0 },
  inputUnit: { fontSize: wp(14), fontFamily: fontFamily.semiBold, color: 'rgba(255,255,255,0.3)' },

  previewCard: {
    backgroundColor: '#1E293B', borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.15)', padding: spacing[3],
  },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing[1] },
  previewLabel: { fontSize: wp(13), fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.5)' },
  previewDiscount: { fontSize: wp(13), fontFamily: fontFamily.semiBold, color: '#34D399' },
  previewNet: { fontSize: wp(18), fontFamily: fontFamily.bold, color: '#FFFFFF' },
  previewSep: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: spacing[1] },
  previewLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], padding: spacing[2] },
  previewLoadingText: { fontSize: wp(12), fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.4)' },

  personsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1E293B', borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    paddingVertical: spacing[3], paddingHorizontal: spacing[3],
  },
  personsLabel: { fontSize: wp(13), fontFamily: fontFamily.medium, color: 'rgba(255,255,255,0.6)' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  stepperBtn: {
    width: wp(30), height: wp(30), borderRadius: wp(15),
    backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  stepperValue: { fontSize: wp(15), fontFamily: fontFamily.bold, color: '#FFFFFF', minWidth: wp(22), textAlign: 'center' },

  submitBtn: { borderRadius: borderRadius['2xl'], overflow: 'hidden' },
  submitBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingVertical: spacing[4] },
  submitBtnText: { fontSize: wp(15), fontFamily: fontFamily.bold, color: '#FFFFFF' },
  cancelBtn: {
    alignItems: 'center', paddingVertical: spacing[3],
    borderRadius: borderRadius.xl, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  cancelBtnText: { fontSize: wp(14), fontFamily: fontFamily.semiBold, color: 'rgba(255,255,255,0.5)' },

  /* Result screens */
  resultContainer: { alignItems: 'center', justifyContent: 'center', padding: spacing[5] },
  resultContent: { alignItems: 'center', width: '100%' },
  successCircle: {
    width: wp(88), height: wp(88), borderRadius: wp(44),
    backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing[4],
    ...shadows.md,
  },
  resultTitle: { fontSize: wp(22), fontFamily: fontFamily.bold, color: '#FFFFFF', textAlign: 'center' },
  resultDesc: { fontSize: wp(13), fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: spacing[2] },
  resultCard: {
    width: '100%', marginTop: spacing[5],
    backgroundColor: '#1E293B', borderRadius: borderRadius['2xl'],
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    padding: spacing[4], gap: spacing[2],
  },
  resultSep: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  resultRowLabel: { flex: 1, fontSize: wp(13), fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.5)' },
  resultRowValue: { fontSize: wp(13), fontFamily: fontFamily.semiBold, color: 'rgba(255,255,255,0.8)' },
});
